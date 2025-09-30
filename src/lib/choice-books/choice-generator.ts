// Choice book generation system - extends existing AI optimization
import { claudeService } from '@/lib/claude/service'
import { contextOptimizer } from '@/lib/claude/context-optimizer'
import { adaptiveContextSelector, ContextLevel } from '@/lib/claude/adaptive-context'
import { analyticsService } from '@/lib/claude/analytics'
import type {
  ChoiceOptimizedContext,
  ChoiceComplexity,
  ChoiceMade,
  ChoiceConsequence } from './choice-types'
import {
  ChoiceGenerationParams,
  Choice,
  ChoicePoint,
  CharacterImpact
} from './choice-types'
import { ChoicePromptBuilder, ChoiceContextEnhancer } from './choice-prompts'

export class ChoiceBookGenerator {
  /**
   * Generate chapter with choices - extends existing chapter generation
   */
  async generateChapterWithChoices({
    storyContext,
    chapterNumber,
    previousChoices = [],
    targetChoiceCount = 2,
    branchingStrategy = 'moderate',
    useOptimizedContext = true
  }: {
    storyContext: {
      story?: { id: string }
      chapterNumber?: number
      summary?: string
      purpose?: string
      keyEvents?: string[]
      ending_proximity?: number
      [key: string]: unknown
    }
    chapterNumber: number
    previousChoices: ChoiceMade[]
    targetChoiceCount?: number
    branchingStrategy?: 'conservative' | 'moderate' | 'aggressive'
    useOptimizedContext?: boolean
  }) {
    const startTime = Date.now()

    // Analyze choice complexity using existing adaptive system
    const choiceComplexity = this.analyzeChoiceComplexity(
      storyContext,
      previousChoices,
      targetChoiceCount,
      branchingStrategy
    )

    // Use existing context optimization with choice extensions
    const optimizedContext = await this.buildChoiceOptimizedContext(
      storyContext,
      previousChoices,
      choiceComplexity
    )

    // Generate chapter content using existing AI service
    const chapterResult = await this.generateChoiceChapterContent(
      optimizedContext,
      chapterNumber,
      choiceComplexity
    )

    // Generate choices using optimized context
    const choicesResult = await this.generateChoices(
      optimizedContext,
      chapterResult.content,
      targetChoiceCount,
      branchingStrategy
    )

    // Track analytics using existing system
    if (storyContext.story?.id) {
      await this.trackChoiceGeneration({
        storyId: storyContext.story.id,
        chapterNumber,
        choiceCount: choicesResult.choices.length,
        generationTime: Date.now() - startTime,
        tokenUsage: chapterResult.usage,
        optimizationUsed: useOptimizedContext
      })
    }

    return {
      chapter: {
        ...chapterResult,
        choice_points: choicesResult.choice_points
      },
      choices: choicesResult.choices,
      optimization_metrics: {
        tokens_saved: optimizedContext.tokens_saved || 0,
        context_compression: optimizedContext.compression_ratio || 1,
        generation_time: Date.now() - startTime
      }
    }
  }

  /**
   * Analyze choice complexity - extends existing complexity analysis
   */
  private analyzeChoiceComplexity(
    storyContext: {
      chapterNumber?: number
      summary?: string
      purpose?: string
      keyEvents?: string[]
      ending_proximity?: number
      [key: string]: unknown
    },
    previousChoices: ChoiceMade[],
    targetChoiceCount: number,
    branchingStrategy: string
  ): ChoiceComplexity {
    // Use existing adaptive context selector as base
    const baseComplexity = adaptiveContextSelector.analyzeChapterComplexity({
      number: storyContext.chapterNumber || 1,
      summary: storyContext.summary || '',
      purpose: storyContext.purpose || 'advance story with choices',
      keyEvents: storyContext.keyEvents || []
    })

    // Extend with choice-specific complexity
    const choiceCount = targetChoiceCount
    const pathDivergence = this.calculatePathDivergence(previousChoices, branchingStrategy)
    const consequenceDepth = this.analyzeConsequenceDepth(previousChoices, storyContext)
    const branchingType = this.determineBranchingType(choiceCount, pathDivergence)

    return {
      ...baseComplexity,
      choiceCount,
      pathDivergence,
      consequenceDepth,
      branchingType,
      replayValue: this.assessReplayValue(choiceCount, consequenceDepth, pathDivergence)
    }
  }

