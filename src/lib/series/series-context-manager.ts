import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type {
  SeriesContext,
  CharacterArc,
  WorldState,
  BookSummary,
  PlotThread,
  UnresolvedConflict,
  ForeshadowingElement,
  WorldStateChange,
  BookDevelopment } from './series-types'
import {
  Series,
  CharacterRelationship,
  TurningPoint,
  PersonalityEvolution
} from './series-types'
import { contextOptimizer } from '../claude/context-optimizer'

export interface ConsistencyValidation {
  is_valid: boolean
  violations: ConsistencyViolation[]
  suggestions: string[]
  confidence_score: number
}

export interface ConsistencyViolation {
  type: 'character' | 'world' | 'timeline' | 'plot' | 'relationship'
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  location: string
  suggested_fix: string
  auto_fixable: boolean
}

export interface SeriesOptimizedContext {
  // Core facts (always included - ~30 tokens)
  series_core: {
    genre: string
    world_type: string
    central_series_conflict: string
    current_book_focus: string
    book_position: string // "early" | "middle" | "late" | "final"
  }

  // Character arcs (dynamic based on chapter - 50-150 tokens)
  character_arcs: {
    active_characters: Array<{
      character_name: string
      current_goal: string
      key_trait: string
      current_emotion: string
      series_arc_progress: number
    }>
    character_relationships: Record<string, string>
    series_development: Record<string, number> // How far along their arc
    relationship_changes: string[]
  }

  // World state (only changed elements - 20-100 tokens)
  world_context: {
    current_state: string[]
    recent_changes: string[]
    rules_reminders: string[]
    threat_level: string
  }

  // Previous books (highly compressed - 50-200 tokens)
  series_history: {
    book_summaries: string[]
    unresolved_threads: string[]
    character_locations: Record<string, string>
    major_consequences: string[]
  }

  // Foreshadowing and plot threads (30-80 tokens)
  narrative_elements: {
    active_foreshadowing: string[]
    plot_threads: string[]
    pending_payoffs: string[]
  }
}

export class SeriesContextManager {
  private supabase: ReturnType<typeof createRouteHandlerClient> | null = null

  constructor() {
    try {
      const cookieStore = cookies()
      this.supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    } catch (error) {
      console.warn('SeriesContextManager: Supabase not available in this context')
    }
  }

  /**
   * Get comprehensive series context for chapter generation
   */
  async getSeriesContext(seriesId: string, bookNumber: number): Promise<SeriesContext> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      // Get series data
      const { data: series } = await this.supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single()

      if (!series) {
        throw new Error(`Series ${seriesId} not found`)
      }

      // Get character arcs
      const { data: characterArcs } = await this.supabase
        .from('character_arcs')
        .select('*')
        .eq('series_id', seriesId)

      // Get world state changes up to current book
      const { data: worldChanges } = await this.supabase
        .from('world_state_changes')
        .select('*')
        .eq('series_id', seriesId)
        .lte('book_number', bookNumber)
        .order('book_number', { ascending: true })

      // Get plot threads
      const { data: plotThreads } = await this.supabase
        .from('plot_threads')
        .select('*')
        .eq('series_id', seriesId)

      // Get foreshadowing elements
      const { data: foreshadowing } = await this.supabase
        .from('foreshadowing_elements')
        .select('*')
        .eq('series_id', seriesId)

      // Get previous book summaries
      const previousBookSummaries = await this.getPreviousBookSummaries(seriesId, bookNumber)

      // Build world state
      const worldState = this.buildCurrentWorldState(series, worldChanges || [])

      // Get unresolved conflicts and ongoing threads
      const unresolvedConflicts = this.extractUnresolvedConflicts(plotThreads || [])
      const ongoingPlotThreads = this.filterActivePlotThreads(plotThreads || [], bookNumber)

