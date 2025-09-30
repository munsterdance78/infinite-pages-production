import { claudeService } from './service'
import { claudeCache } from './cache'
import { CLAUDE_PRICING, calculateCost } from '@/lib/constants'

export interface BatchOperation {
  id: string
  type: 'story_foundation' | 'chapter' | 'content_improvement' | 'content_analysis' | 'general'
  params: {
    title?: string
    genre?: string
    premise?: string
    content?: string
    feedback?: string
    improvementType?: string
    [key: string]: unknown
  }
  priority?: number // Higher number = higher priority
  userId?: string
  cacheKey?: string
}

export interface BatchResult {
  id: string
  success: boolean
  content?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost?: number
  error?: string
  cached?: boolean
  processingTime?: number
}

export interface BatchProcessingOptions {
  maxConcurrency?: number
  retryFailed?: boolean
  maxRetries?: number
  useCache?: boolean
  timeout?: number
}

export class ClaudeBatchProcessor {
  private queue: BatchOperation[] = []
  private processing = new Set<string>()
  private results = new Map<string, BatchResult>()
  private maxConcurrency: number
  private useCache: boolean
  private retryFailed: boolean
  private maxRetries: number
  private timeout: number

  constructor(options: BatchProcessingOptions = {}) {
    this.maxConcurrency = options.maxConcurrency || 3
    this.useCache = options.useCache !== false // Default to true
    this.retryFailed = options.retryFailed || false
    this.maxRetries = options.maxRetries || 2
    this.timeout = options.timeout || 30000 // 30 seconds
  }

  /**
   * Add operation to batch queue
   */
  addOperation(operation: BatchOperation): void {
    // Check cache first if enabled
    if (this.useCache && operation.cacheKey) {
      const cached = claudeCache.get(operation.cacheKey)
      if (cached) {
        this.results.set(operation.id, {
          id: operation.id,
          success: true,
          content: cached.content,
          usage: cached.usage,
          cost: cached.cost,
          cached: true,
          processingTime: 0
        })
        return
      }
    }

    // Add to queue with priority
    this.queue.push(operation)
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Add multiple operations to batch
   */
  addOperations(operations: BatchOperation[]): void {
    operations.forEach(op => this.addOperation(op))
  }

  /**
   * Process all operations in the batch
   */
  async processBatch(): Promise<Map<string, BatchResult>> {
    const promises: Promise<void>[] = []
    
    // Start processing up to maxConcurrency operations
    for (let i = 0; i < Math.min(this.maxConcurrency, this.queue.length); i++) {
      promises.push(this.processNext())
    }

    // Wait for all operations to complete
    await Promise.all(promises)

    return this.results
  }

  /**
   * Process the next operation in queue
   */
  private async processNext(): Promise<void> {
    const operation = this.queue.shift()
    if (!operation) return

    this.processing.add(operation.id)

    try {
      const startTime = Date.now()
      let result: BatchResult

      // Check cache again (in case it was populated while waiting)
      if (this.useCache && operation.cacheKey) {
        const cached = claudeCache.get(operation.cacheKey)
        if (cached) {
          result = {
            id: operation.id,
            success: true,
            content: cached.content,
            usage: cached.usage,
            cost: cached.cost,
            cached: true,
            processingTime: Date.now() - startTime
          }
          this.results.set(operation.id, result)
          return
        }
      }

      // Process operation with timeout
      const operationPromise = this.executeOperation(operation)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
      })

      const response = await Promise.race([operationPromise, timeoutPromise])
      const processingTime = Date.now() - startTime

      // Cache the result if successful
      if (this.useCache && response.content && operation.cacheKey) {
        claudeCache.set(
          operation.cacheKey,
          response.content,
          response.usage,
          response.model,
          {
            operation: operation.type,
            ...(operation.userId && { userId: operation.userId })
          }
        )
      }

      result = {
        id: operation.id,
        success: true,
        content: response.content,
        usage: response.usage,
        cost: response.cost,
        cached: false,
        processingTime
      }

      this.results.set(operation.id, result)

    } catch (error: unknown) {
      const result: BatchResult = {
        id: operation.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - Date.now()
      }

      this.results.set(operation.id, result)

      // Retry if enabled and retries remaining
      const operationWithRetries = operation as BatchOperation & { retries?: number }
      if (this.retryFailed && (operationWithRetries.retries || 0) < this.maxRetries) {
        operationWithRetries.retries = (operationWithRetries.retries || 0) + 1
        this.queue.push(operationWithRetries) // Add back to queue for retry
      }
    } finally {
      this.processing.delete(operation.id)
      
      // Process next operation if queue has more items
      if (this.queue.length > 0) {
        this.processNext()
      }
    }
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: BatchOperation) {
    switch (operation.type) {
      case 'story_foundation':
        return await claudeService.generateStoryFoundation(operation.params)
      
      case 'chapter':
        return await claudeService.generateChapter(operation.params)
      
      case 'content_improvement':
        return await claudeService.improveContent(operation.params)
      
      case 'content_analysis':
        if (!operation.params.content) {
          throw new Error('Content is required for content analysis')
        }
        return await claudeService.analyzeContent(operation.params.content)
      
      case 'general':
      default:
        return await claudeService.generateContent(operation.params)
    }
  }

  /**
   * Get batch processing statistics
   */
  getStats(): {
    queueLength: number
    processing: number
    completed: number
    failed: number
    totalCost: number
    averageProcessingTime: number
    cacheHitRate: number
  } {
    const results = Array.from(this.results.values())
    const completed = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const cached = results.filter(r => r.cached)
    
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0)
    const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0)
    const averageProcessingTime = results.length > 0 ? totalProcessingTime / results.length : 0
    const cacheHitRate = results.length > 0 ? cached.length / results.length : 0

    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      completed: completed.length,
      failed: failed.length,
      totalCost,
      averageProcessingTime,
      cacheHitRate
    }
  }

  /**
   * Clear batch results
   */
  clear(): void {
    this.queue = []
    this.processing.clear()
    this.results.clear()
  }

  /**
   * Get results for specific operation IDs
   */
  getResults(operationIds: string[]): BatchResult[] {
    return operationIds.map(id => this.results.get(id)).filter(Boolean) as BatchResult[]
  }

  /**
   * Wait for specific operations to complete
   */
  async waitForOperations(operationIds: string[], timeout: number = 30000): Promise<BatchResult[]> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const results = this.getResults(operationIds)
      
      if (results.length === operationIds.length) {
        return results
      }
      
      await new Promise(resolve => setTimeout(resolve, 100)) // Check every 100ms
    }
    
    throw new Error('Timeout waiting for operations to complete')
  }
}

