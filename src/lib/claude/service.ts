import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CLAUDE_PRICING,
  calculateCost,
  ERROR_MESSAGES,
  CONTENT_LIMITS,
  MODERATION_PATTERNS,
  INJECTION_PATTERNS
} from '@/lib/constants'
import { claudeCache } from './cache'
import { analyticsService } from './analytics'
import { promptTemplateManager } from './prompts'
import { contextOptimizer, type OptimizedContext } from './context-optimizer'
import { SFSLProcessor } from './sfsl-schema'

// Interface for Claude API errors
interface ClaudeAPIError {
  status?: number
  message?: string
}

// Constants for new fact-based features
const FACT_EXTRACTION_SYSTEM_PROMPT = 'You are a professional story analyst specializing in extracting structured facts from narrative content. Your task is to identify and organize story elements into precise, compressed facts while maintaining all essential information.'

const STORY_BIBLE_COMPLIANCE_PROMPT = 'You are a story consistency expert. Analyze the provided content against the established story facts and identify any inconsistencies, plot holes, or character voice deviations.'

// Enhanced Claude service with better error handling and features
export class ClaudeService {
  private anthropic: Anthropic | null = null
  private defaultModel: string

  constructor() {
    this.defaultModel = CLAUDE_PRICING.MODEL
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      if (!process.env['ANTHROPIC_API_KEY']) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required')
      }

