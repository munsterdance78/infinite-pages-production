import type { ChoiceOptimizedContext, ChoiceComplexity, ChoiceMade, ChoiceConsequence } from './choice-types'
import type { ContextLevel } from '@/lib/claude/adaptive-context'

export class ChoicePromptBuilder {
  static buildFoundationPrompt(params: {
    title: string
    genre: string
    premise: string
    choiceComplexity: 'simple' | 'moderate' | 'complex'
    targetEndingCount: number
    estimatedLength: number
  }): string {
    const { title, genre, premise, choiceComplexity, targetEndingCount, estimatedLength } = params

    const complexityGuidance = {
      'simple': 'Focus on binary choices with clear consequences. Each choice should lead to distinctly different but manageable paths.',
      'moderate': 'Include 2-4 choices per decision point. Allow for some path reconvergence while maintaining meaningful differences.',
      'complex': 'Create intricate choice webs with 3-5 options per point. Include conditional choices based on previous decisions.'
    }

    return `Create a comprehensive choice book foundation for an interactive "${genre}" story:

PREMISE: "${premise}"
CHOICE COMPLEXITY: ${choiceComplexity}
TARGET ENDINGS: ${targetEndingCount}
ESTIMATED LENGTH: ${estimatedLength} chapters

COMPLEXITY GUIDANCE: ${complexityGuidance[choiceComplexity]}

Return structured JSON with:
{
  "title": "${title}",
  "genre": "${genre}",
  "premise": "${premise}",
  "mainCharacters": [
    {
      "name": "Character Name",
      "role": "protagonist/deuteragonist/antagonist/supporting",
      "description": "Character background and personality",
      "motivation": "Primary driving force",
      "arc": "Character development across choices",
      "choiceInfluence": "How this character affects/is affected by reader choices"
    }
  ],
  "setting": {
    "time": "Time period/era",
    "place": "Primary locations",
    "atmosphere": "Mood and tone",
    "worldbuilding": "World rules and unique aspects"
  },
  "choiceStructure": {
    "complexity": "${choiceComplexity}",
    "branchingStyle": "how choices branch and reconverge",
    "consequenceDepth": "how far choices affect the story",
    "endingTypes": ["possible ending categories"]
  },
  "plotStructure": {
    "opening": "Story setup and first choice",
    "majorChoicePoints": ["key decision moments"],
    "pathDivergence": "where stories split significantly",
    "reconvergence": "where paths come back together",
    "endingApproaches": ["how different endings are reached"]
  },
  "themes": ["Primary themes explored through choices"],
  "chapterOutline": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "What happens in this chapter",
      "choicePoint": {
        "description": "The decision readers must make",
        "options": ["brief description of each choice"],
        "consequences": "What each choice leads toward"
      },
      "pathWeight": "linear/branching/reconverging"
    }
  ],
  "endingOutline": [
    {
      "id": "ending_1",
      "type": "happy/tragic/bittersweet/mysterious",
      "requirements": ["choices or paths needed"],
      "description": "Brief ending description",
      "rarity": "common/uncommon/rare/secret"
    }
  ]
}

Focus on meaningful choices that affect character development, plot progression, and multiple satisfying endings.`
  }