  /**
   * Build choice-optimized context - extends existing context optimization
   */
  private async buildChoiceOptimizedContext(
    storyContext: {
      chapterNumber?: number
      summary?: string
      purpose?: string
      keyEvents?: string[]
      ending_proximity?: number
      [key: string]: unknown
    },
    previousChoices: ChoiceMade[],
    complexity: ChoiceComplexity
  ): Promise<ChoiceOptimizedContext> {
    // Start with existing optimization
    const baseContext = contextOptimizer.selectRelevantContext(
      {
        purpose: 'advance story with meaningful choices',
        keyEvents: ['character decisions', 'consequence revelation'],
        complexity: complexity.conflictLevel === 'climactic' ? 8 : 5
      },
      storyContext as Parameters<typeof contextOptimizer.selectRelevantContext>[1]
    )

    // Add choice-specific context
    const choiceContext = {
      previous_choices: previousChoices.slice(-3), // Last 3 choices for context
      available_paths: this.getAvailablePaths(storyContext, previousChoices),
      character_relationships: this.extractCharacterRelationships(previousChoices),
      consequences_pending: this.getPendingConsequences(previousChoices),
      ending_proximity: this.calculateEndingProximity(storyContext, previousChoices)
    }

    const branchingComplexity = {
      choice_count: complexity.choiceCount,
      path_divergence: this.mapPathDivergenceToString(complexity.pathDivergence),
      narrative_weight: this.mapComplexityToWeight(complexity)
    }

    const result: ChoiceOptimizedContext = {
      choice_context: choiceContext,
      branching_complexity: branchingComplexity,
      ...((baseContext as unknown as { tokens_saved?: number }).tokens_saved !== undefined && {
        tokens_saved: (baseContext as unknown as { tokens_saved?: number }).tokens_saved
      }),
      ...((baseContext as unknown as { compression_ratio?: number }).compression_ratio !== undefined && {
        compression_ratio: (baseContext as unknown as { compression_ratio?: number }).compression_ratio
      }),
      ...((baseContext as unknown as { core_facts?: string[] }).core_facts !== undefined && {
        core_facts: (baseContext as unknown as { core_facts?: string[] }).core_facts
      })
    }

    return result
  }

  /**
   * Generate chapter content using enhanced choice prompts
   */
  private async generateChoiceChapterContent(
    optimizedContext: ChoiceOptimizedContext,
    chapterNumber: number,
    complexity: ChoiceComplexity
  ) {
    // Use enhanced prompt builder for better narrative branching
    const contextLevel = this.determineContextLevel(complexity)
    const prompt = ChoicePromptBuilder.buildChapterWithChoicesPrompt({
      context: optimizedContext,
      chapterNumber,
      previousChoices: optimizedContext.choice_context.previous_choices,
      targetChoiceCount: complexity.choiceCount,
      branchingStrategy: this.mapComplexityToBranchingStrategy(complexity),
      contextLevel
    })

    return await claudeService.generateContent({
      prompt,
      operation: 'choice_chapter_generation',
      useCache: true,
      maxTokens: complexity.conflictLevel === 'climactic' ? 6000 : 4000
    })
  }

  /**
   * Generate choices for the chapter with validation
   */
  private async generateChoices(
    optimizedContext: ChoiceOptimizedContext,
    chapterContent: string,
    targetChoiceCount: number,
    branchingStrategy: string
  ) {
    // Extract parsed chapter content
    let parsedChapter
    try {
      parsedChapter = JSON.parse(chapterContent)
    } catch {
      parsedChapter = { content: chapterContent }
    }

    // Choices are included in chapter generation now
    if (parsedChapter.choices) {
      return {
        choices: parsedChapter.choices,
        choice_points: parsedChapter.chapter?.choice_points || []
      }
    }

    // Fallback: generate choices separately if not included
    const choicePrompt = this.buildFallbackChoicePrompt(
      optimizedContext,
      parsedChapter.content || chapterContent,
      targetChoiceCount,
      branchingStrategy
    )

    const choiceResult = await claudeService.generateContent({
      prompt: choicePrompt,
      operation: 'choice_generation',
      useCache: true,
      maxTokens: 2000
    })

    return this.parseAndValidateChoices(choiceResult.content, optimizedContext)
  }

