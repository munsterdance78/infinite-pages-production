/**
 * CONTEXT COMPRESSION MIDDLEWARE
 *
 * Intelligent compression system to reduce AI token usage while preserving
 * story generation quality. Implements multiple compression strategies based
 * on content type and user subscription tier.
 *
 * Key Features:
 * - Smart context reduction for repeated story elements
 * - Template-based compression for common patterns
 * - Subscription-aware compression levels
 * - Real-time cost estimation with compression benefits
 * - Preserves critical story elements while reducing bloat
 */

import { CLAUDE_PRICING, SUBSCRIPTION_LIMITS } from '@/lib/utils/constants'

export interface CompressionOptions {
  maxTokens?: number
  compressionLevel: 'light' | 'moderate' | 'aggressive'
  preserveElements?: string[]
  contextWindow?: number
  subscriptionTier?: 'basic' | 'premium'
}

export interface CompressionResult {
  originalText: string
  compressedText: string
  originalTokenCount: number
  compressedTokenCount: number
  tokensReduced: number
  costSavingsUSD: number
  compressionRatio: number
  preservedElements: string[]
  compressionMethod: string
}

export interface ContextCompressionStats {
  totalCompressions: number
  totalTokensSaved: number
  totalCostSavingsUSD: number
  averageCompressionRatio: number
  methodsUsed: Record<string, number>
}

/**
 * Main Context Compression Class
 */
export class ContextCompressionMiddleware {
  private stats: ContextCompressionStats = {
    totalCompressions: 0,
    totalTokensSaved: 0,
    totalCostSavingsUSD: 0,
    averageCompressionRatio: 0,
    methodsUsed: {}
  }

  /**
   * Compress story context for AI processing
   */
  async compressStoryContext(
    context: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const originalTokenCount = this.estimateTokenCount(context)

    // Apply subscription-aware compression
    const compressionLevel = this.getEffectiveCompressionLevel(options)

    let compressedText = context
    let method = 'none'

    // Apply compression strategies in order of effectiveness
    if (compressionLevel === 'light') {
      const result = this.applyLightCompression(compressedText, options)
      compressedText = result.text
      method = result.method
    } else if (compressionLevel === 'moderate') {
      const result = this.applyModerateCompression(compressedText, options)
      compressedText = result.text
      method = result.method
    } else if (compressionLevel === 'aggressive') {
      const result = this.applyAggressiveCompression(compressedText, options)
      compressedText = result.text
      method = result.method
    }

    const compressedTokenCount = this.estimateTokenCount(compressedText)
    const tokensReduced = originalTokenCount - compressedTokenCount
    const costSavingsUSD = tokensReduced * CLAUDE_PRICING.INPUT_TOKEN_COST
    const compressionRatio = compressedTokenCount / originalTokenCount

    const result: CompressionResult = {
      originalText: context,
      compressedText,
      originalTokenCount,
      compressedTokenCount,
      tokensReduced,
      costSavingsUSD,
      compressionRatio,
      preservedElements: options.preserveElements || [],
      compressionMethod: method
    }

    this.updateStats(result)
    return result
  }

  /**
   * Compress chapter context for continuation
   */
  async compressChapterContext(
    previousChapters: string[],
    currentChapter: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    // Create combined context with smart chapter summarization
    const combinedContext = this.createChapterContext(previousChapters, currentChapter)

    // Apply context-aware compression
    const compressionOptions: CompressionOptions = {
      ...options,
      preserveElements: [
        ...(options.preserveElements || []),
        'character_names',
        'plot_points',
        'story_tone',
        'current_scene'
      ]
    }

    return this.compressStoryContext(combinedContext, compressionOptions)
  }

  /**
   * Estimate token count (approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4)
  }

  /**
   * Get effective compression level based on subscription
   */
  private getEffectiveCompressionLevel(options: CompressionOptions): 'light' | 'moderate' | 'aggressive' {
    if (options.subscriptionTier === 'premium') {
      // Premium users get less aggressive compression to preserve quality
      return options.compressionLevel === 'aggressive' ? 'moderate' : options.compressionLevel
    }
    return options.compressionLevel
  }

  /**
   * Light compression - remove redundancy, preserve quality
   */
  private applyLightCompression(text: string, options: CompressionOptions): { text: string; method: string } {
    let compressed = text

    // Remove excessive whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim()

    // Remove redundant phrases
    compressed = this.removeRedundantPhrases(compressed)

    // Condense repetitive descriptions
    compressed = this.condenseRepetitiveDescriptions(compressed)

    return {
      text: compressed,
      method: 'light_redundancy_removal'
    }
  }

  /**
   * Moderate compression - smart summarization
   */
  private applyModerateCompression(text: string, options: CompressionOptions): { text: string; method: string } {
    let compressed = this.applyLightCompression(text, options).text

    // Apply template-based compression
    compressed = this.applyTemplateCompression(compressed)

    // Summarize verbose sections
    compressed = this.summarizeVerboseSections(compressed, options)

    // Extract key story elements
    compressed = this.extractKeyStoryElements(compressed, options)

    return {
      text: compressed,
      method: 'moderate_summarization'
    }
  }

