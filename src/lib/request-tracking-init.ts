// Automatic Request Tracking Initialization
// This file ensures request tracking is always active and monitoring

import { requestTracker } from './request-tracking'

interface InitConfig {
  enableAutoTracking: boolean
  enablePerformanceMonitoring: boolean
  enableErrorAlerting: boolean
  alertThresholds: {
    errorRate: number // errors per minute
    responseTime: number // ms
    failureRate: number // percentage
  }
}

class RequestTrackingManager {
  private config: InitConfig
  private isInitialized = false
  private alertInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.config = {
      enableAutoTracking: true,
      enablePerformanceMonitoring: true,
      enableErrorAlerting: true,
      alertThresholds: {
        errorRate: 10, // 10 errors per minute triggers alert
        responseTime: 5000, // 5 second response time threshold
        failureRate: 25 // 25% failure rate triggers alert
      }
    }
  }

  async initialize() {
    if (this.isInitialized) return

    console.log('🔍 Initializing Request Tracking System...')

    try {
      // Set up automatic user detection
      this.setupUserTracking()

      // Start continuous monitoring
      this.startContinuousMonitoring()

      // Set up error alerting
      this.setupErrorAlerting()

      // Wrap all existing fetch calls automatically
      this.wrapGlobalFetch()

      this.isInitialized = true
      console.log('✅ Request Tracking System initialized successfully')

      // Send initialization success to tracking
      this.trackSystemEvent('request_tracking_initialized', {
        timestamp: new Date().toISOString(),
        config: this.config
      })

    } catch (error) {
      console.error('❌ Failed to initialize Request Tracking System:', error)
      this.trackSystemEvent('request_tracking_init_failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private setupUserTracking() {
    // Auto-detect user from common auth patterns
    if (typeof window !== 'undefined') {
      // Check for Supabase auth
      const checkAuth = async () => {
        try {
          const { createClient } = await import('@/lib/database/supabase')
          const supabase = createClient()

          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Get user profile for tier info
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_tier')
              .eq('id', user.id)
              .single()

            requestTracker.setUser(
              user.id,
              profile?.subscription_tier as 'basic' | 'premium' || 'basic'
            )

            console.log('👤 User tracking enabled:', user.id)
          }
        } catch (error) {
          console.log('ℹ️ User not authenticated, continuing with anonymous tracking')
        }
      }

      checkAuth()

      // Re-check auth on storage changes
      window.addEventListener('storage', checkAuth)
    }
  }

  private startContinuousMonitoring() {
    // Monitor every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000)
  }

  private setupErrorAlerting() {
    // Check for error patterns every minute
    this.alertInterval = setInterval(() => {
      this.checkErrorThresholds()
    }, 60000)
  }

  private async performHealthCheck() {
    try {
      const sessionInfo = requestTracker.getSessionInfo()

      // Log health check
      this.trackSystemEvent('health_check', {
        activeRequests: sessionInfo.activeRequests,
        sessionId: sessionInfo.sessionId,
        timestamp: new Date().toISOString()
      })

      // Check if tracking is still working
      if (sessionInfo.activeRequests > 100) {
        console.warn('⚠️ High number of active requests detected:', sessionInfo.activeRequests)
        this.sendAlert('high_active_requests', { count: sessionInfo.activeRequests })
      }

    } catch (error) {
      console.error('Health check failed:', error)
      this.sendAlert('health_check_failed', { error: String(error) })
    }
  }

  private async checkErrorThresholds() {
    try {
      // This would typically query your analytics API
      // For now, we'll implement basic client-side monitoring
      const response = await fetch('/api/admin/request-flow/stats', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (response.ok) {
        const stats = await response.json()

        // Check error rate threshold
        if (stats.errors_last_hour > this.config.alertThresholds.errorRate) {
          this.sendAlert('high_error_rate', {
            current: stats.errors_last_hour,
            threshold: this.config.alertThresholds.errorRate,
            successRate: stats.hourly_success_rate
          })
        }

        // Check response time threshold
        if (stats.avg_response_time_hour > this.config.alertThresholds.responseTime) {
          this.sendAlert('slow_response_time', {
            current: stats.avg_response_time_hour,
            threshold: this.config.alertThresholds.responseTime
          })
        }

        // Check failure rate
        const failureRate = 100 - (stats.hourly_success_rate || 100)
        if (failureRate > this.config.alertThresholds.failureRate) {
          this.sendAlert('high_failure_rate', {
            current: failureRate,
            threshold: this.config.alertThresholds.failureRate
          })
        }

      }
    } catch (error) {
      // Silently handle - don't spam console if dashboard isn't available
      console.debug('Threshold check failed (dashboard may not be accessible):', error)
    }
  }

  private wrapGlobalFetch() {
    if (typeof window === 'undefined' || !window.fetch) return

    const originalFetch = window.fetch

    // Enhanced fetch wrapper that tracks ALL requests
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString())
      const method = init.method || 'GET'

      // Skip tracking for our own tracking endpoints to prevent infinite loops
      if (url.includes('/api/request-tracking/') || url.includes('/api/admin/request-flow/')) {
        return originalFetch(input, init)
      }

      // Auto-track if not already being tracked
      if (!(init as { requestId?: string })?.requestId) {
        const requestId = requestTracker.startRequest({
          frontendAction: 'auto_fetch_call',
          frontendComponent: this.getCallerComponent(),
          frontendPage: window.location.pathname,
          integrationPoint: this.determineIntegrationPoint(url),
          customData: { autoTracked: true, url, method }
        })

        // Add requestId to init for tracking
        ;(init as { requestId?: string }).requestId = requestId
      }

      return originalFetch(input, init)
    }

    console.log('🌐 Global fetch wrapper installed - all API calls will be tracked')
  }

  private getCallerComponent(): string {
    try {
      const stack = new Error().stack || ''
      const lines = stack.split('\n')

      // Look for React component in stack trace
      for (const line of lines) {
        if (line.includes('.tsx') || line.includes('.jsx')) {
          const match = line.match(/([A-Z][a-zA-Z0-9]*(?:Component|Page)?)/)
          if (match && match[1]) return match[1]
        }
      }

      return 'UnknownComponent'
    } catch {
      return 'UnknownComponent'
    }
  }

  private determineIntegrationPoint(url: string): string {
    if (url.includes('/api/stories')) return 'story_api'
    if (url.includes('/api/chapters')) return 'chapter_api'
    if (url.includes('/api/auth')) return 'auth_api'
    if (url.includes('supabase.co')) return 'supabase_direct'
    if (url.includes('claude') || url.includes('anthropic')) return 'claude_api'
    if (url.includes('stripe')) return 'stripe_api'
    if (url.includes('/api/')) return 'internal_api'
    return 'external_api'
  }

  private async sendAlert(type: string, data: Record<string, unknown>) {
    console.warn(`🚨 REQUEST TRACKING ALERT [${type}]:`, data)

    // Send alert to tracking system
    this.trackSystemEvent('alert_triggered', { type, data })

    // You could also send to external alerting systems here
    // e.g., Discord webhook, Slack, email, etc.

    try {
      // Example: Send to a webhook endpoint
      if (process.env['NEXT_PUBLIC_ALERT_WEBHOOK_URL']) {
        await fetch(process.env['NEXT_PUBLIC_ALERT_WEBHOOK_URL'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: type,
            data,
            timestamp: new Date().toISOString(),
            site: 'infinite-pages',
            environment: process.env.NODE_ENV
          })
        })
      }
    } catch (error) {
      console.error('Failed to send external alert:', error)
    }
  }

  private trackSystemEvent(event: string, data: Record<string, unknown>) {
    try {
      requestTracker.startRequest({
        frontendAction: `system_${event}`,
        frontendComponent: 'RequestTrackingManager',
        frontendPage: window?.location?.pathname || '/system',
        integrationPoint: 'request_tracking_system',
        customData: { ...data, systemEvent: true }
      })
    } catch (error) {
      console.error('Failed to track system event:', error)
    }
  }

  // Public methods for manual control
  updateConfig(newConfig: Partial<InitConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log('📝 Request tracking config updated:', this.config)
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      config: this.config,
      sessionInfo: requestTracker.getSessionInfo()
    }
  }

  shutdown() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval)
      this.alertInterval = null
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    this.isInitialized = false
    console.log('🛑 Request tracking system shutdown')
  }

  // Force immediate health check
  async forceHealthCheck() {
    await this.performHealthCheck()
  }

  // Force immediate alert check
  async forceAlertCheck() {
    await this.checkErrorThresholds()
  }
}

// Global instance
export const requestTrackingManager = new RequestTrackingManager()

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestTrackingManager.initialize()
    })
  } else {
    requestTrackingManager.initialize()
  }
}

// Export for manual control
export default requestTrackingManager