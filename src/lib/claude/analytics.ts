import { createClient } from '@/lib/database/supabase'
import type { Database } from '@/lib/supabase/types'

export interface ClaudeAnalytics {
  // Usage metrics
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageTokensPerRequest: number
  averageCostPerRequest: number
  
  // Model usage
  modelUsage: {
    [model: string]: {
      requests: number
      tokens: number
      cost: number
    }
  }
  
  // Operation types
  operationUsage: {
    [operation: string]: {
      requests: number
      tokens: number
      cost: number
      averageTokens: number
    }
  }
  
  // Time-based metrics
  hourlyUsage: Array<{
    hour: string
    requests: number
    tokens: number
    cost: number
  }>
  
  dailyUsage: Array<{
    date: string
    requests: number
    tokens: number
    cost: number
  }>
  
  // Performance metrics
  averageResponseTime: number
  successRate: number
  errorRate: number
  
  // User metrics
  userMetrics: {
    totalUsers: number
    activeUsers: number
    averageRequestsPerUser: number
    topUsers: Array<{
      userId: string
      requests: number
      tokens: number
      cost: number
    }>
  }
  
  // Cache metrics
  cacheMetrics: {
    hitRate: number
    missRate: number
    totalHits: number
    totalMisses: number
    costSavings: number
  }
  
  // Efficiency metrics
  efficiencyMetrics: {
    wordsPerToken: number
    charactersPerToken: number
    qualityScore: number
  }
}

export interface ContextOptimizationMetrics {
  chapter_id: string
  tokens_before_optimization: number
  tokens_after_optimization: number
  compression_ratio: number
  generation_time_ms: number
  cost_before: number
  cost_after: number
  quality_maintained: boolean
  optimization_technique: string
  context_level: 'minimal' | 'standard' | 'detailed' | 'full'
}

export interface FactExtractionMetadata {
  compressionRatio: number
  originalLength: number
  compressedLength: number
  factType: string
  storyId?: string
  compressionSavings?: number
  creditsUsed?: number
  issuesFound?: number
}

export interface AnalysisMetadata {
  overallScore: number
  issuesFound: number
  analysisType: string
  storyId?: string
  contentLength?: number
  creditsUsed?: number
}

export interface AnalyticsEvent {
  id: string
  userId: string
  operation: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  responseTime: number
  success: boolean
  error?: string | undefined
  cached: boolean
  timestamp: Date
  metadata?: {
    genre?: string | undefined
    wordCount?: number | undefined
    improvementType?: string | undefined
    optimization?: ContextOptimizationMetrics | undefined
    factExtraction?: FactExtractionMetadata | undefined
    analysis?: AnalysisMetadata | undefined
    storyAnalysis?: AnalysisMetadata | undefined
    [key: string]: unknown
  } | undefined
}

export class ClaudeAnalyticsService {
  private events: AnalyticsEvent[] = []
  private supabase: ReturnType<typeof createClient> | null = null

  constructor() {
    // Initialize Supabase client if available
    try {
      this.supabase = createClient()
    } catch (error) {
      // Analytics: Supabase not available in this context
    }
  }

  /**
   * Track a Claude operation
   */
  async trackOperation(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }

    // Store in memory
    this.events.push(analyticsEvent)

