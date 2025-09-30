// Comprehensive Request Tracking System for Infinite Pages
// Tracks complete request flow: Frontend Action → API Call → Response → UI Update

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface RequestContext {
  // Frontend context
  frontendAction: string // e.g., "story_create_button", "chapter_generate_button"
  frontendComponent: string // e.g., "StoryCreator", "ChapterGenerator"
  frontendPage: string // e.g., "/dashboard", "/stories/123"

  // Integration context
  integrationPoint: string // e.g., "claude_api", "supabase_insert", "stripe_payment"
  expectedEndpoint?: string // what endpoint should be called
  expectedIntegration?: string // what integration should happen

  // User context
  userTier?: 'basic' | 'premium'
  customData?: Record<string, unknown>
}

interface RequestLog {
  requestId: string
  sessionId: string
  userId?: string

  // Frontend context
  frontendAction: string
  frontendComponent: string
  frontendPage: string

  // API details
  apiEndpoint: string
  expectedEndpoint?: string
  httpMethod: HttpMethod

  // Request/Response data
  requestHeaders: Record<string, string>
  requestBodySize: number
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBodySize: number
  responseTimeMs: number

  // Success/Failure tracking
  successFlag: boolean
  errorMessage?: string
  errorCategory?: string

  // Integration tracking
  integrationPoint: string
  expectedIntegration?: string
  integrationSuccess: boolean

  // User context
  userTier?: 'basic' | 'premium'
  deviceInfo: {
    platform?: string
    browser?: string
    version?: string
    mobile?: boolean
  }

  // Timing and performance
  queueTimeMs?: number
  processingTimeMs?: number
  totalTimeMs: number

  // Metadata
  customData?: Record<string, unknown>
  createdAt: string
}

class RequestTracker {
  private sessionId: string
  private userId?: string
  private userTier?: 'basic' | 'premium' | undefined
  private deviceInfo: {
    platform?: string
    browser?: string
    version?: string
    mobile?: boolean
  }
  private activeRequests: Map<string, { startTime: number; context: RequestContext }> = new Map()

