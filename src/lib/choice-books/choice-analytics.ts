import { analyticsService } from '@/lib/claude/analytics'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'
import type {
  ChoiceMade,
  ChoiceAnalytics,
  PathAnalysis
} from './choice-types'
import {
  ReaderPath,
  ChoiceBook
} from './choice-types'

export class ChoiceBookAnalytics {
  private supabase = createClientComponentClient<Database>()

  /**
   * Track choice selection - extends existing analytics
   */
  async trackChoiceSelection({
    userId,
    storyId,
    choiceId,
    choicePointId,
    chapterId,
    choiceText,
    timeTaken,
    sessionId,
    metadata = {}
  }: {
    userId: string
    storyId: string
    choiceId: string
    choicePointId: string
    chapterId: string
    choiceText: string
    timeTaken: number
    sessionId: string
    metadata?: Record<string, unknown>
  }) {
    // Track in existing analytics system
    await analyticsService.trackOperation({
      userId,
      operation: 'choice_selection',
      model: 'user_interaction',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      responseTime: timeTaken,
      success: true,
      cached: false,
      metadata: {
        storyId,
        choiceId,
        choicePointId,
        chapterId,
        choiceText,
        sessionId,
        ...metadata
      }
    })

    // Update choice-specific analytics
    await this.updateChoiceAnalytics({
      storyId,
      choicePointId,
      choiceId,
      selectionCount: 1,
      averageDecisionTime: timeTaken
    })

    // Track reading progress
    await this.updateReaderProgress({
      userId,
      storyId,
      sessionId,
      choiceId,
      chapterId,
      timeTaken
    })
  }

  /**
   * Track chapter generation analytics
   */
  async trackChoiceChapterGeneration({
    userId,
    storyId,
    chapterNumber,
    choiceCount,
    generationTime,
    tokenUsage,
    complexity,
    optimizationUsed,
    cost
  }: {
    userId: string
    storyId: string
    chapterNumber: number
    choiceCount: number
    generationTime: number
    tokenUsage: { inputTokens: number; outputTokens: number }
    complexity: { branchingType: string; consequenceDepth: number; [key: string]: unknown }
    optimizationUsed: boolean
    cost: number
  }) {
    await analyticsService.trackOperation({
      userId,
      operation: 'choice_chapter_generation',
      model: 'claude-3-sonnet',
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens,
      cost,
      responseTime: generationTime,
      success: true,
      cached: false,
      metadata: {
        storyId,
        chapterNumber,
        choiceCount,
        complexity: complexity.branchingType,
        consequenceDepth: complexity.consequenceDepth,
        optimizationUsed,
        tokensSaved: optimizationUsed ? tokenUsage.inputTokens * 0.7 : 0
      }
    })
  }

  /**
   * Track path completion and ending discovery
   */
  async trackPathCompletion({
    userId,
    storyId,
    sessionId,
    endingId,
    endingType,
    pathLength,
    choicesMade,
    timeSpent,
    satisfactionRating
  }: {
    userId: string
    storyId: string
    sessionId: string
    endingId: string
    endingType: string
    pathLength: number
    choicesMade: ChoiceMade[]
    timeSpent: number
    satisfactionRating?: number
  }) {
    await analyticsService.trackOperation({
      userId,
      operation: 'choice_path_completion',
      model: 'user_journey',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      responseTime: timeSpent,
      success: true,
      cached: false,
      metadata: {
        storyId,
        sessionId,
        endingId,
        endingType,
        pathLength,
        choiceCount: choicesMade.length,
        satisfactionRating,
        choicePattern: this.analyzeChoicePattern(choicesMade)
      }
    })

    // Update ending statistics
    await this.updateEndingAnalytics({
      storyId,
      endingId,
      endingType,
      completionCount: 1,
      averagePathLength: pathLength,
      averageSatisfaction: satisfactionRating || 0
    })
  }

