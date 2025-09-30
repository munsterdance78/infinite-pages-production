/**
 * Error monitoring utility functions
 */

import type { ErrorCategory, ErrorSeverity, ServerErrorReport } from './error-types'

export function determineErrorSeverity(error: Error | string): ErrorSeverity {
  const message = typeof error === 'string' ? error : error.message

  // Critical errors
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('timeout') ||
    message.includes('out of memory') ||
    message.includes('segmentation fault')
  ) {
    return 'critical'
  }

  // High severity
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('payment') ||
    message.includes('billing')
  ) {
    return 'high'
  }

  // Medium severity
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('not found')
  ) {
    return 'medium'
  }

  return 'low'
}

export function categorizeError(error: Error | string): ErrorCategory {
  const message = typeof error === 'string' ? error : error.message

  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'authentication_error'
  }

  if (message.includes('payment') || message.includes('stripe')) {
    return 'payment_error'
  }

  if (message.includes('database') || message.includes('sql')) {
    return 'database_error'
  }

  if (message.includes('ai') || message.includes('openai')) {
    return 'ai_generation_error'
  }

  if (message.includes('rate limit')) {
    return 'rate_limit_error'
  }

  if (message.includes('validation')) {
    return 'validation_error'
  }

  return 'api_error'
}

export function sanitizeErrorData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data }

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session'
  ]

  for (const field of sensitiveFields) {
    delete sanitized[field]
  }

  return sanitized
}

export function formatErrorForStorage(errorReport: ServerErrorReport): ServerErrorReport {
  return {
    ...errorReport,
    ...(errorReport.customData && { customData: sanitizeErrorData(errorReport.customData) }),
    ...(errorReport.stack && { stack: errorReport.stack.substring(0, 2000) }) // Limit stack trace
  }
}