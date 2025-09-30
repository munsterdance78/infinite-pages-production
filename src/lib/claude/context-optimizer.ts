interface SettingFacts {
  location: string;           // "Neo-Tokyo_2145"
  atmosphere: string;         // "cyberpunk_neon"
  current_condition: string;  // "night_rain"
  key_features: string[];     // ["megastructures", "holo_ads"]
}

interface CharacterEssential {
  name: string;
  current_goal: string;      // What they want this chapter
  key_trait: string;         // Primary personality trait
  current_emotion: string;   // Current emotional state
  relevant_relationship: string; // Most important current relationship
}

interface CompressedChapterSummary {
  number: number;
  key_event: string;         // 1 sentence max
  character_development: string; // Who changed how
  plot_advancement: string;  // Story progress
  consequences: string;      // What this enables/blocks
}

export interface OptimizedContext {
  // Core facts (always included - ~30 tokens)
  core_facts: {
    genre: string;
    setting: SettingFacts;
    protagonist: string;
    central_conflict: string;
  };

  // Chapter-specific characters (50-150 tokens)
  active_characters: CharacterEssential[];

  // Recent events (100-200 tokens)
  recent_events: CompressedChapterSummary[];

  // Chapter goals (20-50 tokens)
  chapter_goals: {
    primary_goal: string;
    secondary_goal: string;
    plot_advancement: string;
  };
}

interface TokenUsageAnalysis {
  before_optimization: number;
  after_optimization: number;
  compression_ratio: number;
  cost_savings_usd: number;
}

interface ExtractedFacts {
  characters: CharacterEssential[];
  world: {
    locations: string[]
    conditions: string[]
    atmosphere: string
    features: string[]
  };
  plot: {
    current_thread: string
    advancement: string
    stakes: string
  };
  timeline: Array<{
    event: string
    impact: string
    affected_characters: string[]
  }>;
}

export class ContextOptimizer {
  /**
   * Convert prose setting to facts (target: 200 tokens -> 20 tokens)
   */
  compressSettingToFacts(settingDescription: string): SettingFacts {
    // Extract key facts from verbose description using patterns
    const locationMatch = settingDescription.match(/(?:in|at|located)\s+([^,.\n]+)/i)
    const atmosphereMatch = settingDescription.match(/(?:atmosphere|mood|feeling|tone).*?(?:is|:|of)\s+([^,.\n]+)/i)
    const conditionMatch = settingDescription.match(/(?:currently|now|present|today).*?(?:is|:|are)\s+([^,.\n]+)/i)

    // Extract features from descriptive text
    const features: string[] = []
    const featurePatterns = [
      /(?:features?|includes?|contains?|has)\s+([^.]+)/gi,
      /(?:notable|significant|important|key)\s+([^.]+)/gi,
      /(?:filled with|dominated by|characterized by)\s+([^.]+)/gi
    ]

    featurePatterns.forEach(pattern => {
      const matches = settingDescription.matchAll(pattern)
      for (const match of Array.from(matches)) {
        const feature = match[1]?.trim().toLowerCase()
        if (feature && feature.length < 30) {
          features.push(feature)
        }
      }
    })

    return {
      location: locationMatch?.[1]?.trim() || 'unknown_location',
      atmosphere: atmosphereMatch?.[1]?.trim() || 'neutral',
      current_condition: conditionMatch?.[1]?.trim() || 'normal',
      key_features: features.slice(0, 3) // Max 3 features
    }
  }

  /**
   * Extract only essential character info (target: 300 tokens -> 50 tokens)
   */
  extractCharacterEssentials(characters: Array<{
    name: string
    description?: string
    relationships?: Array<{ character?: string; name?: string; type: string }>
  }>, chapterPlan: {
    summary?: string
    keyEvents?: string[]
    purpose?: string
  }): CharacterEssential[] {
    const chapterCharacters = this.getChapterRelevantCharacters(characters, chapterPlan)

    return chapterCharacters.map(character => {
      // Extract primary trait from verbose description
      const traitKeywords = ['determined', 'cautious', 'bold', 'analytical', 'emotional', 'logical', 'impulsive', 'patient']
      const primaryTrait = traitKeywords.find(trait =>
        character.description?.toLowerCase().includes(trait)
      ) || 'complex'

      // Determine current goal from chapter plan
      const currentGoal = this.extractCharacterGoalFromPlan(character.name, chapterPlan)

      // Determine emotional state from recent context
      const currentEmotion = this.determineCurrentEmotion(character, chapterPlan)

      // Find most relevant relationship for this chapter
      const relevantRelationship = this.getMostRelevantRelationship(character, chapterPlan)

      return {
        name: character.name,
        current_goal: currentGoal,
        key_trait: primaryTrait,
        current_emotion: currentEmotion,
        relevant_relationship: relevantRelationship
      }
    })
  }