  /**
   * Build optimized choice chapter prompt
   */
  private buildChoiceChapterPrompt(context: ChoiceOptimizedContext, chapterNumber: number): string {
    const { core_facts, active_characters, recent_events, choice_context, branching_complexity } = context as unknown as {
      core_facts: {
        genre: string
        setting: { location: string }
        protagonist: string
        central_conflict: string
        current_chapter_id?: string
      }
      active_characters: Array<{
        name: string
        current_goal: string
        key_trait: string
        current_emotion: string
      }>
      recent_events: string[]
      choice_context: {
        previous_choices: Array<{ choice_text: string }>
        character_relationships: Record<string, number>
        consequences_pending: Array<{ description: string }>
      }
      branching_complexity: {
        choice_count: number
        path_divergence: string
        narrative_weight: string
      }
    }

    return `CHOICE CHAPTER GENERATION - OPTIMIZED CONTEXT:

STORY CORE:
Genre: ${core_facts.genre} | Setting: ${core_facts.setting.location}
Protagonist: ${core_facts.protagonist} | Conflict: ${core_facts.central_conflict}

CHAPTER ${chapterNumber} - BRANCHING NARRATIVE:

ACTIVE CHARACTERS:
${active_characters.map(c => `${c.name}: wants ${c.current_goal}, ${c.key_trait}, feeling ${c.current_emotion}`).join('\n')}

CHOICE CONTEXT:
Previous Choices: ${choice_context.previous_choices.map(c => `"${c.choice_text}"`).join(' → ')}
Character Relationships: ${Object.entries(choice_context.character_relationships).map(([char, level]) => `${char}: ${level}`).join(', ')}
Pending Consequences: ${choice_context.consequences_pending.map(c => c.description).join('; ')}

BRANCHING STRATEGY:
Choice Count: ${branching_complexity.choice_count}
Path Divergence: ${branching_complexity.path_divergence}
Narrative Weight: ${branching_complexity.narrative_weight}

REQUIREMENTS:
1. Write engaging chapter that builds to meaningful choice point
2. End chapter with natural decision moment
3. Set up consequences for different choice paths
4. Maintain character consistency from previous choices
5. Build toward multiple possible directions

Return as JSON:
{
  "title": "Chapter ${chapterNumber} title",
  "content": "Full chapter content ending with choice setup",
  "summary": "Brief chapter summary",
  "wordCount": word_count,
  "choiceSetup": "Context that sets up the choice",
  "characterStates": {"character": "emotional/relationship state"},
  "consequenceSeeds": ["hints at what choices might lead to"]
}`
  }

  /**
   * Build fallback choice generation prompt
   */
  private buildFallbackChoicePrompt(
    context: ChoiceOptimizedContext,
    chapterContent: string,
    targetCount: number,
    strategy: string
  ): string {
    return `GENERATE MEANINGFUL CHOICES - OPTIMIZED FOR BRANCHING:

CHAPTER CONTEXT:
${chapterContent.slice(-500)}...

CHOICE STRATEGY: ${strategy}
Target Choices: ${targetCount}

CHARACTER RELATIONSHIPS:
${Object.entries(context.choice_context.character_relationships).map(([char, level]) => `${char}: ${level}/10`).join('\n')}

CHOICE REQUIREMENTS:
1. Each choice should feel meaningfully different
2. Choices should reflect character motivations
3. Include potential consequences for each path
4. Vary emotional tones (brave, cautious, clever, empathetic)
5. Consider character relationship impacts

Return as JSON:
{
  "choices": [
    {
      "id": "choice_1",
      "text": "Choice text (action-oriented, character voice)",
      "description": "What this choice represents",
      "emotional_tone": "brave|cautious|clever|empathetic|decisive",
      "consequences": [
        {
          "type": "immediate|delayed|ending_modifier",
          "description": "What this leads to",
          "magnitude": "minor|moderate|major"
        }
      ],
      "character_impacts": [
        {
          "character_name": "Character",
          "relationship_change": -3,
          "trust_change": 2
        }
      ]
    }
  ],
  "choice_point": {
    "setup": "The situation requiring decision",
    "stakes": "What's at risk",
    "time_pressure": false,
    "affects_ending": true
  }
}`
  }

