import { type OptimizedContext } from './context-optimizer'
import { type SeriesOptimizedContext } from '../series/series-context-manager'

export enum ContextLevel {
  MINIMAL = 'minimal',     // 100 tokens - simple scenes, basic dialogue
  STANDARD = 'standard',   // 200 tokens - regular chapters
  DETAILED = 'detailed',   // 400 tokens - complex scenes, multiple characters
  FULL = 'full'           // 800 tokens - climactic moments, series finale
}

export interface ChapterComplexity {
  hasNewCharacters: boolean
  isPlotTurningPoint: boolean
  isClimacticMoment: boolean
  requiresWorldBuilding: boolean
  emotionalIntensity: 'low' | 'medium' | 'high'
  conflictLevel: 'minor' | 'major' | 'climactic'
  characterCount: number
  sceneComplexity: 'simple' | 'moderate' | 'complex'
  dialogueIntensity: 'light' | 'moderate' | 'heavy'
  actionLevel: 'low' | 'medium' | 'high'
  seriesImportance: 'filler' | 'development' | 'critical' | 'finale'
}

export interface ChapterPlan {
  number: number
  title?: string
  summary: string
  purpose: string
  keyEvents: string[]
  characterDevelopment?: string
  introducesNewCharacters?: string[]
  majorPlotPoints?: string[]
  emotionalBeats?: string[]
  worldBuildingElements?: string[]
  conflictEscalation?: string
  seriesRole?: string
  complexity?: number // 1-10 scale
}

export interface AllContextData {
  story: {
    genre?: string
    protagonist?: { name: string }
    [key: string]: unknown
  }
  characters: Array<{ name: string; [key: string]: unknown }>
  previousChapters: Array<{ number: number; summary: string; [key: string]: unknown }>
  seriesContext?: {
    series_id: string
    current_book: number
    [key: string]: unknown
  }
  foundation: {
    premise?: string
    themes?: string[]
    [key: string]: unknown
  }
  setting: {
    location?: string
    time_period?: string
    [key: string]: unknown
  }
  plotThreads?: Array<{ id: string; description: string; status: string }>
  worldRules?: {
    magic_system?: string
    technology_level?: string
    [key: string]: unknown
  }
}

export interface AdaptiveContextResult {
  level: ContextLevel
  context: OptimizedContext | SeriesOptimizedContext
  tokenEstimate: number
  reasoning: string
  optimizations: string[]
  fallbackLevel?: ContextLevel
}

export interface ContextLearningData {
  chapterPlan: ChapterPlan
  contextLevel: ContextLevel
  actualTokens: number
  qualityScore: number
  userFeedback?: string
  generationSuccess: boolean
  performanceMetrics: {
    coherence: number
    consistency: number
    engagement: number
    efficiency: number
  }
}

export class AdaptiveContextSelector {
  private learningData: ContextLearningData[] = []
  private contextPatterns: Map<string, ContextLevel> = new Map()

  /**
   * Analyze chapter requirements to determine optimal context level
   */
  analyzeChapterComplexity(chapterPlan: ChapterPlan): ChapterComplexity {
    const summary = chapterPlan.summary?.toLowerCase() || ''
    const purpose = chapterPlan.purpose?.toLowerCase() || ''
    const keyEvents = chapterPlan.keyEvents?.map(e => e.toLowerCase()) || []
    const allText = `${summary} ${purpose} ${keyEvents.join(' ')}`

    return {
      hasNewCharacters: this.detectNewCharacters(chapterPlan),
      isPlotTurningPoint: this.detectPlotTurningPoint(allText),
      isClimacticMoment: this.detectClimacticMoment(allText),
      requiresWorldBuilding: this.detectWorldBuildingNeed(allText),
      emotionalIntensity: this.assessEmotionalIntensity(allText),
      conflictLevel: this.assessConflictLevel(allText),
      characterCount: this.estimateCharacterCount(chapterPlan),
      sceneComplexity: this.assessSceneComplexity(allText),
      dialogueIntensity: this.assessDialogueIntensity(allText),
      actionLevel: this.assessActionLevel(allText),
      seriesImportance: this.assessSeriesImportance(chapterPlan)
    }
  }