  constructor() {
    this.sessionId = this.generateSessionId()
    this.deviceInfo = this.getDeviceInfo()
    this.setupFetchInterceptor()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  // Set user context
  setUser(userId: string, userTier?: 'basic' | 'premium') {
    this.userId = userId
    this.userTier = userTier
  }

  // Start tracking a request
  startRequest(context: RequestContext): string {
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    this.activeRequests.set(requestId, {
      startTime,
      context
    })

    return requestId
  }

  // Track API call with full context
  async trackApiCall<T>(
    requestId: string,
    url: string,
    options: RequestInit & { expectedEndpoint?: string } = {}
  ): Promise<Response> {
    const requestData = this.activeRequests.get(requestId)
    if (!requestData) {
      throw new Error(`No active request found for ID: ${requestId}`)
    }

    const { startTime, context } = requestData
    const method = (options.method || 'GET') as HttpMethod

    // Prepare request tracking data
    const requestHeaders = this.extractHeaders(options.headers)
    const requestBodySize = this.calculateBodySize(options.body)
    const apiCallStartTime = Date.now()

    try {
      // Make the actual API call
      const response = await fetch(url, options)

      // Calculate timing
      const responseTime = Date.now() - apiCallStartTime
      const totalTime = Date.now() - startTime

      // Extract response data
      const responseHeaders = this.extractResponseHeaders(response)
      const responseBodySize = await this.calculateResponseBodySize(response.clone())

      // Determine success
      const successFlag = response.ok
      const integrationSuccess = this.determineIntegrationSuccess(response, context)

      // Create request log
      const requestLog: RequestLog = {
        requestId,
        sessionId: this.sessionId,
        ...(this.userId !== undefined && { userId: this.userId }),
        frontendAction: context.frontendAction,
        frontendComponent: context.frontendComponent,
        frontendPage: context.frontendPage || window.location.pathname,
        apiEndpoint: url,
        ...(options.expectedEndpoint || context.expectedEndpoint) && { expectedEndpoint: options.expectedEndpoint || context.expectedEndpoint },
        httpMethod: method,
        requestHeaders,
        requestBodySize,
        responseStatus: response.status,
        responseHeaders,
        responseBodySize,
        responseTimeMs: responseTime,
        successFlag,
        ...(!successFlag && { errorMessage: `HTTP ${response.status}: ${response.statusText}` }),
        ...(this.categorizeError(response.status) !== undefined && { errorCategory: this.categorizeError(response.status) }),
        integrationPoint: context.integrationPoint,
        ...(context.expectedIntegration !== undefined && { expectedIntegration: context.expectedIntegration }),
        integrationSuccess,
        ...(this.userTier !== undefined && { userTier: this.userTier }),
        deviceInfo: this.deviceInfo,
        totalTimeMs: totalTime,
        ...(context.customData !== undefined && { customData: context.customData }),
        createdAt: new Date().toISOString()
      }

      // Send to tracking API (fire and forget)
      this.sendRequestLog(requestLog).catch(console.error)

      // Clean up
      this.activeRequests.delete(requestId)

      return response
    } catch (error) {
      // Handle network/other errors
      const responseTime = Date.now() - apiCallStartTime
      const totalTime = Date.now() - startTime

      const requestLog: RequestLog = {
        requestId,
        sessionId: this.sessionId,
        ...(this.userId !== undefined && { userId: this.userId }),
        frontendAction: context.frontendAction,
        frontendComponent: context.frontendComponent,
        frontendPage: context.frontendPage || window.location.pathname,
        apiEndpoint: url,
        ...(options.expectedEndpoint || context.expectedEndpoint) && { expectedEndpoint: options.expectedEndpoint || context.expectedEndpoint },
        httpMethod: method,
        requestHeaders,
        requestBodySize,
        responseStatus: 0,
        responseHeaders: {},
        responseBodySize: 0,
        responseTimeMs: responseTime,
        successFlag: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCategory: 'network_error',
        integrationPoint: context.integrationPoint,
        ...(context.expectedIntegration !== undefined && { expectedIntegration: context.expectedIntegration }),
        integrationSuccess: false,
        ...(this.userTier !== undefined && { userTier: this.userTier }),
        deviceInfo: this.deviceInfo,
        totalTimeMs: totalTime,
        ...(context.customData !== undefined && { customData: context.customData }),
        createdAt: new Date().toISOString()
      }

      this.sendRequestLog(requestLog).catch(console.error)
      this.activeRequests.delete(requestId)

      throw error
    }
  }

  // Complete a request with UI update success/failure
  completeRequest(requestId: string, uiUpdateSuccess: boolean = true, customData?: Record<string, unknown>) {
    const requestData = this.activeRequests.get(requestId)
    if (!requestData) {
      return // Request was likely completed by trackApiCall
    }

    // Update the success flag based on UI update
    // This is useful for cases where API succeeds but UI update fails
    if (customData) {
      // Send an update to the request log
      this.updateRequestLog(requestId, {
        integrationSuccess: uiUpdateSuccess,
        customData: { ...requestData.context.customData, ...customData }
      }).catch(console.error)
    }

    this.activeRequests.delete(requestId)
  }

  // Convenience method for complete request flow tracking
  async trackCompleteFlow<T>(
    context: RequestContext,
    apiCall: (requestId: string) => Promise<T>,
    uiUpdate?: (result: T) => Promise<boolean>
  ): Promise<T> {
    const requestId = this.startRequest(context)

    try {
      const result = await apiCall(requestId)

      if (uiUpdate) {
        try {
          const uiSuccess = await uiUpdate(result)
          this.completeRequest(requestId, uiSuccess)
        } catch (uiError) {
          this.completeRequest(requestId, false, {
            uiError: uiError instanceof Error ? uiError.message : String(uiError)
          })
        }
      } else {
        this.completeRequest(requestId, true)
      }

      return result
    } catch (error) {
      this.completeRequest(requestId, false, {
        apiError: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private setupFetchInterceptor() {
    if (typeof window === 'undefined' || !window.fetch) return

    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      // Check if this is a tracked request
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString())
      const requestId = (init as { requestId?: string })?.requestId

      // CRITICAL FIX: Prevent infinite recursion by excluding ONLY self-tracking calls from the interceptor
      // Allow legitimate API endpoints to function normally, only block when called from within this interceptor
      const isFromThisInterceptor = (init as { _fromRequestTracker?: boolean })?._fromRequestTracker
      if (url.includes('/api/request-tracking/') && isFromThisInterceptor) {
        return originalFetch(input, init)
      }

      if (requestId && this.activeRequests.has(requestId)) {
        // Use our tracking method
        return this.trackApiCall(requestId, url, init)
      } else {
        // Use original fetch
        return originalFetch(input, init)
      }
    }
  }

  private extractHeaders(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) return {}

    if (headers instanceof Headers) {
      const result: Record<string, string> = {}
      headers.forEach((value, key) => {
        result[key] = value
      })
      return result
    }

    if (Array.isArray(headers)) {
      const result: Record<string, string> = {}
      headers.forEach(([key, value]) => {
        result[key] = value
      })
      return result
    }

    return { ...headers } as Record<string, string>
  }

  private extractResponseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }

  private calculateBodySize(body: BodyInit | null | undefined): number {
    if (!body) return 0

    if (typeof body === 'string') {
      return new Blob([body]).size
    }

    if (body instanceof Blob) {
      return body.size
    }

    if (body instanceof ArrayBuffer) {
      return body.byteLength
    }

    if (body instanceof FormData) {
      // Approximate size
      let size = 0
      body.forEach((value) => {
        if (typeof value === 'string') {
          size += new Blob([value]).size
        } else if (value instanceof File) {
          size += value.size
        }
      })
      return size
    }

    return 0
  }

  private async calculateResponseBodySize(response: Response): Promise<number> {
    try {
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        return parseInt(contentLength, 10)
      }

      // Fallback: read the body to calculate size
      const blob = await response.blob()
      return blob.size
    } catch {
      return 0
    }
  }

