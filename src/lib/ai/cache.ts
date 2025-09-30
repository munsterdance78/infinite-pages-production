/**
 * Simplified AI cache for build compatibility
 * TODO: Implement proper caching logic
 */

interface CacheEntry {
  key: string
  value: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  async set(key: string, value: any, ttlMs: number = 300000): Promise<void> {
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

export const infinitePagesCache = new SimpleCache()