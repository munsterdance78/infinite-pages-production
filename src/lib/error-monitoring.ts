// Built-in Error Monitoring System for Infinite Pages
// Uses existing /api/errors endpoint and Supabase storage

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

type ErrorCategory =
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

interface ErrorReport {
  message: string
  stack?: string | undefined
  category: ErrorCategory
  severity: ErrorSeverity
  source: 'client' | 'server' | 'middleware' | 'external'
  timestamp: string
  url: string
  userAgent?: string | undefined
  userId?: string | undefined
  sessionId?: string | undefined
  component?: string | undefined
  operation?: string | undefined
  apiEndpoint?: string | undefined
  statusCode?: number | undefined
  userTier?: 'basic' | 'premium' | undefined
  deviceInfo?: {
    platform?: string
    browser?: string
    version?: string
    mobile?: boolean
  } | undefined
  customData?: Record<string, unknown> | undefined
  responseTime?: number | undefined
}

class ErrorMonitor {
  private sessionId: string
  private userId?: string
  private userTier?: 'basic' | 'premium' | undefined
  private isInitialized = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDeviceInfo() {
    if (typeof navigator === 'undefined') return {}

    const ua = navigator.userAgent
    return {
      platform: navigator.platform,
      browser: this.getBrowserName(ua),
      version: this.getBrowserVersion(ua),
      mobile: /Mobile|Android|iPhone|iPad/.test(ua)
    }
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/)
    return match ? (match[1] || 'Unknown') : 'Unknown'
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message || 'Unknown JavaScript error',
        stack: event.error?.stack,
        category: 'javascript_error',
        severity: 'high',
        source: 'client',
        url: event.filename || window.location.href,
        customData: {
          lineno: event.lineno,
          colno: event.colno,
          filename: event.filename
        }
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        category: 'unhandled_rejection',
        severity: 'high',
        source: 'client',
        url: window.location.href,
        customData: {
          reason: event.reason
        }
      })
    })

    // Monitor fetch API for network errors
    this.monitorFetchAPI()

    this.isInitialized = true
  }

  private monitorFetchAPI() {
    if (typeof window === 'undefined' || !window.fetch) return

    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const startTime = Date.now()
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString())

      try {
        const response = await originalFetch(input, init)
        const responseTime = Date.now() - startTime

        // Report slow API calls
        if (responseTime > 5000) {
          this.captureError({
            message: `Slow API response: ${url}`,
            category: 'performance_issue',
            severity: 'medium',
            source: 'client',
            url: window.location.href,
            apiEndpoint: url,
            responseTime,
            statusCode: response.status
          })
        }

        // Report API errors
        if (!response.ok) {
          this.captureError({
            message: `API Error: ${response.status} ${response.statusText}`,
            category: response.status === 401 || response.status === 403 ? 'authentication_error' : 'api_error',
            severity: response.status >= 500 ? 'high' : 'medium',
            source: 'client',
            url: window.location.href,
            apiEndpoint: url,
            statusCode: response.status,
            responseTime
          })
        }

        return response
      } catch (error) {
        const responseTime = Date.now() - startTime

        this.captureError({
          message: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
          stack: error instanceof Error ? error.stack : undefined,
          category: 'network_error',
          severity: 'high',
          source: 'client',
          url: window.location.href,
          apiEndpoint: url,
          responseTime
        })

        throw error
      }
    }
  }

  // Set user context
  setUser(userId: string, userTier?: 'basic' | 'premium') {
    this.userId = userId
    this.userTier = userTier
  }

  // Capture error manually
  captureError(partialError: Omit<ErrorReport, 'timestamp' | 'sessionId' | 'deviceInfo' | 'userAgent'>) {
    if (typeof window === 'undefined') return

    const errorReport: ErrorReport = {
      ...partialError,
      timestamp: new Date().toISOString(),
      url: partialError.url || window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      userTier: this.userTier,
      deviceInfo: this.getDeviceInfo()
    }

    // Send to your existing error reporting API
    this.sendErrorReport(errorReport).catch(console.error)
  }

  // Capture custom message
  captureMessage(message: string, severity: ErrorSeverity = 'low', category: ErrorCategory = 'unknown') {
    this.captureError({
      message,
      severity,
      category,
      source: 'client',
      url: window.location.href
    })
  }

  // Capture exception
  captureException(error: Error, context?: { component?: string; operation?: string; customData?: Record<string, unknown> }) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      category: 'javascript_error',
      severity: 'high',
      source: 'client',
      url: window.location.href,
      ...context
    })
  }

  // Report performance issue
  reportPerformanceIssue(operation: string, duration: number, threshold = 1000) {
    if (duration > threshold) {
      this.captureError({
        message: `Performance issue: ${operation} took ${duration}ms`,
        category: 'performance_issue',
        severity: duration > threshold * 3 ? 'high' : 'medium',
        source: 'client',
        url: window.location.href,
        operation,
        responseTime: duration
      })
    }
  }

  private async sendErrorReport(errorReport: ErrorReport) {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      })

      if (!response.ok) {
        console.error('Failed to send error report:', response.status)
      }
    } catch (error) {
      // Fallback: log to console if error reporting fails
      console.error('Error reporting failed:', error)
      console.error('Original error:', errorReport)
    }
  }

  // Get monitoring status
  isReady(): boolean {
    return this.isInitialized
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor()

// Hook for React components
export function useErrorMonitor() {
  return {
    captureError: errorMonitor.captureError.bind(errorMonitor),
    captureMessage: errorMonitor.captureMessage.bind(errorMonitor),
    captureException: errorMonitor.captureException.bind(errorMonitor),
    reportPerformanceIssue: errorMonitor.reportPerformanceIssue.bind(errorMonitor),
    setUser: errorMonitor.setUser.bind(errorMonitor)
  }
}

// Performance timing helper
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T> | T,
  threshold = 1000
): Promise<T> {
  const start = Date.now()

  try {
    const result = fn()

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = Date.now() - start
        errorMonitor.reportPerformanceIssue(operation, duration, threshold)
      })
    } else {
      const duration = Date.now() - start
      errorMonitor.reportPerformanceIssue(operation, duration, threshold)
      return Promise.resolve(result)
    }
  } catch (error) {
    const duration = Date.now() - start
    errorMonitor.captureException(error as Error, { operation })
    throw error
  }
}

export default errorMonitor