  private determineIntegrationSuccess(response: Response, context: RequestContext): boolean {
    // Basic success check
    if (!response.ok) return false

    // Check if endpoint matches expected
    if (context.expectedEndpoint && !response.url.includes(context.expectedEndpoint)) {
      return false
    }

    return true
  }

  private categorizeError(status: number): string {
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) return 'authentication_error'
      if (status === 429) return 'rate_limit_error'
      return 'client_error'
    }

    if (status >= 500) return 'server_error'
    if (status === 0) return 'network_error'

    return 'unknown_error'
  }

  private async sendRequestLog(requestLog: RequestLog) {
    try {
      await fetch('/api/request-tracking/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestLog),
        _fromRequestTracker: true  // Mark as internal call to prevent recursion
      } as RequestInit & { _fromRequestTracker?: boolean })
    } catch (error) {
      console.error('Failed to send request log:', error)
    }
  }

  private async updateRequestLog(requestId: string, updates: Partial<RequestLog>) {
    try {
      await fetch('/api/request-tracking/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, updates }),
        _fromRequestTracker: true  // Mark as internal call to prevent recursion
      } as RequestInit & { _fromRequestTracker?: boolean })
    } catch (error) {
      console.error('Failed to update request log:', error)
    }
  }

  // Get session information
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userTier: this.userTier,
      activeRequests: this.activeRequests.size
    }
  }
}

// Global request tracker instance
export const requestTracker = new RequestTracker()

// Hook for React components
export function useRequestTracker() {
  return {
    startRequest: requestTracker.startRequest.bind(requestTracker),
    trackApiCall: requestTracker.trackApiCall.bind(requestTracker),
    completeRequest: requestTracker.completeRequest.bind(requestTracker),
    trackCompleteFlow: requestTracker.trackCompleteFlow.bind(requestTracker),
    setUser: requestTracker.setUser.bind(requestTracker),
    getSessionInfo: requestTracker.getSessionInfo.bind(requestTracker)
  }
}

// Utility function for easy request tracking
export async function trackRequest<T>(
  context: RequestContext,
  apiCall: () => Promise<T>
): Promise<T> {
  return requestTracker.trackCompleteFlow(
    context,
    async (requestId) => {
      // Modify the fetch options to include request ID in headers
      const originalFetch = window.fetch
      window.fetch = (input, init = {}) => {
        const headers = new Headers(init.headers)
        headers.set('X-Request-ID', requestId)
        return originalFetch(input, { ...init, headers })
      }

      try {
        const result = await apiCall()
        return result
      } finally {
        // Restore original fetch
        window.fetch = originalFetch
      }
    }
  )
}

export default requestTracker