  /**
   * Aggressive compression - maximum token reduction
   */
  private applyAggressiveCompression(text: string, options: CompressionOptions): { text: string; method: string } {
    let compressed = this.applyModerateCompression(text, options).text

    // Apply bullet-point summarization
    compressed = this.convertToBulletPoints(compressed, options)

    // Use keyword extraction
    compressed = this.extractKeywords(compressed, options)

    // Apply maximum length constraints
    if (options.maxTokens) {
      compressed = this.enforceTokenLimit(compressed, options.maxTokens)
    }

    return {
      text: compressed,
      method: 'aggressive_bullet_points'
    }
  }

  /**
   * Remove redundant phrases and repetitive language
   */
  private removeRedundantPhrases(text: string): string {
    const redundantPatterns = [
      /\b(very|really|quite|rather|somewhat)\s+/gi,
      /\b(it was|there was|there were)\s+/gi,
      /\b(in order to|in an effort to)\b/gi,
      /\b(due to the fact that|because of the fact that)\b/gi
    ]

    let compressed = text
    redundantPatterns.forEach(pattern => {
      compressed = compressed.replace(pattern, '')
    })

    return compressed
  }

  /**
   * Condense repetitive descriptions
   */
  private condenseRepetitiveDescriptions(text: string): string {
    // Find and condense repeated character descriptions
    const sentences = text.split(/[.!?]+/)
    const condensed: string[] = []
    const seenDescriptions = new Set<string>()

    sentences.forEach(sentence => {
      const trimmed = sentence.trim()
      if (trimmed.length === 0) return

      // Check for repetitive character descriptions
      const descriptionKey = this.extractDescriptionKey(trimmed)
      if (!seenDescriptions.has(descriptionKey)) {
        condensed.push(trimmed)
        seenDescriptions.add(descriptionKey)
      }
    })

    return condensed.join('. ') + '.'
  }

  /**
   * Extract description key for deduplication
   */
  private extractDescriptionKey(sentence: string): string {
    // Simple heuristic for identifying similar descriptions
    const words = sentence.toLowerCase().split(/\s+/)
    const keyWords = words.filter(word =>
      word.length > 3 &&
      !['that', 'this', 'with', 'were', 'been', 'have', 'will'].includes(word)
    )
    return keyWords.slice(0, 3).sort().join('_')
  }

  /**
   * Apply template-based compression for common story patterns
   */
  private applyTemplateCompression(text: string): string {
    const templates = [
      {
        pattern: /The character (\w+) walked into the (\w+) and saw/gi,
        replacement: '$1 entered $2, seeing'
      },
      {
        pattern: /(\w+) said with a (\w+) voice/gi,
        replacement: '$1 said $2ly'
      },
      {
        pattern: /The atmosphere was (\w+) and the mood was (\w+)/gi,
        replacement: 'Atmosphere: $1, mood: $2'
      }
    ]

    let compressed = text
    templates.forEach(template => {
      compressed = compressed.replace(template.pattern, template.replacement)
    })

    return compressed
  }

  /**
   * Summarize verbose sections while preserving key elements
   */
  private summarizeVerboseSections(text: string, options: CompressionOptions): string {
    const preserve = options.preserveElements || []
    const sections = text.split(/\n\n+/)

    return sections.map(section => {
      if (section.length > 200) {
        // Extract key information
        const keyInfo = this.extractKeyInformation(section, preserve)
        return keyInfo.length > 50 ? keyInfo : section
      }
      return section
    }).join('\n\n')
  }

  /**
   * Extract key story elements based on preservation rules
   */
  private extractKeyStoryElements(text: string, options: CompressionOptions): string {
    const preserve = options.preserveElements || []
    const elements: string[] = []

    // Character names and dialogue
    if (preserve.includes('character_names') || preserve.includes('dialogue')) {
      const dialogue = text.match(/"[^"]+"/g) || []
      elements.push(...dialogue.slice(0, 3)) // Keep first 3 dialogue snippets
    }

    // Plot points
    if (preserve.includes('plot_points')) {
      const plotIndicators = text.match(/\b(suddenly|then|meanwhile|later|finally)[^.!?]*[.!?]/gi) || []
      elements.push(...plotIndicators.slice(0, 2))
    }

    // Setting descriptions
    if (preserve.includes('setting')) {
      const settings = text.match(/\b(in the|at the|inside|outside)[^.!?]*[.!?]/gi) || []
      elements.push(...settings.slice(0, 1))
    }

    return elements.length > 0 ? elements.join(' ') : text
  }

