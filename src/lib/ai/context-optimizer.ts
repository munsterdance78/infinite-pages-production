/**
 * AI CONTEXT OPTIMIZER
 *
 * Advanced optimization system for AI context management. Works with the
 * compression middleware to provide intelligent context preparation for
 * Claude API calls, maximizing quality while minimizing token usage.
 *
 * Key Features:
 * - Intelligent context windowing for long stories
 * - Story element extraction and preservation
 * - Character consistency tracking
 * - Plot coherence optimization
 * - Adaptive compression based on story type
 * - Real-time optimization metrics
 */

import {
  contextCompressionMiddleware,
  type CompressionOptions,
  type CompressionResult,
  getOptimalCompressionSettings
} from '@/lib/middleware/compression-middleware'
import { CLAUDE_PRICING, ESTIMATED_CREDIT_COSTS } from '@/lib/utils/constants'

export interface StoryContext {
  title: string
  genre: string
  premise: string
  currentChapter?: number
  totalChapters?: number
  characters: Character[]
  plotPoints: PlotPoint[]
  storyTone: string
  previousContent?: string[]
  currentScene?: string
}

export interface Character {
  name: string
  description: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  traits: string[]
  lastMentioned?: number // Chapter number
  importance: number // 1-10 scale
}

export interface PlotPoint {
  id: string
  description: string
  chapter: number
  importance: 'critical' | 'major' | 'minor'
  resolved: boolean
  dependencies: string[] // IDs of other plot points
}

export interface OptimizationResult {
  optimizedContext: string
  originalTokens: number
  optimizedTokens: number
  compressionRatio: number
  tokensKept: number
  tokensSaved: number
  costSavingsUSD: number
  qualityScore: number // 0-100 based on preserved elements
  optimizationMethod: string
  preservedElements: {
    characters: number
    plotPoints: number
    storyTone: boolean
    previousContext: number
  }
}

export interface OptimizationOptions extends CompressionOptions {
  prioritizeCharacters?: boolean
  prioritizePlot?: boolean
  maintainTone?: boolean
  includeRecapLength?: number
  adaptiveWindowSize?: boolean
  qualityThreshold?: number // Minimum quality score to accept
}

/**
 * Advanced Context Optimizer Class
 */
export class ContextOptimizer {
  private characterCache = new Map<string, Character[]>()
  private plotCache = new Map<string, PlotPoint[]>()

  /**
   * Optimize story context for AI generation
   */
  async optimizeStoryContext(
    context: StoryContext,
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    // Extract and analyze story elements
    const analysis = this.analyzeStoryContext(context)

    // Determine optimal compression strategy
    const compressionOptions = this.getOptimalCompressionOptions(context, options, analysis)

    // Apply intelligent compression
    const compressionResult = await this.applyIntelligentCompression(
      context,
      compressionOptions,
      analysis
    )

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(compressionResult, analysis)

    // If quality is below threshold, try less aggressive compression
    if (qualityScore < (options.qualityThreshold || 70) && compressionOptions.compressionLevel !== 'light') {
      const fallbackOptions = { ...compressionOptions, compressionLevel: 'light' as const }
      return this.optimizeStoryContext(context, fallbackOptions)
    }

    return this.buildOptimizationResult(compressionResult, analysis, qualityScore)
  }

  /**
   * Optimize chapter continuation context
   */
  async optimizeChapterContext(
    context: StoryContext,
    chapterNumber: number,
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    // Create windowed context for chapter continuation
    const windowedContext = this.createChapterWindow(context, chapterNumber, options)

    // Optimize the windowed context
    return this.optimizeStoryContext(windowedContext, {
      ...options,
      contextWindow: options.contextWindow || this.calculateOptimalWindowSize(context, chapterNumber)
    })
  }

  /**
   * Batch optimize multiple story operations
   */
  async batchOptimize(
    contexts: StoryContext[],
    operations: ('foundation' | 'chapter' | 'improvement')[],
    subscriptionTier: 'basic' | 'premium'
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = []

    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i]
      if (!context) continue // Skip undefined contexts

