import { createHash } from 'crypto'
import { calculateCost } from '@/lib/constants'

export interface CacheEntry {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost: number
  model: string
  timestamp: number
  expiresAt: number
  metadata?: {
    promptHash: string
    operation: string
    userId?: string
  }
}

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  maxSize?: number // Maximum cache size
  userId?: string
}

export class ClaudeCache {
  private cache = new Map<string, CacheEntry>()
  private accessTimes = new Map<string, number>()
  private maxSize: number
  private defaultTTL: number

  // Performance optimization features for intelligent caching

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.ttl || 3600 // 1 hour default
  }

  /**
   * Generate a cache key from prompt and options
   */
  private generateCacheKey(
    prompt: string, 
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
      operation?: string
    } = {}
  ): string {
    const keyData = {
      prompt: prompt.trim().toLowerCase(),
      model: options.model || 'default',
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      systemPrompt: options.systemPrompt || '',
      operation: options.operation || 'general'
    }

    const hash = createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')

    return hash.substring(0, 16) // Use first 16 chars for shorter keys
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now())
    return true
  }

  /**
   * Get cache entry
   */
  get(key: string): CacheEntry | null {
    if (!this.has(key)) return null

    const entry = this.cache.get(key)!
    this.accessTimes.set(key, Date.now())
    
    return {
      ...entry,
      // Add cache hit indicator
      metadata: {
        ...entry.metadata,
        cacheHit: true,
        cacheKey: key
      }
    } as CacheEntry
  }

  /**
   * Set cache entry
   */
  set(
    key: string,
    content: string,
    usage: { inputTokens: number; outputTokens: number; totalTokens: number },
    model: string,
    options: {
      ttl?: number | undefined
      operation?: string | undefined
      userId?: string | undefined
    } = {}
  ): void {
    const ttl = options.ttl || this.defaultTTL
    const now = Date.now()

    const entry: CacheEntry = {
      content,
      usage,
      cost: calculateCost(usage.inputTokens, usage.outputTokens),
      model,
      timestamp: now,
      expiresAt: now + (ttl * 1000),
      metadata: {
        promptHash: key,
        operation: options.operation || 'general',
        ...(options.userId && { userId: options.userId })
      }
    }

    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, entry)
    this.accessTimes.set(key, now)
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    this.accessTimes.delete(key)
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    Array.from(this.accessTimes.entries()).forEach(([key, time]) => {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalCost: number
    entries: Array<{
      key: string
      operation: string
      cost: number
      age: number
      expiresIn: number
    }>
  } {
    const now = Date.now()
    let totalCost = 0
    const entries: Array<{
      key: string
      operation: string
      cost: number
      age: number
      expiresIn: number
    }> = []

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      totalCost += entry.cost
      entries.push({
        key: key.substring(0, 8) + '...', // Truncated key for display
        operation: entry.metadata?.operation || 'unknown',
        cost: entry.cost,
        age: Math.floor((now - entry.timestamp) / 1000),
        expiresIn: Math.floor((entry.expiresAt - now) / 1000)
      })
    })

    // Sort by cost (highest first)
    entries.sort((a, b) => b.cost - a.cost)

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses separately
      totalCost,
      entries: entries.slice(0, 10) // Top 10 most expensive entries
    }
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.delete(key)
        cleaned++
      }
    })

    return cleaned
  }

  /**
   * Cache a Claude response
   */
  cacheResponse(
    prompt: string,
    response: {
      content: string
      usage: { inputTokens: number; outputTokens: number; totalTokens: number }
      model: string
    },
    options: {
      operation?: string
      userId?: string
      ttl?: number
      cacheOptions?: {
        model?: string
        maxTokens?: number
        temperature?: number
        systemPrompt?: string
      }
    } = {}
  ): string {
    const key = this.generateCacheKey(prompt, {
      ...(options.operation && { operation: options.operation }),
      ...options.cacheOptions
    })

    this.set(key, response.content, response.usage, response.model, {
      ...(options.ttl && { ttl: options.ttl }),
      ...(options.operation && { operation: options.operation }),
      ...(options.userId && { userId: options.userId })
    })

    return key
  }

  /**
   * Try to get cached response
   */
  getCachedResponse(
    prompt: string,
    options: {
      operation?: string
      cacheOptions?: {
        model?: string
        maxTokens?: number
        temperature?: number
        systemPrompt?: string
      }
    } = {}
  ): CacheEntry | null {
    const key = this.generateCacheKey(prompt, {
      ...(options.operation && { operation: options.operation }),
      ...options.cacheOptions
    })

    return this.get(key)
  }

  // NEW: Hierarchical fact caching
  async cacheHierarchicalFacts(
    storyId: string,
    facts: {
      userId?: string
      [key: string]: unknown
    },
    level: 'universe' | 'series' | 'book' | 'chapter'
  ): Promise<void> {
    const ttlMap = {
      universe: 30 * 24 * 60 * 60,  // 30 days
      series: 14 * 24 * 60 * 60,    // 14 days
      book: 7 * 24 * 60 * 60,       // 7 days
      chapter: 24 * 60 * 60         // 1 day
    }

    const key = `facts:${level}:${storyId}`

    // Use existing cache infrastructure
    this.set(
      key,
      JSON.stringify(facts),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      'fact-cache',
      {
        ttl: ttlMap[level],
        operation: `fact_cache_${level}`,
        userId: facts.userId || undefined
      }
    )
  }

  // NEW: Get optimized fact context
  async getOptimizedFactContext(storyId: string): Promise<{
    universe: Record<string, unknown> | null,
    series: Record<string, unknown> | null,
    book: Record<string, unknown> | null,
    chapter: Record<string, unknown> | null
  }> {
    const levels = ['universe', 'series', 'book', 'chapter'] as const
    const factPromises = levels.map(level => this.get(`facts:${level}:${storyId}`))
    const cachedFacts = await Promise.all(factPromises)

    return levels.reduce((acc, level, index) => {
      const cachedFact = cachedFacts[index]
      try {
        acc[level] = cachedFact ? JSON.parse(cachedFact.content) : null
      } catch (error) {
        // Failed to parse cached facts - production logging system would handle this
        acc[level] = null
      }
      return acc
    }, {} as { universe: Record<string, unknown> | null, series: Record<string, unknown> | null, book: Record<string, unknown> | null, chapter: Record<string, unknown> | null })
  }

  // NEW: Get specific level facts
  async getFactsByLevel(
    storyId: string,
    level: 'universe' | 'series' | 'book' | 'chapter'
  ): Promise<Record<string, unknown> | null> {
    const key = `facts:${level}:${storyId}`
    const cachedEntry = this.get(key)

    if (!cachedEntry) return null

    try {
      return JSON.parse(cachedEntry.content)
    } catch (error) {
      // Failed to parse cached facts - production logging system would handle this
      this.delete(key) // Remove corrupted cache entry
      return null
    }
  }

  // NEW: Invalidate facts cache for story
  invalidateStoryFacts(storyId: string): number {
    const levels = ['universe', 'series', 'book', 'chapter']
    let invalidated = 0

    levels.forEach(level => {
      const key = `facts:${level}:${storyId}`
      if (this.delete(key)) {
        invalidated++
      }
    })

    return invalidated
  }

  // NEW: Get fact cache statistics
  getFactCacheStats(): {
    totalFactEntries: number
    factEntriesByLevel: Record<string, number>
    totalFactCacheSize: number
    oldestFactEntry: { level: string, age: number } | null
  } {
    const now = Date.now()
    let totalFactEntries = 0
    let totalFactCacheSize = 0
    const factEntriesByLevel: Record<string, number> = {
      universe: 0,
      series: 0,
      book: 0,
      chapter: 0
    }
    let oldestFactEntry: { level: string, age: number } | null = null
    let oldestTime = now

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (key.startsWith('facts:')) {
        totalFactEntries++
        totalFactCacheSize += entry.content.length

        const level = key.split(':')[1]
        if (level && (level === 'universe' || level === 'series' || level === 'book' || level === 'chapter')) {
          const currentCount = factEntriesByLevel[level] ?? 0
          factEntriesByLevel[level] = currentCount + 1
        }

        const age = now - entry.timestamp
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp
          oldestFactEntry = { level: level || 'unknown', age: Math.floor(age / 1000) }
        }
      }
    })

    return {
      totalFactEntries,
      factEntriesByLevel,
      totalFactCacheSize,
      oldestFactEntry
    }
  }

  // NEW: Cleanup only fact cache entries
  cleanupFactCache(): number {
    const now = Date.now()
    let cleaned = 0

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (key.startsWith('facts:') && now > entry.expiresAt) {
        this.delete(key)
        cleaned++
      }
    })

    return cleaned
  }

  // NEW: Pre-warm fact cache for story
  async preWarmFactCache(
    storyId: string,
    factsHierarchy: {
      universe?: Record<string, unknown>
      series?: Record<string, unknown>
      book?: Record<string, unknown>
      chapter?: Record<string, unknown>
    }
  ): Promise<void> {
    const promises: Promise<void>[] = []

    Object.entries(factsHierarchy).forEach(([level, facts]) => {
      if (facts && ['universe', 'series', 'book', 'chapter'].includes(level)) {
        promises.push(
          this.cacheHierarchicalFacts(storyId, facts as { userId?: string; [key: string]: unknown }, level as 'universe' | 'series' | 'book' | 'chapter')
        )
      }
    })

    await Promise.all(promises)
  }
}

// Export singleton instance
export const claudeCache = new ClaudeCache({
  ttl: 3600, // 1 hour
  maxSize: 1000
})

// Auto-cleanup every 5 minutes
setInterval(() => {
  const cleaned = claudeCache.cleanup()
  if (cleaned > 0) {
    // Claude cache cleanup completed - expired entries removed
  }
}, 5 * 60 * 1000)