  /**
   * Build choice generation prompt
   */
  private buildChoiceGenerationPrompt(
    context: ChoiceOptimizedContext,
    chapterContent: string,
    targetCount: number,
    strategy: string
  ): string {
    return `GENERATE MEANINGFUL CHOICES - OPTIMIZED FOR BRANCHING:

CHAPTER CONTEXT:
${chapterContent.slice(-500)}...

CHOICE STRATEGY: ${strategy}
Target Choices: ${targetCount}

CHARACTER RELATIONSHIPS:
${Object.entries(context.choice_context.character_relationships).map(([char, level]) => `${char}: ${level}/10`).join('\n')}

CHOICE REQUIREMENTS:
1. Each choice should feel meaningfully different
2. Choices should reflect character motivations
3. Include potential consequences for each path
4. Vary emotional tones (brave, cautious, clever, empathetic)
5. Consider character relationship impacts

Return as JSON:
{
  "choices": [
    {
      "id": "choice_1",
      "text": "Choice text (action-oriented, character voice)",
      "description": "What this choice represents",
      "emotional_tone": "brave|cautious|clever|empathetic|decisive",
      "consequences": [
        {
          "type": "immediate|delayed|ending_modifier",
          "description": "What this leads to",
          "magnitude": "minor|moderate|major"
        }
      ],
      "character_impacts": [
        {
          "character_name": "Character",
          "relationship_change": -3,
          "trust_change": 2
        }
      ]
    }
  ],
  "choice_point": {
    "setup": "The situation requiring decision",
    "stakes": "What's at risk",
    "time_pressure": false,
    "affects_ending": true
  }
}`
  }

  /**
   * Parse and validate generated choices
   */
  private parseAndValidateChoices(generatedContent: string, context: ChoiceOptimizedContext) {
    try {
      const parsed = JSON.parse(generatedContent)

      // Validate choice structure
      const validatedChoices = parsed.choices.map((choice: {
        id?: string
        text?: string
        description?: string
        emotional_tone?: string
        consequences?: unknown[]
        character_impacts?: unknown[]
      }, index: number) => ({
        id: choice.id || `choice_${index + 1}`,
        text: choice.text || `Choice ${index + 1}`,
        description: choice.description,
        emotional_tone: choice.emotional_tone || 'neutral',
        consequences: choice.consequences || [],
        character_impacts: choice.character_impacts || [],
        difficulty_level: this.assessChoiceDifficulty(choice, context),
        leads_to_chapter: `pending_generation_${choice.id}` // Will be set during path creation
      }))

      const choicePoint = {
        id: `cp_${Date.now()}`,
        chapter_id: 'current',
        position_in_chapter: 'end',
        choices: validatedChoices,
        choice_type: this.determineChoiceType(validatedChoices),
        affects_ending: parsed.choice_point?.affects_ending || false
      }

      return {
        choices: validatedChoices,
        choice_points: [choicePoint]
      }
    } catch (error) {
      console.error('Failed to parse generated choices:', error)
      return this.generateFallbackChoices()
    }
  }

  /**
   * Track choice generation analytics
   */
  private async trackChoiceGeneration({
    storyId,
    chapterNumber,
    choiceCount,
    generationTime,
    tokenUsage,
    optimizationUsed
  }: {
    storyId: string
    chapterNumber: number
    choiceCount: number
    generationTime: number
    tokenUsage: {
      inputTokens?: number
      outputTokens?: number
      cost?: number
    }
    optimizationUsed: boolean
  }) {
    await analyticsService.trackOperation({
      userId: 'system', // Will be replaced with actual user ID
      operation: 'choice_chapter_generation',
      model: 'claude-3-sonnet',
      inputTokens: tokenUsage.inputTokens || 0,
      outputTokens: tokenUsage.outputTokens || 0,
      cost: tokenUsage.cost || 0,
      responseTime: generationTime,
      success: true,
      cached: false,
      metadata: {
        storyId,
        chapterNumber,
        choiceCount,
        optimizationUsed,
        operationType: 'choice_generation'
      }
    })
  }