  static buildChapterWithChoicesPrompt(params: {
    context: ChoiceOptimizedContext
    chapterNumber: number
    previousChoices: ChoiceMade[]
    targetChoiceCount: number
    branchingStrategy: 'conservative' | 'moderate' | 'aggressive'
    contextLevel: ContextLevel
  }): string {
    const { context, chapterNumber, previousChoices, targetChoiceCount, branchingStrategy } = params

    const strategyGuidance = {
      'conservative': 'Choices should have clear, predictable outcomes. Avoid major plot divergence.',
      'moderate': 'Balance familiar and surprising consequences. Allow moderate path divergence.',
      'aggressive': 'Include unexpected consequences and major plot branches. High narrative risk/reward.'
    }

    const choiceHistorySummary = previousChoices.length > 0
      ? `Previous choices made: ${previousChoices.map(c => `"${c.choice_text}" (${c.chapter_context})`).join(', ')}`
      : 'This is the beginning of the reader\'s journey.'

    const pendingConsequences = context.choice_context?.consequences_pending || []
    const consequencesSummary = pendingConsequences.length > 0
      ? `Pending consequences to address: ${pendingConsequences.map(c => c.description).join(', ')}`
      : 'No pending consequences to resolve.'

    return `Generate Chapter ${chapterNumber} with choices for an interactive story.

STORY CONTEXT:
Title: ${(context as { story?: { title?: string; genre?: string }; optimized_summary?: string }).story?.title}
Genre: ${(context as { story?: { title?: string; genre?: string }; optimized_summary?: string }).story?.genre}
Current situation: ${(context as { story?: { title?: string; genre?: string }; optimized_summary?: string }).optimized_summary}

CHARACTER STATUS:
${(context as { key_characters?: Array<{ name: string; current_state?: string }> }).key_characters?.map(char => `${char.name}: ${char.current_state || 'Active in story'}`).join('\n') || 'No specific character states tracked.'}

CHOICE HISTORY:
${choiceHistorySummary}

CONSEQUENCES:
${consequencesSummary}

BRANCHING STRATEGY: ${branchingStrategy}
GUIDANCE: ${strategyGuidance[branchingStrategy]}

TARGET CHOICE COUNT: ${targetChoiceCount}

Return structured JSON:
{
  "chapter": {
    "title": "Chapter ${chapterNumber} Title",
    "content": "Full chapter content (800-1200 words)",
    "summary": "Brief chapter summary",
    "wordCount": 1000,
    "choice_points": [
      {
        "id": "cp_${chapterNumber}_1",
        "position": "end",
        "setup": "The situation requiring a decision",
        "question": "What should the protagonist do?"
      }
    ]
  },
  "choices": [
    {
      "id": "choice_${chapterNumber}_1",
      "text": "Action choice text",
      "description": "Explanation of this choice",
      "consequences": [
        {
          "type": "immediate/delayed/ending_modifier",
          "description": "What this choice leads to",
          "magnitude": "minor/moderate/major"
        }
      ],
      "character_impacts": [
        {
          "character_name": "Character affected",
          "relationship_change": 0,
          "trust_change": 0
        }
      ],
      "emotional_tone": "positive/negative/neutral/mysterious",
      "difficulty_level": "easy/moderate/hard"
    }
  ]
}

IMPORTANT:
- Chapter content should be engaging and advance the plot
- Choices should feel meaningful and have clear personality/moral implications
- Consider character relationships and how choices affect them
- Build toward eventual endings while maintaining story momentum
- Each choice should offer a genuinely different path forward`
  }

  static buildChoiceValidationPrompt(params: {
    chapterContent: string
    choices: Array<{ [key: string]: unknown }>
    storyContext: { [key: string]: unknown }
  }): string {
    const { chapterContent, choices, storyContext } = params

    return `Validate the following chapter and choices for narrative quality and consistency:

STORY CONTEXT:
${JSON.stringify(storyContext, null, 2)}

CHAPTER CONTENT:
${chapterContent}

CHOICES:
${JSON.stringify(choices, null, 2)}

Analyze and return JSON:
{
  "validation": {
    "is_valid": true/false,
    "quality_score": 0-100,
    "errors": ["Critical issues that must be fixed"],
    "warnings": ["Issues that should be addressed"],
    "suggestions": ["Ways to improve the chapter/choices"]
  },
  "narrative_analysis": {
    "pacing": "too_slow/good/too_fast",
    "character_consistency": "poor/fair/good/excellent",
    "choice_meaningfulness": "low/medium/high",
    "consequence_clarity": "unclear/somewhat_clear/very_clear"
  },
  "choice_analysis": {
    "choice_variety": "limited/adequate/good/excellent",
    "difficulty_balance": "too_easy/balanced/too_hard",
    "emotional_range": "narrow/adequate/broad",
    "plot_impact": "minimal/moderate/significant"
  },
  "recommendations": ["Specific suggestions for improvement"]
}`
  }

  static buildConsequenceResolutionPrompt(params: {
    pendingConsequences: Array<{ [key: string]: unknown }>
    currentContext: { [key: string]: unknown }
    chapterNumber: number
  }): string {
    const { pendingConsequences, currentContext, chapterNumber } = params

    return `Resolve pending consequences in Chapter ${chapterNumber}:

CURRENT CONTEXT:
${JSON.stringify(currentContext, null, 2)}

PENDING CONSEQUENCES:
${JSON.stringify(pendingConsequences, null, 2)}

Generate consequence resolution content:
{
  "resolutions": [
    {
      "consequence_id": "original consequence ID",
      "resolution_type": "positive/negative/mixed/unexpected",
      "description": "How this consequence manifests",
      "narrative_integration": "How to weave this into the chapter",
      "character_reactions": ["How characters respond"],
      "plot_impact": "What this means for the story going forward"
    }
  ],
  "new_story_elements": [
    "New plot threads or character developments arising from resolutions"
  ],
  "emotional_beats": [
    "Key emotional moments created by consequence resolution"
  ]
}

Focus on natural, satisfying resolutions that enhance rather than interrupt the narrative flow.`
  }