    // Store in database if available
    if (this.supabase) {
      try {
        await (this.supabase as any)
          .from('claude_analytics')
          .insert({
            id: analyticsEvent.id,
            user_id: analyticsEvent.userId,
            operation: analyticsEvent.operation,
            model: analyticsEvent.model,
            input_tokens: analyticsEvent.inputTokens,
            output_tokens: analyticsEvent.outputTokens,
            total_tokens: analyticsEvent.inputTokens + analyticsEvent.outputTokens,
            cost: analyticsEvent.cost,
            response_time: analyticsEvent.responseTime,
            success: analyticsEvent.success,
            error: analyticsEvent.error,
            cached: analyticsEvent.cached,
            metadata: analyticsEvent.metadata,
            created_at: analyticsEvent.timestamp
          })
      } catch (error) {
        // Failed to store analytics event - production logging system would handle this
      }
    }

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * Get comprehensive analytics
   */
  async getAnalytics(timeRange: {
    start: Date
    end: Date
  } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  }): Promise<ClaudeAnalytics> {
    let events = this.events.filter(e => 
      e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    )

    // If Supabase is available, fetch from database
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('claude_analytics')
          .select('*')
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString())

        if (data) {
          events = data.map((row: {
            id: string
            user_id: string
            operation: string
            model: string
            input_tokens: number
            output_tokens: number
            cost: number
            response_time: number
            success: boolean
            error?: string
            cached: boolean
            created_at: string
            metadata?: unknown
          }): AnalyticsEvent => ({
            id: row.id,
            userId: row.user_id,
            operation: row.operation,
            model: row.model,
            inputTokens: row.input_tokens,
            outputTokens: row.output_tokens,
            cost: row.cost,
            responseTime: row.response_time,
            success: row.success,
            error: row.error,
            cached: row.cached,
            timestamp: new Date(row.created_at),
            metadata: row.metadata as AnalyticsEvent['metadata']
          }))
        }
      } catch (error) {
        // Failed to fetch analytics from database - production logging system would handle this
      }
    }

    return this.calculateAnalytics(events)
  }

  /**
   * Calculate analytics from events
   */
  private calculateAnalytics(events: AnalyticsEvent[]): ClaudeAnalytics {
    if (events.length === 0) {
      return this.getEmptyAnalytics()
    }

    const totalRequests = events.length
    const totalTokens = events.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0)
    const totalCost = events.reduce((sum, e) => sum + e.cost, 0)
    const successfulRequests = events.filter(e => e.success).length
    const cachedRequests = events.filter(e => e.cached).length

    // Model usage
    const modelUsage: { [key: string]: { requests: number; tokens: number; cost: number } } = {}
    events.forEach(event => {
      if (!modelUsage[event.model]) {
        modelUsage[event.model] = { requests: 0, tokens: 0, cost: 0 }
      }
      modelUsage[event.model]!.requests++
      modelUsage[event.model]!.tokens += event.inputTokens + event.outputTokens
      modelUsage[event.model]!.cost += event.cost
    })

    // Operation usage
    const operationUsage: { [key: string]: { requests: number; tokens: number; cost: number; averageTokens: number } } = {}
    events.forEach(event => {
      if (!operationUsage[event.operation]) {
        operationUsage[event.operation] = { requests: 0, tokens: 0, cost: 0, averageTokens: 0 }
      }
      operationUsage[event.operation]!.requests++
      operationUsage[event.operation]!.tokens += event.inputTokens + event.outputTokens
      operationUsage[event.operation]!.cost += event.cost
    })

    // Calculate average tokens per operation
    Object.keys(operationUsage).forEach(operation => {
      const usage = operationUsage[operation]!
      usage.averageTokens = usage.tokens / usage.requests
    })

    // Time-based metrics
    const hourlyUsage = this.calculateHourlyUsage(events)
    const dailyUsage = this.calculateDailyUsage(events)

    // Performance metrics
    const totalResponseTime = events.reduce((sum, e) => sum + e.responseTime, 0)
    const averageResponseTime = totalResponseTime / totalRequests
    const successRate = successfulRequests / totalRequests
    const errorRate = 1 - successRate

    // User metrics
    const userMetrics = this.calculateUserMetrics(events)

    // Cache metrics
    const cacheMetrics = {
      hitRate: cachedRequests / totalRequests,
      missRate: (totalRequests - cachedRequests) / totalRequests,
      totalHits: cachedRequests,
      totalMisses: totalRequests - cachedRequests,
      costSavings: cachedRequests * (totalCost / totalRequests) * 0.8 // Assume 80% cost savings from cache
    }

    // Efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(events)

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageTokensPerRequest: totalTokens / totalRequests,
      averageCostPerRequest: totalCost / totalRequests,
      modelUsage,
      operationUsage,
      hourlyUsage,
      dailyUsage,
      averageResponseTime,
      successRate,
      errorRate,
      userMetrics,
      cacheMetrics,
      efficiencyMetrics
    }
  }

  /**
   * Calculate hourly usage
   */
  private calculateHourlyUsage(events: AnalyticsEvent[]) {
    const hourlyMap = new Map<string, { requests: number; tokens: number; cost: number }>()
    
    events.forEach(event => {
      const hour = event.timestamp.toISOString().slice(0, 13) // YYYY-MM-DDTHH
      if (!hourlyMap.has(hour)) {
        hourlyMap.set(hour, { requests: 0, tokens: 0, cost: 0 })
      }
      const hourData = hourlyMap.get(hour)!
      hourData.requests++
      hourData.tokens += event.inputTokens + event.outputTokens
      hourData.cost += event.cost
    })

    return Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  }

  /**
   * Calculate daily usage
   */
  private calculateDailyUsage(events: AnalyticsEvent[]) {
    const dailyMap = new Map<string, { requests: number; tokens: number; cost: number }>()
    
    events.forEach(event => {
      const date = event.timestamp.toISOString().slice(0, 10) // YYYY-MM-DD
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { requests: 0, tokens: 0, cost: 0 })
      }
      const dayData = dailyMap.get(date)!
      dayData.requests++
      dayData.tokens += event.inputTokens + event.outputTokens
      dayData.cost += event.cost
    })

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Calculate user metrics
   */
  private calculateUserMetrics(events: AnalyticsEvent[]) {
    const userMap = new Map<string, { requests: number; tokens: number; cost: number }>()
    
    events.forEach(event => {
      if (!userMap.has(event.userId)) {
        userMap.set(event.userId, { requests: 0, tokens: 0, cost: 0 })
      }
      const userData = userMap.get(event.userId)!
      userData.requests++
      userData.tokens += event.inputTokens + event.outputTokens
      userData.cost += event.cost
    })

    const totalUsers = userMap.size
    const activeUsers = Array.from(userMap.values()).filter(u => u.requests > 0).length
    const totalRequests = events.length
    const averageRequestsPerUser = totalRequests / totalUsers

    const topUsers = Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)

    return {
      totalUsers,
      activeUsers,
      averageRequestsPerUser,
      topUsers
    }
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(events: AnalyticsEvent[]) {
    let totalWords = 0
    let totalCharacters = 0
    let totalOutputTokens = 0
    let qualityScoreSum = 0

    events.forEach(event => {
      if (event.metadata?.wordCount) {
        totalWords += event.metadata.wordCount
        totalOutputTokens += event.outputTokens
      }
      
      // Estimate characters from output tokens (rough approximation)
      totalCharacters += event.outputTokens * 4 // ~4 chars per token
      
      // Estimate quality score (could be improved with actual quality metrics)
      if (event.metadata?.wordCount && event.outputTokens > 0) {
        const wordsPerToken = event.metadata.wordCount / event.outputTokens
        const qualityScore = Math.min(wordsPerToken / 2, 5) // Scale to 0-5
        qualityScoreSum += qualityScore
      }
    })

    return {
      wordsPerToken: totalOutputTokens > 0 ? totalWords / totalOutputTokens : 0,
      charactersPerToken: totalOutputTokens > 0 ? totalCharacters / totalOutputTokens : 0,
      qualityScore: events.length > 0 ? qualityScoreSum / events.length : 0
    }
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(): ClaudeAnalytics {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageTokensPerRequest: 0,
      averageCostPerRequest: 0,
      modelUsage: {},
      operationUsage: {},
      hourlyUsage: [],
      dailyUsage: [],
      averageResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      userMetrics: {
        totalUsers: 0,
        activeUsers: 0,
        averageRequestsPerUser: 0,
        topUsers: []
      },
      cacheMetrics: {
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        costSavings: 0
      },
      efficiencyMetrics: {
        wordsPerToken: 0,
        charactersPerToken: 0,
        qualityScore: 0
      }
    }
  }

  /**
   * Get real-time metrics
   */
  getRealtimeMetrics(): {
    requestsPerMinute: number
    averageResponseTime: number
    currentCost: number
    activeOperations: number
  } {
    const lastMinute = new Date(Date.now() - 60 * 1000)
    const recentEvents = this.events.filter(e => e.timestamp >= lastMinute)
    
    const requestsPerMinute = recentEvents.length
    const averageResponseTime = recentEvents.length > 0 
      ? recentEvents.reduce((sum, e) => sum + e.responseTime, 0) / recentEvents.length 
      : 0
    const currentCost = recentEvents.reduce((sum, e) => sum + e.cost, 0)
    
    return {
      requestsPerMinute,
      averageResponseTime,
      currentCost,
      activeOperations: 0 // Would need to track active operations separately
    }
  }

  /**
   * Track context optimization specifically
   */
  async trackContextOptimization(metrics: ContextOptimizationMetrics): Promise<void> {
    const event: Omit<AnalyticsEvent, 'id' | 'timestamp'> = {
      userId: 'system', // Or pass userId parameter
      operation: 'context_optimization',
      model: 'optimization_tracker',
      inputTokens: metrics.tokens_before_optimization,
      outputTokens: metrics.tokens_after_optimization,
      cost: metrics.cost_after,
      responseTime: metrics.generation_time_ms,
      success: metrics.quality_maintained,
      cached: false,
      metadata: {
        optimization: metrics
      }
    }

    await this.trackOperation(event)
  }

  /**
   * Get optimization performance report
   */
  async getOptimizationReport(timeRange?: { start: Date; end: Date }): Promise<{
    totalOptimizations: number
    averageCompressionRatio: number
    totalTokensSaved: number
    totalCostSavings: number
    qualityMaintainanceRate: number
    optimizationsByTechnique: Record<string, number>
    optimizationsByContextLevel: Record<string, number>
  }> {
    const analytics = await this.getAnalytics(timeRange)
    const optimizationEvents = this.events.filter(e =>
      e.operation === 'context_optimization' &&
      e.metadata?.optimization
    )

    if (optimizationEvents.length === 0) {
      return {
        totalOptimizations: 0,
        averageCompressionRatio: 0,
        totalTokensSaved: 0,
        totalCostSavings: 0,
        qualityMaintainanceRate: 0,
        optimizationsByTechnique: {},
        optimizationsByContextLevel: {}
      }
    }

    const totalOptimizations = optimizationEvents.length
    const compressionRatios = optimizationEvents.map(e => e.metadata!.optimization!.compression_ratio)
    const averageCompressionRatio = compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / totalOptimizations

    const totalTokensSaved = optimizationEvents.reduce((sum, e) => {
      const opt = e.metadata!.optimization!
      return sum + (opt.tokens_before_optimization - opt.tokens_after_optimization)
    }, 0)

    const totalCostSavings = optimizationEvents.reduce((sum, e) => {
      const opt = e.metadata!.optimization!
      return sum + (opt.cost_before - opt.cost_after)
    }, 0)

    const qualityMaintained = optimizationEvents.filter(e => e.metadata!.optimization!.quality_maintained).length
    const qualityMaintainanceRate = qualityMaintained / totalOptimizations

    // Group by technique
    const optimizationsByTechnique: Record<string, number> = {}
    optimizationEvents.forEach(e => {
      const technique = e.metadata!.optimization!.optimization_technique
      optimizationsByTechnique[technique] = (optimizationsByTechnique[technique] || 0) + 1
    })

    // Group by context level
    const optimizationsByContextLevel: Record<string, number> = {}
    optimizationEvents.forEach(e => {
      const level = e.metadata!.optimization!.context_level
      optimizationsByContextLevel[level] = (optimizationsByContextLevel[level] || 0) + 1
    })

    return {
      totalOptimizations,
      averageCompressionRatio,
      totalTokensSaved,
      totalCostSavings,
      qualityMaintainanceRate,
      optimizationsByTechnique,
      optimizationsByContextLevel
    }
  }

  /**
   * Get real-time optimization metrics
   */
  getRealTimeOptimizationMetrics(): {
    currentCompressionRatio: number
    tokensPerMinute: number
    costSavingsPerHour: number
    optimizationSuccessRate: number
  } {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000)
    const recentOptimizations = this.events.filter(e =>
      e.operation === 'context_optimization' &&
      e.timestamp >= lastHour &&
      e.metadata?.optimization
    )

    if (recentOptimizations.length === 0) {
      return {
        currentCompressionRatio: 1.0,
        tokensPerMinute: 0,
        costSavingsPerHour: 0,
        optimizationSuccessRate: 0
      }
    }

    const compressionRatios = recentOptimizations.map(e => e.metadata!.optimization!.compression_ratio)
    const currentCompressionRatio = compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length

    const totalTokensSaved = recentOptimizations.reduce((sum, e) => {
      const opt = e.metadata!.optimization!
      return sum + (opt.tokens_before_optimization - opt.tokens_after_optimization)
    }, 0)
    const tokensPerMinute = totalTokensSaved / 60

    const totalCostSavings = recentOptimizations.reduce((sum, e) => {
      const opt = e.metadata!.optimization!
      return sum + (opt.cost_before - opt.cost_after)
    }, 0)
    const costSavingsPerHour = totalCostSavings

    const successfulOptimizations = recentOptimizations.filter(e => e.metadata!.optimization!.quality_maintained).length
    const optimizationSuccessRate = successfulOptimizations / recentOptimizations.length

    return {
      currentCompressionRatio,
      tokensPerMinute,
      costSavingsPerHour,
      optimizationSuccessRate
    }
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'id', 'userId', 'operation', 'model', 'inputTokens', 'outputTokens',
        'cost', 'responseTime', 'success', 'cached', 'timestamp'
      ].join(',')

      const rows = this.events.map(event => [
        event.id,
        event.userId,
        event.operation,
        event.model,
        event.inputTokens,
        event.outputTokens,
        event.cost,
        event.responseTime,
        event.success,
        event.cached,
        event.timestamp.toISOString()
      ].join(','))

      return [headers, ...rows].join('\n')
    }

    return JSON.stringify(this.events, null, 2)
  }

  // NEW: Track fact extraction with existing infrastructure
  async trackFactExtraction(metrics: {
    userId: string
    storyId: string
    factType: string
    compressionRatio: number
    extractionTime: number
    cost: number
    creditsUsed: number
    originalLength: number
    compressedLength: number
    issuesFound?: number
    error?: string
  }): Promise<void> {
    // Use existing trackOperation method
    await this.trackOperation({
      userId: metrics.userId,
      operation: 'fact_extraction',
      model: 'sfsl_processor',
      inputTokens: Math.ceil(metrics.originalLength / 4), // Approximate tokens from length
      outputTokens: Math.ceil(metrics.compressedLength / 4),
      cost: metrics.cost,
      responseTime: metrics.extractionTime,
      success: !metrics.error,
      cached: false,
      error: metrics.error,
      metadata: {
        factExtraction: {
          storyId: metrics.storyId,
          factType: metrics.factType,
          compressionRatio: metrics.compressionRatio,
          originalLength: metrics.originalLength,
          compressedLength: metrics.compressedLength,
          creditsUsed: metrics.creditsUsed,
          issuesFound: metrics.issuesFound || 0
        }
      }
    })
  }

  // NEW: Track story analysis with existing infrastructure
  async trackStoryAnalysis(metrics: {
    userId: string
    storyId: string
    analysisType: string
    analysisTime: number
    cost: number
    creditsUsed: number
    contentLength: number
    issuesFound: number
    overallScore: number
    error?: string
  }): Promise<void> {
    await this.trackOperation({
      userId: metrics.userId,
      operation: 'story_analysis',
      model: 'sfsl_analyzer',
      inputTokens: Math.ceil(metrics.contentLength / 4),
      outputTokens: 100, // Approximate analysis output
      cost: metrics.cost,
      responseTime: metrics.analysisTime,
      success: !metrics.error,
      cached: false,
      error: metrics.error,
      metadata: {
        storyAnalysis: {
          storyId: metrics.storyId,
          analysisType: metrics.analysisType,
          contentLength: metrics.contentLength,
          issuesFound: metrics.issuesFound,
          overallScore: metrics.overallScore,
          creditsUsed: metrics.creditsUsed
        }
      }
    })
  }

  // NEW: Get V2.0 specific analytics
  async getV2Analytics(userId?: string, timeRange?: { start: Date; end: Date }): Promise<{
    baseAnalytics: ClaudeAnalytics
    factExtraction: {
      totalExtractions: number
      averageCompressionRatio: number
      totalTokensSaved: number
      totalCostSavings: number
      extractionsByType: Record<string, number>
      averageExtractionTime: number
      errorRate: number
    }
    storyAnalysis: {
      totalAnalyses: number
      averageScore: number
      issueDetectionRate: number
      analysesByType: Record<string, number>
      averageAnalysisTime: number
      conflictResolutionRate: number
    }
    sfslEfficiency: {
      averageCompressionRatio: number
      totalCompressionSavings: number
      compressionTrends: Array<{ date: string; ratio: number }>
      topPerformingStories: Array<{ storyId: string; compressionRatio: number }>
    }
  }> {
    const baseAnalytics = await this.getAnalytics(timeRange)

    // Filter events for this user if specified
    let events = this.events.filter(e =>
      e.timestamp >= (timeRange?.start || new Date(0)) &&
      e.timestamp <= (timeRange?.end || new Date())
    )

    if (userId) {
      events = events.filter(e => e.userId === userId)
    }

    // Filter fact extraction events
    const factExtractions = events.filter(e =>
      e.operation === 'fact_extraction' && e.metadata?.['factExtraction']
    )

    // Filter story analysis events
    const storyAnalyses = events.filter(e =>
      e.operation === 'story_analysis' && e.metadata?.['storyAnalysis']
    )

    // Calculate fact extraction analytics
    const factExtraction = this.calculateFactExtractionAnalytics(factExtractions)

    // Calculate story analysis analytics
    const storyAnalysis = this.calculateStoryAnalysisAnalytics(storyAnalyses)

    // Calculate SFSL efficiency metrics
    const sfslEfficiency = this.calculateSFSLEfficiencyMetrics([...factExtractions, ...storyAnalyses])

    return {
      baseAnalytics,
      factExtraction,
      storyAnalysis,
      sfslEfficiency
    }
  }

  // Helper method to calculate fact extraction analytics
  private calculateFactExtractionAnalytics(events: AnalyticsEvent[]) {
    if (events.length === 0) {
      return {
        totalExtractions: 0,
        averageCompressionRatio: 0,
        totalTokensSaved: 0,
        totalCostSavings: 0,
        extractionsByType: {},
        averageExtractionTime: 0,
        errorRate: 0
      }
    }

    const totalExtractions = events.length
    const successfulExtractions = events.filter(e => e.success)
    const errorRate = (totalExtractions - successfulExtractions.length) / totalExtractions

    const compressionRatios = events
      .filter(e => e.metadata?.['factExtraction']?.compressionRatio)
      .map(e => e.metadata!['factExtraction']!.compressionRatio)

    const averageCompressionRatio = compressionRatios.length > 0
      ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length
      : 0

    const totalTokensSaved = events.reduce((sum, e) => {
      const metadata = e.metadata?.['factExtraction']
      if (metadata) {
        const originalTokens = Math.ceil(metadata.originalLength / 4)
        const compressedTokens = Math.ceil(metadata.compressedLength / 4)
        return sum + (originalTokens - compressedTokens)
      }
      return sum
    }, 0)

    const totalCostSavings = totalTokensSaved * 0.000003 // Approximate cost per token

    const extractionsByType: Record<string, number> = {}
    events.forEach(e => {
      const factType = e.metadata?.['factExtraction']?.factType || 'unknown'
      extractionsByType[factType] = (extractionsByType[factType] || 0) + 1
    })

    const averageExtractionTime = events.reduce((sum, e) => sum + e.responseTime, 0) / totalExtractions

    return {
      totalExtractions,
      averageCompressionRatio,
      totalTokensSaved,
      totalCostSavings,
      extractionsByType,
      averageExtractionTime,
      errorRate
    }
  }

  // Helper method to calculate story analysis analytics
  private calculateStoryAnalysisAnalytics(events: AnalyticsEvent[]) {
    if (events.length === 0) {
      return {
        totalAnalyses: 0,
        averageScore: 0,
        issueDetectionRate: 0,
        analysesByType: {},
        averageAnalysisTime: 0,
        conflictResolutionRate: 0
      }
    }

    const totalAnalyses = events.length

    const scores = events
      .filter(e => e.metadata?.['storyAnalysis']?.overallScore !== undefined)
      .map(e => e.metadata!['storyAnalysis']!.overallScore)
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0

    const analysesWithIssues = events.filter(e =>
      e.metadata?.['storyAnalysis']?.issuesFound && e.metadata['storyAnalysis'].issuesFound > 0
    )
    const issueDetectionRate = analysesWithIssues.length / totalAnalyses

    const analysesByType: Record<string, number> = {}
    events.forEach(e => {
      const analysisType = e.metadata?.['storyAnalysis']?.analysisType || 'unknown'
      analysesByType[analysisType] = (analysesByType[analysisType] || 0) + 1
    })

    const averageAnalysisTime = events.reduce((sum, e) => sum + e.responseTime, 0) / totalAnalyses

    // Conflict resolution rate would need to be tracked separately
    const conflictResolutionRate = 0.75 // Placeholder - would come from story_bible_conflicts table

    return {
      totalAnalyses,
      averageScore,
      issueDetectionRate,
      analysesByType,
      averageAnalysisTime,
      conflictResolutionRate
    }
  }

  // Helper method to calculate SFSL efficiency metrics
  private calculateSFSLEfficiencyMetrics(events: AnalyticsEvent[]) {
    const compressionEvents = events.filter(e =>
      e.metadata?.['factExtraction']?.compressionRatio !== undefined
    )

    if (compressionEvents.length === 0) {
      return {
        averageCompressionRatio: 1.0,
        totalCompressionSavings: 0,
        compressionTrends: [],
        topPerformingStories: []
      }
    }

    const compressionRatios = compressionEvents.map(e => e.metadata!['factExtraction']!.compressionRatio)
    const averageCompressionRatio = compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length

    const totalCompressionSavings = compressionEvents.reduce((sum, e) => {
      const metadata = e.metadata!['factExtraction']!
      const originalSize = metadata.originalLength
      const compressedSize = metadata.compressedLength
      return sum + (originalSize - compressedSize)
    }, 0)

    // Calculate daily compression trends
    const trendMap = new Map<string, { totalRatio: number; count: number }>()
    compressionEvents.forEach(e => {
      const date = e.timestamp.toISOString().slice(0, 10)
      const ratio = e.metadata!['factExtraction']!.compressionRatio

      if (!trendMap.has(date)) {
        trendMap.set(date, { totalRatio: 0, count: 0 })
      }
      const dayData = trendMap.get(date)!
      dayData.totalRatio += ratio
      dayData.count++
    })

    const compressionTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        ratio: data.totalRatio / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate top performing stories
    const storyMap = new Map<string, { totalRatio: number; count: number }>()
    compressionEvents.forEach(e => {
      const storyId = e.metadata!['factExtraction']!.storyId || 'unknown'
      const ratio = e.metadata!['factExtraction']!.compressionRatio

      if (!storyMap.has(storyId)) {
        storyMap.set(storyId, { totalRatio: 0, count: 0 })
      }
      const storyData = storyMap.get(storyId)!
      storyData.totalRatio += ratio
      storyData.count++
    })

    const topPerformingStories = Array.from(storyMap.entries())
      .map(([storyId, data]) => ({
        storyId,
        compressionRatio: data.totalRatio / data.count
      }))
      .sort((a, b) => a.compressionRatio - b.compressionRatio) // Lower is better for compression
      .slice(0, 10)

    return {
      averageCompressionRatio,
      totalCompressionSavings,
      compressionTrends,
      topPerformingStories
    }
  }
}