      return {
        series_id: seriesId,
        current_book: bookNumber,
        character_arcs: characterArcs || [],
        world_state: worldState,
        previous_book_summaries: previousBookSummaries,
        ongoing_plot_threads: ongoingPlotThreads,
        unresolved_conflicts: unresolvedConflicts,
        foreshadowing_elements: foreshadowing || []
      }
    } catch (error) {
      console.error('Error getting series context:', error)
      throw error
    }
  }

  /**
   * Update character development across series
   */
  async updateCharacterArc(
    seriesId: string,
    characterName: string,
    bookNumber: number,
    development: Partial<BookDevelopment>
  ): Promise<void> {
    if (!this.supabase) return

    try {
      // Get existing character arc
      const { data: existingArc } = await this.supabase
        .from('character_arcs')
        .select('*')
        .eq('series_id', seriesId)
        .eq('character_name', characterName)
        .single() as { data: { id: string, current_book_development: Record<number, Partial<BookDevelopment>>, last_appearance_book: number } | null }

      if (!existingArc) {
        // Create new character arc
        await (this.supabase as any)
          .from('character_arcs')
          .insert({
            series_id: seriesId,
            character_name: characterName,
            current_book_development: { [bookNumber]: development },
            last_appearance_book: bookNumber
          })
      } else {
        // Update existing arc
        const updatedDevelopment = {
          ...existingArc.current_book_development,
          [bookNumber]: development
        }

        await (this.supabase as any)
          .from('character_arcs')
          .update({
            current_book_development: updatedDevelopment,
            last_appearance_book: Math.max(existingArc.last_appearance_book, bookNumber),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingArc.id)
      }
    } catch (error) {
      console.error('Error updating character arc:', error)
      throw error
    }
  }

  /**
   * Record changes that affect future books
   */
  async recordWorldStateChange(
    seriesId: string,
    bookNumber: number,
    change: Omit<WorldStateChange, 'id' | 'series_id' | 'book_number'>
  ): Promise<void> {
    if (!this.supabase) return

    try {
      await (this.supabase as any)
        .from('world_state_changes')
        .insert({
          series_id: seriesId,
          book_number: bookNumber,
          ...change
        })

      // Recalculate series analytics
      await this.updateSeriesAnalytics(seriesId)
    } catch (error) {
      console.error('Error recording world state change:', error)
      throw error
    }
  }

  /**
   * Validate new content against series consistency
   */
  async validateSeriesConsistency(
    newContent: string,
    seriesId: string,
    bookNumber: number,
    chapterNumber?: number
  ): Promise<ConsistencyValidation> {
    try {
      const seriesContext = await this.getSeriesContext(seriesId, bookNumber)
      const violations: ConsistencyViolation[] = []

      // Check character consistency
      const characterViolations = await this.validateCharacterConsistency(
        newContent,
        seriesContext.character_arcs
      )
      violations.push(...characterViolations)

      // Check world rules consistency
      const worldViolations = await this.validateWorldConsistency(
        newContent,
        seriesContext.world_state
      )
      violations.push(...worldViolations)

      // Check timeline consistency
      const timelineViolations = await this.validateTimelineConsistency(
        newContent,
        seriesContext,
        bookNumber,
        chapterNumber
      )
      violations.push(...timelineViolations)

      // Check relationship consistency
      const relationshipViolations = await this.validateRelationshipConsistency(
        newContent,
        seriesContext.character_arcs
      )
      violations.push(...relationshipViolations)

      // Calculate confidence score
      const criticalViolations = violations.filter(v => v.severity === 'critical').length
      const majorViolations = violations.filter(v => v.severity === 'major').length
      const confidenceScore = Math.max(0, 100 - (criticalViolations * 40 + majorViolations * 20))

      // Generate suggestions
      const suggestions = this.generateConsistencySuggestions(violations)

      return {
        is_valid: criticalViolations === 0 && majorViolations <= 2,
        violations,
        suggestions,
        confidence_score: confidenceScore
      }
    } catch (error) {
      console.error('Error validating series consistency:', error)
      return {
        is_valid: false,
        violations: [{
          type: 'world',
          severity: 'critical',
          description: 'Failed to validate consistency due to system error',
          location: 'validation system',
          suggested_fix: 'Retry validation or contact support',
          auto_fixable: false
        }],
        suggestions: ['Retry validation'],
        confidence_score: 0
      }
    }
  }

  /**
   * Generate compressed summaries of previous books
   */
  async generateBookSummary(storyId: string): Promise<BookSummary> {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      // Get story details
      const { data: story } = await this.supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single() as { data: { book_number: number, title: string } | null }

      if (!story) {
        throw new Error(`Story ${storyId} not found`)
      }

      // Get all chapters
      const { data: chapters } = await this.supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true })

      // Extract key elements from chapters
      const mainPlot = this.extractMainPlot(chapters || [])
      const subplots = this.extractSubplots(chapters || [])
      const characterDevelopments = this.extractCharacterDevelopments(chapters || [])
      const worldChanges = this.extractWorldChanges(chapters || [])
      const unresolved = this.extractUnresolvedElements(chapters || [])
      const cliffhangers = this.extractCliffhangers(chapters || [])

      return {
        book_number: story.book_number || 1,
        title: story.title,
        main_plot: mainPlot,
        subplots,
        character_developments: characterDevelopments,
        world_changes: worldChanges,
        unresolved_elements: unresolved,
        cliffhangers,
        new_characters_introduced: this.extractNewCharacters(chapters || []),
        characters_who_died: this.extractDeadCharacters(chapters || [])
      }
    } catch (error) {
      console.error('Error generating book summary:', error)
      throw error
    }
  }

  /**
   * Get optimized series context for token efficiency
   */
  async getOptimizedSeriesContext(
    seriesId: string,
    bookNumber: number,
    chapterPlan: {
      characters: string[]
      themes: string[]
      [key: string]: unknown
    }
  ): Promise<SeriesOptimizedContext> {
    const fullContext = await this.getSeriesContext(seriesId, bookNumber)
    if (!fullContext) {
      throw new Error(`Series context for ${seriesId} not found`)
    }

    // Get series data for core facts
    if (!this.supabase) {
      throw new Error('Supabase client not initialized')
    }

    const seriesResult = await this.supabase
      .from('series')
      .select('*')
      .eq('id', seriesId)
      .single()

    if (!seriesResult) {
      throw new Error(`Failed to query series ${seriesId}`)
    }

    const { data: seriesData, error: seriesError } = seriesResult

    if (seriesError || !seriesData) {
      throw new Error(`Series ${seriesId} not found`)
    }

    const series = seriesData as { genre: string, world_rules: unknown, total_planned_books: number }

    // Compress character arcs to essentials
    const activeCharacters = this.selectActiveCharacters(
      fullContext.character_arcs,
      chapterPlan,
      3 // Max 3 characters for token efficiency
    )

    // Compress world state to recent changes only
    const recentChanges = this.getRecentWorldChanges(
      fullContext.world_state,
      2 // Last 2 major changes
    )

    // Compress book summaries to key points
    const compressedSummaries = fullContext.previous_book_summaries
      .slice(-2) // Last 2 books only
      .map(book => `Book ${book.book_number}: ${book.main_plot.slice(0, 100)}`)

    // Get active foreshadowing
    const activeForeshadowing = fullContext.foreshadowing_elements
      .filter(f => f.status === 'planted' || f.status === 'developing')
      .slice(0, 3)
      .map(f => f.element.slice(0, 50))

    // Get active plot threads
    const activePlotThreads = fullContext.ongoing_plot_threads
      .filter(t => t.current_status === 'active' && t.priority !== 'background')
      .slice(0, 3)
      .map(t => t.name)

    return {
      series_core: {
        genre: series.genre,
        world_type: this.determineWorldType(series.world_rules as any),
        central_series_conflict: this.extractCentralConflict(series as { description?: string }),
        current_book_focus: this.determineBookFocus(bookNumber, series.total_planned_books),
        book_position: this.determineBookPosition(bookNumber, series.total_planned_books)
      },
      character_arcs: {
        active_characters: activeCharacters,
        character_relationships: this.extractRelevantRelationships(activeCharacters),
        series_development: this.calculateSeriesDevelopment(fullContext.character_arcs),
        relationship_changes: this.getRecentRelationshipChanges(fullContext.character_arcs)
      },
      world_context: {
        current_state: this.getCurrentWorldState(fullContext.world_state),
        recent_changes: recentChanges,
        rules_reminders: this.getImportantRules(series.world_rules as any),
        threat_level: this.assessCurrentThreatLevel(fullContext)
      },
      series_history: {
        book_summaries: compressedSummaries,
        unresolved_threads: fullContext.unresolved_conflicts.map(c => c.name).slice(0, 3),
        character_locations: this.getCurrentCharacterLocations(fullContext.character_arcs),
        major_consequences: this.getMajorConsequences(fullContext.previous_book_summaries)
      },
      narrative_elements: {
        active_foreshadowing: activeForeshadowing,
        plot_threads: activePlotThreads,
        pending_payoffs: this.getPendingPayoffs(fullContext.foreshadowing_elements)
      }
    }
  }

  // Helper methods for building context
  private async getPreviousBookSummaries(seriesId: string, currentBook: number): Promise<BookSummary[]> {
    if (!this.supabase || currentBook <= 1) return []

    try {
      const { data: stories } = await this.supabase
        .from('stories')
        .select('*')
        .eq('series_id', seriesId)
        .lt('book_number', currentBook)
        .order('book_number', { ascending: true }) as { data: Array<{ id: string }> | null }

      const summaries: BookSummary[] = []
      for (const story of stories || []) {
        const summary = await this.generateBookSummary(story.id)
        summaries.push(summary)
      }

      return summaries
    } catch (error) {
      console.error('Error getting previous book summaries:', error)
      return []
    }
  }

  private buildCurrentWorldState(series: { world_rules?: Record<string, unknown> }, worldChanges: Array<{ affects_future_books: boolean; description: string }>): WorldState {
    const latestChanges = worldChanges
      .filter(change => change.affects_future_books)
      .slice(-5) // Last 5 major changes

    return {
      current_political_situation: this.extractPoliticalSituation(latestChanges),
      current_technology_level: this.extractTechnologyLevel(series.world_rules as any),
      current_social_climate: this.extractSocialClimate(latestChanges),
      current_threats: this.extractCurrentThreats(latestChanges),
      current_opportunities: this.extractCurrentOpportunities(latestChanges),
      changed_since_book_one: latestChanges as WorldStateChange[]
    }
  }

  private extractUnresolvedConflicts(plotThreads: Array<{
    id: string
    name: string
    current_status: string
    priority: string
    description: string
    characters_involved?: string[]
    introduced_book: number
  }>): UnresolvedConflict[] {
    return plotThreads
      .filter(thread => thread.current_status === 'active' && thread.priority !== 'background')
      .map(thread => ({
        id: thread.id,
        name: thread.name,
        type: this.determineConflictType(thread.description),
        parties_involved: thread.characters_involved || [],
        stakes: this.extractStakes(thread.description),
        escalation_level: this.calculateEscalationLevel(thread),
        introduced_book: thread.introduced_book,
        tension_level: this.assessTensionLevel(thread)
      })) as UnresolvedConflict[]
  }

  private filterActivePlotThreads(plotThreads: Array<{
    current_status: string
    introduced_book: number
    expected_resolution_book?: number
  }>, currentBook: number): PlotThread[] {
    return plotThreads.filter(thread =>
      thread.current_status === 'active' &&
      thread.introduced_book <= currentBook &&
      (!thread.expected_resolution_book || thread.expected_resolution_book >= currentBook)
    ) as PlotThread[]
  }

  // Character consistency validation
  private async validateCharacterConsistency(
    content: string,
    characterArcs: CharacterArc[]
  ): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = []

    for (const arc of characterArcs) {
      if (content.includes(arc.character_name)) {
        // Check for personality consistency
        const personalityViolations = this.checkPersonalityConsistency(content, arc)
        violations.push(...personalityViolations)

        // Check for relationship consistency
        const relationshipViolations = this.checkRelationshipConsistency(content, arc)
        violations.push(...relationshipViolations)

        // Check for ability consistency
        const abilityViolations = this.checkAbilityConsistency(content, arc)
        violations.push(...abilityViolations)
      }
    }

    return violations
  }

  private async validateWorldConsistency(
    content: string,
    worldState: WorldState
  ): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = []

    // Check for technology level consistency
    const techViolations = this.checkTechnologyConsistency(content, worldState)
    violations.push(...techViolations)

    // Check for political consistency
    const politicalViolations = this.checkPoliticalConsistency(content, worldState)
    violations.push(...politicalViolations)

    // Check for social climate consistency
    const socialViolations = this.checkSocialConsistency(content, worldState)
    violations.push(...socialViolations)

    return violations
  }

  private async validateTimelineConsistency(
    content: string,
    seriesContext: SeriesContext,
    bookNumber: number,
    chapterNumber?: number
  ): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = []

    // Check for chronological consistency
    const chronologicalViolations = this.checkChronologicalConsistency(
      content,
      seriesContext.previous_book_summaries,
      bookNumber
    )
    violations.push(...chronologicalViolations)

    // Check for event sequence consistency
    const sequenceViolations = this.checkEventSequenceConsistency(
      content,
      seriesContext.foreshadowing_elements
    )
    violations.push(...sequenceViolations)

    return violations
  }

  private async validateRelationshipConsistency(
    content: string,
    characterArcs: CharacterArc[]
  ): Promise<ConsistencyViolation[]> {
    const violations: ConsistencyViolation[] = []

    // Check for relationship status consistency
    for (const arc of characterArcs) {
      if (content.includes(arc.character_name)) {
        const relationshipViolations = this.checkRelationshipStatusConsistency(content, arc)
        violations.push(...relationshipViolations)
      }
    }

    return violations
  }

  private generateConsistencySuggestions(violations: ConsistencyViolation[]): string[] {
    const suggestions = new Set<string>()

    for (const violation of violations) {
      suggestions.add(violation.suggested_fix)

      if (violation.severity === 'critical') {
        suggestions.add(`CRITICAL: Address ${violation.type} inconsistency immediately`)
      }

      if (violation.auto_fixable) {
        suggestions.add(`Auto-fix available for ${violation.description}`)
      }
    }

    return Array.from(suggestions)
  }

  private async updateSeriesAnalytics(seriesId: string): Promise<void> {
    if (!this.supabase) return

    try {
      // This would call the calculate_series_analytics function
      await (this.supabase as any).rpc('calculate_series_analytics', {
        series_uuid: seriesId
      })
    } catch (error) {
      console.error('Error updating series analytics:', error)
    }
  }

  // Placeholder implementations for helper methods
  // These would contain more sophisticated logic in a full implementation

  private extractMainPlot(chapters: Array<{ summary: string }>): string {
    // Extract main plot from chapter summaries and content
    return chapters.map(ch => ch.summary).join(' ').slice(0, 200)
  }

  private extractSubplots(chapters: Array<Record<string, unknown>>): string[] {
    // Extract subplot threads from chapters
    return []
  }

  private extractCharacterDevelopments(chapters: Array<Record<string, unknown>>): string[] {
    // Extract character development from chapters
    return []
  }

  private extractWorldChanges(chapters: Array<Record<string, unknown>>): string[] {
    // Extract world changes from chapters
    return []
  }

  private extractUnresolvedElements(chapters: Array<Record<string, unknown>>): string[] {
    // Extract unresolved elements from chapters
    return []
  }

  private extractCliffhangers(chapters: Array<Record<string, unknown>>): string[] {
    // Extract cliffhangers from chapters
    return []
  }

  private extractNewCharacters(chapters: Array<Record<string, unknown>>): string[] {
    // Extract new character introductions
    return []
  }

  private extractDeadCharacters(chapters: Array<Record<string, unknown>>): string[] {
    // Extract character deaths
    return []
  }

  private selectActiveCharacters(arcs: CharacterArc[], chapterPlan: { characters?: string[] }, maxCount: number): Array<{
    character_name: string
    current_goal: string
    key_trait: string
    current_emotion: string
    series_arc_progress: number
  }> {
    // Select most relevant characters for this chapter
    return arcs.slice(0, maxCount) as unknown as Array<{
      character_name: string
      current_goal: string
      key_trait: string
      current_emotion: string
      series_arc_progress: number
    }>
  }

  private getRecentWorldChanges(worldState: WorldState, maxCount: number): string[] {
    // Get most recent world changes
    return worldState.changed_since_book_one
      .slice(-maxCount)
      .map(change => change.description.slice(0, 50))
  }

  private determineWorldType(worldRules: { geography?: { world_type?: string } }): string {
    // Determine world type from rules
    return worldRules?.geography?.world_type || 'earth_like'
  }

  private extractCentralConflict(series: { description?: string }): string {
    // Extract central series conflict
    return series.description?.slice(0, 100) || 'character vs unknown'
  }

  private determineBookFocus(bookNumber: number, totalBooks: number): string {
    // Determine what this book focuses on in the series
    if (bookNumber === 1) return 'introduction and setup'
    if (bookNumber === totalBooks) return 'climax and resolution'
    if (bookNumber < totalBooks / 2) return 'development and rising action'
    return 'complications and approaching climax'
  }

  private determineBookPosition(bookNumber: number, totalBooks: number): string {
    if (bookNumber === 1) return 'early'
    if (bookNumber === totalBooks) return 'final'
    if (bookNumber <= totalBooks / 3) return 'early'
    if (bookNumber >= totalBooks * 2/3) return 'late'
    return 'middle'
  }

  private extractRelevantRelationships(characters: Array<{ character_name: string }>): Record<string, string> {
    // Extract relevant character relationships
    return {}
  }

  private calculateSeriesDevelopment(arcs: CharacterArc[]): Record<string, number> {
    // Calculate how far along each character's arc they are
    return {}
  }

  private getRecentRelationshipChanges(arcs: CharacterArc[]): string[] {
    // Get recent relationship changes
    return []
  }

  private getCurrentWorldState(worldState: WorldState): string[] {
    // Get current world state summary
    return [
      worldState.current_political_situation,
      worldState.current_social_climate
    ].filter(Boolean)
  }

  private getImportantRules(worldRules: Record<string, unknown>): string[] {
    // Get important world rules to remember
    return []
  }

  private assessCurrentThreatLevel(context: SeriesContext): string {
    // Assess current threat level
    return context.unresolved_conflicts.length > 3 ? 'high' : 'moderate'
  }

  private getCurrentCharacterLocations(arcs: CharacterArc[]): Record<string, string> {
    // Get current character locations
    return {}
  }

  private getMajorConsequences(summaries: BookSummary[]): string[] {
    // Get major consequences from previous books
    return summaries.flatMap(s => s.unresolved_elements).slice(0, 3)
  }

  private getPendingPayoffs(foreshadowing: ForeshadowingElement[]): string[] {
    // Get foreshadowing elements ready for payoff
    return foreshadowing
      .filter(f => f.status === 'developing')
      .map(f => f.element.slice(0, 50))
      .slice(0, 2)
  }

  // Stub implementations for validation methods
  private checkPersonalityConsistency(content: string, arc: CharacterArc): ConsistencyViolation[] { return [] }
  private checkRelationshipConsistency(content: string, arc: CharacterArc): ConsistencyViolation[] { return [] }
  private checkAbilityConsistency(content: string, arc: CharacterArc): ConsistencyViolation[] { return [] }
  private checkTechnologyConsistency(content: string, worldState: WorldState): ConsistencyViolation[] { return [] }
  private checkPoliticalConsistency(content: string, worldState: WorldState): ConsistencyViolation[] { return [] }
  private checkSocialConsistency(content: string, worldState: WorldState): ConsistencyViolation[] { return [] }
  private checkChronologicalConsistency(content: string, summaries: BookSummary[], bookNumber: number): ConsistencyViolation[] { return [] }
  private checkEventSequenceConsistency(content: string, foreshadowing: ForeshadowingElement[]): ConsistencyViolation[] { return [] }
  private checkRelationshipStatusConsistency(content: string, arc: CharacterArc): ConsistencyViolation[] { return [] }

  // Stub implementations for extraction methods
  private extractPoliticalSituation(changes: Array<Record<string, unknown>>): string { return 'stable' }
  private extractTechnologyLevel(worldRules: Record<string, unknown>): string { return 'modern' }
  private extractSocialClimate(changes: Array<Record<string, unknown>>): string { return 'normal' }
  private extractCurrentThreats(changes: Array<Record<string, unknown>>): string[] { return [] }
  private extractCurrentOpportunities(changes: Array<Record<string, unknown>>): string[] { return [] }
  private determineConflictType(description: string): 'personal' | 'political' | 'social' | 'economic' | 'ideological' { return 'personal' }
  private extractStakes(description: string): string { return 'unknown stakes' }
  private calculateEscalationLevel(thread: Record<string, unknown>): number { return 5 }
  private assessTensionLevel(thread: Record<string, unknown>): 'low' | 'moderate' | 'high' | 'critical' { return 'moderate' }
}

export const seriesContextManager = new SeriesContextManager()