  /**
   * Select appropriate context level based on complexity
   */
  selectContextLevel(complexity: ChapterComplexity): ContextLevel {
    // Calculate complexity score
    let score = 0

    // Base scoring
    if (complexity.hasNewCharacters) score += 2
    if (complexity.isPlotTurningPoint) score += 3
    if (complexity.isClimacticMoment) score += 4
    if (complexity.requiresWorldBuilding) score += 2

    // Intensity scoring
    score += this.mapIntensityToScore(complexity.emotionalIntensity)
    score += this.mapConflictToScore(complexity.conflictLevel)
    score += Math.min(complexity.characterCount, 4) // Cap at 4 characters
    score += this.mapComplexityToScore(complexity.sceneComplexity)
    score += this.mapIntensityToScore(complexity.dialogueIntensity)
    score += this.mapIntensityToScore(complexity.actionLevel)
    score += this.mapSeriesImportanceToScore(complexity.seriesImportance)

    // Apply machine learning if available
    const learnedLevel = this.getLearnedContextLevel(complexity)
    if (learnedLevel) {
      return learnedLevel
    }

    // Determine level based on score
    if (score <= 5) return ContextLevel.MINIMAL
    if (score <= 10) return ContextLevel.STANDARD
    if (score <= 16) return ContextLevel.DETAILED
    return ContextLevel.FULL
  }

  /**
   * Build context package based on selected level
   */
  buildContextForLevel(
    level: ContextLevel,
    allContext: AllContextData,
    chapterPlan: ChapterPlan,
    seriesContext?: {
      series_id: string
      current_book: number
      [key: string]: unknown
    }
  ): OptimizedContext | SeriesOptimizedContext {
    switch (level) {
      case ContextLevel.MINIMAL:
        return this.buildMinimalContext(allContext, chapterPlan)

      case ContextLevel.STANDARD:
        return this.buildStandardContext(allContext, chapterPlan, seriesContext)

      case ContextLevel.DETAILED:
        return this.buildDetailedContext(allContext, chapterPlan, seriesContext)

      case ContextLevel.FULL:
        return this.buildFullContext(allContext, chapterPlan, seriesContext)

      default:
        return this.buildStandardContext(allContext, chapterPlan, seriesContext)
    }
  }

  /**
   * Get adaptive context with automatic level selection
   */
  getAdaptiveContext(
    allContext: AllContextData,
    chapterPlan: ChapterPlan,
    seriesContext?: {
      series_id: string
      current_book: number
      [key: string]: unknown
    }
  ): AdaptiveContextResult {
    const complexity = this.analyzeChapterComplexity(chapterPlan)
    const level = this.selectContextLevel(complexity)
    const context = this.buildContextForLevel(level, allContext, chapterPlan, seriesContext)

    const tokenEstimate = this.estimateTokens(level)
    const reasoning = this.explainLevelSelection(complexity, level)
    const optimizations = this.getOptimizationStrategies(level, complexity)
    const fallbackLevel = this.getFallbackLevel(level)

    return {
      level,
      context,
      tokenEstimate,
      reasoning,
      optimizations,
      fallbackLevel
    }
  }

