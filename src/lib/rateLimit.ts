import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { RATE_LIMITS, ERROR_MESSAGES } from './constants'

// In-memory store for development (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

class RateLimiter {
  private store: RateLimitStore = {}
  private redisClient: unknown = null
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Initialize Redis client if available
    if (process.env['REDIS_URL'] && typeof window === 'undefined') {
      try {
        // Redis client would be initialized here in production
        // this.redisClient = new Redis(process.env['REDIS_URL']);
      } catch (error) {
        // Redis connection failed, falling back to memory store
      }
    }
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const key in this.store) {
      const entry = this.store[key]
      if (entry && entry.resetTime < now) {
        delete this.store[key]
      }
    }
  }

  private getKey(identifier: string, operation: string): string {
    return `${operation}:${identifier}`
  }

  private getWindowStart(windowMs: number): number {
    return Math.floor(Date.now() / windowMs) * windowMs
  }

  check(
    identifier: string,
    operation: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = this.getKey(identifier, operation)
    const now = Date.now()
    const windowStart = this.getWindowStart(windowMs)
    const resetTime = windowStart + windowMs

    let entry = this.store[key]

    // Create new entry or reset if window expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime,
        firstRequest: now
      }
      this.store[key] = entry
    }

    // Check if request is allowed
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    // Increment counter
    entry.count++

    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    }
  }

  // Get current status without incrementing
  status(
    identifier: string,
    operation: string,
    limit: number,
    windowMs: number
  ): {
    remaining: number;
    resetTime: number;
    used: number;
  } {
    const key = this.getKey(identifier, operation)
    const now = Date.now()
    const windowStart = this.getWindowStart(windowMs)
    const resetTime = windowStart + windowMs

    const entry = this.store[key]

    if (!entry || entry.resetTime <= now) {
      return {
        remaining: limit,
        resetTime,
        used: 0
      }
    }

    return {
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
      used: entry.count
    }
  }

  // Reset limits for a specific identifier and operation
  reset(identifier: string, operation: string): void {
    const key = this.getKey(identifier, operation)
    delete this.store[key]
  }

  // Get all current limits for debugging
  getAllLimits(): Record<string, RateLimitEntry> {
    return { ...this.store }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store = {}
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Rate limit configurations by operation type
export const RATE_LIMIT_CONFIGS = {
  // Story creation - more restrictive due to high cost
  STORY_CREATION: {
    limit: RATE_LIMITS.STORY_CREATION_PER_MINUTE,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // Chapter generation - moderate restrictions
  CHAPTER_GENERATION: {
    limit: RATE_LIMITS.CHAPTER_GENERATION_PER_MINUTE,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // General API requests - less restrictive
  API_GENERAL: {
    limit: RATE_LIMITS.API_REQUESTS_PER_MINUTE,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Export requests - hourly limit
  EXPORT: {
    limit: RATE_LIMITS.EXPORT_REQUESTS_PER_HOUR,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // Authentication attempts - stricter for security
  AUTH_ATTEMPT: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Health check - very permissive
  HEALTH_CHECK: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // V2.0 Fact extraction - moderate limits
  FACT_EXTRACTION: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // V2.0 Fact optimization - moderate limits
  FACT_OPTIMIZATION: {
    limit: 15,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // V2.0 Story analysis - moderate limits
  STORY_ANALYSIS: {
    limit: 8,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // Dashboard access - moderate limits
  DASHBOARD_ACCESS: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Guest story creation - very limited
  GUEST_STORY_CREATION: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // Guest chapter generation - very limited
  GUEST_CHAPTER_GENERATION: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // Guest character generation - very limited
  GUEST_CHARACTER_GENERATION: {
    limit: 2,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  }
} as const

export type RateLimitOperation = keyof typeof RATE_LIMIT_CONFIGS;

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Use user ID if available (authenticated requests)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address for unauthenticated requests
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIP || 'unknown'
  
  return `ip:${ip}`
}

// Main rate limiting middleware
export async function rateLimit(
  request: NextRequest,
  operation: RateLimitOperation,
  userId?: string
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}> {
  const config = RATE_LIMIT_CONFIGS[operation]

  // Handle missing config gracefully
  if (!config) {
    // Rate limit config not found for operation - production logging system would handle this
    return {
      success: true,
      headers: {}
    }
  }

  const identifier = getClientIdentifier(request, userId)

  const result = rateLimiter.check(
    identifier,
    operation,
    config.limit,
    config.windowMs
  )

  // Prepare headers for client
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Window': (config.windowMs / 1000).toString()
  }

  if (!result.allowed) {
    headers['Retry-After'] = result.retryAfter?.toString() || '60'
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          details: [
            `Rate limit exceeded for ${operation.toLowerCase()}. ` +
            `Try again in ${result.retryAfter} seconds.`
          ],
          rateLimitInfo: {
            limit: config.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: result.retryAfter
          }
        },
        { 
          status: 429,
          headers
        }
      ),
      headers
    }
  }

  return {
    success: true,
    headers
  }
}

// Get rate limit status without consuming a request
export function getRateLimitStatus(
  request: NextRequest,
  operation: RateLimitOperation,
  userId?: string
): {
  remaining: number;
  resetTime: number;
  used: number;
  limit: number;
} {
  const config = RATE_LIMIT_CONFIGS[operation]
  const identifier = getClientIdentifier(request, userId)
  
  const status = rateLimiter.status(
    identifier,
    operation,
    config.limit,
    config.windowMs
  )

  return {
    ...status,
    limit: config.limit
  }
}

// Reset rate limits for a user (admin function)
export function resetUserRateLimit(
  userId: string,
  operation?: RateLimitOperation
): void {
  const identifier = `user:${userId}`
  
  if (operation) {
    rateLimiter.reset(identifier, operation)
  } else {
    // Reset all operations for this user
    Object.keys(RATE_LIMIT_CONFIGS).forEach(op => {
      rateLimiter.reset(identifier, op as RateLimitOperation)
    })
  }
}

// Advanced rate limiting with burst allowance
export async function burstRateLimit(
  request: NextRequest,
  operation: RateLimitOperation,
  userId?: string,
  burstMultiplier: number = 2
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
  isBurst: boolean;
}> {
  const config = RATE_LIMIT_CONFIGS[operation]
  const identifier = getClientIdentifier(request, userId)
  
  // First check normal limit
  const normalResult = rateLimiter.check(
    identifier,
    operation,
    config.limit,
    config.windowMs
  )

  if (normalResult.allowed) {
    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': normalResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(normalResult.resetTime / 1000).toString()
      },
      isBurst: false
    }
  }

  // Check burst limit
  const burstLimit = Math.floor(config.limit * burstMultiplier)
  const burstResult = rateLimiter.check(
    identifier,
    `${operation}_burst`,
    burstLimit,
    config.windowMs
  )

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Burst-Limit': burstLimit.toString(),
    'X-RateLimit-Remaining': Math.max(0, burstResult.remaining - config.limit).toString(),
    'X-RateLimit-Reset': Math.ceil(burstResult.resetTime / 1000).toString()
  }

  if (!burstResult.allowed) {
    headers['Retry-After'] = burstResult.retryAfter?.toString() || '60'
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          details: [
            `Burst rate limit exceeded for ${operation.toLowerCase()}. ` +
            `Try again in ${burstResult.retryAfter} seconds.`
          ]
        },
        { 
          status: 429,
          headers
        }
      ),
      headers,
      isBurst: true
    }
  }

  return {
    success: true,
    headers: {
      ...headers,
      'X-RateLimit-Burst-Used': 'true'
    },
    isBurst: true
  }
}