// V2.0 Performance Monitoring Class
export class V2PerformanceMonitor {
  private performanceMetrics = new Map<string, {
    storyId: string
    totalExtractions: number
    totalDuration: number
    averageDuration: number
    extractionHistory: Array<{
      timestamp: number
      duration: number
      factType: string
      hierarchicalLevel: string
      factsExtracted: number
      inputSize: number
      efficiency: number
    }>
    performanceTrends: Array<{
      hourBucket: number
      totalExtractions: number
      totalDuration: number
      averageDuration: number
    }>
  }>()
  private workflowMetrics = new Map<string, {
    workflowType: string
    totalAttempts: number
    successfulCompletions: number
    failedAttempts: number
    averageDuration: number
    totalDuration: number
    successRate: number
    recentAttempts: Array<{
      timestamp: number
      success: boolean
      duration: number
      userId: string
      storyId: string
      steps: string[]
      errorType?: string | undefined
      metadata: Record<string, unknown>
    }>
  }>()
  private compressionMetrics: Array<{ timestamp: number; original: number; compressed: number; ratio: number; compressionSavings?: number }> = []
  private cacheMetrics = new Map<string, { hits: number; misses: number; totalRequests: number }>()

  /**
   * Track fact extraction performance time
   */
  trackFactExtractionTime(storyId: string, duration: number, options?: {
    factType?: string
    hierarchicalLevel?: string
    factsExtracted?: number
    inputSize?: number
  }): void {
    const timestamp = Date.now()
    const key = `fact_extraction_${storyId}`

    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        storyId,
        totalExtractions: 0,
        totalDuration: 0,
        averageDuration: 0,
        extractionHistory: [],
        performanceTrends: []
      })
    }

    const metrics = this.performanceMetrics.get(key)
    if (!metrics) return

    metrics.totalExtractions++
    metrics.totalDuration += duration
    metrics.averageDuration = metrics.totalDuration / metrics.totalExtractions

    // Record individual extraction
    const extractionRecord = {
      timestamp,
      duration,
      factType: options?.factType || 'unknown',
      hierarchicalLevel: options?.hierarchicalLevel || 'chapter',
      factsExtracted: options?.factsExtracted || 0,
      inputSize: options?.inputSize || 0,
      efficiency: options?.inputSize ? (options.factsExtracted || 0) / options.inputSize : 0
    }

    metrics.extractionHistory.push(extractionRecord)

    // Keep only last 100 extractions for performance
    if (metrics.extractionHistory.length > 100) {
      metrics.extractionHistory.shift()
    }

    // Update performance trends (hourly buckets)
    const hourBucket = Math.floor(timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60)
    const existingTrend = metrics.performanceTrends.find(t => t.hourBucket === hourBucket)

    if (existingTrend) {
      existingTrend.totalExtractions++
      existingTrend.totalDuration += duration
      existingTrend.averageDuration = existingTrend.totalDuration / existingTrend.totalExtractions
    } else {
      metrics.performanceTrends.push({
        hourBucket,
        totalExtractions: 1,
        totalDuration: duration,
        averageDuration: duration
      })
    }

    // Keep only last 24 hours of trends
    const cutoff = Date.now() - (24 * 60 * 60 * 1000)
    metrics.performanceTrends = metrics.performanceTrends.filter(t => t.hourBucket >= cutoff)

    // Fact extraction tracked - metrics recorded for storyId, duration, and facts extracted
  }

  /**
   * Track compression ratio performance
   */
  trackCompressionRatio(original: number, compressed: number, options?: {
    storyId?: string
    factType?: string
    algorithm?: string
  }): void {
    const ratio = original > 0 ? compressed / original : 0
    const compressionSavings = Math.max(0, original - compressed)
    const timestamp = Date.now()

    // Record compression metrics
    const compressionRecord = {
      timestamp,
      original,
      compressed,
      ratio,
      compressionSavings,
      compressionPercentage: original > 0 ? (compressionSavings / original) * 100 : 0,
      storyId: options?.storyId || 'unknown',
      factType: options?.factType || 'general',
      algorithm: options?.algorithm || 'sfsl'
    }

    this.compressionMetrics.push(compressionRecord)

    // Keep only last 1000 compression records
    if (this.compressionMetrics.length > 1000) {
      this.compressionMetrics.shift()
    }

    // Note: Analytics tracked internally via compressionMetrics array

    // Compression tracked - metrics recorded for original size, compressed size, and savings
  }

  /**
   * Track cache hit rates by hierarchical level
   */
  trackCacheHitRates(level: string, hit: boolean = true, options?: {
    storyId?: string
    operation?: string
    cacheKey?: string
  }): void {
    const key = `cache_${level}`

    if (!this.cacheMetrics.has(key)) {
      this.cacheMetrics.set(key, {
        hits: 0,
        misses: 0,
        totalRequests: 0
      })
    }

    const metrics = this.cacheMetrics.get(key)!
    metrics.totalRequests++

    if (hit) {
      metrics.hits++
    } else {
      metrics.misses++
    }

    const hitRate = (metrics.hits / metrics.totalRequests) * 100
    const missRate = (metrics.misses / metrics.totalRequests) * 100

    // Note: Cache performance tracked internally via cacheMetrics map
  }

  /**
   * Track user workflow completion
   */
  trackUserWorkflowCompletion(workflowType: string, success: boolean, options?: {
    userId?: string | undefined
    storyId?: string | undefined
    duration?: number | undefined
    steps?: string[] | undefined
    errorType?: string | undefined
    metadata?: Record<string, unknown> | undefined
  }): void {
    const timestamp = Date.now()
    const key = `workflow_${workflowType}`

    if (!this.workflowMetrics.has(key)) {
      this.workflowMetrics.set(key, {
        workflowType,
        totalAttempts: 0,
        successfulCompletions: 0,
        failedAttempts: 0,
        averageDuration: 0,
        totalDuration: 0,
        successRate: 0,
        recentAttempts: []
      })
    }

    const metrics = this.workflowMetrics.get(key)
    if (!metrics) return

    metrics.totalAttempts++

    const attemptRecord = {
      timestamp,
      success,
      duration: options?.duration || 0,
      userId: options?.userId || 'anonymous',
      storyId: options?.storyId || 'unknown',
      steps: options?.steps || [],
      errorType: options?.errorType,
      metadata: options?.metadata || {}
    }

    if (success) {
      metrics.successfulCompletions++
      if (options?.duration) {
        metrics.totalDuration += options.duration
        metrics.averageDuration = metrics.totalDuration / metrics.successfulCompletions
      }
    } else {
      metrics.failedAttempts++
    }

    metrics.successRate = (metrics.successfulCompletions / metrics.totalAttempts) * 100
    metrics.recentAttempts.push(attemptRecord)

    // Keep only last 50 attempts for performance
    if (metrics.recentAttempts.length > 50) {
      metrics.recentAttempts.shift()
    }

    // Note: Workflow completion tracked internally via workflowMetrics map
  }

  /**
   * Get fact extraction performance metrics
   */
  getFactExtractionMetrics(storyId?: string): {
    totalExtractions: number
    totalDuration: number
    averageDuration: number
    storiesProcessed?: number
    performanceTrends?: Array<{
      hourBucket: number
      totalExtractions: number
      totalDuration: number
      averageDuration: number
    }>
    extractionHistory?: Array<{
      timestamp: number
      duration: number
      factType: string
      hierarchicalLevel: string
      factsExtracted: number
      inputSize: number
      efficiency: number
    }>
  } | null {
    if (storyId) {
      return this.performanceMetrics.get(`fact_extraction_${storyId}`) || null
    }

    // Return aggregated metrics across all stories
    const allMetrics = Array.from(this.performanceMetrics.values())
      .filter(m => m.storyId)

    const totalExtractions = allMetrics.reduce((sum, m) => sum + m.totalExtractions, 0)
    const totalDuration = allMetrics.reduce((sum, m) => sum + m.totalDuration, 0)

    return {
      totalExtractions,
      totalDuration,
      averageDuration: totalExtractions > 0 ? totalDuration / totalExtractions : 0,
      storiesProcessed: allMetrics.length,
      performanceTrends: this.aggregatePerformanceTrends(allMetrics)
    }
  }

  /**
   * Get compression performance metrics
   */
  getCompressionMetrics(timeRange?: { start: number; end: number }): {
    averageCompressionRatio: number
    totalCompressionSavings: number
    compressionCount: number
    bestCompression: {
      timestamp: number
      original: number
      compressed: number
      ratio: number
      compressionSavings: number
      compressionPercentage: number
      storyId: string
      factType: string
      algorithm: string
    } | null
    worstCompression: {
      timestamp: number
      original: number
      compressed: number
      ratio: number
      compressionSavings: number
      compressionPercentage: number
      storyId: string
      factType: string
      algorithm: string
    } | null
    recentMetrics?: Array<{
      timestamp: number
      original: number
      compressed: number
      ratio: number
      compressionSavings: number
      compressionPercentage: number
      storyId: string
      factType: string
      algorithm: string
    }>
  } {
    let metrics = [...this.compressionMetrics]

    if (timeRange) {
      metrics = metrics.filter(m =>
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    if (metrics.length === 0) {
      return {
        averageCompressionRatio: 0,
        totalCompressionSavings: 0,
        compressionCount: 0,
        bestCompression: null,
        worstCompression: null
      }
    }

    const totalSavings = metrics.reduce((sum, m) => sum + (m.compressionSavings || 0), 0)
    const averageRatio = metrics.reduce((sum, m) => sum + m.ratio, 0) / metrics.length

    const sortedByRatio = [...metrics].sort((a, b) => a.ratio - b.ratio)

    // Transform metrics to match expected format
    const transformMetric = (m: typeof metrics[0] | undefined) => {
      if (!m) return undefined
      return {
        timestamp: m.timestamp,
        original: m.original,
        compressed: m.compressed,
        ratio: m.ratio,
        compressionSavings: m.compressionSavings || 0,
        compressionPercentage: ((m.original - m.compressed) / m.original) * 100,
        storyId: 'unknown',
        factType: 'general',
        algorithm: 'sfsl'
      }
    }

    return {
      averageCompressionRatio: averageRatio,
      totalCompressionSavings: totalSavings,
      compressionCount: metrics.length,
      bestCompression: sortedByRatio[0] ? transformMetric(sortedByRatio[0])! : null, // Lowest ratio (best compression)
      worstCompression: sortedByRatio[sortedByRatio.length - 1] ? transformMetric(sortedByRatio[sortedByRatio.length - 1])! : null,
      recentMetrics: metrics.slice(-10).map(transformMetric).filter((m): m is NonNullable<typeof m> => m !== undefined) // Last 10 compressions
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(level?: string): {
    level?: string
    hitRate: number
    missRate: number
    totalHits: number
    totalMisses: number
    totalRequests: number
    overall?: {
      hitRate: number
      missRate: number
      totalRequests: number
    }
    byLevel?: Record<string, {
      hitRate: number
      missRate: number
      totalRequests: number
    }>
  } | null {
    if (level) {
      const metrics = this.cacheMetrics.get(`cache_${level}`)
      if (!metrics) return null

      return {
        level,
        hitRate: (metrics.hits / metrics.totalRequests) * 100,
        missRate: (metrics.misses / metrics.totalRequests) * 100,
        totalHits: metrics.hits,
        totalMisses: metrics.misses,
        totalRequests: metrics.totalRequests
      }
    }

    // Return aggregated cache metrics
    const allMetrics = Array.from(this.cacheMetrics.entries())
    const aggregated = allMetrics.reduce((acc, [key, metrics]) => {
      acc.totalHits += metrics.hits
      acc.totalMisses += metrics.misses
      acc.totalRequests += metrics.totalRequests
      return acc
    }, { totalHits: 0, totalMisses: 0, totalRequests: 0 })

    const levelMetrics = Object.fromEntries(
      allMetrics.map(([key, metrics]) => [
        key.replace('cache_', ''),
        {
          hitRate: (metrics.hits / metrics.totalRequests) * 100,
          missRate: (metrics.misses / metrics.totalRequests) * 100,
          totalRequests: metrics.totalRequests
        }
      ])
    )

    return {
      hitRate: aggregated.totalRequests > 0 ? (aggregated.totalHits / aggregated.totalRequests) * 100 : 0,
      missRate: aggregated.totalRequests > 0 ? (aggregated.totalMisses / aggregated.totalRequests) * 100 : 0,
      totalHits: aggregated.totalHits,
      totalMisses: aggregated.totalMisses,
      totalRequests: aggregated.totalRequests,
      overall: {
        hitRate: aggregated.totalRequests > 0 ? (aggregated.totalHits / aggregated.totalRequests) * 100 : 0,
        missRate: aggregated.totalRequests > 0 ? (aggregated.totalMisses / aggregated.totalRequests) * 100 : 0,
        totalRequests: aggregated.totalRequests
      },
      byLevel: levelMetrics
    }
  }

  /**
   * Get workflow performance metrics
   */
  getWorkflowMetrics(workflowType?: string): {
    workflowType: string
    totalAttempts: number
    successfulCompletions: number
    failedAttempts: number
    averageDuration: number
    totalDuration: number
    successRate: number
    recentAttempts: Array<{
      timestamp: number
      success: boolean
      duration: number
      userId: string
      storyId: string
      steps: string[]
      errorType?: string | undefined
      metadata: Record<string, unknown>
    }>
  } | Record<string, unknown> | null {
    if (workflowType) {
      return this.workflowMetrics.get(`workflow_${workflowType}`) || null
    }

    // Return all workflow metrics
    const allWorkflows = Object.fromEntries(
      Array.from(this.workflowMetrics.entries()).map(([key, metrics]) => [
        key.replace('workflow_', ''),
        metrics
      ])
    )

    return allWorkflows
  }

  /**
   * Get comprehensive V2.0 performance dashboard
   */
  getV2PerformanceDashboard(): {
    factExtraction: unknown
    compression: unknown
    cache: unknown
    workflows: unknown
    systemHealth: {
      totalTrackedStories: number
      totalCompressions: number
      totalCacheLevels: number
      totalWorkflowTypes: number
      lastUpdated: number
    }
  } {
    return {
      factExtraction: this.getFactExtractionMetrics(),
      compression: this.getCompressionMetrics(),
      cache: this.getCacheMetrics(),
      workflows: this.getWorkflowMetrics(),
      systemHealth: {
        totalTrackedStories: this.performanceMetrics.size,
        totalCompressions: this.compressionMetrics.length,
        totalCacheLevels: this.cacheMetrics.size,
        totalWorkflowTypes: this.workflowMetrics.size,
        lastUpdated: Date.now()
      }
    }
  }

  /**
   * Clear performance metrics (for testing or reset)
   */
  clearMetrics(): void {
    this.performanceMetrics.clear()
    this.workflowMetrics.clear()
    this.compressionMetrics.length = 0
    this.cacheMetrics.clear()
    // V2 Performance metrics cleared
  }

  /**
   * Private helper to aggregate performance trends
   */
  private aggregatePerformanceTrends(allMetrics: Array<{
    performanceTrends: Array<{
      hourBucket: number
      totalExtractions: number
      totalDuration: number
    }>
  }>): Array<{
    hourBucket: number
    totalExtractions: number
    totalDuration: number
    averageDuration: number
  }> {
    const trendMap = new Map<number, { totalExtractions: number; totalDuration: number }>()

    allMetrics.forEach(metrics => {
      metrics.performanceTrends.forEach(trend => {
        if (!trendMap.has(trend.hourBucket)) {
          trendMap.set(trend.hourBucket, { totalExtractions: 0, totalDuration: 0 })
        }
        const aggregated = trendMap.get(trend.hourBucket)!
        aggregated.totalExtractions += trend.totalExtractions
        aggregated.totalDuration += trend.totalDuration
      })
    })

    return Array.from(trendMap.entries())
      .map(([hourBucket, data]) => ({
        hourBucket,
        totalExtractions: data.totalExtractions,
        totalDuration: data.totalDuration,
        averageDuration: data.totalExtractions > 0 ? data.totalDuration / data.totalExtractions : 0
      }))
      .sort((a, b) => a.hourBucket - b.hourBucket)
  }
}

// Export singleton instances
export const analyticsService = new ClaudeAnalyticsService()
export const v2PerformanceMonitor = new V2PerformanceMonitor()