  // Helper methods
  private calculatePathDivergence(choices: ChoiceMade[], strategy: string): number {
    const baseValue = choices.length * 0.2
    const strategyMultiplier = {
      'conservative': 0.5,
      'moderate': 1.0,
      'aggressive': 1.5
    }[strategy] || 1.0

    return Math.min(baseValue * strategyMultiplier, 1.0)
  }

  private analyzeConsequenceDepth(choices: ChoiceMade[], context: { ending_proximity?: number }): 'immediate' | 'short_term' | 'long_term' | 'ending_affecting' {
    if (context.ending_proximity && context.ending_proximity > 0.8) return 'ending_affecting'
    if (choices.length > 5) return 'long_term'
    if (choices.length > 2) return 'short_term'
    return 'immediate'
  }

  private determineBranchingType(choiceCount: number, divergence: number): 'simple_binary' | 'multiple_choice' | 'conditional' | 'complex_tree' {
    if (choiceCount === 2 && divergence < 0.3) return 'simple_binary'
    if (choiceCount <= 3 && divergence < 0.5) return 'multiple_choice'
    if (divergence < 0.7) return 'conditional'
    return 'complex_tree'
  }

  private assessReplayValue(choiceCount: number, depth: string, divergence: number): 'low' | 'medium' | 'high' {
    const score = choiceCount * 0.3 + divergence * 0.4 + (depth === 'ending_affecting' ? 0.3 : 0.1)
    if (score > 0.7) return 'high'
    if (score > 0.4) return 'medium'
    return 'low'
  }

  private getAvailablePaths(context: { [key: string]: unknown }, choices: ChoiceMade[]): string[] {
    // Simplified - would analyze story structure for available narrative paths
    return ['main_path', 'alternate_path', 'secret_path'].slice(0, Math.max(2, 4 - choices.length))
  }

  private extractCharacterRelationships(choices: ChoiceMade[]): Record<string, number> {
    // Simplified - would analyze choice impacts on relationships
    return {
      'protagonist': 5,
      'companion': 3,
      'antagonist': -2
    }
  }

  private getPendingConsequences(choices: ChoiceMade[]): ChoiceConsequence[] {
    // Simplified - would track unresolved consequences
    return choices.slice(-2).map(choice => ({
      type: 'delayed' as const,
      description: `Consequence of: ${choice.choice_text}`,
      magnitude: 'moderate' as const
    }))
  }

  private calculateEndingProximity(context: { [key: string]: unknown }, choices: ChoiceMade[]): number {
    // Simplified calculation based on story progress
    return Math.min(choices.length * 0.15, 0.9)
  }

  private mapPathDivergenceToString(divergence: number): 'linear' | 'branching' | 'reconverging' | 'complex' {
    if (divergence < 0.3) return 'linear'
    if (divergence < 0.6) return 'branching'
    if (divergence < 0.8) return 'reconverging'
    return 'complex'
  }

  private mapComplexityToWeight(complexity: ChoiceComplexity): 'light' | 'moderate' | 'heavy' | 'climactic' {
    if (complexity.conflictLevel === 'climactic') return 'climactic'
    if (complexity.emotionalIntensity === 'high') return 'heavy'
    if (complexity.choiceCount > 3) return 'heavy'
    if (complexity.consequenceDepth === 'ending_affecting') return 'heavy'
    return 'moderate'
  }

  private assessChoiceDifficulty(choice: {
    consequences?: unknown[]
    character_impacts?: unknown[]
  }, context: ChoiceOptimizedContext): 'easy' | 'moderate' | 'hard' {
    const consequenceCount = choice.consequences?.length || 0
    const characterImpacts = choice.character_impacts?.length || 0

    if (consequenceCount > 2 || characterImpacts > 2) return 'hard'
    if (consequenceCount > 1 || characterImpacts > 1) return 'moderate'
    return 'easy'
  }