// Export singleton instance
export const batchProcessor = new ClaudeBatchProcessor({
  maxConcurrency: 3,
  useCache: true,
  retryFailed: true,
  maxRetries: 2,
  timeout: 30000
})

// Utility functions for common batch operations

/**
 * Batch generate multiple story foundations
 */
export async function batchGenerateStoryFoundations(
  stories: Array<{
    id: string
    title?: string
    genre: string
    premise: string
    userId?: string
  }>
): Promise<Map<string, BatchResult>> {
  const operations: BatchOperation[] = stories.map(story => ({
    id: story.id,
    type: 'story_foundation',
    params: {
      title: story.title || 'Untitled Story',
      genre: story.genre,
      premise: story.premise
    },
    ...(story.userId && { userId: story.userId }),
    cacheKey: `story_foundation_${story.genre}_${story.premise.slice(0, 100)}`
  }))

  batchProcessor.addOperations(operations)
  return await batchProcessor.processBatch()
}

/**
 * Batch analyze multiple content pieces
 */
export async function batchAnalyzeContent(
  contents: Array<{
    id: string
    content: string
    userId?: string
  }>
): Promise<Map<string, BatchResult>> {
  const operations: BatchOperation[] = contents.map(item => ({
    id: item.id,
    type: 'content_analysis',
    params: { content: item.content },
    ...(item.userId && { userId: item.userId }),
    cacheKey: `analysis_${item.content.slice(0, 100)}`
  }))

  batchProcessor.addOperations(operations)
  return await batchProcessor.processBatch()
}

/**
 * Batch improve multiple content pieces
 */
export async function batchImproveContent(
  improvements: Array<{
    id: string
    content: string
    feedback: string
    improvementType?: string
    userId?: string
  }>
): Promise<Map<string, BatchResult>> {
  const operations: BatchOperation[] = improvements.map(item => ({
    id: item.id,
    type: 'content_improvement',
    params: {
      content: item.content,
      feedback: item.feedback,
      improvementType: item.improvementType || 'general'
    },
    ...(item.userId && { userId: item.userId }),
    cacheKey: `improve_${item.content.slice(0, 50)}_${item.feedback.slice(0, 50)}`
  }))

  batchProcessor.addOperations(operations)
  return await batchProcessor.processBatch()
}

