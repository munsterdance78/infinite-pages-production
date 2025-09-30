// Server-side error monitoring for API routes
// Uses existing /api/errors endpoint and Supabase storage

import type { NextRequest, NextResponse } from 'next/server'
import type {
  ErrorSeverity,
  ErrorCategory,
  ServerErrorReport,
  ErrorContext
} from './error-types'
import {
  determineErrorSeverity,
  categorizeError,
  formatErrorForStorage
} from './error-utils'

class ServerErrorMonitor {
  // Report server error to the existing error system
  async reportError(
    error: Error | string,
    context: {
      category: ErrorCategory
      severity: ErrorSeverity
      apiEndpoint: string
      operation?: string | undefined
      userId?: string | undefined
      statusCode?: number | undefined
      responseTime?: number | undefined
      customData?: Record<string, unknown> | undefined
      request?: NextRequest | undefined
    }
  ) {
    const errorReport: ServerErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      ...(typeof error === 'object' && error.stack && { stack: error.stack }),
      category: context.category,
      severity: context.severity,
      source: 'server',
      timestamp: new Date().toISOString(),
      url: context.request?.url || context.apiEndpoint,
      apiEndpoint: context.apiEndpoint,
      ...(context.statusCode !== undefined && { statusCode: context.statusCode }),
      ...(context.userId !== undefined && { userId: context.userId }),
      ...(context.operation !== undefined && { operation: context.operation }),
      requestId: this.generateRequestId(),
      ...(context.responseTime !== undefined && { responseTime: context.responseTime }),
      ...(this.getMemoryUsage() !== undefined && { memoryUsage: this.getMemoryUsage() }),
      ...(context.customData !== undefined && { customData: context.customData })
    }

    // In server environment, we can directly call the error processing logic
    // instead of making HTTP request to /api/errors
    await this.storeError(errorReport)