  /**
   * Compress previous chapters (target: 1200 tokens -> 150 tokens)
   */
  compressPreviousChapters(chapters: Array<{
    number: number
    content?: string
    summary?: string
  }>): CompressedChapterSummary[] {
    // Only use last 3 chapters for context
    const recentChapters = chapters.slice(-3)

    return recentChapters.map(chapter => {
      // Extract key event (first significant action/conflict in chapter)
      const keyEvent = this.extractKeyEvent(chapter.content || chapter.summary)

      // Extract character development (who changed how)
      const characterDevelopment = this.extractCharacterDevelopment(chapter)

      // Extract plot advancement (what moved forward)
      const plotAdvancement = this.extractPlotAdvancement(chapter)

      // Extract consequences (what this enables/blocks)
      const consequences = this.extractConsequences(chapter)

      return {
        number: chapter.number,
        key_event: keyEvent,
        character_development: characterDevelopment,
        plot_advancement: plotAdvancement,
        consequences: consequences
      }
    })
  }

  /**
   * Select only relevant context for this chapter
   */
  selectRelevantContext(chapterPlan: {
    purpose?: string
    keyEvents?: string[]
    plotAdvancement?: string
    complexity?: string | number
  }, allContext: {
    setting?: { description?: string }
    characters?: Array<{
      name: string
      description?: string
      relationships?: Array<{ character?: string; name?: string; type: string }>
    }>
    previousChapters?: Array<{
      number: number
      content?: string
      summary?: string
    }>
    genre?: string
    protagonist?: { name?: string }
    foundation?: {
      plotStructure?: { incitingIncident?: string }
      premise?: string
    }
  }): OptimizedContext {
    const setting = this.compressSettingToFacts(allContext.setting?.description || '')
    const characters = this.extractCharacterEssentials(allContext.characters || [], chapterPlan)
    const recentEvents = this.compressPreviousChapters(allContext.previousChapters || [])

    return {
      core_facts: {
        genre: allContext.genre || 'unknown',
        setting,
        protagonist: allContext.protagonist?.name || 'unnamed',
        central_conflict: this.extractCentralConflict(allContext.foundation)
      },
      active_characters: characters,
      recent_events: recentEvents,
      chapter_goals: {
        primary_goal: chapterPlan.purpose || 'advance story',
        secondary_goal: chapterPlan.keyEvents?.[0] || 'develop characters',
        plot_advancement: chapterPlan.plotAdvancement || 'continue narrative'
      }
    }
  }

  /**
   * Calculate token count using Claude's tokenization
   */
  calculateTokens(content: string): number {
    // Rough approximation: 4 characters = 1 token
    // More accurate would use @anthropic-ai/tokenizer if available
    return Math.ceil(content.length / 4)
  }

  /**
   * Analyze token usage reduction
   */
  analyzeTokenReduction(originalContext: string, optimizedContext: OptimizedContext): TokenUsageAnalysis {
    const beforeTokens = this.calculateTokens(originalContext)
    const afterTokens = this.calculateTokens(JSON.stringify(optimizedContext))
    const compressionRatio = afterTokens / beforeTokens

    // Calculate cost savings (using Claude 3 Sonnet pricing)
    const costPerToken = 0.000003 // $3 per million input tokens
    const costSavings = (beforeTokens - afterTokens) * costPerToken

    return {
      before_optimization: beforeTokens,
      after_optimization: afterTokens,
      compression_ratio: compressionRatio,
      cost_savings_usd: costSavings
    }
  }

