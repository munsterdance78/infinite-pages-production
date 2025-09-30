import type { AuthenticatedRequest, AuthResult } from './types'
import { NextResponse } from 'next/server'

/**
 * Type guard to check if auth result is successful
 * @param authResult - Result from authentication middleware
 * @returns True if authentication successful, false if error response
 */
export function isAuthSuccess(authResult: AuthResult): authResult is AuthenticatedRequest {
  return !(authResult instanceof NextResponse)
}

/**
 * Extract user ID from authenticated request
 * @param authResult - Successful authentication result
 * @returns User ID string
 */
export function getUserId(authResult: AuthenticatedRequest): string {
  return authResult.user.id
}

/**
 * Extract user email from authenticated request
 * @param authResult - Successful authentication result
 * @returns User email or undefined
 */
export function getUserEmail(authResult: AuthenticatedRequest): string | undefined {
  return authResult.user.email
}

/**
 * Check if user has specific metadata field
 * @param authResult - Successful authentication result
 * @param field - Metadata field to check
 * @returns Boolean indicating if field exists and is truthy
 */
export function hasUserMetadata(authResult: AuthenticatedRequest, field: string): boolean {
  return !!(authResult.user.user_metadata?.[field] || authResult.user.app_metadata?.[field])
}

/**
 * Standardized error response for authentication failures
 * @param message - Error message
 * @param status - HTTP status code (default: 401)
 * @returns NextResponse with error
 */
export function authErrorResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Standardized success response for API endpoints
 * @param data - Response data
 * @param message - Optional success message
 * @returns NextResponse with data
 */
export function authSuccessResponse(data: any, message?: string): NextResponse {
  const response: any = { data }
  if (message) {
    response.message = message
  }
  return NextResponse.json(response)
}