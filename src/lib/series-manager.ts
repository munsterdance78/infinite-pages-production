import { claudeService } from './claude/service'
import { claudeCache } from './claude/cache'
import { createClient } from './supabase/client'

interface SeriesCreationOptions {
  name: string
  plannedBooks: number
  universeId: string
  description?: string
  genre?: string
  targetAudience?: string
  themes?: string[]
}

interface SeriesFacts {
  seriesId: string
  name: string
  universe: SeriesUniverse
  characterDatabase: SeriesCharacterDatabase
  plotStructure: SeriesPlotStructure
  continuityRules: ContinuityRule[]
  timelineStructure: SeriesTimeline
  worldState: SeriesWorldState
}

interface SeriesUniverse {
  id: string
  name: string
  rules: UniverseRule[]
  magicSystem?: MagicSystem
  technology: TechnologyLevel
  geography: GeographicElement[]
  cultures: Culture[]
  history: HistoricalEvent[]
}

interface SeriesCharacterDatabase {
  mainCharacters: SeriesCharacter[]
  supportingCharacters: SeriesCharacter[]
  characterRelationships: CharacterRelationship[]
  arcTemplates: CharacterArcTemplate[]
}

interface SeriesCharacter {
  id: string
  name: string
  role: string
  firstAppearance: string
  characterTraits: string[]
  developmentArc: CharacterArcPoint[]
  voicePattern: VoicePattern
  relationships: string[]
  currentStatus: CharacterStatus
}

interface CharacterArcPoint {
  bookNumber: number
  chapterRange: string
  developmentStage: string
  keyEvents: string[]
  emotionalState: string
  growth: string
  conflicts: string[]
}

interface SeriesPlotStructure {
  overallArc: PlotArc
  bookArcs: BookArc[]
  subplots: Subplot[]
  plotThreads: PlotThread[]
  cliffhangers: Cliffhanger[]
  foreshadowing: ForeshadowingElement[]
}

interface ContinuityRule {
  id: string
  type: 'character' | 'world' | 'plot' | 'timeline'
  description: string
  enforcement: 'strict' | 'flexible'
  exceptions: string[]
  validationCriteria: string[]
}

interface SeriesTimeline {
  startDate: string
  endDate: string
  timeSpan: string
  majorEvents: TimelineEvent[]
  characterAges: Record<string, AgeProgression>
  worldEvents: WorldEvent[]
}

interface ContinuityAnalysis {
  overallScore: number
  characterContinuity: CharacterContinuityCheck[]
  plotContinuity: PlotContinuityCheck[]
  worldContinuity: WorldContinuityCheck[]
  timelineContinuity: TimelineContinuityCheck[]
  violations: ContinuityViolation[]
  suggestions: ContinuitySuggestion[]
}

interface CharacterContinuityCheck {
  characterName: string
  consistencyScore: number
  voiceConsistency: number
  arcProgression: number
  relationshipConsistency: number
  issues: string[]
}

export class SeriesManager {
  private supabase = createClient()