  // Helper methods for extraction logic
  private getChapterRelevantCharacters(characters: Array<{
    name: string
    description?: string
    relationships?: Array<{ character?: string; name?: string; type: string }>
  }>, chapterPlan: {
    summary?: string
    keyEvents?: string[]
  }): Array<{
    name: string
    description?: string
    relationships?: Array<{ character?: string; name?: string; type: string }>
  }> {
    // Return characters mentioned in chapter plan or first 3 main characters
    const mentioned = characters.filter(char =>
      chapterPlan.summary?.includes(char.name) ||
      chapterPlan.keyEvents?.some((event: string) => event.includes(char.name))
    )

    return mentioned.length > 0 ? mentioned : characters.slice(0, 3)
  }

  private extractCharacterGoalFromPlan(characterName: string, chapterPlan: {
    summary?: string
    purpose?: string
  }): string {
    // Look for character-specific goals in chapter plan
    const planText = `${chapterPlan.summary || ''} ${chapterPlan.purpose || ''}`

    if (planText.includes(characterName)) {
      // Extract sentence containing character name and look for action words
      const sentences = planText.split(/[.!?]+/)
      const relevantSentence = sentences.find(s => s.includes(characterName))

      if (relevantSentence) {
        const actionWords = ['wants', 'needs', 'seeks', 'tries', 'attempts', 'hopes']
        const actionMatch = actionWords.find(action => relevantSentence.includes(action))
        if (actionMatch) {
          return relevantSentence.split(actionMatch)[1]?.trim().slice(0, 50) || 'advance plot'
        }
      }
    }

    return 'advance plot'
  }

  private determineCurrentEmotion(character: {
    name: string
    description?: string
  }, chapterPlan: {
    summary?: string
    purpose?: string
  }): string {
    const emotions = ['determined', 'anxious', 'hopeful', 'conflicted', 'angry', 'calm', 'excited', 'worried']

    // Look for emotional context in chapter plan
    const planText = `${chapterPlan.summary || ''} ${chapterPlan.purpose || ''}`.toLowerCase()
    const foundEmotion = emotions.find(emotion => planText.includes(emotion))

    return foundEmotion || 'focused'
  }

  private getMostRelevantRelationship(character: {
    relationships?: Array<{ character?: string; name?: string; type: string }>
  }, chapterPlan: {
    summary?: string
    purpose?: string
  }): string {
    // Extract other character names from chapter plan
    const planText = chapterPlan.summary || chapterPlan.purpose || ''
    const otherCharacters = character.relationships || []

    const mentionedRelationship = otherCharacters.find((rel: any) =>
      planText.includes(rel.character) || planText.includes(rel.name)
    )

    return mentionedRelationship ?
      `${mentionedRelationship.character || mentionedRelationship.name}: ${mentionedRelationship.type}` :
      'none active'
  }

  private extractKeyEvent(content: string): string {
    // Extract first significant action or conflict
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)

    // Look for action/conflict indicators
    const actionIndicators = ['suddenly', 'then', 'but', 'however', 'when', 'as', 'after']
    const actionSentence = sentences.find(sentence =>
      actionIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    )