  /**
   * Learn from generation results to improve future selections
   */
  learnFromGeneration(data: ContextLearningData): void {
    this.learningData.push(data)

    // Limit learning data size
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000)
    }

    // Update patterns
    this.updateContextPatterns(data)

    // Analyze learning trends
    this.analyzeLearningTrends()
  }

  /**
   * Get performance analytics for context selection
   */
  getPerformanceAnalytics(): {
    levelDistribution: Record<ContextLevel, number>
    averageQuality: Record<ContextLevel, number>
    averageTokens: Record<ContextLevel, number>
    successRate: Record<ContextLevel, number>
    recommendations: string[]
  } {
    const levelDistribution: Record<ContextLevel, number> = {
      [ContextLevel.MINIMAL]: 0,
      [ContextLevel.STANDARD]: 0,
      [ContextLevel.DETAILED]: 0,
      [ContextLevel.FULL]: 0
    }

    const qualityByLevel: Record<ContextLevel, number[]> = {
      [ContextLevel.MINIMAL]: [],
      [ContextLevel.STANDARD]: [],
      [ContextLevel.DETAILED]: [],
      [ContextLevel.FULL]: []
    }

    const tokensByLevel: Record<ContextLevel, number[]> = {
      [ContextLevel.MINIMAL]: [],
      [ContextLevel.STANDARD]: [],
      [ContextLevel.DETAILED]: [],
      [ContextLevel.FULL]: []
    }

    const successByLevel: Record<ContextLevel, number[]> = {
      [ContextLevel.MINIMAL]: [],
      [ContextLevel.STANDARD]: [],
      [ContextLevel.DETAILED]: [],
      [ContextLevel.FULL]: []
    }

    // Analyze learning data
    this.learningData.forEach(data => {
      levelDistribution[data.contextLevel]++
      qualityByLevel[data.contextLevel].push(data.qualityScore)
      tokensByLevel[data.contextLevel].push(data.actualTokens)
      successByLevel[data.contextLevel].push(data.generationSuccess ? 1 : 0)
    })

    // Calculate averages
    const averageQuality: Record<ContextLevel, number> = {} as Record<ContextLevel, number>
    const averageTokens: Record<ContextLevel, number> = {} as Record<ContextLevel, number>
    const successRate: Record<ContextLevel, number> = {} as Record<ContextLevel, number>

    Object.values(ContextLevel).forEach(level => {
      const qualities = qualityByLevel[level]
      const tokens = tokensByLevel[level]
      const successes = successByLevel[level]

      averageQuality[level] = qualities.length > 0
        ? qualities.reduce((sum, q) => sum + q, 0) / qualities.length
        : 0

      averageTokens[level] = tokens.length > 0
        ? tokens.reduce((sum, t) => sum + t, 0) / tokens.length
        : 0

      successRate[level] = successes.length > 0
        ? successes.reduce((sum, s) => sum + s, 0) / successes.length
        : 0
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      levelDistribution,
      averageQuality,
      averageTokens,
      successRate
    )

    return {
      levelDistribution,
      averageQuality,
      averageTokens,
      successRate,
      recommendations
    }
  }

  // Private helper methods

  private detectNewCharacters(chapterPlan: ChapterPlan): boolean {
    return (chapterPlan.introducesNewCharacters?.length || 0) > 0 ||
           chapterPlan.summary?.toLowerCase().includes('meet') ||
           chapterPlan.summary?.toLowerCase().includes('introduce')
  }

  private detectPlotTurningPoint(text: string): boolean {
    const turningPointKeywords = [
      'discover', 'reveal', 'realize', 'twist', 'betray', 'death', 'attack',
      'decision', 'choose', 'sacrifice', 'breakthrough', 'escape'
    ]
    return turningPointKeywords.some(keyword => text.includes(keyword))
  }

  private detectClimacticMoment(text: string): boolean {
    const climacticKeywords = [
      'final', 'ultimate', 'decisive', 'climax', 'showdown', 'confrontation',
      'resolution', 'ending', 'conclusion', 'victory', 'defeat'
    ]
    return climacticKeywords.some(keyword => text.includes(keyword))
  }

  private detectWorldBuildingNeed(text: string): boolean {
    const worldBuildingKeywords = [
      'world', 'society', 'culture', 'history', 'politics', 'magic system',
      'technology', 'geography', 'rules', 'law', 'custom', 'tradition'
    ]
    return worldBuildingKeywords.some(keyword => text.includes(keyword))
  }

  private assessEmotionalIntensity(text: string): 'low' | 'medium' | 'high' {
    const highEmotionWords = ['love', 'hate', 'rage', 'terror', 'grief', 'joy', 'despair']
    const mediumEmotionWords = ['angry', 'sad', 'happy', 'worried', 'excited', 'nervous']

    if (highEmotionWords.some(word => text.includes(word))) return 'high'
    if (mediumEmotionWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  private assessConflictLevel(text: string): 'minor' | 'major' | 'climactic' {
    const climacticConflictWords = ['war', 'battle', 'final fight', 'duel', 'showdown']
    const majorConflictWords = ['fight', 'conflict', 'struggle', 'oppose', 'challenge']
    const minorConflictWords = ['disagree', 'argue', 'tension', 'uncomfortable']

    if (climacticConflictWords.some(word => text.includes(word))) return 'climactic'
    if (majorConflictWords.some(word => text.includes(word))) return 'major'
    return 'minor'
  }

  private estimateCharacterCount(chapterPlan: ChapterPlan): number {
    // Count character names mentioned in summary and key events
    const text = `${chapterPlan.summary} ${chapterPlan.keyEvents?.join(' ')}`
    const characterIndicators = ['and', 'with', 'meet', 'talk', 'speak']

    let count = 1 // Assume at least protagonist
    characterIndicators.forEach(indicator => {
      const matches = text.split(indicator).length - 1
      count += matches
    })

    return Math.min(count, 8) // Cap at 8 characters
  }

  private assessSceneComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const complexSceneWords = ['multiple', 'several', 'various', 'complex', 'intricate']
    const moderateSceneWords = ['both', 'two', 'different', 'change']

    if (complexSceneWords.some(word => text.includes(word))) return 'complex'
    if (moderateSceneWords.some(word => text.includes(word))) return 'moderate'
    return 'simple'
  }

  private assessDialogueIntensity(text: string): 'light' | 'moderate' | 'heavy' {
    const heavyDialogueWords = ['conversation', 'discuss', 'argue', 'debate', 'negotiate']
    const moderateDialogueWords = ['talk', 'speak', 'say', 'tell', 'ask']

    if (heavyDialogueWords.some(word => text.includes(word))) return 'heavy'
    if (moderateDialogueWords.some(word => text.includes(word))) return 'moderate'
    return 'light'
  }

  private assessActionLevel(text: string): 'low' | 'medium' | 'high' {
    const highActionWords = ['fight', 'chase', 'battle', 'escape', 'attack', 'flee']
    const mediumActionWords = ['move', 'run', 'search', 'follow', 'pursue']

    if (highActionWords.some(word => text.includes(word))) return 'high'
    if (mediumActionWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  private assessSeriesImportance(chapterPlan: ChapterPlan): 'filler' | 'development' | 'critical' | 'finale' {
    const text = `${chapterPlan.purpose} ${chapterPlan.seriesRole || ''}`.toLowerCase()

    if (text.includes('finale') || text.includes('end') || text.includes('conclusion')) return 'finale'
    if (text.includes('critical') || text.includes('important') || text.includes('key')) return 'critical'
    if (text.includes('develop') || text.includes('advance') || text.includes('progress')) return 'development'
    return 'filler'
  }

  private mapIntensityToScore(intensity: string): number {
    switch (intensity) {
      case 'low': case 'light': return 1
      case 'medium': case 'moderate': return 2
      case 'high': case 'heavy': return 3
      default: return 1
    }
  }

  private mapConflictToScore(conflict: string): number {
    switch (conflict) {
      case 'minor': return 1
      case 'major': return 3
      case 'climactic': return 5
      default: return 1
    }
  }

  private mapComplexityToScore(complexity: string): number {
    switch (complexity) {
      case 'simple': return 1
      case 'moderate': return 2
      case 'complex': return 3
      default: return 1
    }
  }

  private mapSeriesImportanceToScore(importance: string): number {
    switch (importance) {
      case 'filler': return 0
      case 'development': return 1
      case 'critical': return 3
      case 'finale': return 5
      default: return 1
    }
  }

  private getLearnedContextLevel(complexity: ChapterComplexity): ContextLevel | null {
    // Create pattern key from complexity
    const patternKey = this.createPatternKey(complexity)
    return this.contextPatterns.get(patternKey) || null
  }

  private createPatternKey(complexity: ChapterComplexity): string {
    return `${complexity.conflictLevel}_${complexity.emotionalIntensity}_${complexity.seriesImportance}_${complexity.characterCount}`
  }

  private buildMinimalContext(allContext: AllContextData, chapterPlan: ChapterPlan): OptimizedContext {
    // Ultra-lean context for simple scenes
    return {
      core_facts: {
        genre: allContext.story?.genre || 'unknown',
        setting: {
          location: 'current_location',
          atmosphere: 'normal',
          current_condition: 'present',
          key_features: []
        },
        protagonist: allContext.story?.protagonist?.name || 'protagonist',
        central_conflict: 'immediate challenge'
      },
      active_characters: [{
        name: allContext.story?.protagonist?.name || 'protagonist',
        current_goal: chapterPlan.purpose,
        key_trait: 'determined',
        current_emotion: 'focused',
        relevant_relationship: 'none'
      }],
      recent_events: [],
      chapter_goals: {
        primary_goal: chapterPlan.purpose,
        secondary_goal: chapterPlan.keyEvents?.[0] || 'advance story',
        plot_advancement: 'incremental progress'
      }
    }
  }

  private buildStandardContext(allContext: AllContextData, chapterPlan: ChapterPlan, seriesContext?: { [key: string]: unknown }): OptimizedContext {
    // Standard context for regular chapters
    const { contextOptimizer } = require('./context-optimizer')
    return contextOptimizer.selectRelevantContext(chapterPlan, allContext)
  }

  private buildDetailedContext(allContext: AllContextData, chapterPlan: ChapterPlan, seriesContext?: { series_id: string; current_book: number; [key: string]: unknown }): OptimizedContext | SeriesOptimizedContext {
    // Enhanced context for complex scenes
    if (seriesContext) {
      const { seriesContextManager } = require('../series/series-context-manager')
      return seriesContextManager.getOptimizedSeriesContext(
        seriesContext.series_id,
        seriesContext.current_book,
        chapterPlan
      )
    }

    const { contextOptimizer } = require('./context-optimizer')
    return contextOptimizer.selectRelevantContext(chapterPlan, allContext)
  }

  private buildFullContext(allContext: AllContextData, chapterPlan: ChapterPlan, seriesContext?: { series_id: string; current_book: number; [key: string]: unknown }): OptimizedContext | SeriesOptimizedContext {
    // Maximum context for climactic moments
    if (seriesContext) {
      const { seriesContextManager } = require('../series/series-context-manager')
      return seriesContextManager.getOptimizedSeriesContext(
        seriesContext.series_id,
        seriesContext.current_book,
        chapterPlan
      )
    }

    const { contextOptimizer } = require('./context-optimizer')
    return contextOptimizer.selectRelevantContext(chapterPlan, allContext)
  }

  private estimateTokens(level: ContextLevel): number {
    switch (level) {
      case ContextLevel.MINIMAL: return 100
      case ContextLevel.STANDARD: return 200
      case ContextLevel.DETAILED: return 400
      case ContextLevel.FULL: return 800
      default: return 200
    }
  }

  private explainLevelSelection(complexity: ChapterComplexity, level: ContextLevel): string {
    const factors = []

    if (complexity.isClimacticMoment) factors.push('climactic moment detected')
    if (complexity.isPlotTurningPoint) factors.push('plot turning point')
    if (complexity.hasNewCharacters) factors.push('new characters introduced')
    if (complexity.requiresWorldBuilding) factors.push('world building required')
    if (complexity.emotionalIntensity === 'high') factors.push('high emotional intensity')
    if (complexity.conflictLevel === 'climactic') factors.push('climactic conflict')
    if (complexity.characterCount > 3) factors.push('multiple characters')

    return `Selected ${level} context due to: ${factors.join(', ') || 'standard complexity'}`
  }

  private getOptimizationStrategies(level: ContextLevel, complexity: ChapterComplexity): string[] {
    const strategies = []

    if (level === ContextLevel.MINIMAL) {
      strategies.push('Focus on immediate scene only')
      strategies.push('Single character perspective')
      strategies.push('Minimal world context')
    } else if (level === ContextLevel.STANDARD) {
      strategies.push('Include relevant character backgrounds')
      strategies.push('Reference recent events only')
      strategies.push('Standard world context')
    } else if (level === ContextLevel.DETAILED) {
      strategies.push('Include character relationships')
      strategies.push('Reference plot threads')
      strategies.push('Enhanced world context')
    } else {
      strategies.push('Full character development context')
      strategies.push('Complete plot thread awareness')
      strategies.push('Comprehensive world state')
    }

    return strategies
  }

  private getFallbackLevel(level: ContextLevel): ContextLevel {
    switch (level) {
      case ContextLevel.FULL: return ContextLevel.DETAILED
      case ContextLevel.DETAILED: return ContextLevel.STANDARD
      case ContextLevel.STANDARD: return ContextLevel.MINIMAL
      case ContextLevel.MINIMAL: return ContextLevel.MINIMAL
      default: return ContextLevel.STANDARD
    }
  }

  private updateContextPatterns(data: ContextLearningData): void {
    const patternKey = this.createPatternKey(this.analyzeChapterComplexity(data.chapterPlan))

    // Only learn from successful, high-quality generations
    if (data.generationSuccess && data.qualityScore >= 7) {
      this.contextPatterns.set(patternKey, data.contextLevel)
    }
  }

  private analyzeLearningTrends(): void {
    // Analyze recent performance trends and adjust patterns
    const recentData = this.learningData.slice(-100) // Last 100 generations

    // Find patterns that consistently underperform
    const performanceByPattern = new Map<string, { total: number; success: number; quality: number }>()

    recentData.forEach(data => {
      const patternKey = this.createPatternKey(this.analyzeChapterComplexity(data.chapterPlan))
      const existing = performanceByPattern.get(patternKey) || { total: 0, success: 0, quality: 0 }

      performanceByPattern.set(patternKey, {
        total: existing.total + 1,
        success: existing.success + (data.generationSuccess ? 1 : 0),
        quality: existing.quality + data.qualityScore
      })
    })

    // Remove patterns with poor performance
    performanceByPattern.forEach((performance, pattern) => {
      const successRate = performance.success / performance.total
      const avgQuality = performance.quality / performance.total

      if (successRate < 0.7 || avgQuality < 6) {
        this.contextPatterns.delete(pattern)
      }
    })
  }

  private generateRecommendations(
    distribution: Record<ContextLevel, number>,
    quality: Record<ContextLevel, number>,
    tokens: Record<ContextLevel, number>,
    success: Record<ContextLevel, number>
  ): string[] {
    const recommendations = []

    // Analyze distribution
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    const minimalPercent = (distribution[ContextLevel.MINIMAL] / total) * 100
    const fullPercent = (distribution[ContextLevel.FULL] / total) * 100

    if (minimalPercent > 60) {
      recommendations.push('Consider more detailed context for complex chapters')
    }

    if (fullPercent > 30) {
      recommendations.push('Optimize usage of FULL context - may be overused')
    }

    // Analyze quality by level
    const avgQuality = Object.values(quality).reduce((sum, q) => sum + q, 0) / Object.values(quality).length

    if (quality[ContextLevel.MINIMAL] > avgQuality + 1) {
      recommendations.push('MINIMAL context performing well - consider using more often')
    }

    if (quality[ContextLevel.FULL] < avgQuality - 1) {
      recommendations.push('FULL context underperforming - review complex chapter handling')
    }

    // Analyze token efficiency
    const tokenEfficiency = Object.entries(quality).map(([level, qual]) => ({
      level,
      efficiency: qual / tokens[level as ContextLevel]
    }))

    const mostEfficient = tokenEfficiency.reduce((best, current) =>
      current.efficiency > best.efficiency ? current : best
    )

    recommendations.push(`${mostEfficient.level} context shows best quality/token ratio`)

    return recommendations
  }
}

export const adaptiveContextSelector = new AdaptiveContextSelector()