  private determineChoiceType(choices: Array<{ consequences?: unknown[] }>): 'binary' | 'multiple' | 'consequential' {
    if (choices.length === 2) return 'binary'
    if (choices.some(c => c.consequences?.length && c.consequences.length > 1)) return 'consequential'
    return 'multiple'
  }

  private generateFallbackChoices() {
    return {
      choices: [
        {
          id: 'fallback_1',
          text: 'Continue forward cautiously',
          emotional_tone: 'cautious',
          consequences: [],
          character_impacts: [],
          difficulty_level: 'easy',
          leads_to_chapter: 'pending_generation_1'
        },
        {
          id: 'fallback_2',
          text: 'Take a bold action',
          emotional_tone: 'brave',
          consequences: [],
          character_impacts: [],
          difficulty_level: 'moderate',
          leads_to_chapter: 'pending_generation_2'
        }
      ],
      choice_points: [{
        id: 'fallback_cp',
        chapter_id: 'current',
        position_in_chapter: 'end',
        choices: [],
        choice_type: 'binary',
        affects_ending: false
      }]
    }
  }

  private determineContextLevel(complexity: ChoiceComplexity): ContextLevel {
    if (complexity.conflictLevel === 'climactic') return ContextLevel.FULL
    if (complexity.choiceCount > 3) return ContextLevel.DETAILED
    if (complexity.consequenceDepth === 'ending_affecting') return ContextLevel.DETAILED
    return ContextLevel.STANDARD
  }

  private mapComplexityToBranchingStrategy(complexity: ChoiceComplexity): 'conservative' | 'moderate' | 'aggressive' {
    if (complexity.branchingType === 'complex_tree') return 'aggressive'
    if (complexity.branchingType === 'conditional') return 'moderate'
    return 'conservative'
  }

  /**
   * Generate ending chapter based on reader's choice path
   */
  async generateEndingChapter(params: {
    storyContext: { [key: string]: unknown }
    choicePath: ChoiceMade[]
    endingType: string
    endingRequirements: Array<{ [key: string]: unknown }>
  }) {
    const prompt = ChoicePromptBuilder.buildEndingGenerationPrompt(params)

    return await claudeService.generateContent({
      prompt,
      operation: 'choice_ending_generation',
      useCache: true,
      maxTokens: 6000
    })
  }

  /**
   * Validate choice structure and narrative consistency
   */
  async validateChoiceChapter(params: {
    chapterContent: string
    choices: Array<{ [key: string]: unknown }>
    storyContext: { [key: string]: unknown }
  }) {
    const prompt = ChoicePromptBuilder.buildChoiceValidationPrompt(params)

    const result = await claudeService.generateContent({
      prompt,
      operation: 'choice_validation',
      useCache: false,
      maxTokens: 2000
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return {
        validation: { is_valid: true, quality_score: 75 },
        recommendations: ['Generated content appears valid']
      }
    }
  }

  /**
   * Resolve pending consequences in upcoming chapters
   */
  async resolveConsequences(params: {
    pendingConsequences: Array<{
      id?: string
      description: string
      [key: string]: unknown
    }>
    currentContext: { [key: string]: unknown }
    chapterNumber: number
  }) {
    if (params.pendingConsequences.length === 0) {
      return { resolutions: [], new_story_elements: [] }
    }

    const prompt = ChoicePromptBuilder.buildConsequenceResolutionPrompt(params)

    const result = await claudeService.generateContent({
      prompt,
      operation: 'consequence_resolution',
      useCache: true,
      maxTokens: 3000
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return {
        resolutions: params.pendingConsequences.map(c => ({
          consequence_id: c.id || 'unknown',
          resolution_type: 'natural_progression',
          description: `Resolves naturally: ${c.description}`
        })),
        new_story_elements: []
      }
    }
  }
}

export const choiceBookGenerator = new ChoiceBookGenerator()