  /**
   * Track choice book creation analytics
   */
  async trackChoiceBookCreation({
    userId,
    storyId,
    complexity,
    targetEndingCount,
    estimatedLength,
    foundationGenerationTime,
    tokenUsage,
    cost
  }: {
    userId: string
    storyId: string
    complexity: string
    targetEndingCount: number
    estimatedLength: number
    foundationGenerationTime: number
    tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number }
    cost: number
  }) {
    await analyticsService.trackOperation({
      userId,
      operation: 'choice_book_creation',
      model: 'claude-3-sonnet',
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens,
      cost,
      responseTime: foundationGenerationTime,
      success: true,
      cached: false,
      metadata: {
        storyId,
        complexity,
        targetEndingCount,
        estimatedLength,
        bookType: 'choice',
        foundationTokens: tokenUsage.totalTokens
      }
    })
  }

  /**
   * Generate choice book analytics report
   */
  async generateChoiceBookReport(storyId: string): Promise<{
    overview: {
      totalReaders: number
      totalChoicesMade: number
      averagePathLength: number
      completionRate: number
      averagePlaytime: number
      replayRate: number
    }
    choiceAnalytics: ChoiceAnalytics[]
    pathAnalytics: PathAnalysis
    endingAnalytics: {
      distribution: Record<string, number>
      totalEndings: number
      mostPopular: [string, number] | undefined
    }
    readerBehavior: {
      uniqueReaders: number
      totalSessions: number
      replayRate: number
      averageSessionLength: number
      abandonmentRate: number
    }
  }> {
    // Get choice analytics
    const { data: choiceAnalytics } = await this.supabase
      .from('choice_analytics')
      .select('*')
      .eq('story_id', storyId)

    // Get reader paths
    const { data: readerPaths } = await this.supabase
      .from('reader_paths')
      .select('*')
      .eq('story_id', storyId)

    // Get story info
    const { data: story } = await this.supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    const pathAnalysis = this.analyzeReaderPaths(readerPaths || [])
    const endingAnalysis = this.analyzeEndingDistribution(readerPaths || [])
    const behaviorAnalysis = this.analyzeReaderBehavior(readerPaths || [])

    return {
      overview: {
        totalReaders: readerPaths?.length || 0,
        totalChoicesMade: readerPaths?.reduce((sum, path) => sum + (path.choices_made?.length || 0), 0) || 0,
        averagePathLength: pathAnalysis.average_path_length,
        completionRate: pathAnalysis.replay_value_score,
        averagePlaytime: behaviorAnalysis.averageSessionLength,
        replayRate: behaviorAnalysis.replayRate
      },
      choiceAnalytics: choiceAnalytics || [],
      pathAnalytics: pathAnalysis,
      endingAnalytics: endingAnalysis,
      readerBehavior: behaviorAnalysis
    }
  }

  /**
   * Get popular choice paths for optimization
   */
  async getPopularChoicePaths(storyId: string, limit = 10) {
    const { data: paths } = await this.supabase
      .from('reader_paths')
      .select('choices_made, path_completion, session_end')
      .eq('story_id', storyId)
      .not('session_end', 'is', null) // Only completed sessions
      .order('created_at', { ascending: false })
      .limit(100)

    if (!paths) return []

    // Group similar paths
    const pathGroups = this.groupSimilarPaths(paths)

    return pathGroups
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(group => ({
        choiceSequence: group.pattern,
        readerCount: group.count,
        averageCompletion: group.averageCompletion,
        popularityScore: group.count / paths.length
      }))
  }

  /**
   * Analyze choice difficulty and engagement
   */
  async analyzeChoiceDifficulty(storyId: string, choicePointId?: string) {
    const whereClause = choicePointId
      ? { story_id: storyId, choice_point_id: choicePointId }
      : { story_id: storyId }

    const { data: analytics } = await this.supabase
      .from('choice_analytics')
      .select('*')
      .match(whereClause)

    if (!analytics) return null

    return analytics.map(choice => ({
      choiceId: choice.choice_id,
      selectionRate: choice.selection_count / analytics.reduce((sum, c) => sum + c.selection_count, 0),
      averageDecisionTime: choice.average_decision_time,
      completionRate: choice.completion_rate,
      satisfactionRating: choice.satisfaction_rating,
      difficulty: this.calculateChoiceDifficulty(choice),
      engagement: this.calculateEngagementScore(choice)
    }))
  }

  // Private helper methods
  private async updateChoiceAnalytics({
    storyId,
    choicePointId,
    choiceId,
    selectionCount,
    averageDecisionTime
  }: {
    storyId: string
    choicePointId: string
    choiceId: string
    selectionCount: number
    averageDecisionTime: number
  }) {
    await this.supabase
      .from('choice_analytics')
      .upsert({
        story_id: storyId,
        choice_point_id: choicePointId,
        choice_id: choiceId,
        selection_count: selectionCount,
        average_decision_time: averageDecisionTime
      }, {
        onConflict: 'choice_id',
        ignoreDuplicates: false
      })
  }

  private async updateReaderProgress({
    userId,
    storyId,
    sessionId,
    choiceId,
    chapterId,
    timeTaken
  }: {
    userId: string
    storyId: string
    sessionId: string
    choiceId: string
    chapterId: string
    timeTaken: number
  }) {
    const { data: existingPath } = await this.supabase
      .from('reader_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .eq('session_id', sessionId)
      .single()

    const newChoice: ChoiceMade = {
      choice_point_id: `cp_${chapterId}`,
      choice_id: choiceId,
      choice_text: 'Choice made',
      timestamp: new Date(),
      time_taken_seconds: timeTaken,
      chapter_context: chapterId
    }

    if (existingPath) {
      const updatedChoices = [...(existingPath.choices_made || []), newChoice]
      await this.supabase
        .from('reader_paths')
        .update({
          choices_made: updatedChoices,
          current_chapter: chapterId,
          path_completion: this.calculatePathCompletion(updatedChoices),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPath.id)
    } else {
      await this.supabase
        .from('reader_paths')
        .insert({
          user_id: userId,
          story_id: storyId,
          session_id: sessionId,
          choices_made: [newChoice],
          current_chapter: chapterId,
          path_completion: 10,
          discovered_endings: [],
          playthrough_count: 1,
          session_start: new Date().toISOString()
        })
    }
  }

  private async updateEndingAnalytics({
    storyId,
    endingId,
    endingType,
    completionCount,
    averagePathLength,
    averageSatisfaction
  }: {
    storyId: string
    endingId: string
    endingType: string
    completionCount: number
    averagePathLength: number
    averageSatisfaction: number
  }) {
    // This would update ending-specific analytics
    // Implementation depends on final database schema
  }

  private analyzeChoicePattern(choices: ChoiceMade[]): string {
    // Analyze the pattern of choices (e.g., "aggressive", "cautious", "balanced")
    if (choices.length < 2) return 'insufficient_data'

    // Simplified pattern analysis
    return 'mixed_strategy'
  }

  private analyzeReaderPaths(paths: Array<{ choices_made?: ChoiceMade[]; path_completion: number; discovered_endings?: string[]; user_id: string; session_start?: string; session_end?: string }>): PathAnalysis {
    if (paths.length === 0) {
      return {
        total_paths: 0,
        average_path_length: 0,
        shortest_path: 0,
        longest_path: 0,
        ending_distribution: {},
        choice_density: 0,
        replay_value_score: 0
      }
    }

    const pathLengths = paths.map(p => p.choices_made?.length || 0)
    const completedPaths = paths.filter(p => p.path_completion >= 90)

    return {
      total_paths: paths.length,
      average_path_length: pathLengths.reduce((sum, len) => sum + len, 0) / pathLengths.length,
      shortest_path: Math.min(...pathLengths),
      longest_path: Math.max(...pathLengths),
      ending_distribution: this.calculateEndingDistribution(paths),
      choice_density: this.calculateChoiceDensity(paths),
      replay_value_score: completedPaths.length / paths.length
    }
  }

  private analyzeEndingDistribution(paths: Array<{ discovered_endings?: string[] }>) {
    const endingCounts: Record<string, number> = {}
    paths.forEach(path => {
      if (path.discovered_endings?.length && path.discovered_endings.length > 0) {
        path.discovered_endings?.forEach((ending: string) => {
          endingCounts[ending] = (endingCounts[ending] || 0) + 1
        })
      }
    })

    return {
      distribution: endingCounts,
      totalEndings: Object.keys(endingCounts).length,
      mostPopular: Object.entries(endingCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0]
    }
  }

  private analyzeReaderBehavior(paths: Array<{ user_id: string; session_start?: string; session_end?: string; path_completion: number }>) {
    const totalSessions = paths.length
    const uniqueUsers = new Set(paths.map(p => p.user_id)).size
    const replayRate = totalSessions > uniqueUsers ? (totalSessions - uniqueUsers) / uniqueUsers : 0

    return {
      uniqueReaders: uniqueUsers,
      totalSessions,
      replayRate,
      averageSessionLength: this.calculateAverageSessionLength(paths),
      abandonmentRate: this.calculateAbandonmentRate(paths)
    }
  }

  private groupSimilarPaths(paths: Array<{ choices_made?: ChoiceMade[]; path_completion: number }>) {
    // Group paths with similar choice sequences
    const groups = new Map()

    paths.forEach(path => {
      const pattern = this.extractChoicePattern(path.choices_made || [])
      if (groups.has(pattern)) {
        groups.get(pattern).count++
        groups.get(pattern).completions.push(path.path_completion)
      } else {
        groups.set(pattern, {
          pattern,
          count: 1,
          completions: [path.path_completion]
        })
      }
    })

    return Array.from(groups.values()).map(group => ({
      ...group,
      averageCompletion: group.completions.reduce((sum: number, c: number) => sum + c, 0) / group.completions.length
    }))
  }

  private extractChoicePattern(choices: Array<{ choice_id?: string }>): string {
    // Extract a pattern signature from choices
    return choices.map(c => c.choice_id?.split('_').pop() || 'x').join('-')
  }

  private calculatePathCompletion(choices: ChoiceMade[]): number {
    return Math.min(choices.length * 15, 100)
  }

  private calculateEndingDistribution(paths: Array<{ discovered_endings?: string[] }>) {
    const distribution: Record<string, number> = {}
    paths.forEach(path => {
      if (path.discovered_endings) {
        path.discovered_endings.forEach((ending: string) => {
          distribution[ending] = (distribution[ending] || 0) + 1
        })
      }
    })
    return distribution
  }

  private calculateChoiceDensity(paths: Array<{ choices_made?: ChoiceMade[] }>): number {
    if (paths.length === 0) return 0
    const totalChoices = paths.reduce((sum, p) => sum + (p.choices_made?.length || 0), 0)
    return totalChoices / paths.length
  }

  private calculateAverageSessionLength(paths: Array<{ session_start?: string; session_end?: string }>): number {
    const sessionsWithTime = paths.filter(p => p.session_start && p.session_end)
    if (sessionsWithTime.length === 0) return 0

    const totalTime = sessionsWithTime.reduce((sum, p) => {
      const start = new Date(p.session_start!).getTime()
      const end = new Date(p.session_end!).getTime()
      return sum + (end - start)
    }, 0)

    return totalTime / sessionsWithTime.length / 1000 / 60 // minutes
  }

  private calculateAbandonmentRate(paths: Array<{ session_end?: string; path_completion: number }>): number {
    const abandonedSessions = paths.filter(p => !p.session_end && p.path_completion < 90)
    return abandonedSessions.length / paths.length
  }

  private calculateChoiceDifficulty(analytics: { average_decision_time?: number; completion_rate?: number }): 'easy' | 'moderate' | 'hard' {
    const decisionTime = analytics.average_decision_time || 0
    const completionRate = analytics.completion_rate || 1

    if (decisionTime > 60 || completionRate < 0.7) return 'hard'
    if (decisionTime > 30 || completionRate < 0.85) return 'moderate'
    return 'easy'
  }

  private calculateEngagementScore(analytics: { selection_count?: number; completion_rate?: number; satisfaction_rating?: number }): number {
    const selectionRate = analytics.selection_count || 0
    const completionRate = analytics.completion_rate || 0
    const satisfaction = analytics.satisfaction_rating || 0

    return (selectionRate * 0.3 + completionRate * 0.4 + satisfaction * 0.3) / 3
  }
}

export const choiceBookAnalytics = new ChoiceBookAnalytics()