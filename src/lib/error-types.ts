/**
 * Error monitoring types and interfaces
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ErrorCategory =
  | 'javascript_error'
  | 'api_error'
  | 'authentication_error'
  | 'payment_error'
  | 'ai_generation_error'
  | 'database_error'
  | 'validation_error'
  | 'rate_limit_error'
  | 'security_violation'
  | 'performance_issue'
  | 'user_reported'
  | 'unhandled_rejection'
  | 'network_error'
  | 'unknown'

export interface ServerErrorReport {
  message: string
  stack?: string
  category: ErrorCategory
  severity: ErrorSeverity
  source: 'server'
  timestamp: string
  url: string
  apiEndpoint: string
  statusCode?: number
  userId?: string
  operation?: string
  requestId?: string
  responseTime?: number
  memoryUsage?: number
  customData?: Record<string, unknown>
}

export interface ErrorContext {
  category: ErrorCategory
  severity: ErrorSeverity
  apiEndpoint: string
  operation?: string
  userId?: string
  statusCode?: number
  responseTime?: number
  memoryUsage?: number
  customData?: Record<string, unknown>
}

export interface ErrorMetrics {
  count: number
  lastOccurrence: string
  averageResponseTime?: number
  affectedUsers: string[]
  commonPatterns: string[]
}