  static buildEndingGenerationPrompt(params: {
    storyContext: { [key: string]: unknown }
    choicePath: ChoiceMade[]
    endingType: string
    endingRequirements: Array<{ [key: string]: unknown }>
  }): string {
    const { storyContext, choicePath, endingType, endingRequirements } = params

    const pathSummary = choicePath.map(choice =>
      `"${choice.choice_text}" → ${choice.chapter_context}`
    ).join(' → ')

    return `Generate a satisfying ${endingType} ending based on the reader's choice path:

STORY CONTEXT:
${JSON.stringify(storyContext, null, 2)}

CHOICE PATH:
${pathSummary}

ENDING REQUIREMENTS:
${JSON.stringify(endingRequirements, null, 2)}

Generate ending content:
{
  "ending": {
    "title": "Ending chapter title",
    "content": "Full ending content (1000-1500 words)",
    "type": "${endingType}",
    "resolution_quality": "satisfying/bittersweet/open",
    "character_fates": [
      {
        "character_name": "Character",
        "final_state": "What happens to them",
        "resolution": "How their arc concludes"
      }
    ],
    "theme_resolution": "How main themes are resolved",
    "loose_ends": ["Any intentionally unresolved elements"],
    "emotional_payoff": "The feeling readers should have"
  },
  "epilogue_suggestions": [
    "Optional epilogue content ideas"
  ],
  "replay_hooks": [
    "Elements that encourage trying different choice paths"
  ]
}

Ensure the ending feels earned based on the choices made and provides appropriate closure for this specific path through the story.`
  }
}

export class ChoiceContextEnhancer {
  static enhanceContextForChoices(
    baseContext: { [key: string]: unknown },
    previousChoices: ChoiceMade[],
    complexity: ChoiceComplexity
  ): ChoiceOptimizedContext {
    const characterRelationships = this.calculateCharacterRelationships(previousChoices)
    const pendingConsequences = this.identifyPendingConsequences(previousChoices)
    const endingProximity = this.calculateEndingProximity(previousChoices, complexity)

    return {
      ...baseContext,
      choice_context: {
        previous_choices: previousChoices,
        available_paths: this.calculateAvailablePaths(previousChoices),
        character_relationships: characterRelationships,
        consequences_pending: pendingConsequences,
        ending_proximity: endingProximity
      },
      branching_complexity: {
        choice_count: complexity.choiceCount,
        path_divergence: this.determinePathDivergence(previousChoices),
        narrative_weight: this.calculateNarrativeWeight(endingProximity)
      }
    }
  }

  private static calculateCharacterRelationships(choices: ChoiceMade[]): Record<string, number> {
    const relationships: Record<string, number> = {}

    choices.forEach(choice => {
      // Extract character impacts from choice context if available
      // This would be enhanced based on actual choice data structure
    })

    return relationships
  }

  private static identifyPendingConsequences(choices: ChoiceMade[]): ChoiceConsequence[] {
    // Analyze choices to identify consequences that haven't been resolved yet
    return choices
      .filter(choice => {
        // Logic to determine if choice has unresolved consequences
        return true // Placeholder
      })
      .map(choice => ({
        type: 'delayed' as const,
        description: `Consequence from: ${choice.choice_text}`,
        magnitude: 'moderate' as const
      }))
  }

  private static calculateEndingProximity(choices: ChoiceMade[], complexity: ChoiceComplexity): number {
    // Calculate how close we are to an ending (0-1 scale)
    const expectedLength = (complexity as { estimatedChapterCount?: number }).estimatedChapterCount || 10
    const currentProgress = choices.length
    return Math.min(currentProgress / expectedLength, 1)
  }

  private static calculateAvailablePaths(choices: ChoiceMade[]): string[] {
    // Determine which narrative paths are still available
    return ['default_path'] // Placeholder
  }

  private static determinePathDivergence(choices: ChoiceMade[]): 'linear' | 'branching' | 'reconverging' | 'complex' {
    // Analyze choice pattern to determine current path type
    if (choices.length < 2) return 'linear'
    return 'branching' // Placeholder logic
  }

  private static calculateNarrativeWeight(endingProximity: number): 'light' | 'moderate' | 'heavy' | 'climactic' {
    if (endingProximity > 0.8) return 'climactic'
    if (endingProximity > 0.6) return 'heavy'
    if (endingProximity > 0.3) return 'moderate'
    return 'light'
  }
}