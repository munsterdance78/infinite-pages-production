import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

/**
 * Simplified rate limiting for build compatibility
 * TODO: Implement proper rate limiting logic
 */
export async function subscriptionAwareRateLimit(
  request: NextRequest,
  operation: string,
  userTier?: string
): Promise<NextResponse | null> {
  // Simplified implementation - always allow for now
  // In production, implement proper rate limiting based on subscription tier
  return null // null means no rate limit exceeded
}

export function logRateLimitViolation(
  operation: string,
  userTier: string,
  identifier: string
): void {
  console.warn(`Rate limit violation: ${operation} for ${userTier} user ${identifier}`)
}