  async createSeries(options: SeriesCreationOptions): Promise<SeriesFacts> {
    try {
      // Create series record in database
      const { data: series, error: seriesError } = await (this.supabase as any)
        .from('series')
        .insert({
          name: options.name,
          planned_books: options.plannedBooks,
          universe_id: options.universeId,
          description: options.description || '',
          genre: options.genre || '',
          target_audience: options.targetAudience || '',
          themes: options.themes || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single() as { data: { id: string, series_id: string } | null, error: Error | null }

      if (seriesError || !series) {
        throw new Error(`Failed to create series: ${seriesError?.message}`)
      }

      // Create series-level fact hierarchy
      const seriesFacts = await this.initializeSeriesFacts({
        ...options,
        seriesId: series.id
      })

      // Cache with series-level TTL
      await claudeCache.cacheHierarchicalFacts(
        options.universeId,
        seriesFacts as any,
        'series'
      )

      return seriesFacts
    } catch (error) {
      console.error('Failed to create series:', error)
      throw new Error('Series creation failed')
    }
  }

  async trackCrossBookContinuity(bookId: string, characterArcs: Array<{
    character: string
    development: string
    relationships: string[]
    status: string
  }>): Promise<ContinuityAnalysis> {
    try {
      // Get series information for the book
      const { data: book, error: bookError } = await this.supabase
        .from('stories')
        .select('series_id, book_number, title')
        .eq('id', bookId)
        .single() as { data: { series_id: string, book_number: number, title: string } | null, error: Error | null }

      if (bookError || !book?.series_id) {
        throw new Error('Book not found or not part of a series')
      }

      // Ensure character development consistency across books
      const consistencyAnalysis = await this.analyzeSeriesContinuity(
        book.series_id,
        bookId,
        characterArcs
      )

      // Store continuity analysis results
      await this.storeContinuityAnalysis(bookId, consistencyAnalysis)

      return consistencyAnalysis
    } catch (error) {
      console.error('Cross-book continuity tracking failed:', error)
      throw new Error('Failed to track cross-book continuity')
    }
  }

  async getSeriesContinuityReport(seriesId: string): Promise<ContinuityAnalysis> {
    try {
      // Get all books in the series
      const { data: books, error: booksError } = await this.supabase
        .from('stories')
        .select('id, title, book_number')
        .eq('series_id', seriesId)
        .order('book_number', { ascending: true })

      if (booksError) {
        throw new Error(`Failed to get series books: ${booksError.message}`)
      }

      if (!books || books.length === 0) {
        throw new Error('No books found in series')
      }

      // Analyze continuity across all books
      const overallContinuity = await this.analyzeOverallSeriesContinuity(seriesId, books)

      return overallContinuity
    } catch (error) {
      console.error('Failed to generate series continuity report:', error)
      throw new Error('Failed to generate continuity report')
    }
  }

  async updateCharacterAcrossSeries(seriesId: string, characterName: string, updates: Partial<SeriesCharacter>) {
    try {
      // Get current character data
      const characterData = await this.getSeriesCharacter(seriesId, characterName)

      if (!characterData) {
        throw new Error(`Character ${characterName} not found in series`)
      }

      // Update character with new information
      const updatedCharacter = { ...characterData, ...updates }

      // Validate continuity with existing character arc
      const continuityCheck = await this.validateCharacterUpdate(seriesId, characterName, updatedCharacter)

      if (!continuityCheck.isValid) {
        throw new Error(`Character update violates continuity: ${continuityCheck.violations.join(', ')}`)
      }

      // Store updated character information
      await this.storeSeriesCharacter(seriesId, updatedCharacter)

      // Update cached series facts
      await this.updateSeriesCache(seriesId)

      return {
        character: updatedCharacter,
        continuityCheck
      }
    } catch (error) {
      console.error('Failed to update character across series:', error)
      throw error
    }
  }

  async generateSeriesBible(seriesId: string) {
    try {
      const seriesFacts = await this.getSeriesFacts(seriesId)

      if (!seriesFacts) {
        throw new Error('Series facts not found')
      }

      const bible = await claudeService.generateContent({
        prompt: this.buildSeriesBiblePrompt(seriesFacts),
        operation: 'series_bible_generation',
        context: { seriesId, seriesFacts }
      })

      // Store the generated bible
      await this.storeSeriesBible(seriesId, bible)

      return bible
    } catch (error) {
      console.error('Failed to generate series bible:', error)
      throw new Error('Series bible generation failed')
    }
  }

  private async initializeSeriesFacts(options: SeriesCreationOptions & { seriesId: string }): Promise<SeriesFacts> {
    try {
      // Get universe information
      const universe = await this.getUniverseData(options.universeId)

      // Generate initial series structure using Claude
      const result = await claudeService.generateContent({
        prompt: this.buildSeriesInitializationPrompt(options, universe),
        operation: 'series_initialization'
      })

      // Parse the result with type guard
      const seriesStructure = 'content' in result ? JSON.parse(result.content) : result

      const seriesFacts: SeriesFacts = {
        seriesId: options.seriesId,
        name: options.name,
        universe: universe || this.createDefaultUniverse(options.universeId),
        characterDatabase: seriesStructure.characterDatabase || this.createEmptyCharacterDatabase(),
        plotStructure: seriesStructure.plotStructure || this.createDefaultPlotStructure(options.plannedBooks),
        continuityRules: seriesStructure.continuityRules || this.createDefaultContinuityRules(),
        timelineStructure: seriesStructure.timelineStructure || this.createDefaultTimeline(),
        worldState: seriesStructure.worldState || this.createDefaultWorldState()
      }

      return seriesFacts
    } catch (error) {
      console.error('Failed to initialize series facts:', error)
      throw new Error('Series facts initialization failed')
    }
  }

  private async analyzeSeriesContinuity(
    seriesId: string,
    bookId: string,
    characterArcs: Array<{
      character: string
      development: string
      relationships: string[]
      status: string
    }>
  ): Promise<ContinuityAnalysis> {
    try {
      // Get series facts and previous books
      const seriesFacts = await this.getSeriesFacts(seriesId)
      const previousBooks = await this.getPreviousBooks(seriesId, bookId)

      // Analyze continuity using Claude
      const analysis = await claudeService.generateContent({
        prompt: this.buildContinuityAnalysisPrompt(seriesFacts!, previousBooks, characterArcs),
        operation: 'series_continuity_analysis',
        context: { seriesId, bookId, characterArcs }
      })

      return analysis as unknown as ContinuityAnalysis
    } catch (error) {
      console.error('Series continuity analysis failed:', error)
      throw new Error('Continuity analysis failed')
    }
  }

  private async analyzeOverallSeriesContinuity(seriesId: string, books: Array<{
    id: string
    title: string
    book_number: number
  }>): Promise<ContinuityAnalysis> {
    try {
      // Get series facts
      const seriesFacts = await this.getSeriesFacts(seriesId)

      // Get all continuity analyses for books
      const bookAnalyses = await Promise.all(
        books.map(book => this.getContinuityAnalysis(book.id))
      )

      // Generate overall analysis
      const overallAnalysis = await claudeService.generateContent({
        prompt: this.buildOverallContinuityPrompt(seriesFacts!, books, bookAnalyses),
        operation: 'overall_series_continuity',
        context: { seriesId, books, bookAnalyses }
      })

      return overallAnalysis as unknown as ContinuityAnalysis
    } catch (error) {
      console.error('Overall series continuity analysis failed:', error)
      throw new Error('Overall continuity analysis failed')
    }
  }

  private buildSeriesInitializationPrompt(options: SeriesCreationOptions & { seriesId: string }, universe: SeriesUniverse | null): string {
    return `
You are an expert series planner and continuity manager. Initialize a comprehensive series structure for a ${options.plannedBooks}-book series.

**Series Information:**
- Name: ${options.name}
- Planned Books: ${options.plannedBooks}
- Genre: ${options.genre || 'Not specified'}
- Themes: ${options.themes?.join(', ') || 'Not specified'}
- Description: ${options.description || 'Not provided'}

**Universe Context:**
${JSON.stringify(universe, null, 2)}

**Create a comprehensive series structure including:**

1. **Character Database**
   - Main characters with complete development arcs across ${options.plannedBooks} books
   - Supporting character roles and appearances
   - Character relationship networks
   - Voice patterns and consistency markers

2. **Plot Structure**
   - Overall series arc with clear beginning, middle, and end
   - Individual book arcs that contribute to the overall story
   - Subplot threads that span multiple books
   - Cliffhangers and book-to-book connections
   - Foreshadowing elements

3. **Continuity Rules**
   - Character development consistency requirements
   - World-building consistency rules
   - Timeline and aging consistency
   - Magic/technology system consistency

4. **Timeline Structure**
   - Series timeline with major events
   - Character aging and development milestones
   - World events that affect the story

5. **World State**
   - How the world changes throughout the series
   - Political, social, and environmental evolution
   - Technology or magic system progression

**Output Format:** Valid JSON matching the SeriesFacts interface.
    `.trim()
  }

  private buildContinuityAnalysisPrompt(seriesFacts: SeriesFacts, previousBooks: Array<{
    id: string
    title: string
    book_number: number
    character_arcs?: unknown
  }>, characterArcs: Array<{
    character: string
    development: string
    relationships: string[]
    status: string
  }>): string {
    return `
You are a series continuity expert. Analyze the character arcs and story elements for continuity violations across books in a series.

**Series Facts:**
${JSON.stringify(seriesFacts, null, 2)}

**Previous Books:**
${JSON.stringify(previousBooks, null, 2)}

**Current Book Character Arcs:**
${JSON.stringify(characterArcs, null, 2)}

**Analysis Requirements:**
1. Check character voice and personality consistency
2. Verify character relationship progression
3. Validate character development arc progression
4. Check for timeline inconsistencies
5. Verify world state consistency
6. Identify any continuity violations
7. Provide specific suggestions for fixes

**Output Format:** Valid JSON matching the ContinuityAnalysis interface.
    `.trim()
  }

  private buildSeriesBiblePrompt(seriesFacts: SeriesFacts): string {
    return `
Create a comprehensive series bible based on the established facts and continuity rules.

**Series Facts:**
${JSON.stringify(seriesFacts, null, 2)}

**Bible should include:**
1. Complete character profiles and development arcs
2. World-building guide with rules and consistency requirements
3. Timeline and chronology
4. Plot structure and major story beats
5. Continuity guidelines for writers
6. Voice and tone guidelines
7. Series-specific terminology and concepts

**Format:** Structured markdown document suitable for reference by writers and editors.
    `.trim()
  }

  private buildOverallContinuityPrompt(
    seriesFacts: SeriesFacts,
    books: Array<{ id: string; title: string; book_number: number }>,
    bookAnalyses: (ContinuityAnalysis | null)[]
  ): string {
    return `
Analyze the overall continuity of the series across all books.

**Series Facts:**
${JSON.stringify(seriesFacts, null, 2)}

**Books in Series:**
${books.map((b, i) => `Book ${b.book_number}: ${b.title}`).join('\n')}

**Individual Book Analyses:**
${bookAnalyses.map((analysis, i) => `
Book ${books[i]?.book_number} (${books[i]?.title}):
${analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available'}
`).join('\n')}

**Analysis Requirements:**
1. Identify cross-book continuity issues
2. Check character development consistency
3. Verify timeline coherence
4. Assess world-building consistency
5. Evaluate plot thread resolution
6. Provide recommendations for improvements

**Output Format:**
{
  "overallContinuityScore": number (0-100),
  "crossBookIssues": string[],
  "characterConsistency": string[],
  "timelineIssues": string[],
  "worldBuildingIssues": string[],
  "plotThreadStatus": string[],
  "recommendations": string[]
}
    `.trim()
  }

  // Helper methods for database operations and default structures
  private async getSeriesFacts(seriesId: string): Promise<SeriesFacts | null> {
    try {
      const cached = await claudeCache.getOptimizedFactContext(seriesId)
      if (cached) {
        return cached as unknown as SeriesFacts
      }

      const { data, error } = await this.supabase
        .from('series_facts')
        .select('facts_data')
        .eq('series_id', seriesId)
        .single() as { data: { facts_data: string } | null, error: Error | null }

      if (error || !data) {
        return null
      }

      return JSON.parse(data.facts_data)
    } catch (error) {
      console.error('Failed to get series facts:', error)
      return null
    }
  }

  private async storeSeriesFacts(seriesId: string, facts: SeriesFacts): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from('series_facts')
        .upsert({
          series_id: seriesId,
          facts_data: JSON.stringify(facts),
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Failed to store series facts:', error)
      throw new Error('Failed to store series facts')
    }
  }

  private createDefaultUniverse(universeId: string): SeriesUniverse {
    return {
      id: universeId,
      name: 'Default Universe',
      rules: [],
      technology: { level: 'medieval', description: 'Standard medieval technology' },
      geography: [],
      cultures: [],
      history: []
    }
  }

  private createEmptyCharacterDatabase(): SeriesCharacterDatabase {
    return {
      mainCharacters: [],
      supportingCharacters: [],
      characterRelationships: [],
      arcTemplates: []
    }
  }

  private createDefaultPlotStructure(plannedBooks: number): SeriesPlotStructure {
    return {
      overallArc: {
        title: 'Series Arc',
        description: 'Main series storyline',
        stages: []
      },
      bookArcs: Array.from({ length: plannedBooks }, (_, i) => ({
        bookNumber: i + 1,
        title: `Book ${i + 1} Arc`,
        description: `Storyline for book ${i + 1}`,
        stages: []
      })),
      subplots: [],
      plotThreads: [],
      cliffhangers: [],
      foreshadowing: []
    }
  }

  private createDefaultContinuityRules(): ContinuityRule[] {
    return [
      {
        id: 'character-voice',
        type: 'character',
        description: 'Character voice patterns must remain consistent',
        enforcement: 'strict',
        exceptions: ['character development moments'],
        validationCriteria: ['speech patterns', 'vocabulary', 'tone']
      },
      {
        id: 'timeline',
        type: 'timeline',
        description: 'Timeline and character ages must be consistent',
        enforcement: 'strict',
        exceptions: [],
        validationCriteria: ['chronology', 'character ages', 'event sequence']
      }
    ]
  }

  private createDefaultTimeline(): SeriesTimeline {
    return {
      startDate: 'Series Start',
      endDate: 'Series End',
      timeSpan: 'Variable',
      majorEvents: [],
      characterAges: {},
      worldEvents: []
    }
  }

  private createDefaultWorldState(): SeriesWorldState {
    return {
      political: 'Stable',
      social: 'Normal',
      economic: 'Functioning',
      environmental: 'Unchanged',
      magical: 'Consistent',
      technological: 'Static'
    }
  }

  // Additional helper methods would be implemented here for database operations
  private async getUniverseData(universeId: string): Promise<SeriesUniverse | null> {
    // Implementation for getting universe data
    return null
  }

  private async getPreviousBooks(seriesId: string, currentBookId: string): Promise<Array<{
    id: string
    title: string
    book_number: number
    character_arcs?: unknown
  }>> {
    // Implementation for getting previous books in series
    return []
  }

  private async getContinuityAnalysis(bookId: string): Promise<ContinuityAnalysis | null> {
    // Implementation for getting stored continuity analysis
    return null
  }

  private async storeContinuityAnalysis(bookId: string, analysis: ContinuityAnalysis): Promise<void> {
    // Implementation for storing continuity analysis
  }

  private async storeSeriesBible(seriesId: string, bible: { content: string; metadata?: Record<string, unknown> }): Promise<void> {
    // Implementation for storing series bible
  }

  private async getSeriesCharacter(seriesId: string, characterName: string): Promise<SeriesCharacter | null> {
    // Implementation for getting series character
    return null
  }

  private async storeSeriesCharacter(seriesId: string, character: SeriesCharacter): Promise<void> {
    // Implementation for storing series character
  }

  private async validateCharacterUpdate(seriesId: string, characterName: string, character: SeriesCharacter): Promise<{
    isValid: boolean
    violations: string[]
    suggestions?: string[]
  }> {
    // Implementation for validating character updates
    return { isValid: true, violations: [] }
  }

  private async updateSeriesCache(seriesId: string): Promise<void> {
    // Implementation for updating series cache
  }
}

// Additional interfaces for completeness
interface UniverseRule {
  id: string
  type: string
  description: string
}

interface MagicSystem {
  name: string
  rules: string[]
  limitations: string[]
}

interface TechnologyLevel {
  level: string
  description: string
}

interface GeographicElement {
  name: string
  type: string
  description: string
}

interface Culture {
  name: string
  description: string
  traits: string[]
}

interface HistoricalEvent {
  name: string
  date: string
  description: string
}

interface VoicePattern {
  speechPatterns: string[]
  vocabulary: string
  tone: string
}

interface CharacterStatus {
  alive: boolean
  location: string
  condition: string
}

interface CharacterRelationship {
  character1: string
  character2: string
  type: string
  description: string
}

interface CharacterArcTemplate {
  name: string
  stages: string[]
  milestones: string[]
}

interface PlotArc {
  title: string
  description: string
  stages: string[]
}

interface BookArc {
  bookNumber: number
  title: string
  description: string
  stages: string[]
}

interface Subplot {
  name: string
  description: string
  books: number[]
}

interface PlotThread {
  name: string
  description: string
  events: string[]
}

interface Cliffhanger {
  bookNumber: number
  description: string
  resolution: string
}

interface ForeshadowingElement {
  element: string
  introduction: string
  payoff: string
}

interface TimelineEvent {
  name: string
  date: string
  description: string
}

interface AgeProgression {
  character: string
  startAge: number
  currentAge: number
}

interface WorldEvent {
  name: string
  date: string
  impact: string
}

interface PlotContinuityCheck {
  element: string
  consistencyScore: number
  issues: string[]
}

interface WorldContinuityCheck {
  element: string
  consistencyScore: number
  issues: string[]
}

interface TimelineContinuityCheck {
  event: string
  consistencyScore: number
  issues: string[]
}

interface ContinuityViolation {
  type: string
  description: string
  severity: string
  suggestion: string
}

interface ContinuitySuggestion {
  area: string
  suggestion: string
  priority: string
}

interface SeriesWorldState {
  political: string
  social: string
  economic: string
  environmental: string
  magical: string
  technological: string
}

// Export singleton instance
export const seriesManager = new SeriesManager()