// Subscription-aware rate limiting
export async function subscriptionAwareRateLimit(
  request: NextRequest,
  operation: RateLimitOperation,
  userId: string,
  subscriptionTier: 'free' | 'pro'
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}> {
  const config = RATE_LIMIT_CONFIGS[operation]
  
  // Pro users get higher limits
  const multiplier = subscriptionTier === 'pro' ? 3 : 1
  const adjustedLimit = Math.floor(config.limit * multiplier)
  
  const identifier = getClientIdentifier(request, userId)
  
  const result = rateLimiter.check(
    identifier,
    `${operation}_${subscriptionTier}`,
    adjustedLimit,
    config.windowMs
  )

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': adjustedLimit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Tier': subscriptionTier
  }

  if (!result.allowed) {
    headers['Retry-After'] = result.retryAfter?.toString() || '60'
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          details: [
            `Rate limit exceeded for ${subscriptionTier} tier. ` +
            (subscriptionTier === 'free' 
              ? 'Upgrade to Pro for higher limits.' 
              : `Try again in ${result.retryAfter} seconds.`)
          ]
        },
        { 
          status: 429,
          headers
        }
      ),
      headers
    }
  }

  return {
    success: true,
    headers
  }
}

// Utility for logging rate limit violations
export function logRateLimitViolation(
  identifier: string,
  operation: RateLimitOperation,
  request: NextRequest
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    identifier,
    operation,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIdentifier(request).replace('ip:', ''),
    path: request.nextUrl.pathname,
    method: request.method
  }

  // Rate limit violation detected - production logging system would handle this

  // You could also store persistent violations for abuse detection
  // Example: Track users who consistently hit rate limits
}

// Cleanup function for testing or shutdown
export function destroyRateLimiter(): void {
  rateLimiter.destroy()
}

// Export the rate limiter instance for advanced usage
export { rateLimiter }

export default rateLimit