    return actionSentence?.trim().slice(0, 100) || sentences[0]?.trim().slice(0, 100) || 'story continues'
  }

  private extractCharacterDevelopment(chapter: {
    content?: string
    summary?: string
  }): string {
    // Look for character growth indicators
    const developmentWords = ['realizes', 'learns', 'discovers', 'understands', 'changes', 'grows']
    const content = chapter.content || chapter.summary || ''

    const sentences = content.split(/[.!?]+/)
    const devSentence = sentences.find((sentence: string) =>
      developmentWords.some(word => sentence.toLowerCase().includes(word))
    )

    return devSentence?.trim().slice(0, 80) || 'continues arc'
  }

  private extractPlotAdvancement(chapter: {
    content?: string
    summary?: string
  }): string {
    // Look for plot progression
    const plotWords = ['reveals', 'leads to', 'causes', 'results in', 'advances', 'moves toward']
    const content = chapter.content || chapter.summary || ''

    const sentences = content.split(/[.!?]+/)
    const plotSentence = sentences.find((sentence: string) =>
      plotWords.some(word => sentence.toLowerCase().includes(word))
    )

    return plotSentence?.trim().slice(0, 80) || 'story progresses'
  }

  private extractConsequences(chapter: {
    content?: string
    summary?: string
  }): string {
    // Look for consequences or implications
    const consequenceWords = ['therefore', 'thus', 'as a result', 'consequently', 'this means', 'now']
    const content = chapter.content || chapter.summary || ''

    const sentences = content.split(/[.!?]+/)
    const conseqSentence = sentences.find((sentence: string) =>
      consequenceWords.some(word => sentence.toLowerCase().includes(word))
    )

    return conseqSentence?.trim().slice(0, 80) || 'sets up future events'
  }

  private extractCentralConflict(foundation?: {
    plotStructure?: { incitingIncident?: string }
    premise?: string
  }): string {
    if (!foundation) return 'internal struggle'

    const plotStructure = foundation.plotStructure
    if (plotStructure?.incitingIncident) {
      return plotStructure.incitingIncident.slice(0, 50)
    }

    return foundation.premise?.slice(0, 50) || 'character vs obstacle'
  }

  // NEW: Fact-based context selection
  selectRelevantFactContext(
    chapterGoals: {
      purpose?: string
      keyEvents?: string[]
      plotAdvancement?: string
    },
    factHierarchy: {
      universe: Record<string, unknown>
      series: Record<string, unknown>
      book: Record<string, unknown>
      chapter: Record<string, unknown>
    }
  ): OptimizedContext {
    // Build on existing compression logic
    return this.buildOptimizedContext(factHierarchy, chapterGoals)
  }

  // NEW: Extract facts instead of just compressing prose
  extractStoryFacts(content: string, existingContext: {
    characters?: Array<{
      name: string
      description?: string
      relationships?: Array<{ character?: string; name?: string; type: string }>
    }>
  }): ExtractedFacts {
    // Use existing character extraction as foundation
    const characters = this.extractCharacterEssentials(existingContext.characters || [], {})
    const world = this.extractWorldElements(content)
    const plot = this.extractPlotProgression(content)
    return { characters, world, plot, timeline: this.extractTimelineEvents(content) }
  }

  private buildOptimizedContext(factHierarchy: Record<string, unknown>, chapterGoals: {
    purpose?: string
    keyEvents?: string[]
    plotAdvancement?: string
  }): OptimizedContext {
    // Leverage existing selectRelevantContext but with fact hierarchy
    return this.selectRelevantContext(chapterGoals, factHierarchy)
  }

  private extractWorldElements(content: string): {
    locations: string[]
    conditions: string[]
    atmosphere: string
    features: string[]
  } {
    const setting = this.compressSettingToFacts(content)
    return {
      locations: [setting.location],
      conditions: [setting.current_condition],
      atmosphere: setting.atmosphere,
      features: setting.key_features
    }
  }

  private extractPlotProgression(content: string): {
    current_thread: string
    advancement: string
    stakes: string
  } {
    const keyEvent = this.extractKeyEvent(content)
    const consequences = this.extractConsequences({ content })

    return {
      current_thread: keyEvent,
      advancement: consequences,
      stakes: this.extractStakes(content)
    }
  }

  private extractTimelineEvents(content: string): Array<{
    event: string
    impact: string
    affected_characters: string[]
  }> {
    // Extract timeline markers from content
    const timeMarkers = content.match(/(?:chapter|ch\.?)\s*(\d+)|(?:after|before|during)\s+([^.]+)/gi) || []

    return timeMarkers.map(marker => ({
      event: marker.trim(),
      impact: 'moderate',
      affected_characters: this.extractCharacterNamesFromText(content)
    }))
  }

  private extractStakes(content: string): string {
    const stakeWords = ['at stake', 'risk', 'danger', 'consequence', 'lose', 'gain', 'win', 'fail']
    const sentences = content.split(/[.!?]+/)

    const stakeSentence = sentences.find(sentence =>
      stakeWords.some(word => sentence.toLowerCase().includes(word))
    )

    return stakeSentence?.trim().slice(0, 100) || 'character development'
  }

  private extractCharacterNamesFromText(content: string): string[] {
    // Simple name extraction - look for capitalized words that appear multiple times
    const words = content.split(/\s+/)
    const capitalized = words.filter(word => /^[A-Z][a-z]+$/.test(word))
    const wordCounts = capitalized.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {})

    return Object.keys(wordCounts).filter(word => (wordCounts[word] ?? 0) > 1).slice(0, 5)
  }
}

export const contextOptimizer = new ContextOptimizer()