      const operation = operations[i] || 'chapter'

      const options = getOptimalCompressionSettings(
        subscriptionTier,
        operation === 'foundation' ? 'story_foundation' :
        operation === 'chapter' ? 'chapter_generation' : 'story_improvement'
      )

      const optimizationOptions: OptimizationOptions = {
        ...options,
        prioritizeCharacters: operation === 'chapter',
        prioritizePlot: operation === 'foundation',
        maintainTone: true,
        adaptiveWindowSize: true
      }

      const result = await this.optimizeStoryContext(context, optimizationOptions)
      results.push(result)
    }

    return results
  }

  /**
   * Analyze story context to understand key elements
   */
  private analyzeStoryContext(context: StoryContext) {
    return {
      characterCount: context.characters.length,
      plotPointCount: context.plotPoints.length,
      criticalPlotPoints: context.plotPoints.filter(p => p.importance === 'critical').length,
      storyLength: context.previousContent?.join(' ').length || 0,
      genreComplexity: this.getGenreComplexity(context.genre),
      characterDiversity: this.calculateCharacterDiversity(context.characters),
      plotComplexity: this.calculatePlotComplexity(context.plotPoints)
    }
  }

  /**
   * Get optimal compression options based on story analysis
   */
  private getOptimalCompressionOptions(
    context: StoryContext,
    options: OptimizationOptions,
    analysis: ReturnType<typeof this.analyzeStoryContext>
  ): CompressionOptions {
    // Base compression level on story complexity
    let compressionLevel: 'light' | 'moderate' | 'aggressive' = options.compressionLevel || 'moderate'

    // Adjust based on story analysis
    if (analysis.characterCount > 5 || analysis.criticalPlotPoints > 3) {
      // Complex stories need gentler compression
      compressionLevel = compressionLevel === 'aggressive' ? 'moderate' : 'light'
    }

    // Preserve elements based on priorities
    const preserveElements: string[] = []
    if (options.prioritizeCharacters || analysis.characterCount > 0) {
      preserveElements.push('character_names', 'dialogue')
    }
    if (options.prioritizePlot || analysis.criticalPlotPoints > 0) {
      preserveElements.push('plot_points')
    }
    if (options.maintainTone) {
      preserveElements.push('story_tone')
    }

    return {
      ...options,
      compressionLevel,
      preserveElements,
      maxTokens: options.maxTokens || this.calculateOptimalTokenLimit(context, analysis)
    }
  }

  /**
   * Apply intelligent compression with story awareness
   */
  private async applyIntelligentCompression(
    context: StoryContext,
    options: CompressionOptions,
    analysis: ReturnType<typeof this.analyzeStoryContext>
  ): Promise<CompressionResult> {
    // Build context string with intelligent ordering
    const contextString = this.buildOptimalContextString(context, analysis)

    // Apply compression middleware
    return contextCompressionMiddleware.compressStoryContext(contextString, options)
  }

  /**
   * Build context string with optimal element ordering
   */
  private buildOptimalContextString(
    context: StoryContext,
    analysis: ReturnType<typeof this.analyzeStoryContext>
  ): string {
    const sections: string[] = []

    // 1. Essential story information (always first)
    sections.push(`Title: ${context.title}`)
    sections.push(`Genre: ${context.genre}`)
    sections.push(`Premise: ${context.premise}`)
    sections.push(`Tone: ${context.storyTone}`)

    // 2. Character information (prioritized by importance)
    if (context.characters.length > 0) {
      const sortedCharacters = context.characters
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8) // Limit to top 8 characters

      const characterSection = sortedCharacters
        .map(char => `${char.name} (${char.role}): ${char.description}`)
        .join('\n')

      sections.push(`Characters:\n${characterSection}`)
    }

    // 3. Critical plot points
    if (context.plotPoints.length > 0) {
      const criticalPlots = context.plotPoints
        .filter(p => p.importance === 'critical' || p.importance === 'major')
        .sort((a, b) => a.chapter - b.chapter)
        .slice(0, 5) // Top 5 plot points

      if (criticalPlots.length > 0) {
        const plotSection = criticalPlots
          .map(plot => `Chapter ${plot.chapter}: ${plot.description}`)
          .join('\n')

        sections.push(`Key Plot Points:\n${plotSection}`)
      }
    }

    // 4. Previous content (summarized if long)
    if (context.previousContent && context.previousContent.length > 0) {
      const previousText = context.previousContent.join('\n\n')

      if (previousText.length > 2000) {
        // Summarize long previous content
        const summary = this.summarizePreviousContent(context.previousContent)
        sections.push(`Previous Content Summary:\n${summary}`)
      } else {
        sections.push(`Previous Content:\n${previousText}`)
      }
    }

    // 5. Current scene context (if available)
    if (context.currentScene) {
      sections.push(`Current Scene: ${context.currentScene}`)
    }

    return sections.join('\n\n')
  }

  /**
   * Calculate quality score based on preserved elements
   */
  private calculateQualityScore(
    compressionResult: CompressionResult,
    analysis: ReturnType<typeof this.analyzeStoryContext>
  ): number {
    let score = 100

    // Penalty for excessive compression
    if (compressionResult.compressionRatio < 0.3) {
      score -= 30 // Heavy penalty for over-compression
    } else if (compressionResult.compressionRatio < 0.5) {
      score -= 15 // Moderate penalty
    }

    // Bonus for preserved elements
    const preserved = compressionResult.preservedElements
    if (preserved.includes('character_names')) score += 5
    if (preserved.includes('plot_points')) score += 5
    if (preserved.includes('story_tone')) score += 5

    // Adjust based on story complexity
    if (analysis.characterCount > 5 && compressionResult.compressionRatio < 0.6) {
      score -= 10 // Complex character stories need more context
    }

    if (analysis.criticalPlotPoints > 3 && compressionResult.compressionRatio < 0.7) {
      score -= 10 // Complex plots need more context
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Build final optimization result
   */
  private buildOptimizationResult(
    compressionResult: CompressionResult,
    analysis: ReturnType<typeof this.analyzeStoryContext>,
    qualityScore: number
  ): OptimizationResult {
    return {
      optimizedContext: compressionResult.compressedText,
      originalTokens: compressionResult.originalTokenCount,
      optimizedTokens: compressionResult.compressedTokenCount,
      compressionRatio: compressionResult.compressionRatio,
      tokensKept: compressionResult.compressedTokenCount,
      tokensSaved: compressionResult.tokensReduced,
      costSavingsUSD: compressionResult.costSavingsUSD,
      qualityScore,
      optimizationMethod: `intelligent_${compressionResult.compressionMethod}`,
      preservedElements: {
        characters: analysis.characterCount,
        plotPoints: analysis.plotPointCount,
        storyTone: compressionResult.preservedElements.includes('story_tone'),
        previousContext: compressionResult.preservedElements.includes('previous_context') ? 1 : 0
      }
    }
  }

  /**
   * Create windowed context for chapter continuation
   */
  private createChapterWindow(
    context: StoryContext,
    chapterNumber: number,
    options: OptimizationOptions
  ): StoryContext {
    const windowSize = options.contextWindow || this.calculateOptimalWindowSize(context, chapterNumber)

    // Include recent chapters based on window size
    const recentChapters = context.previousContent
      ? context.previousContent.slice(-Math.ceil(windowSize / 1000))
      : []

    // Filter characters mentioned in recent chapters
    const recentCharacters = context.characters.filter(char =>
      char.lastMentioned && char.lastMentioned >= (chapterNumber - 3)
    )

    // Include unresolved plot points
    const activePlotPoints = context.plotPoints.filter(plot =>
      !plot.resolved && plot.chapter <= chapterNumber
    )

    return {
      ...context,
      currentChapter: chapterNumber,
      characters: recentCharacters.length > 0 ? recentCharacters : context.characters.slice(0, 5),
      plotPoints: activePlotPoints,
      previousContent: recentChapters
    }
  }

  /**
   * Calculate optimal window size based on story complexity
   */
  private calculateOptimalWindowSize(context: StoryContext, chapterNumber: number): number {
    const baseWindow = 3000

    // Adjust based on story complexity
    const complexityMultiplier = 1 + (context.characters.length * 0.1) + (context.plotPoints.length * 0.05)

    // Adjust based on chapter position (later chapters need more context)
    const positionMultiplier = 1 + Math.min(chapterNumber * 0.05, 0.5)

    return Math.floor(baseWindow * complexityMultiplier * positionMultiplier)
  }

  /**
   * Utility methods
   */
  private getGenreComplexity(genre: string): number {
    const complexityMap: Record<string, number> = {
      'Fantasy': 8,
      'Science Fiction': 8,
      'Mystery': 7,
      'Thriller': 6,
      'Romance': 4,
      'Literary Fiction': 7,
      'Historical Fiction': 7,
      'Young Adult': 5,
      'Horror': 6
    }
    return complexityMap[genre] || 5
  }

  private calculateCharacterDiversity(characters: Character[]): number {
    const roles = new Set(characters.map(c => c.role))
    return roles.size / Math.max(characters.length, 1)
  }

  private calculatePlotComplexity(plotPoints: PlotPoint[]): number {
    const dependencies = plotPoints.reduce((sum, p) => sum + p.dependencies.length, 0)
    return dependencies / Math.max(plotPoints.length, 1)
  }

  private calculateOptimalTokenLimit(
    context: StoryContext,
    analysis: ReturnType<typeof this.analyzeStoryContext>
  ): number {
    const baseLimit = 4000

    // Adjust based on subscription tier and story complexity
    if (analysis.characterCount > 5 || analysis.criticalPlotPoints > 3) {
      return Math.floor(baseLimit * 1.2) // More tokens for complex stories
    }

    return baseLimit
  }

  private summarizePreviousContent(previousContent: string[]): string {
    // Simple summarization - in production would use more sophisticated methods
    const recentChapters = previousContent.slice(-3) // Last 3 chapters

    return recentChapters.map((chapter, index) => {
      const sentences = chapter.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const keySentences = sentences.slice(0, 2) // First 2 sentences of each chapter
      return `Chapter ${previousContent.length - recentChapters.length + index + 1}: ${keySentences.join('. ')}.`
    }).join('\n')
  }
}

/**
 * Utility functions
 */

/**
 * Get optimization recommendations for story type
 */
export function getOptimizationRecommendations(
  storyType: 'short' | 'novella' | 'novel' | 'series',
  subscriptionTier: 'basic' | 'premium'
): OptimizationOptions {
  const baseOptions = getOptimalCompressionSettings(subscriptionTier, 'story_foundation')

  const recommendations: Record<string, Partial<OptimizationOptions>> = {
    short: {
      compressionLevel: 'light',
      prioritizeCharacters: true,
      includeRecapLength: 0,
      qualityThreshold: 80
    },
    novella: {
      compressionLevel: 'moderate',
      prioritizeCharacters: true,
      prioritizePlot: true,
      includeRecapLength: 1,
      qualityThreshold: 75
    },
    novel: {
      compressionLevel: 'moderate',
      prioritizePlot: true,
      maintainTone: true,
      includeRecapLength: 2,
      qualityThreshold: 70,
      adaptiveWindowSize: true
    },
    series: {
      compressionLevel: 'aggressive',
      prioritizePlot: true,
      maintainTone: true,
      includeRecapLength: 3,
      qualityThreshold: 65,
      adaptiveWindowSize: true
    }
  }

  return {
    ...baseOptions,
    ...recommendations[storyType]
  } as OptimizationOptions
}

/**
 * Export singleton optimizer instance
 */
export const contextOptimizer = new ContextOptimizer()

export default contextOptimizer