      this.anthropic = new Anthropic({
        apiKey: process.env['ANTHROPIC_API_KEY']
      })
    }
    return this.anthropic
  }

  /**
   * Generate content with Claude using enhanced error handling and retry logic
   */
  async generateContent({
    prompt,
    model = this.defaultModel,
    maxTokens = 4000,
    temperature = 0.7,
    systemPrompt,
    retries = 3,
    useCache = true,
    userId,
    operation = 'general',
    trackAnalytics = true,
    context
  }: {
    prompt: string
    model?: string | undefined
    maxTokens?: number | undefined
    temperature?: number | undefined
    systemPrompt?: string | undefined
    retries?: number | undefined
    useCache?: boolean | undefined
    userId?: string | undefined
    operation?: string | undefined
    trackAnalytics?: boolean | undefined
    context?: Record<string, unknown> | undefined
  }) {
    // Validate input
    this.validateInput(prompt)
    
    // Check for prompt injection
    if (this.detectPromptInjection(prompt)) {
      throw new Error('Potential prompt injection detected')
    }

    // Check cache first if enabled
    if (useCache) {
      const cacheKey = claudeCache.getCachedResponse(prompt, {
        operation,
        cacheOptions: {
          model,
          maxTokens,
          temperature,
          ...(systemPrompt !== undefined && { systemPrompt })
        }
      })
      
      if (cacheKey) {
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: cacheKey.usage.inputTokens,
            outputTokens: cacheKey.usage.outputTokens,
            cost: cacheKey.cost,
            responseTime: 0,
            success: true,
            cached: true
          })
        }
        return cacheKey
      }
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'user' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ]

    let lastError: unknown
    const startTime = Date.now()
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.getAnthropic().messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages
        })

        const content = response.content[0]?.type === 'text' 
          ? response.content[0].text 
          : ''

        const usage = response.usage
        const cost = calculateCost(usage.input_tokens, usage.output_tokens)
        const responseTime = Date.now() - startTime

        // Moderate content for safety
        const moderationResult = await this.moderateContent(content)
        if (!moderationResult.isValid) {
          throw new Error(`Content moderation failed: ${moderationResult.reason}`)
        }

        const result = {
          content,
          usage: {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens
          },
          cost,
          model: response.model,
          attempt,
          responseTime
        }

        // Cache the result if enabled
        if (useCache) {
          claudeCache.cacheResponse(prompt, {
            content,
            usage: result.usage,
            model
          }, {
            ...(operation !== undefined && { operation }),
            ...(userId !== undefined && { userId }),
            cacheOptions: {
              model,
              maxTokens,
              temperature,
              ...(systemPrompt !== undefined && { systemPrompt })
            }
          })
        }

        // Track analytics
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            cost,
            responseTime,
            success: true,
            cached: false
          })
        }

        return result
      } catch (error: unknown) {
        lastError = error
        
        // Track failed analytics
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            responseTime: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            cached: false
          })
        }
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw this.handleClaudeError(error)
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw this.handleClaudeError(lastError)
  }

  /**
   * Generate story foundation with structured prompt
   */
  async generateStoryFoundation({
    title,
    genre,
    premise
  }: {
    title?: string | undefined
    genre: string
    premise: string
  }) {
    const systemPrompt = 'You are a professional story architect and creative writing expert. Your task is to create comprehensive, engaging story foundations that serve as blueprints for complete novels. Focus on creating compelling characters, well-structured plots, and rich thematic elements.'

    const prompt = `Create a comprehensive story foundation for a ${genre} story with this premise: "${premise}".

Please provide a structured JSON response with the following elements:
{
  "title": "${title || 'Untitled Story'}",
  "genre": "${genre}",
  "premise": "${premise}",
  "mainCharacters": [
    {
      "name": "Character Name",
      "role": "protagonist/antagonist/supporting",
      "description": "Detailed character description including appearance, personality, background",
      "motivation": "What drives this character",
      "arc": "How this character will change throughout the story"
    }
  ],
  "setting": {
    "time": "When the story takes place (specific era, season, etc.)",
    "place": "Where the story takes place (specific locations)",
    "atmosphere": "Mood and tone of the setting",
    "worldbuilding": "Unique aspects of this world"
  },
  "plotStructure": {
    "incitingIncident": "What kicks off the story",
    "risingAction": "Key conflicts and complications that build tension",
    "climax": "The story's turning point and highest tension",
    "fallingAction": "How tensions begin to resolve",
    "resolution": "How conflicts are ultimately resolved"
  },
  "themes": ["Primary themes and messages of the story"],
  "tone": "Overall tone and style (e.g., dark and gritty, light and humorous, etc.)",
  "targetAudience": "Who this story is intended for",
  "chapterOutline": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "What happens in this chapter",
      "purpose": "How this chapter serves the overall story",
      "keyEvents": ["Important events that occur"],
      "characterDevelopment": "How characters grow or change"
    }
  ]
}

Make this foundation comprehensive, engaging, and detailed. This will serve as the blueprint for writing a complete novel.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
    })
  }

  /**
   * Generate a chapter with optimized context (70% token reduction)
   */
  async generateChapter({
    storyContext,
    chapterNumber,
    previousChapters,
    targetWordCount = 2000,
    chapterPlan,
    useOptimizedContext = true
  }: {
    storyContext: string | Record<string, unknown>
    chapterNumber: number
    previousChapters: Array<{ number: number; content: string; summary: string }>
    targetWordCount?: number
    chapterPlan?: {
      purpose: string
      keyEvents: string[]
      [key: string]: unknown
    }
    useOptimizedContext?: boolean
  }) {
    const systemPrompt = 'You are a professional novelist and creative writing expert. Your task is to write compelling, well-crafted chapters that advance the story while maintaining consistency with established characters, plot, and themes. Focus on engaging dialogue, vivid descriptions, and meaningful character development.'

    let prompt: string
    let tokenAnalysis: {
      before_optimization: number
      after_optimization: number
      compression_ratio: number
      cost_savings_usd: number
    } | null = null

    if (useOptimizedContext && typeof storyContext === 'object') {
      // Use optimized context approach for 70% token reduction
      const optimizedContext = contextOptimizer.selectRelevantContext(
        chapterPlan || { purpose: 'advance story', keyEvents: [] },
        {
          ...storyContext,
          previousChapters
        }
      )

      // Calculate token savings
      const originalContextStr = `Story: ${JSON.stringify(storyContext)}\nPrevious: ${previousChapters.map(ch => `Ch${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}`).join('\n')}`
      tokenAnalysis = contextOptimizer.analyzeTokenReduction(originalContextStr, optimizedContext)

      prompt = this.buildOptimizedChapterPrompt(optimizedContext, chapterNumber, targetWordCount)
    } else {
      // Fallback to original verbose approach
      const previousContext = previousChapters.length > 0
        ? `Previous Chapters Context:\n${previousChapters.map(ch =>
            `Chapter ${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}...`
          ).join('\n\n')}`
        : 'This is the first chapter.'

      prompt = `Write Chapter ${chapterNumber} for this story:

${typeof storyContext === 'string' ? storyContext : JSON.stringify(storyContext)}

${previousContext}

Please write a complete chapter that:
- Is approximately ${targetWordCount} words
- Maintains consistency with the story foundation and previous chapters
- Flows naturally from previous chapters (if any)
- Advances the plot meaningfully
- Includes engaging dialogue and vivid descriptions
- Develops characters in meaningful ways
- Ends with appropriate tension or resolution for this point in the story
- Uses proper pacing for this stage of the story

Return the response as JSON:
{
  "title": "Chapter ${chapterNumber} title",
  "content": "The full chapter content",
  "summary": "Brief summary of what happens in this chapter",
  "wordCount": number_of_words,
  "keyEvents": ["Important events that occur in this chapter"],
  "characterDevelopment": "How characters grow or change in this chapter",
  "foreshadowing": "Any hints or foreshadowing for future events"
}

Make this chapter compelling, well-written, and integral to the overall story.`
    }

    const result = await this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 6000,
      operation: 'chapter_generation'
    })

    // Add token optimization analytics
    if (tokenAnalysis) {
      (result as Record<string, unknown>)['optimization'] = {
        tokensSaved: tokenAnalysis.before_optimization - tokenAnalysis.after_optimization,
        compressionRatio: tokenAnalysis.compression_ratio,
        costSavings: tokenAnalysis.cost_savings_usd,
        optimizedContext: useOptimizedContext
      }
    }

    return result
  }

  /**
   * Build optimized prompt using fact-based context
   */
  private buildOptimizedChapterPrompt(context: OptimizedContext, chapterNumber: number, targetWordCount: number): string {
    const { core_facts, active_characters, recent_events, chapter_goals } = context

    return `STORY CORE:
Genre: ${core_facts.genre} | Setting: ${core_facts.setting.location} (${core_facts.setting.atmosphere})
Protagonist: ${core_facts.protagonist} | Conflict: ${core_facts.central_conflict}
Current: ${core_facts.setting.current_condition} | Features: ${core_facts.setting.key_features.join(', ')}

CHAPTER ${chapterNumber} - ${chapter_goals.primary_goal}:

ACTIVE CHARACTERS:
${active_characters.map(c => `${c.name}: wants ${c.current_goal}, ${c.key_trait}, feeling ${c.current_emotion}`).join('\n')}

RECENT EVENTS:
${recent_events.map(e => `Ch${e.number}: ${e.key_event} → ${e.consequences}`).join(' | ')}

GOALS:
1. ${chapter_goals.primary_goal}
2. ${chapter_goals.secondary_goal}
3. Advance: ${chapter_goals.plot_advancement}

Write ${targetWordCount} words. Focus on ACTION and DIALOGUE. Show don't tell.

Return as JSON:
{
  "title": "Chapter ${chapterNumber} title",
  "content": "The full chapter content",
  "summary": "Brief summary of what happens in this chapter",
  "wordCount": number_of_words,
  "keyEvents": ["Important events that occur in this chapter"],
  "characterDevelopment": "How characters grow or change in this chapter",
  "foreshadowing": "Any hints or foreshadowing for future events"
}`
  }

  /**
   * Improve existing content with specific feedback
   */
  async improveContent({
    content,
    feedback,
    improvementType = 'general'
  }: {
    content: string
    feedback: string
    improvementType?: 'general' | 'dialogue' | 'description' | 'pacing' | 'character' | undefined
  }) {
    const systemPrompt = 'You are a professional editor and writing coach. Your task is to improve existing content based on specific feedback while maintaining the author\'s voice and style. Focus on enhancing clarity, engagement, and overall quality.'

    const prompt = `Please improve the following content based on the feedback provided:

CONTENT TO IMPROVE:
${content}

FEEDBACK:
${feedback}

IMPROVEMENT TYPE: ${improvementType}

Return the improved content as JSON:
{
  "improvedContent": "The enhanced version of the content",
  "changes": ["List of specific changes made"],
  "reasoning": "Explanation of why these improvements were made",
  "wordCount": number_of_words,
  "improvementAreas": ["Areas that were specifically addressed"]
}

Focus on making meaningful improvements that enhance the overall quality while preserving the original intent and voice.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
    })
  }

  /**
   * Analyze content for various metrics and suggestions
   */
  async analyzeContent(content: string) {
    const systemPrompt = 'You are a professional literary analyst and writing coach. Your task is to analyze content and provide detailed insights about writing quality, structure, and potential improvements.'

    const prompt = `Analyze the following content and provide a comprehensive assessment:

CONTENT:
${content}

Return your analysis as JSON:
{
  "overallQuality": "excellent|good|fair|needs_work",
  "wordCount": number_of_words,
  "readabilityScore": "score out of 100",
  "strengths": ["What the content does well"],
  "areasForImprovement": ["Areas that could be enhanced"],
  "writingStyle": {
    "tone": "Overall tone detected",
    "pacing": "Assessment of pacing",
    "dialogue": "Quality of dialogue (if present)",
    "description": "Quality of descriptions"
  },
  "suggestions": ["Specific actionable suggestions for improvement"],
  "targetAudience": "Who this content would appeal to",
  "genreAlignment": "How well it fits typical genre conventions"
}

Provide honest, constructive feedback that will help improve the writing quality.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 2000
    })
  }

  /**
   * Content moderation for safety
   */
  private async moderateContent(content: string): Promise<{ isValid: boolean; reason?: string }> {
    // Check against moderation patterns
    for (const { pattern, reason } of MODERATION_PATTERNS) {
      if (pattern.test(content)) {
        return { isValid: false, reason }
      }
    }

    // Additional AI-powered moderation could be added here
    return { isValid: true }
  }

  /**
   * Detect potential prompt injection attempts
   */
  private detectPromptInjection(prompt: string): boolean {
    return INJECTION_PATTERNS.some(pattern => pattern.test(prompt))
  }

  /**
   * Validate input parameters
   */
  private validateInput(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty')
    }

    if (prompt.length > CONTENT_LIMITS.MAX_CONTENT_LENGTH) {
      throw new Error(`Prompt exceeds maximum length of ${CONTENT_LIMITS.MAX_CONTENT_LENGTH} characters`)
    }
  }

  /**
   * Handle Claude API errors with appropriate responses
   */
  private handleClaudeError(error: unknown) {
    console.error('Claude API error:', error)

    const apiError = error as ClaudeAPIError

    if (apiError.status === 429) {
      return new Error('Rate limit exceeded. Please wait a moment before trying again.')
    }

    if (apiError.status === 401) {
      return new Error('API authentication failed. Please contact support.')
    }

    if (apiError.status === 400) {
      return new Error('Invalid request. Please check your input and try again.')
    }

    if (apiError.status && apiError.status >= 500) {
      return new Error('Claude service is temporarily unavailable. Please try again later.')
    }

    return new Error(apiError.message || 'An unexpected error occurred with Claude.')
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    const nonRetryableStatuses = [400, 401, 403, 422]
    const apiError = error as ClaudeAPIError
    return apiError.status !== undefined && nonRetryableStatuses.includes(apiError.status)
  }

  /**
   * Generate content using a prompt template
   */
  async generateWithTemplate(
    templateId: string,
    variables: Array<{ name: string; value: string | number | boolean | string[] }>,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      userId?: string
      useCache?: boolean
      trackAnalytics?: boolean
    } = {}
  ) {
    const template = promptTemplateManager.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const prompt = promptTemplateManager.renderTemplate(templateId, variables)
    
    return this.generateContent({
      prompt,
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      userId: options.userId,
      operation: template.category,
      useCache: options.useCache,
      trackAnalytics: options.trackAnalytics
    })
  }

  /**
   * Batch generate content using multiple prompts
   */
  async batchGenerate(
    prompts: Array<{
      id: string
      prompt: string
      model?: string
      maxTokens?: number
      temperature?: number
      userId?: string
      operation?: string
    }>,
    options: {
      maxConcurrency?: number
      useCache?: boolean
      trackAnalytics?: boolean
    } = {}
  ) {
    const { batchProcessor } = await import('./batch')
    
    const operations = prompts.map(prompt => ({
      id: prompt.id,
      type: (prompt.operation || 'general') as 'story_foundation' | 'chapter_generation' | 'content_improvement' | 'content_analysis' | 'general',
      params: {
        prompt: prompt.prompt,
        model: prompt.model,
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature
      },
      userId: prompt.userId
    }))

    batchProcessor.addOperations(operations)
    return await batchProcessor.processBatch()
  }

  /**
   * Get analytics data
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }) {
    return await analyticsService.getAnalytics(timeRange)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return claudeCache.getStats()
  }

  /**
   * Clear cache
   */
  clearCache() {
    claudeCache.clear()
  }

  /**
   * Get prompt templates
   */
  getPromptTemplates(category?: string) {
    if (category) {
      return promptTemplateManager.getTemplatesByCategory(category)
    }
    return promptTemplateManager.getAllTemplates()
  }

  /**
   * Search prompt templates
   */
  searchPromptTemplates(query: string) {
    return promptTemplateManager.searchTemplates(query)
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance and cost' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable, highest cost' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest, most cost-effective' }
    ]
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const cacheStats = this.getCacheStats()
    const analytics = await this.getAnalytics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    })

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
        hitRate: 0 // Would need to track this separately
      },
      analytics: {
        totalRequests: analytics.totalRequests,
        successRate: analytics.successRate,
        averageResponseTime: analytics.averageResponseTime
      },
      models: this.getAvailableModels()
    }
  }

  // NEW: Fact extraction using existing infrastructure
  async extractAndCompressFacts({
    content,
    storyContext,
    factType = 'chapter'
  }: {
    content: string
    storyContext: Record<string, unknown>
    factType: 'universe' | 'series' | 'book' | 'chapter'
  }) {
    // Use existing generateContent() infrastructure
    const response = await this.generateContent({
      prompt: this.buildFactExtractionPrompt(content, storyContext, factType),
      systemPrompt: FACT_EXTRACTION_SYSTEM_PROMPT,
      operation: 'fact_extraction',
      useCache: true,
      trackAnalytics: true,
      userId: typeof storyContext['userId'] === 'string' ? storyContext['userId'] : undefined
    })

    // Process using new SFSL system
    const sfslProcessor = new SFSLProcessor()
    const facts = this.parseExtractedFacts(response.content)
    const compressed = sfslProcessor.compressFacts(facts)

    return {
      facts,
      compressed,
      compressionRatio: content.length / compressed.length,
      cost: response.cost,
      usage: response.usage
    }
  }

  // NEW: Generate with fact-based context
  async generateWithFactContext({
    storyId,
    chapterGoals,
    factHierarchy
  }: {
    storyId: string
    chapterGoals: {
      number: number
      targetWordCount?: number
      [key: string]: unknown
    }
    factHierarchy: Record<string, unknown>
  }) {
    // Use existing generateChapter with enhanced context
    const optimizedContext = contextOptimizer.selectRelevantFactContext(
      {
        purpose: chapterGoals['purpose'],
        keyEvents: chapterGoals['keyEvents'],
        plotAdvancement: chapterGoals['plotAdvancement']
      } as Parameters<typeof contextOptimizer.selectRelevantFactContext>[0],
      factHierarchy
    )

    return this.generateChapter({
      storyContext: optimizedContext as unknown as Record<string, unknown>,
      chapterNumber: chapterGoals.number,
      useOptimizedContext: true,
      targetWordCount: chapterGoals.targetWordCount || 2000,
      previousChapters: [],
      chapterPlan: {
        ...chapterGoals,
        purpose: (typeof chapterGoals['purpose'] === 'string' ? chapterGoals['purpose'] : undefined) || 'Advance the story',
        keyEvents: Array.isArray(chapterGoals['keyEvents']) ? chapterGoals['keyEvents'] : []
      }
    })
  }

  // NEW: Story bible compliance checking
  async analyzeStoryConsistency(storyId: string, newContent: string) {
    const storyFacts = await this.getStoredFacts(storyId)

    return this.generateContent({
      prompt: this.buildConsistencyAnalysisPrompt(newContent, storyFacts),
      systemPrompt: STORY_BIBLE_COMPLIANCE_PROMPT,
      operation: 'story_consistency_analysis',
      useCache: true
    })
  }

  // NEW: Enhanced content improvement with fact awareness
  async enhanceWithFactContext(content: string, storyFacts: Record<string, unknown>, feedback: string) {
    return this.improveContent({
      content,
      feedback: `${feedback}\n\nStory Context: ${JSON.stringify(storyFacts)}`,
      improvementType: 'general'
    })
  }

  // Helper methods for new functionality
  private buildFactExtractionPrompt(content: string, storyContext: Record<string, unknown>, factType: string): string {
    return `Extract structured facts from this ${factType} content:

CONTENT:
${content}

STORY CONTEXT:
${JSON.stringify(storyContext)}

Extract facts in these categories:
- Characters: names, traits, goals, relationships, voice patterns
- World: settings, rules, limitations, unique aspects
- Plot: threads, stakes, progression, consequences
- Timeline: events, impacts, character effects

Return as structured JSON with precise, compressed facts.`
  }

  private parseExtractedFacts(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content)
    } catch (e) {
      // Fallback parsing for non-JSON responses
      return {
        characters: this.extractCharacterFacts(content),
        world: this.extractWorldFacts(content),
        plot: this.extractPlotFacts(content),
        timeline: this.extractTimelineFacts(content)
      }
    }
  }

  private buildConsistencyAnalysisPrompt(newContent: string, storyFacts: Record<string, unknown>): string {
    return `Analyze this new content for consistency with established story facts:

NEW CONTENT:
${newContent}

ESTABLISHED STORY FACTS:
${JSON.stringify(storyFacts)}

Check for:
1. Character voice consistency
2. World-building rule violations
3. Timeline inconsistencies
4. Plot contradictions
5. Relationship/motivation conflicts

Return detailed analysis with specific issues and suggestions.`
  }

  /**
   * Extract structured facts from chapter content
   */
  async extractChapterFacts({
    chapterContent,
    storyId,
    chapterId,
    userId
  }: {
    chapterContent: string
    storyId: string
    chapterId: string
    userId?: string
  }) {
    const systemPrompt = FACT_EXTRACTION_SYSTEM_PROMPT

    const prompt = `Extract structured facts from this chapter content for story consistency tracking.

CHAPTER CONTENT:
${chapterContent}

Return a JSON object with the following structure:
{
  "characters": [
    {
      "name": "Character full name",
      "traits": ["personality trait 1", "personality trait 2"],
      "description": "Physical appearance and key characteristics",
      "relationships": ["relationship to other character"],
      "goals": "What this character wants",
      "voicePattern": "How this character speaks (formal/casual/etc)"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Detailed description of the place",
      "atmosphere": "Mood and feeling of the location",
      "features": ["key feature 1", "key feature 2"]
    }
  ],
  "plotEvents": [
    {
      "event": "What happened",
      "significance": "Why this matters to the story",
      "consequences": "What this leads to",
      "involvedCharacters": ["character 1", "character 2"]
    }
  ],
  "worldRules": [
    {
      "rule": "A specific rule or limitation in this world",
      "category": "magic/technology/social/physical",
      "implications": "How this affects the story"
    }
  ]
}

Extract only facts that are explicitly stated or clearly implied. Be precise and concise.`

    let response
    try {
      response = await this.generateContent({
        prompt,
        systemPrompt,
        maxTokens: 3000,
        operation: 'fact_extraction',
        userId,
        trackAnalytics: true
      })
    } catch (error) {
      console.error('Claude API error during fact extraction:', error)
      throw new Error('Failed to extract facts from chapter content')
    }

    // Parse JSON response with error handling
    let parsedData: {
      characters?: Array<{
        name: string
        traits?: string[]
        description?: string
        relationships?: string[]
        goals?: string
        voicePattern?: string
      }>
      locations?: Array<{
        name: string
        description?: string
        atmosphere?: string
        features?: string[]
      }>
      plotEvents?: Array<{
        event: string
        significance?: string
        consequences?: string
        involvedCharacters?: string[]
      }>
      worldRules?: Array<{
        rule: string
        category?: string
        implications?: string
      }>
    }

    try {
      parsedData = JSON.parse(response.content)
    } catch (parseError) {
      console.warn('Failed to parse fact extraction response as JSON, attempting fallback parsing')

      // Fallback: try to extract JSON from response if it's wrapped in text
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
        } catch (e) {
          console.error('Fallback JSON parsing also failed')
          throw new Error('Could not parse fact extraction response')
        }
      } else {
        throw new Error('No valid JSON found in fact extraction response')
      }
    }

    // Transform parsed data into flat array of fact objects
    const facts: Array<{
      story_id: string
      chapter_id: string
      fact_type: 'character' | 'location' | 'plot_event' | 'world_rule'
      entity_name: string
      fact_data: Record<string, unknown>
      source_text: string
      confidence: number
      extraction_model: string
      extraction_cost_usd: number
    }> = []

    // Process characters
    if (parsedData.characters && Array.isArray(parsedData.characters)) {
      for (const char of parsedData.characters) {
        if (char.name) {
          facts.push({
            story_id: storyId,
            chapter_id: chapterId,
            fact_type: 'character',
            entity_name: char.name,
            fact_data: {
              traits: char.traits || [],
              description: char.description || '',
              relationships: char.relationships || [],
              goals: char.goals || '',
              voicePattern: char.voicePattern || ''
            },
            source_text: chapterContent.substring(0, 500),
            confidence: 0.9,
            extraction_model: response.model || this.defaultModel,
            extraction_cost_usd: response.cost || 0
          })
        }
      }
    }

    // Process locations
    if (parsedData.locations && Array.isArray(parsedData.locations)) {
      for (const loc of parsedData.locations) {
        if (loc.name) {
          facts.push({
            story_id: storyId,
            chapter_id: chapterId,
            fact_type: 'location',
            entity_name: loc.name,
            fact_data: {
              description: loc.description || '',
              atmosphere: loc.atmosphere || '',
              features: loc.features || []
            },
            source_text: chapterContent.substring(0, 500),
            confidence: 0.9,
            extraction_model: response.model || this.defaultModel,
            extraction_cost_usd: response.cost || 0
          })
        }
      }
    }

    // Process plot events
    if (parsedData.plotEvents && Array.isArray(parsedData.plotEvents)) {
      for (const event of parsedData.plotEvents) {
        if (event.event) {
          facts.push({
            story_id: storyId,
            chapter_id: chapterId,
            fact_type: 'plot_event',
            entity_name: event.event.substring(0, 255),
            fact_data: {
              significance: event.significance || '',
              consequences: event.consequences || '',
              involvedCharacters: event.involvedCharacters || []
            },
            source_text: chapterContent.substring(0, 500),
            confidence: 0.85,
            extraction_model: response.model || this.defaultModel,
            extraction_cost_usd: response.cost || 0
          })
        }
      }
    }

    // Process world rules
    if (parsedData.worldRules && Array.isArray(parsedData.worldRules)) {
      for (const rule of parsedData.worldRules) {
        if (rule.rule) {
          facts.push({
            story_id: storyId,
            chapter_id: chapterId,
            fact_type: 'world_rule',
            entity_name: rule.rule.substring(0, 255),
            fact_data: {
              category: rule.category || 'general',
              implications: rule.implications || ''
            },
            source_text: chapterContent.substring(0, 500),
            confidence: 0.95,
            extraction_model: response.model || this.defaultModel,
            extraction_cost_usd: response.cost || 0
          })
        }
      }
    }

    return {
      facts,
      extractionCost: response.cost || 0,
      tokensUsed: response.usage?.totalTokens || 0,
      model: response.model || this.defaultModel
    }
  }

  /**
   * Get stored facts for a story from database
   */
  async getStoredFactsForStory(
    storyId: string,
    supabase: SupabaseClient
  ): Promise<Array<{
    id: string
    story_id: string
    chapter_id: string | null
    fact_type: string
    entity_name: string | null
    fact_data: Record<string, unknown>
    confidence: number
    extraction_model: string | null
    extraction_cost_usd: number
    extracted_at: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('story_facts')
        .select('*')
        .eq('story_id', storyId)
        .order('extracted_at', { ascending: false })

      if (error) {
        console.error('Database error fetching story facts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching story facts:', error)
      return []
    }
  }

  /**
   * Save extracted facts to database
   */
  async saveExtractedFacts(
    facts: Array<{
      story_id: string
      chapter_id: string
      fact_type: 'character' | 'location' | 'plot_event' | 'world_rule'
      entity_name: string
      fact_data: Record<string, unknown>
      source_text: string
      confidence: number
      extraction_model: string
      extraction_cost_usd: number
    }>,
    supabase: SupabaseClient
  ): Promise<{ saved: number; failed: number }> {
    let saved = 0
    let failed = 0

    for (const fact of facts) {
      try {
        const { error } = await supabase
          .from('story_facts')
          .upsert(
            {
              story_id: fact.story_id,
              chapter_id: fact.chapter_id,
              fact_type: fact.fact_type,
              entity_name: fact.entity_name,
              fact_data: fact.fact_data,
              source_text: fact.source_text,
              confidence: fact.confidence,
              extraction_model: fact.extraction_model,
              extraction_cost_usd: fact.extraction_cost_usd
            },
            {
              onConflict: 'story_id,fact_type,entity_name',
              ignoreDuplicates: false
            }
          )

        if (error) {
          console.error('Error saving fact:', error, fact)
          failed++
        } else {
          saved++
        }
      } catch (error) {
        console.error('Unexpected error saving fact:', error, fact)
        failed++
      }
    }

    return { saved, failed }
  }

  private async getStoredFacts(storyId: string): Promise<Record<string, unknown>> {
    // This would typically fetch from database
    // For now, return empty structure
    return {
      characters: {},
      world: {},
      plot: {},
      timeline: {}
    }
  }

  private extractCharacterFacts(content: string): { names: string[] } {
    // Simple extraction logic - could be enhanced
    const names = content.match(/([A-Z][a-z]+)/g) || []
    return { names: Array.from(new Set(names)) }
  }

  private extractWorldFacts(content: string): { locations: string[] } {
    const locations = content.match(/(?:in|at|near)\s+([A-Z][a-z\s]+)/g) || []
    return { locations }
  }

  private extractPlotFacts(content: string): { key_events: string[] } {
    const events = content.split(/[.!?]+/).filter(s => s.length > 20).slice(0, 3)
    return { key_events: events }
  }

  private extractTimelineFacts(content: string): { markers: string[] } {
    const timeMarkers = content.match(/(?:after|before|during|when)\s+([^.]+)/gi) || []
    return { markers: timeMarkers }
  }
}

// Export singleton instance
export const claudeService = new ClaudeService()