  /**
   * Convert text to bullet points for maximum compression
   */
  private convertToBulletPoints(text: string, options: CompressionOptions): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const bullets = sentences.slice(0, 5).map(sentence => `• ${sentence.trim()}`)
    return bullets.join('\n')
  }

  /**
   * Extract keywords for ultra-compressed context
   */
  private extractKeywords(text: string, options: CompressionOptions): string {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || []
    const wordFreq = new Map<string, number>()

    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)

    return `Keywords: ${keywords.join(', ')}`
  }

  /**
   * Enforce token limit by truncation
   */
  private enforceTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokenCount(text)
    if (estimatedTokens <= maxTokens) return text

    const ratio = maxTokens / estimatedTokens
    const targetLength = Math.floor(text.length * ratio)

    return text.substring(0, targetLength) + '...'
  }

  /**
   * Extract key information from verbose sections
   */
  private extractKeyInformation(section: string, preserve: string[]): string {
    // Simple extraction - in production would use more sophisticated NLP
    const sentences = section.split(/[.!?]+/)
    const keyStoryElements = sentences.filter(sentence => {
      const lower = sentence.toLowerCase()
      return preserve.some(element => {
        switch (element) {
          case 'character_names':
            return /\b(he|she|they|\w+(?:said|walked|looked|felt))\b/i.test(sentence)
          case 'plot_points':
            return /\b(suddenly|then|because|after|when)\b/i.test(sentence)
          case 'dialogue':
            return sentence.includes('"')
          default:
            return false
        }
      })
    })

    return keyStoryElements.slice(0, 2).join('. ') + '.'
  }

  /**
   * Create optimized chapter context
   */
  private createChapterContext(previousChapters: string[], currentChapter: string): string {
    if (previousChapters.length === 0) return currentChapter

    // Summarize previous chapters with increasing compression
    const summaries = previousChapters.map((chapter, index) => {
      const age = previousChapters.length - index
      const compressionLevel = age > 3 ? 'aggressive' : age > 1 ? 'moderate' : 'light'

      // Simple summarization based on age
      if (compressionLevel === 'aggressive') {
        return this.extractKeywords(chapter, { compressionLevel: 'aggressive' })
      } else if (compressionLevel === 'moderate') {
        return this.convertToBulletPoints(chapter, { compressionLevel: 'moderate' })
      } else {
        return this.applyLightCompression(chapter, { compressionLevel: 'light' }).text
      }
    })

    return `Previous context: ${summaries.join(' | ')}\n\nCurrent: ${currentChapter}`
  }

  /**
   * Update compression statistics
   */
  private updateStats(result: CompressionResult): void {
    this.stats.totalCompressions++
    this.stats.totalTokensSaved += result.tokensReduced
    this.stats.totalCostSavingsUSD += result.costSavingsUSD

    // Update average compression ratio
    this.stats.averageCompressionRatio =
      (this.stats.averageCompressionRatio * (this.stats.totalCompressions - 1) + result.compressionRatio) /
      this.stats.totalCompressions

    // Track methods used
    this.stats.methodsUsed[result.compressionMethod] =
      (this.stats.methodsUsed[result.compressionMethod] || 0) + 1
  }

  /**
   * Get compression statistics
   */
  getStats(): ContextCompressionStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalCompressions: 0,
      totalTokensSaved: 0,
      totalCostSavingsUSD: 0,
      averageCompressionRatio: 0,
      methodsUsed: {}
    }
  }
}

/**
 * Utility functions for context compression
 */

/**
 * Get optimal compression settings for subscription tier
 */
export function getOptimalCompressionSettings(
  subscriptionTier: 'basic' | 'premium',
  operationType: 'story_foundation' | 'chapter_generation' | 'story_improvement'
): CompressionOptions {
  const baseSettings: CompressionOptions = {
    compressionLevel: 'moderate',
    contextWindow: 4000,
    subscriptionTier
  }

  if (subscriptionTier === 'premium') {
    // Premium users get higher quality with less aggressive compression
    return {
      ...baseSettings,
      compressionLevel: 'light',
      contextWindow: 6000,
      preserveElements: ['character_names', 'dialogue', 'plot_points', 'story_tone']
    }
  } else {
    // Basic users get more aggressive compression to manage costs
    return {
      ...baseSettings,
      compressionLevel: 'moderate',
      maxTokens: 3000,
      preserveElements: ['character_names', 'plot_points']
    }
  }
}

/**
 * Calculate potential savings from compression
 */
export function calculateCompressionSavings(
  originalTokens: number,
  compressionRatio: number
): { tokensSaved: number; costSavingsUSD: number; percentageSaved: number } {
  const compressedTokens = Math.floor(originalTokens * compressionRatio)
  const tokensSaved = originalTokens - compressedTokens
  const costSavingsUSD = tokensSaved * CLAUDE_PRICING.INPUT_TOKEN_COST
  const percentageSaved = (tokensSaved / originalTokens) * 100

  return {
    tokensSaved,
    costSavingsUSD,
    percentageSaved
  }
}

/**
 * Export singleton instance
 */
export const contextCompressionMiddleware = new ContextCompressionMiddleware()

export default contextCompressionMiddleware