    // Also log to console for immediate visibility
    console.error(`[${context.severity.toUpperCase()}] ${context.category}:`, {
      message: errorReport.message,
      endpoint: context.apiEndpoint,
      operation: context.operation,
      userId: context.userId,
      requestId: errorReport.requestId
    })
  }

  // Report AI generation errors specifically
  async reportAIError(
    error: Error | string,
    context: {
      operation: string
      model?: string
      inputTokens?: number
      outputTokens?: number
      userId?: string
      apiEndpoint: string
      responseTime?: number
      prompt?: string
      request?: NextRequest
    }
  ) {
    await this.reportError(error, {
      category: 'ai_generation_error',
      severity: 'high',
      apiEndpoint: context.apiEndpoint,
      operation: context.operation,
      userId: context.userId,
      responseTime: context.responseTime,
      request: context.request,
      customData: {
        model: context.model,
        inputTokens: context.inputTokens,
        outputTokens: context.outputTokens,
        promptLength: context.prompt?.length
      }
    })
  }

  // Report database errors
  async reportDatabaseError(
    error: Error | string,
    context: {
      operation: string
      table?: string
      query?: string
      userId?: string
      apiEndpoint: string
      responseTime?: number
      request?: NextRequest
    }
  ) {
    await this.reportError(error, {
      category: 'database_error',
      severity: 'high',
      apiEndpoint: context.apiEndpoint,
      operation: context.operation,
      userId: context.userId,
      responseTime: context.responseTime,
      request: context.request,
      customData: {
        table: context.table,
        queryType: context.query?.split(' ')[0]?.toUpperCase() // SELECT, INSERT, etc.
      }
    })
  }

  // Report authentication errors
  async reportAuthError(
    error: Error | string,
    context: {
      operation: string
      userId?: string
      apiEndpoint: string
      request?: NextRequest
    }
  ) {
    await this.reportError(error, {
      category: 'authentication_error',
      severity: 'medium',
      apiEndpoint: context.apiEndpoint,
      operation: context.operation,
      userId: context.userId,
      statusCode: 401,
      request: context.request
    })
  }

  // Report performance issues
  async reportPerformanceIssue(context: {
    operation: string
    responseTime: number
    threshold?: number | undefined
    apiEndpoint: string
    userId?: string | undefined
    request?: NextRequest | undefined
  }) {
    const threshold = context.threshold || 5000 // 5 seconds default

    if (context.responseTime > threshold) {
      await this.reportError(
        `Slow API response: ${context.operation} took ${context.responseTime}ms`,
        {
          category: 'performance_issue',
          severity: context.responseTime > threshold * 2 ? 'high' : 'medium',
          apiEndpoint: context.apiEndpoint,
          operation: context.operation,
          userId: context.userId,
          responseTime: context.responseTime,
          request: context.request
        }
      )
    }
  }

  // Wrap API handler with error monitoring
  withErrorMonitoring<T extends unknown[], R>(
    handler: (...args: T) => Promise<Response | NextResponse>,
    options: {
      operation: string
      apiEndpoint: string
    }
  ) {
    return async (...args: T): Promise<Response | NextResponse> => {
      const startTime = Date.now()
      let userId: string | undefined
      let request: NextRequest | undefined

      // Extract request and user info if available
      if (args.length > 0 && args[0] && typeof args[0] === 'object') {
        const possibleRequest = args[0] as { url?: string; method?: string }
        if (possibleRequest.url && possibleRequest.method) {
          request = possibleRequest as NextRequest
          // Try to extract userId from headers or URL
          userId = request.headers.get('x-user-id') || undefined
        }
      }

      try {
        const response = await handler(...args)
        const responseTime = Date.now() - startTime

        // Report performance issues
        await this.reportPerformanceIssue({
          operation: options.operation,
          responseTime,
          apiEndpoint: options.apiEndpoint,
          userId,
          request
        })

        return response
      } catch (error) {
        const responseTime = Date.now() - startTime

        // Determine error category and severity
        let category: ErrorCategory = 'api_error'
        let severity: ErrorSeverity = 'high'

        if (error instanceof Error) {
          if (error.message.includes('unauthorized') || error.message.includes('auth')) {
            category = 'authentication_error'
            severity = 'medium'
          } else if (error.message.includes('validation') || error.message.includes('invalid')) {
            category = 'validation_error'
            severity = 'medium'
          } else if (error.message.includes('database') || error.message.includes('query')) {
            category = 'database_error'
            severity = 'high'
          } else if (error.message.includes('claude') || error.message.includes('anthropic')) {
            category = 'ai_generation_error'
            severity = 'high'
          }
        }

        await this.reportError(error as Error, {
          category,
          severity,
          apiEndpoint: options.apiEndpoint,
          operation: options.operation,
          userId,
          statusCode: 500,
          responseTime,
          request
        })

        throw error
      }
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getMemoryUsage(): number {
    if (process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  // Store error in Supabase (same as existing /api/errors endpoint)
  private async storeError(errorReport: ServerErrorReport) {
    try {
      // Import here to avoid circular dependencies
      const { createClient } = await import('@supabase/supabase-js')

      if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
        console.error('Supabase credentials missing for error reporting')
        return
      }

      const supabase = createClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL'],
        process.env['SUPABASE_SERVICE_ROLE_KEY']
      )

      const { error: dbError } = await supabase
        .from('error_reports')
        .insert([{
          message: errorReport.message,
          stack: errorReport.stack,
          category: errorReport.category,
          severity: errorReport.severity,
          source: errorReport.source,
          url: errorReport.url,
          user_agent: 'server',
          user_id: errorReport.userId,
          session_id: errorReport.requestId,
          component: 'server-api',
          operation: errorReport.operation,
          api_endpoint: errorReport.apiEndpoint,
          status_code: errorReport.statusCode,
          response_time: errorReport.responseTime,
          memory_usage: errorReport.memoryUsage,
          custom_data: errorReport.customData,
          created_at: errorReport.timestamp,
          fingerprint: this.generateFingerprint(errorReport)
        }])

      if (dbError) {
        console.error('Failed to store error report:', dbError)
      }
    } catch (storeError) {
      console.error('Error storing error report:', storeError)
    }
  }

  private generateFingerprint(errorReport: ServerErrorReport): string {
    const components = [
      errorReport.message?.replace(/\d+/g, 'N'),
      errorReport.stack?.split('\n')[0]?.replace(/:\d+:\d+/g, ':N:N'),
      errorReport.operation,
      errorReport.apiEndpoint,
      errorReport.category
    ].filter(Boolean)

    return Buffer.from(components.join('|')).toString('base64').substr(0, 32)
  }
}

// Global server error monitor instance
export const serverErrorMonitor = new ServerErrorMonitor()

// Convenience function for API routes
export const withErrorMonitoring = serverErrorMonitor.withErrorMonitoring.bind(serverErrorMonitor)

// Export individual reporting functions
export const {
  reportError,
  reportAIError,
  reportDatabaseError,
  reportAuthError,
  reportPerformanceIssue
} = serverErrorMonitor

export default serverErrorMonitor