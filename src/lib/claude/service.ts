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
    useOptimizedContext = true,
    factContext,
    chapterOutline
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
    factContext?: string
    chapterOutline?: any
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

      prompt = this.buildOptimizedChapterPrompt(optimizedContext, chapterNumber, targetWordCount, factContext, chapterOutline)
    } else {
      // Fallback to original verbose approach
      const previousContext = previousChapters.length > 0
        ? `Previous Chapters Context:\n${previousChapters.map(ch =>
            `Chapter ${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}...`
          ).join('\n\n')}`
        : 'This is the first chapter.'

      // PHASE 3: Add fact context for consistency checking
      const consistencySection = factContext ? `
⚠️ CRITICAL - MAINTAIN CONSISTENCY WITH ESTABLISHED FACTS:

${factContext}

You MUST maintain perfect consistency with these established facts. Any contradictions will break the story continuity.
` : ''

      // PHASE 4: Add story outline section
      const outlineSection = chapterOutline ? `
## CHAPTER OUTLINE - FOLLOW THIS PLAN

Purpose: ${chapterOutline.planned_purpose}
Emotional Target: ${chapterOutline.emotional_target || 'Not specified'}
Pacing: ${chapterOutline.pacing_target || 'moderate'}
Tone: ${chapterOutline.tone_guidance || 'Maintain story tone'}
${chapterOutline.stakes_level ? `Stakes Level: ${chapterOutline.stakes_level}/10` : ''}
${chapterOutline.chapter_type ? `Chapter Type: ${chapterOutline.chapter_type}` : ''}

${chapterOutline.key_events_planned && Array.isArray(chapterOutline.key_events_planned) && chapterOutline.key_events_planned.length > 0 ? `Key Events to Include:
${chapterOutline.key_events_planned.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')}` : ''}

${chapterOutline.new_characters_to_introduce && Array.isArray(chapterOutline.new_characters_to_introduce) && chapterOutline.new_characters_to_introduce.length > 0 ? `New Characters to Introduce:
${chapterOutline.new_characters_to_introduce.map((c: any) => `- ${c.name} (${c.role}): ${c.introduction_context}`).join('\n')}` : ''}

${chapterOutline.new_locations_to_introduce && Array.isArray(chapterOutline.new_locations_to_introduce) && chapterOutline.new_locations_to_introduce.length > 0 ? `New Locations to Introduce:
${chapterOutline.new_locations_to_introduce.map((l: any) => `- ${l.name}: ${l.why_visiting}`).join('\n')}` : ''}

${chapterOutline.conflicts_to_escalate && Array.isArray(chapterOutline.conflicts_to_escalate) && chapterOutline.conflicts_to_escalate.length > 0 ? `Conflicts to Escalate:
${chapterOutline.conflicts_to_escalate.map((c: any) => `- ${c.conflict_type}: ${c.how_it_escalates}`).join('\n')}` : ''}

${chapterOutline.conflicts_to_resolve && Array.isArray(chapterOutline.conflicts_to_resolve) && chapterOutline.conflicts_to_resolve.length > 0 ? `Conflicts to Resolve:
${chapterOutline.conflicts_to_resolve.map((c: any) => `- ${c.conflict_type}: ${c.resolution_approach}`).join('\n')}` : ''}

${chapterOutline.mysteries_to_deepen && Array.isArray(chapterOutline.mysteries_to_deepen) && chapterOutline.mysteries_to_deepen.length > 0 ? `Mysteries to Deepen:
${chapterOutline.mysteries_to_deepen.map((m: any) => `- ${m.mystery}: ${m.new_clue}`).join('\n')}` : ''}

${chapterOutline.mysteries_to_reveal && Array.isArray(chapterOutline.mysteries_to_reveal) && chapterOutline.mysteries_to_reveal.length > 0 ? `Mysteries to Reveal:
${chapterOutline.mysteries_to_reveal.map((m: any) => `- ${m.mystery}: ${m.what_gets_revealed}`).join('\n')}` : ''}

${chapterOutline.foreshadowing_to_plant && Array.isArray(chapterOutline.foreshadowing_to_plant) && chapterOutline.foreshadowing_to_plant.length > 0 ? `Foreshadowing to Plant:
${chapterOutline.foreshadowing_to_plant.map((f: any) => `- ${f.element} (payoff in chapter ${f.payoff_chapter})`).join('\n')}` : ''}

${chapterOutline.callbacks_to_earlier_chapters && Array.isArray(chapterOutline.callbacks_to_earlier_chapters) && chapterOutline.callbacks_to_earlier_chapters.length > 0 ? `Callbacks to Earlier Chapters:
${chapterOutline.callbacks_to_earlier_chapters.map((c: any) => `- Chapter ${c.chapter_ref}: ${c.what_to_callback}`).join('\n')}` : ''}

YOU MUST incorporate these planned elements while maintaining consistency with established facts.
` : ''

      prompt = `Write Chapter ${chapterNumber} for this story:

${typeof storyContext === 'string' ? storyContext : JSON.stringify(storyContext)}

${previousContext}
${outlineSection}
${consistencySection}
Please write a complete chapter that:
- Is approximately ${targetWordCount} words
- Maintains consistency with the story foundation and previous chapters
- ${factContext ? '**CRITICALLY IMPORTANT**: Stays 100% consistent with all established facts above' : 'Flows naturally from previous chapters (if any)'}
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
      maxTokens: 4000, // ~3,000 words for reasonable chapter length
      operation: 'chapter_generation'
    })

    // Log token usage
    const inputTokens = result.usage?.inputTokens || 0
    const outputTokens = result.usage?.outputTokens || 0
    const cost = result.cost || 0
    console.log(`[Token Usage] generateChapter: input=${inputTokens}, output=${outputTokens}, cost=$${cost.toFixed(4)}`)

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
  private buildOptimizedChapterPrompt(context: OptimizedContext, chapterNumber: number, targetWordCount: number, factContext?: string, chapterOutline?: any): string {
    const { core_facts, active_characters, recent_events, chapter_goals } = context

    // PHASE 3: Add fact consistency section if available
    const consistencySection = factContext ? `
⚠️ CRITICAL CONSISTENCY REQUIREMENTS:
${factContext}

You MUST maintain perfect consistency with these established facts.
` : ''

    // PHASE 4: Add story outline section
    const outlineSection = chapterOutline ? `
📋 CHAPTER OUTLINE - FOLLOW THIS PLAN:
Purpose: ${chapterOutline.planned_purpose}
Emotional: ${chapterOutline.emotional_target || 'Not specified'} | Pacing: ${chapterOutline.pacing_target || 'moderate'} | Tone: ${chapterOutline.tone_guidance || 'Maintain story tone'}
${chapterOutline.stakes_level ? `Stakes: ${chapterOutline.stakes_level}/10 | ` : ''}${chapterOutline.chapter_type ? `Type: ${chapterOutline.chapter_type}` : ''}

${chapterOutline.key_events_planned && Array.isArray(chapterOutline.key_events_planned) && chapterOutline.key_events_planned.length > 0 ? `Events: ${chapterOutline.key_events_planned.join(' → ')}` : ''}
${chapterOutline.new_characters_to_introduce && Array.isArray(chapterOutline.new_characters_to_introduce) && chapterOutline.new_characters_to_introduce.length > 0 ? `Introduce: ${chapterOutline.new_characters_to_introduce.map((c: any) => `${c.name} (${c.role})`).join(', ')}` : ''}
${chapterOutline.conflicts_to_escalate && Array.isArray(chapterOutline.conflicts_to_escalate) && chapterOutline.conflicts_to_escalate.length > 0 ? `Escalate: ${chapterOutline.conflicts_to_escalate.map((c: any) => c.conflict_type).join(', ')}` : ''}
${chapterOutline.mysteries_to_deepen && Array.isArray(chapterOutline.mysteries_to_deepen) && chapterOutline.mysteries_to_deepen.length > 0 ? `Deepen: ${chapterOutline.mysteries_to_deepen.map((m: any) => m.mystery).join(', ')}` : ''}

YOU MUST incorporate these elements.
` : ''

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
${outlineSection}
${consistencySection}
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
      type: (prompt.operation === 'chapter_generation' ? 'chapter' : (prompt.operation || 'general')) as 'story_foundation' | 'chapter' | 'content_improvement' | 'content_analysis' | 'general',
      params: {
        prompt: prompt.prompt,
        model: prompt.model,
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature
      },
      userId: prompt.userId
    }))

    batchProcessor.addOperations(operations as any)
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
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Balanced performance and cost' },
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
    const compressed = sfslProcessor.compressFacts(facts as any)

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
      factHierarchy as any
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
   * Get genre-specific JSON schema examples for genre_metadata field
   */
  private getGenreMetadataSchema(genre: string): {
    characters: string
    locations: string
    plot_events: string
    world_rules: string
    timeline: string
    themes: string
  } {
    const normalizedGenre = genre.toLowerCase()

    // Romance genre schemas
    if (normalizedGenre.includes('romance')) {
      return {
        characters: `"genre_metadata": {
        "relationship_stage": "enemies_to_lovers_tension",
        "heat_level": 3,
        "romantic_archetype": "brooding_hero"
      }`,
        locations: `"genre_metadata": {
        "romantic_significance": "first_kiss_location",
        "intimacy_level": "private"
      }`,
        plot_events: `"genre_metadata": {
        "relationship_stage": "first_spark_of_attraction",
        "heat_level": 2,
        "romantic_beat": "meet_cute"
      }`,
        world_rules: `"genre_metadata": {}`,
        timeline: `"genre_metadata": {}`,
        themes: `"genre_metadata": {
        "romance_tropes": ["enemies_to_lovers", "forced_proximity"],
        "emotional_tone": "longing"
      }`
      }
    }

    // Mystery genre schemas
    if (normalizedGenre.includes('mystery') || normalizedGenre.includes('thriller')) {
      return {
        characters: `"genre_metadata": {
        "suspect_level": "primary_suspect",
        "alibi_strength": "weak",
        "motive": "inheritance"
      }`,
        locations: `"genre_metadata": {
        "crime_scene": true,
        "evidence_found": ["fingerprints", "bloodstain"]
      }`,
        plot_events: `"genre_metadata": {
        "clue_importance": "major_clue",
        "red_herring": false,
        "revelation_timing": "act_2_midpoint"
      }`,
        world_rules: `"genre_metadata": {
        "clue_importance": "minor_clue",
        "investigative_technique": "forensics"
      }`,
        timeline: `"genre_metadata": {
        "time_of_crime": "22:15",
        "witness_reliability": "unreliable"
      }`,
        themes: `"genre_metadata": {
        "mystery_subgenre": "whodunit",
        "fair_play": true
      }`
      }
    }

    // Fantasy genre schemas
    if (normalizedGenre.includes('fantasy') || normalizedGenre.includes('sci-fi') || normalizedGenre.includes('science fiction')) {
      return {
        characters: `"genre_metadata": {
        "power_level": "Tier 3 Adept",
        "magical_affinity": "Crystal resonance",
        "special_abilities": ["telekinesis", "mind_reading"]
      }`,
        locations: `"genre_metadata": {
        "magic_system_notes": "Crystal veins amplify emotional resonance by 3x, requires direct contact, depletes user stamina",
        "ley_line_convergence": "major",
        "magical_saturation": "high"
      }`,
        plot_events: `"genre_metadata": {
        "power_escalation": "character_learns_new_spell",
        "magical_consequence": "stamina_depletion"
      }`,
        world_rules: `"genre_metadata": {
        "magic_system_notes": "Emotional state directly affects spell potency; anger = unstable, calm = precise. Cost scales exponentially with range.",
        "hard_magic_system": true,
        "known_by_characters": ["protagonist", "mentor"]
      }`,
        timeline: `"genre_metadata": {
        "magical_event": "lunar_eclipse",
        "prophecy_marker": true
      }`,
        themes: `"genre_metadata": {
        "fantasy_subgenre": "epic_fantasy",
        "power_dynamics": "mentor_student"
      }`
      }
    }

    // Historical genre schemas
    if (normalizedGenre.includes('historical')) {
      return {
        characters: `"genre_metadata": {
        "period_accuracy": "verified_accurate",
        "historical_figure": false,
        "social_class": "working_class"
      }`,
        locations: `"genre_metadata": {
        "period_accuracy": "verified_accurate",
        "historical_landmark": true,
        "architectural_period": "Victorian"
      }`,
        plot_events: `"genre_metadata": {
        "period_accuracy": "plausible",
        "based_on_real_event": "Chicago speakeasy raids"
      }`,
        world_rules: `"genre_metadata": {
        "period_accuracy": "verified_accurate",
        "historical_law": "Prohibition_Act_1920"
      }`,
        timeline: `"genre_metadata": {
        "period_accuracy": "plausible",
        "historical_date": "1923-08-15",
        "real_event_reference": "Based on Chicago speakeasy raids",
        "anachronism_check": "verified"
      }`,
        themes: `"genre_metadata": {
        "period_accuracy": "intentional_deviation",
        "historical_themes": ["class_struggle", "industrialization"]
      }`
      }
    }

    // Default (general fiction) schemas - minimal metadata
    return {
      characters: `"genre_metadata": {}`,
      locations: `"genre_metadata": {}`,
      plot_events: `"genre_metadata": {}`,
      world_rules: `"genre_metadata": {}`,
      timeline: `"genre_metadata": {}`,
      themes: `"genre_metadata": {}`
    }
  }

  /**
   * Get genre-specific extraction instructions
   */
  private getGenreSpecificInstructions(genre: string): string {
    const normalizedGenre = genre.toLowerCase()

    const genreInstructions: Record<string, string> = {
      'romance': `
GENRE-SPECIFIC EXTRACTION (Romance):
For characters and plot events, also extract:
- relationship_stage: "strangers/acquaintances/friends/attraction/dating/committed/complicated"
- heat_level: 1-5 scale (1=sweet, 5=explicit)
Store these in a genre_metadata JSONB field.`,

      'mystery': `
GENRE-SPECIFIC EXTRACTION (Mystery):
For plot events and world rules, also extract:
- clue_importance: "red_herring/minor_clue/major_clue/smoking_gun"
- red_herring: true/false (is this a deliberate misdirection?)
Store these in a genre_metadata JSONB field.`,

      'fantasy': `
GENRE-SPECIFIC EXTRACTION (Fantasy):
For world rules and locations, also extract:
- magic_system_notes: "type of magic, limitations, costs, unique aspects"
Store these in a genre_metadata JSONB field.`,

      'historical': `
GENRE-SPECIFIC EXTRACTION (Historical):
For all fact types, also extract:
- period_accuracy: "verified_accurate/plausible/artistic_liberty/anachronism"
Store these in a genre_metadata JSONB field.`
    }

    // Check for partial genre matches (e.g., "historical fiction" matches "historical")
    for (const [key, instructions] of Object.entries(genreInstructions)) {
      if (normalizedGenre.includes(key)) {
        return instructions
      }
    }

    // Default: no genre-specific instructions
    return `
GENRE-SPECIFIC EXTRACTION:
No genre-specific fields required for ${genre}. You may include any relevant metadata in genre_metadata as a JSONB object.`
  }

  /**
   * Generate initial story bible from premise (not chapter content)
   * Creates story-level facts for characters, locations, world_rules, and themes
   * Does NOT populate plot_events or timeline (those come from actual chapters)
   */
  async generateStoryBibleFromPremise({
    premise,
    genre,
    title,
    storyId,
    userId
  }: {
    premise: string
    genre: string
    title: string
    storyId: string
    userId?: string
  }) {
    const systemPrompt = 'You are a professional story development assistant specializing in creating detailed story bibles from premises. Generate comprehensive world-building, character foundations, and thematic elements that will guide consistent story development.'

    // Genre-specific generation instructions and schemas
    const genreInstructions = this.getGenreSpecificInstructions(genre)
    const genreSchemas = this.getGenreMetadataSchema(genre)

    const prompt = `Based on the following story premise, generate a comprehensive story bible for a ${genre} story. This will be used to maintain consistency across all chapters.

STORY TITLE: ${title}
GENRE: ${genre}

PREMISE:
${premise}

${genreInstructions}

Generate initial world-building and character foundations. Return ONLY valid JSON in this exact structure (no markdown, no explanations):

{
  "characters": [
    {
      "character_name": "Full character name",
      "physical_description": "Detailed physical appearance, height, build, distinguishing features",
      "age_mentioned": "Character age or age range",
      "appearance_details": "Hair, eyes, clothing style, distinguishing marks",
      "personality_traits": ["core trait 1", "core trait 2", "core trait 3"],
      "speech_patterns": {
        "vocabulary": "formal/casual/technical/poetic",
        "accent": "regional accent or speech characteristic",
        "verbal_tics": ["characteristic phrases or speaking habits"],
        "tone": "typical emotional tone when speaking"
      },
      "backstory_elements": ["key background element 1", "formative experience"],
      "relationships": [
        {
          "with_character": "other character name",
          "relationship_type": "friend/enemy/family/mentor/rival",
          "dynamic": "how they typically interact",
          "history": "shared history or connection"
        }
      ],
      "goals_shortterm": ["immediate objective for story start"],
      "goals_longterm": ["ultimate life goal or quest"],
      "fears_motivations": {
        "fears": ["primary fear or anxiety"],
        "motivations": ["core driving force"]
      },
      "skills_abilities": ["notable skill or ability"],
      "confidence": 0.9,
      ${genreSchemas.characters}
    }
  ],
  "locations": [
    {
      "location_name": "Primary location name",
      "physical_layout": "Layout, size, architecture, or geography",
      "atmosphere_mood": "Overall feeling and mood of the place",
      "sensory_details": {
        "sounds": ["typical ambient sounds"],
        "smells": ["characteristic scents"],
        "temperature": "typical climate or temperature",
        "lighting": "typical lighting conditions"
      },
      "location_history": "Historical significance or backstory",
      "controlled_by": "Who owns or controls this location",
      "connected_locations": ["nearby place 1", "connected area 2"],
      "danger_level": "safe/moderate/dangerous/deadly",
      "features": ["notable landmark", "key feature"],
      "confidence": 0.85,
      ${genreSchemas.locations}
    }
  ],
  "world_rules": [
    {
      "rule_name": "Name of this rule or system",
      "rule_description": "Detailed explanation of how this works in your world",
      "category": "magic/social/political/technology/law/physics",
      "mechanics": "Specific mechanics of how this rule functions",
      "costs_limitations": "What are the costs, limits, or restrictions?",
      "exceptions": "Any exceptions or special cases",
      "implications": "How this affects characters and story possibilities",
      "consistency_notes": "Guidelines to avoid breaking this rule in future chapters",
      "confidence": 0.95,
      ${genreSchemas.world_rules}
    }
  ],
  "themes": [
    {
      "theme_name": "Central theme name",
      "motif_description": "Recurring motif or pattern to use",
      "symbolic_elements": ["symbol to weave throughout story"],
      "message_meaning": "What the story should convey about this theme",
      "confidence": 0.75,
      ${genreSchemas.themes}
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. Generate foundational elements that will guide all future chapters
3. Characters should be rich and multi-dimensional
4. World rules should be clear and enforceable
5. Themes should guide the story's deeper meaning
6. Leave plot_events and timeline empty - those are extracted from actual chapters
7. Confidence scores: 0.95 (core elements) to 0.7 (flexible elements)`

    let response
    try {
      response = await this.generateContent({
        prompt,
        systemPrompt,
        maxTokens: 8000,
        operation: 'story_bible_generation',
        userId,
        trackAnalytics: true
      })
    } catch (error) {
      console.error('Claude API error during story bible generation:', error)
      throw new Error('Failed to generate story bible from premise')
    }

    // Log token usage
    const inputTokens = response.usage?.inputTokens || 0
    const outputTokens = response.usage?.outputTokens || 0
    const cost = response.cost || 0
    console.log(`[Token Usage] generateStoryBibleFromPremise: input=${inputTokens}, output=${outputTokens}, cost=$${cost.toFixed(4)}`)

    // Strip markdown code blocks if present
    let contentToParse = response.content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    // Parse JSON response with error handling
    let parsedData: {
      characters?: any[]
      locations?: any[]
      world_rules?: any[]
      themes?: any[]
    }

    try {
      parsedData = JSON.parse(contentToParse)
    } catch (parseError) {
      console.warn('Failed to parse story bible response, attempting fallback')
      const jsonMatch = contentToParse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
        } catch (e) {
          throw new Error('Could not parse story bible generation response')
        }
      } else {
        throw new Error('No valid JSON found in story bible generation response')
      }
    }

    const extractionCost = response.cost || 0
    const model = response.model || this.defaultModel

    // Return data structured for 6 specialized tables
    // chapter_id is NULL for story-level facts (not tied to specific chapter)
    return {
      characters: (parsedData.characters || []).map((char: any) => ({
        story_id: storyId,
        chapter_id: null, // Story-level fact, not chapter-specific
        character_name: char.character_name || '',
        physical_description: char.physical_description || null,
        age_mentioned: char.age_mentioned || null,
        appearance_details: char.appearance_details || null,
        personality_traits: char.personality_traits || [],
        speech_patterns: char.speech_patterns || {},
        dialogue_examples: [],
        backstory_elements: char.backstory_elements || [],
        relationships: char.relationships || [],
        goals_shortterm: char.goals_shortterm || [],
        goals_longterm: char.goals_longterm || [],
        fears_motivations: char.fears_motivations || {},
        internal_conflicts: null,
        skills_abilities: char.skills_abilities || [],
        emotional_state: null,
        character_arc_notes: null,
        confidence: char.confidence || 0.9,
        genre_metadata: char.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      locations: (parsedData.locations || []).map((loc: any) => ({
        story_id: storyId,
        chapter_id: null, // Story-level fact
        location_name: loc.location_name || '',
        physical_layout: loc.physical_layout || null,
        atmosphere_mood: loc.atmosphere_mood || null,
        sensory_details: loc.sensory_details || {},
        location_history: loc.location_history || null,
        controlled_by: loc.controlled_by || null,
        connected_locations: loc.connected_locations || [],
        danger_level: loc.danger_level || null,
        character_interactions: null,
        emotional_associations: null,
        features: loc.features || [],
        confidence: loc.confidence || 0.85,
        genre_metadata: loc.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      plot_events: [], // Empty - plot events come from actual chapters
      world_rules: (parsedData.world_rules || []).map((rule: any) => ({
        story_id: storyId,
        chapter_id: null, // Story-level fact
        rule_name: rule.rule_name || '',
        rule_description: rule.rule_description || null,
        category: rule.category || null,
        mechanics: rule.mechanics || null,
        costs_limitations: rule.costs_limitations || null,
        exceptions: rule.exceptions || null,
        implications: rule.implications || null,
        consistency_notes: rule.consistency_notes || null,
        confidence: rule.confidence || 0.95,
        genre_metadata: rule.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      timeline: [], // Empty - timeline events come from actual chapters
      themes: (parsedData.themes || []).map((theme: any) => ({
        story_id: storyId,
        chapter_id: null, // Story-level fact
        theme_name: theme.theme_name || '',
        motif_description: theme.motif_description || null,
        symbolic_elements: theme.symbolic_elements || [],
        related_conflicts: null,
        message_meaning: theme.message_meaning || null,
        narrative_voice: null,
        prose_style_notes: null,
        confidence: theme.confidence || 0.75,
        genre_metadata: theme.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      }))
    }
  }

  /**
   * Extract structured facts from chapter content into 6 specialized tables
   */
  async extractChapterFacts({
    chapterContent,
    storyId,
    chapterId,
    userId,
    genre
  }: {
    chapterContent: string
    storyId: string
    chapterId: string
    userId?: string
    genre: string
  }) {
    const systemPrompt = 'You are a professional story analyst specializing in extracting detailed, structured facts from narrative content for consistency tracking. Your analysis must be thorough, accurate, and return valid JSON only.'

    // Genre-specific extraction instructions and schemas
    const genreInstructions = this.getGenreSpecificInstructions(genre)
    const genreSchemas = this.getGenreMetadataSchema(genre)

    const prompt = `Analyze this ${genre} chapter and extract comprehensive facts in the following JSON format. Be thorough and detailed.

CHAPTER CONTENT:
${chapterContent}

${genreInstructions}

Return ONLY valid JSON in this exact structure (no markdown, no explanations):

{
  "characters": [
    {
      "character_name": "Full character name",
      "physical_description": "Detailed physical appearance, height, build, distinguishing features",
      "age_mentioned": "Any age references or hints (e.g., 'mid-thirties', 'teenage')",
      "appearance_details": "Hair, eyes, scars, clothing style, distinguishing marks",
      "personality_traits": ["brave", "sarcastic", "cautious"],
      "speech_patterns": {
        "vocabulary": "formal/casual/technical/poetic/crude",
        "accent": "regional accent or speech impediment",
        "verbal_tics": ["repeated phrases", "catchphrases"],
        "tone": "sarcastic/warm/cold/authoritative"
      },
      "dialogue_examples": ["actual quote from chapter", "another quote"],
      "backstory_elements": ["orphaned as child", "trained as soldier"],
      "relationships": [
        {
          "with_character": "other character name",
          "relationship_type": "mentor/friend/enemy/lover/rival",
          "dynamic": "how they interact (protective/competitive/distant)",
          "history": "shared past or connection"
        }
      ],
      "goals_shortterm": ["immediate objective in this chapter"],
      "goals_longterm": ["ultimate life goal or quest"],
      "fears_motivations": {
        "fears": ["what they're afraid of"],
        "motivations": ["what drives them"]
      },
      "internal_conflicts": "inner struggle or moral dilemma",
      "skills_abilities": ["magic ability", "combat skill", "special talent"],
      "emotional_state": "current emotion (angry, hopeful, conflicted)",
      "character_arc_notes": "how this character is changing or developing",
      "confidence": 0.9,
      ${genreSchemas.characters}
    }
  ],
  "locations": [
    {
      "location_name": "Place name",
      "physical_layout": "Layout, size, architecture, geography",
      "atmosphere_mood": "Overall feeling and mood of the place",
      "sensory_details": {
        "sounds": ["ambient noise", "specific sounds"],
        "smells": ["scent descriptions"],
        "temperature": "hot/cold/comfortable",
        "lighting": "bright/dim/flickering/natural"
      },
      "location_history": "Historical significance or backstory",
      "controlled_by": "Who owns or controls this location",
      "connected_locations": ["adjacent area 1", "nearby place 2"],
      "danger_level": "safe/moderate/dangerous/deadly",
      "character_interactions": "How characters use or interact with this space",
      "emotional_associations": "What emotions this place evokes in characters",
      "features": ["notable landmark", "key feature"],
      "confidence": 0.85,
      ${genreSchemas.locations}
    }
  ],
  "plot_events": [
    {
      "event_name": "Brief event name",
      "event_description": "Detailed description of what happened",
      "chapter_position": 1,
      "characters_involved": ["character 1", "character 2"],
      "significance": "Why this matters to the overall story",
      "immediate_consequences": "What happens right after",
      "longterm_implications": "Future impact on the story",
      "foreshadowing_elements": "Hints or setup for future events",
      "payoff_for_setup": "Which earlier setup does this resolve?",
      "unresolved_threads": ["unanswered question 1", "ongoing conflict"],
      "emotional_impact": "How reader should feel (shocked, hopeful, tense)",
      "tension_level": "low/medium/high/climax",
      "pacing_notes": "fast action/slow reflection/steady progression",
      "stakes": "What's at risk? What could be lost or gained?",
      "confidence": 0.9,
      ${genreSchemas.plot_events}
    }
  ],
  "world_rules": [
    {
      "rule_name": "Name of this rule or system",
      "rule_description": "Detailed explanation of how this works",
      "category": "magic/social/political/technology/law/physics",
      "mechanics": "Specific mechanics of how this rule functions",
      "costs_limitations": "What are the costs, limits, or restrictions?",
      "exceptions": "Any exceptions or special cases",
      "implications": "How this affects characters and plot",
      "consistency_notes": "How to avoid breaking this rule in future chapters",
      "confidence": 0.95,
      ${genreSchemas.world_rules}
    }
  ],
  "timeline": [
    {
      "event_name": "Timeline event name",
      "chronological_order": 1,
      "time_reference": "when this happens (yesterday, three days ago, flashback)",
      "is_flashback": false,
      "parallel_storyline": "name of parallel thread if applicable",
      "reader_knowledge_gap": "What reader doesn't know yet about this event",
      "mystery_elements": "Unanswered questions related to this event",
      "confidence": 0.8,
      ${genreSchemas.timeline}
    }
  ],
  "themes": [
    {
      "theme_name": "Central theme name",
      "motif_description": "Recurring motif or pattern",
      "symbolic_elements": ["symbol 1", "recurring image"],
      "related_conflicts": "Which conflicts express this theme",
      "message_meaning": "What the story says about this theme",
      "narrative_voice": "first person/third person limited/omniscient, past/present tense",
      "prose_style_notes": "lyrical/terse/poetic/straightforward, metaphor density",
      "confidence": 0.75,
      ${genreSchemas.themes}
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. Extract only facts explicitly stated or clearly implied in the chapter
3. If a field has no data, use empty string "" or empty array []
4. Be thorough but precise - quality over quantity
5. Confidence scores: 0.95 (certain) to 0.5 (uncertain)`

    let response
    try {
      response = await this.generateContent({
        prompt,
        systemPrompt,
        maxTokens: 8000, // ~6,000 words for comprehensive fact extraction
        operation: 'fact_extraction',
        userId,
        trackAnalytics: true
      })
    } catch (error) {
      console.error('Claude API error during fact extraction:', error)
      throw new Error('Failed to extract facts from chapter content')
    }

    // Log token usage
    const inputTokens = response.usage?.inputTokens || 0
    const outputTokens = response.usage?.outputTokens || 0
    const cost = response.cost || 0
    console.log(`[Token Usage] extractChapterFacts: input=${inputTokens}, output=${outputTokens}, cost=$${cost.toFixed(4)}`)

    // Strip markdown code blocks if present
    let contentToParse = response.content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    // Parse JSON response with error handling
    let parsedData: {
      characters?: any[]
      locations?: any[]
      plot_events?: any[]
      world_rules?: any[]
      timeline?: any[]
      themes?: any[]
    }

    try {
      parsedData = JSON.parse(contentToParse)
    } catch (parseError) {
      console.warn('Failed to parse fact extraction response, attempting fallback')
      const jsonMatch = contentToParse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
        } catch (e) {
          throw new Error('Could not parse fact extraction response')
        }
      } else {
        throw new Error('No valid JSON found in fact extraction response')
      }
    }

    const extractionCost = response.cost || 0
    const model = response.model || this.defaultModel

    // Return data structured for 6 specialized tables
    return {
      characters: (parsedData.characters || []).map((char: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        character_name: char.character_name || '',
        physical_description: char.physical_description || null,
        age_mentioned: char.age_mentioned || null,
        appearance_details: char.appearance_details || null,
        personality_traits: char.personality_traits || [],
        speech_patterns: char.speech_patterns || {},
        dialogue_examples: char.dialogue_examples || [],
        backstory_elements: char.backstory_elements || [],
        relationships: char.relationships || [],
        goals_shortterm: char.goals_shortterm || [],
        goals_longterm: char.goals_longterm || [],
        fears_motivations: char.fears_motivations || {},
        internal_conflicts: char.internal_conflicts || null,
        skills_abilities: char.skills_abilities || [],
        emotional_state: char.emotional_state || null,
        character_arc_notes: char.character_arc_notes || null,
        confidence: char.confidence || 0.9,
        genre_metadata: char.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      locations: (parsedData.locations || []).map((loc: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        location_name: loc.location_name || '',
        physical_layout: loc.physical_layout || null,
        atmosphere_mood: loc.atmosphere_mood || null,
        sensory_details: loc.sensory_details || {},
        location_history: loc.location_history || null,
        controlled_by: loc.controlled_by || null,
        connected_locations: loc.connected_locations || [],
        danger_level: loc.danger_level || null,
        character_interactions: loc.character_interactions || null,
        emotional_associations: loc.emotional_associations || null,
        features: loc.features || [],
        confidence: loc.confidence || 0.85,
        genre_metadata: loc.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      plot_events: (parsedData.plot_events || []).map((event: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        event_name: event.event_name || '',
        event_description: event.event_description || '',
        chapter_position: event.chapter_position || null,
        characters_involved: event.characters_involved || [],
        significance: event.significance || null,
        immediate_consequences: event.immediate_consequences || null,
        longterm_implications: event.longterm_implications || null,
        foreshadowing_elements: event.foreshadowing_elements || null,
        payoff_for_setup: event.payoff_for_setup || null,
        unresolved_threads: event.unresolved_threads || [],
        emotional_impact: event.emotional_impact || null,
        tension_level: event.tension_level || null,
        pacing_notes: event.pacing_notes || null,
        stakes: event.stakes || null,
        confidence: event.confidence || 0.9,
        genre_metadata: event.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      world_rules: (parsedData.world_rules || []).map((rule: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        rule_name: rule.rule_name || '',
        rule_description: rule.rule_description || '',
        category: rule.category || null,
        mechanics: rule.mechanics || null,
        costs_limitations: rule.costs_limitations || null,
        exceptions: rule.exceptions || null,
        implications: rule.implications || null,
        consistency_notes: rule.consistency_notes || null,
        confidence: rule.confidence || 0.95,
        genre_metadata: rule.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      timeline: (parsedData.timeline || []).map((t: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        event_name: t.event_name || '',
        chronological_order: t.chronological_order || null,
        time_reference: t.time_reference || null,
        is_flashback: t.is_flashback || false,
        parallel_storyline: t.parallel_storyline || null,
        reader_knowledge_gap: t.reader_knowledge_gap || null,
        mystery_elements: t.mystery_elements || null,
        confidence: t.confidence || 0.8,
        genre_metadata: t.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      themes: (parsedData.themes || []).map((theme: any) => ({
        story_id: storyId,
        chapter_id: chapterId,
        theme_name: theme.theme_name || '',
        motif_description: theme.motif_description || null,
        symbolic_elements: theme.symbolic_elements || [],
        related_conflicts: theme.related_conflicts || null,
        message_meaning: theme.message_meaning || null,
        narrative_voice: theme.narrative_voice || null,
        prose_style_notes: theme.prose_style_notes || null,
        confidence: theme.confidence || 0.75,
        genre_metadata: theme.genre_metadata || {},
        extraction_cost_usd: extractionCost,
        extraction_model: model
      })),
      extractionCost,
      tokensUsed: response.usage?.totalTokens || 0,
      model
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
   * Calculate similarity between two fact data objects (0-100%)
   */
  private calculateFactSimilarity(existingFactData: Record<string, any>, newFactData: Record<string, any>): number {
    const allKeys = new Set([
      ...Object.keys(existingFactData),
      ...Object.keys(newFactData)
    ])

    if (allKeys.size === 0) return 100 // Both empty = identical

    let matchingFields = 0
    let totalFields = 0

    for (const key of allKeys) {
      // Skip metadata fields that change every extraction
      if (['extraction_cost_usd', 'extraction_model', 'confidence', 'extracted_at', 'updated_at', 'created_at'].includes(key)) {
        continue
      }

      totalFields++

      const existingValue = existingFactData[key]
      const newValue = newFactData[key]

      // Compare values
      if (existingValue === newValue) {
        matchingFields++
      } else if (Array.isArray(existingValue) && Array.isArray(newValue)) {
        // For arrays, check if they have the same elements (order independent)
        const sortedExisting = JSON.stringify([...existingValue].sort())
        const sortedNew = JSON.stringify([...newValue].sort())
        if (sortedExisting === sortedNew) {
          matchingFields++
        }
      } else if (typeof existingValue === 'object' && typeof newValue === 'object' && existingValue !== null && newValue !== null) {
        // For objects, do deep comparison
        if (JSON.stringify(existingValue) === JSON.stringify(newValue)) {
          matchingFields++
        }
      }
    }

    return totalFields === 0 ? 100 : Math.round((matchingFields / totalFields) * 100)
  }

  /**
   * Save extracted facts to 6 specialized tables
   */
  async saveExtractedFacts(
    extractedData: {
      characters: any[]
      locations: any[]
      plot_events: any[]
      world_rules: any[]
      timeline: any[]
      themes: any[]
    },
    supabase: SupabaseClient
  ): Promise<{
    characters: number
    locations: number
    events: number
    rules: number
    timeline: number
    themes: number
    totalSaved: number
    totalFailed: number
    duplicatesSkipped: number
    updatedWithNewDetails: number
  }> {
    const results = {
      characters: 0,
      locations: 0,
      events: 0,
      rules: 0,
      timeline: 0,
      themes: 0,
      totalSaved: 0,
      totalFailed: 0,
      duplicatesSkipped: 0,
      updatedWithNewDetails: 0
    }

    // Save characters with duplicate detection
    for (const char of extractedData.characters) {
      if (!char.character_name) continue
      try {
        // Check if character already exists
        const { data: existing } = await supabase
          .from('character_facts')
          .select('*')
          .eq('story_id', char.story_id)
          .eq('character_name', char.character_name)
          .single()

        if (existing) {
          // Calculate similarity
          const similarity = this.calculateFactSimilarity(existing, char)

          if (similarity > 80) {
            // Skip duplicate
            console.log(`[Fact Extraction] Skipped duplicate: ${char.character_name} (${similarity}% match)`)
            results.duplicatesSkipped++
            continue
          } else {
            // Update with new details
            console.log(`[Fact Extraction] Updated with new details: ${char.character_name} (${similarity}% match)`)
            results.updatedWithNewDetails++
          }
        }

        const { error } = await supabase
          .from('character_facts')
          .upsert(char, { onConflict: 'story_id,character_name' })
        if (!error) {
          results.characters++
          results.totalSaved++
        } else {
          console.error(`[Fact Save Error] Failed to save character: ${char.character_name}`, error)
          results.totalFailed++
        }
      } catch (err) {
        console.error(`[Fact Save Error] Exception saving character: ${char?.character_name}`, err)
        results.totalFailed++
      }
    }

    // Save locations with duplicate detection
    for (const loc of extractedData.locations) {
      if (!loc.location_name) continue
      try {
        // Check if location already exists
        const { data: existing } = await supabase
          .from('location_facts')
          .select('*')
          .eq('story_id', loc.story_id)
          .eq('location_name', loc.location_name)
          .single()

        if (existing) {
          const similarity = this.calculateFactSimilarity(existing, loc)

          if (similarity > 80) {
            console.log(`[Fact Extraction] Skipped duplicate: ${loc.location_name} (${similarity}% match)`)
            results.duplicatesSkipped++
            continue
          } else {
            console.log(`[Fact Extraction] Updated with new details: ${loc.location_name} (${similarity}% match)`)
            results.updatedWithNewDetails++
          }
        }

        const { error } = await supabase
          .from('location_facts')
          .upsert(loc, { onConflict: 'story_id,location_name' })
        if (!error) {
          results.locations++
          results.totalSaved++
        } else {
          console.error(`[Fact Save Error] Failed to save location: ${loc.location_name}`, error)
          results.totalFailed++
        }
      } catch (err) {
        console.error(`[Fact Save Error] Exception saving location: ${loc?.location_name}`, err)
        results.totalFailed++
      }
    }

    // Save plot events (no UPSERT since events can reoccur, but check for duplicates)
    for (const event of extractedData.plot_events) {
      if (!event.event_name) continue
      try {
        // Check if very similar event already exists
        const { data: existingEvents } = await supabase
          .from('plot_event_facts')
          .select('*')
          .eq('story_id', event.story_id)
          .eq('event_name', event.event_name)
          .eq('chapter_number', event.chapter_number)

        if (existingEvents && existingEvents.length > 0) {
          // Check similarity with the most recent one
          const similarity = this.calculateFactSimilarity(existingEvents[0], event)

          if (similarity > 80) {
            console.log(`[Fact Extraction] Skipped duplicate event: ${event.event_name} (${similarity}% match)`)
            results.duplicatesSkipped++
            continue
          }
        }

        const { error } = await supabase
          .from('plot_event_facts')
          .insert(event)
        if (!error) {
          results.events++
          results.totalSaved++
        } else {
          results.totalFailed++
        }
      } catch { results.totalFailed++ }
    }

    // Save world rules with duplicate detection
    for (const rule of extractedData.world_rules) {
      if (!rule.rule_name) continue
      try {
        // Check if rule already exists
        const { data: existing } = await supabase
          .from('world_rule_facts')
          .select('*')
          .eq('story_id', rule.story_id)
          .eq('rule_name', rule.rule_name)
          .single()

        if (existing) {
          const similarity = this.calculateFactSimilarity(existing, rule)

          if (similarity > 80) {
            console.log(`[Fact Extraction] Skipped duplicate: ${rule.rule_name} (${similarity}% match)`)
            results.duplicatesSkipped++
            continue
          } else {
            console.log(`[Fact Extraction] Updated with new details: ${rule.rule_name} (${similarity}% match)`)
            results.updatedWithNewDetails++
          }
        }

        const { error } = await supabase
          .from('world_rule_facts')
          .upsert(rule, { onConflict: 'story_id,rule_name' })
        if (!error) {
          results.rules++
          results.totalSaved++
        } else {
          results.totalFailed++
        }
      } catch { results.totalFailed++ }
    }

    // Save timeline (check for duplicates by event name and timing)
    for (const t of extractedData.timeline) {
      if (!t.event_name) continue
      try {
        // Check if similar timeline entry exists
        const { data: existingEntries } = await supabase
          .from('timeline_facts')
          .select('*')
          .eq('story_id', t.story_id)
          .eq('event_name', t.event_name)

        if (existingEntries && existingEntries.length > 0) {
          // Check similarity with existing entries
          let isDuplicate = false
          for (const existing of existingEntries) {
            const similarity = this.calculateFactSimilarity(existing, t)
            if (similarity > 80) {
              console.log(`[Fact Extraction] Skipped duplicate timeline: ${t.event_name} (${similarity}% match)`)
              results.duplicatesSkipped++
              isDuplicate = true
              break
            }
          }
          if (isDuplicate) continue
        }

        const { error } = await supabase
          .from('timeline_facts')
          .insert(t)
        if (!error) {
          results.timeline++
          results.totalSaved++
        } else {
          results.totalFailed++
        }
      } catch { results.totalFailed++ }
    }

    // Save themes with duplicate detection
    for (const theme of extractedData.themes) {
      if (!theme.theme_name) continue
      try {
        // Check if theme already exists
        const { data: existing } = await supabase
          .from('theme_facts')
          .select('*')
          .eq('story_id', theme.story_id)
          .eq('theme_name', theme.theme_name)
          .single()

        if (existing) {
          const similarity = this.calculateFactSimilarity(existing, theme)

          if (similarity > 80) {
            console.log(`[Fact Extraction] Skipped duplicate: ${theme.theme_name} (${similarity}% match)`)
            results.duplicatesSkipped++
            continue
          } else {
            console.log(`[Fact Extraction] Updated with new details: ${theme.theme_name} (${similarity}% match)`)
            results.updatedWithNewDetails++
          }
        }

        const { error } = await supabase
          .from('theme_facts')
          .upsert(theme, { onConflict: 'story_id,theme_name' })
        if (!error) {
          results.themes++
          results.totalSaved++
        } else {
          results.totalFailed++
        }
      } catch { results.totalFailed++ }
    }

    return results
  }

  /**
   * Generate comprehensive story outline with advanced narrative architecture
   */
  async generateStoryOutline({
    story,
    currentChapterNumber,
    chaptersToOutline = 5,
    allExistingFacts,
    storyArcTarget = 'three-act'
  }: {
    story: {
      id: string
      title: string
      premise: string
      genre: string
      target_chapter_count?: number
      foundation?: any
    }
    currentChapterNumber: number
    chaptersToOutline?: number
    allExistingFacts: {
      characters: any[]
      locations: any[]
      events: any[]
      rules: any[]
      timeline: any[]
      themes: any[]
    }
    storyArcTarget?: 'three-act' | 'five-act' | 'hero-journey' | 'custom'
  }) {
    // Validate chaptersToOutline to prevent excessive token usage
    if (chaptersToOutline > 5) {
      console.warn(`[generateStoryOutline] chaptersToOutline=${chaptersToOutline} exceeds limit, capping at 5`)
      chaptersToOutline = 5
    }

    const targetChapters = story.target_chapter_count || 30
    const progressPercent = Math.round((currentChapterNumber / targetChapters) * 100)

    // Calculate story structure position
    const structureInfo = this.calculateStructurePosition(
      currentChapterNumber,
      targetChapters,
      storyArcTarget
    )

    // Analyze character arcs
    const characterAnalysis = this.analyzeCharacterArcs(allExistingFacts.characters, allExistingFacts.events)

    // Track active conflicts
    const activeConflicts = this.extractActiveConflicts(allExistingFacts.events)

    // Track mysteries
    const activeMysteries = this.extractActiveMysteries(allExistingFacts.events, allExistingFacts.timeline)

    const systemPrompt = 'You are a master story architect specializing in narrative structure, character development, pacing, and thematic consistency. You create detailed chapter outlines that ensure satisfying story progression.'

    const prompt = `You are a master story architect planning chapters ${currentChapterNumber} through ${currentChapterNumber + chaptersToOutline - 1} of a ${story.genre} novel.

CURRENT STATE ANALYSIS:
Story: "${story.title}"
Premise: ${story.premise}
Current Chapter: ${currentChapterNumber}
Total Planned Chapters: ${targetChapters}
Story Structure: ${storyArcTarget}
Progress: ${progressPercent}% through overall arc

STRUCTURAL POSITION:
${structureInfo.description}
Current Act: ${structureInfo.currentAct}
Needed Story Beats: ${structureInfo.missingBeats.join(', ')}

ESTABLISHED FACTS SUMMARY:
Characters (${allExistingFacts.characters.length}): ${allExistingFacts.characters.map(c => c.character_name).join(', ') || 'None yet'}
Locations (${allExistingFacts.locations.length}): ${allExistingFacts.locations.map(l => l.location_name).join(', ') || 'None yet'}
Major Events: ${allExistingFacts.events.slice(0, 5).map(e => e.event_name).join('; ') || 'Story beginning'}
World Rules: ${allExistingFacts.rules.map(r => r.rule_name).join(', ') || 'None established'}
Themes: ${allExistingFacts.themes.map(t => t.theme_name).join(', ') || 'To be determined'}

CHARACTER ARC STATUS:
${characterAnalysis.length > 0 ? characterAnalysis.map(c =>
  `- ${c.name}: ${c.arcPosition} (needs: ${c.nextDevelopment})`
).join('\n') : 'No character arcs established yet'}

ACTIVE CONFLICTS:
${activeConflicts.length > 0 ? activeConflicts.map(c =>
  `- ${c.type}: ${c.description} (intensity: ${c.intensity}/10)`
).join('\n') : 'Conflicts to be established'}

ACTIVE MYSTERIES & REVEALS:
${activeMysteries.length > 0 ? activeMysteries.map(m =>
  `- ${m.mystery} (reveal in ~${m.chaptersUntilReveal} chapters)`
).join('\n') : 'No active mysteries'}

YOUR TASK:
Generate ${chaptersToOutline} detailed chapter outlines that accomplish the following:

1. CHARACTER ARCS: Advance each character meaningfully, not just plot events
2. CONFLICT ESCALATION: Increase stakes from ${structureInfo.currentStakes} to ${structureInfo.targetStakes}
3. MYSTERY MANAGEMENT: Plant clues 2-3 chapters before reveals, layer new mysteries
4. STRUCTURAL BEATS: Hit key ${storyArcTarget} story beats (${structureInfo.nextBeat})
5. PACING VARIETY: Mix tension levels (not all climax, not all setup)
6. NEW ELEMENTS: Introduce characters/locations at logical moments
7. SETUP/PAYOFF: Track foreshadowing with planned payoff chapters
8. THEMATIC CONSISTENCY: Reinforce themes through character choices

CRITICAL GUIDELINES:
- After high-tension chapters, plan reflection/recovery
- Stagger conflict resolutions (don't resolve everything at once)
- Balance answers with new questions (maintain curiosity)
- Ensure character decisions drive plot (not just reacting)
- Plan "earned moments" readers have been waiting for
- End chapters on hooks (questions, revelations, cliffhangers)
- Introduce world details gradually (no info-dumps)

Return ONLY valid JSON (no markdown) in this structure:
{
  "outlines": [
    {
      "chapter_number": ${currentChapterNumber},
      "planned_purpose": "What this chapter accomplishes narratively",
      "new_characters_to_introduce": [{"name": "Character Name", "role": "their function", "introduction_context": "how they enter"}],
      "new_locations_to_introduce": [{"name": "Location", "why_visiting": "narrative reason"}],
      "conflicts_to_escalate": [{"conflict_type": "external/internal/interpersonal", "how_it_escalates": "specific escalation"}],
      "conflicts_to_resolve": [{"conflict_type": "type", "resolution_approach": "how it resolves"}],
      "mysteries_to_deepen": [{"mystery": "which mystery", "new_clue": "what clue"}],
      "mysteries_to_reveal": [{"mystery": "which mystery", "what_gets_revealed": "revelation"}],
      "emotional_target": "triumph/tension/loss/wonder/fear/hope/despair",
      "pacing_target": "slow/moderate/fast/climax",
      "stakes_level": 5,
      "chapter_type": "setup/development/climax/resolution/transition",
      "key_events_planned": ["event 1", "event 2", "event 3"],
      "foreshadowing_to_plant": [{"element": "what to foreshadow", "payoff_chapter": ${currentChapterNumber + 3}}],
      "callbacks_to_earlier_chapters": [{"chapter_ref": 1, "what_to_callback": "reference to earlier event"}],
      "tone_guidance": "how this chapter should feel",
      "word_count_target": 2000
    }
  ]
}

Ensure stakes escalate logically, pacing varies, and character arcs progress meaningfully.`

    let response
    try {
      response = await this.generateContent({
        prompt,
        systemPrompt,
        maxTokens: 6000, // Sufficient for 5 chapter outlines
        operation: 'outline_generation'
      })
    } catch (error) {
      console.error('Claude API error during outline generation:', error)
      throw new Error('Failed to generate story outline')
    }

    // Log token usage
    const inputTokens = response.usage?.inputTokens || 0
    const outputTokens = response.usage?.outputTokens || 0
    const cost = response.cost || 0
    console.log(`[Token Usage] generateStoryOutline: input=${inputTokens}, output=${outputTokens}, cost=$${cost.toFixed(4)}`)

    // Strip markdown and parse
    let contentToParse = response.content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    let parsedData: { outlines: any[] }
    try {
      parsedData = JSON.parse(contentToParse)
    } catch (parseError) {
      const jsonMatch = contentToParse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse outline generation response')
      }
    }

    // Validate and analyze generated outlines
    const outlines = parsedData.outlines || []
    const validation = this.validateOutlines(outlines, currentChapterNumber, structureInfo.currentStakes)

    // Calculate summary statistics
    const pacingDistribution = outlines.reduce((acc, o) => {
      acc[o.pacing_target] = (acc[o.pacing_target] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stakesRange = outlines.length > 0
      ? `${Math.min(...outlines.map((o: any) => o.stakes_level))} → ${Math.max(...outlines.map((o: any) => o.stakes_level))}`
      : 'N/A'

    const newCharactersPlanned = outlines.reduce(
      (sum, o) => sum + (o.new_characters_to_introduce?.length || 0),
      0
    )

    const mysteriesActive = new Set(
      outlines.flatMap(o => [
        ...(o.mysteries_to_deepen || []).map((m: any) => m.mystery),
        ...(o.mysteries_to_reveal || []).map((m: any) => m.mystery)
      ])
    ).size

    return {
      outlines,
      outlinesGenerated: outlines.length,
      fromChapter: currentChapterNumber,
      toChapter: currentChapterNumber + outlines.length - 1,
      structuralPosition: `${structureInfo.currentAct}, ${progressPercent}% through`,
      stakesRange,
      pacingDistribution,
      newCharactersPlanned,
      mysteriesActive,
      validationWarnings: validation.warnings,
      cost: response.cost || 0,
      tokensUsed: response.usage?.totalTokens || 0
    }
  }

  /**
   * Calculate story structure position and needed beats
   */
  private calculateStructurePosition(
    currentChapter: number,
    totalChapters: number,
    arcType: string
  ) {
    const progress = currentChapter / totalChapters

    const structures: Record<string, any> = {
      'three-act': {
        acts: [
          { name: 'Act 1: Setup', end: 0.25, beats: ['Hook', 'Inciting Incident', 'First Plot Point'] },
          { name: 'Act 2: Confrontation', end: 0.75, beats: ['Rising Action', 'Midpoint', 'Crisis'] },
          { name: 'Act 3: Resolution', end: 1.0, beats: ['Climax', 'Falling Action', 'Resolution'] }
        ]
      },
      'five-act': {
        acts: [
          { name: 'Act 1: Exposition', end: 0.15, beats: ['Introduction', 'Inciting Incident'] },
          { name: 'Act 2: Rising Action', end: 0.35, beats: ['Complication', 'Development'] },
          { name: 'Act 3: Climax', end: 0.55, beats: ['Crisis', 'Climax'] },
          { name: 'Act 4: Falling Action', end: 0.75, beats: ['Consequences', 'Resolution'] },
          { name: 'Act 5: Denouement', end: 1.0, beats: ['Final Confrontation', 'Conclusion'] }
        ]
      },
      'hero-journey': {
        acts: [
          { name: 'Departure', end: 0.25, beats: ['Ordinary World', 'Call to Adventure', 'Crossing Threshold'] },
          { name: 'Initiation', end: 0.75, beats: ['Tests', 'Approach', 'Ordeal', 'Reward'] },
          { name: 'Return', end: 1.0, beats: ['Road Back', 'Resurrection', 'Return with Elixir'] }
        ]
      }
    }

    const structure = structures[arcType] || structures['three-act']
    const currentAct = structure.acts.find((act: any) => progress <= act.end) || structure.acts[structure.acts.length - 1]
    const actIndex = structure.acts.indexOf(currentAct)

    const currentStakes = Math.ceil(progress * 10)
    const targetStakes = Math.min(currentStakes + 2, 10)

    const allBeats = structure.acts.flatMap((act: any) => act.beats)
    const completedBeats = allBeats.slice(0, Math.floor(progress * allBeats.length))
    const missingBeats = allBeats.filter((b: string) => !completedBeats.includes(b))
    const nextBeat = missingBeats[0] || 'Maintain tension'

    return {
      currentAct: currentAct.name,
      actIndex,
      currentStakes,
      targetStakes,
      missingBeats,
      nextBeat,
      description: `You are ${Math.round(progress * 100)}% through the story in ${currentAct.name}. Next major beat: ${nextBeat}.`
    }
  }

  /**
   * Analyze character arc progression
   */
  private analyzeCharacterArcs(characters: any[], events: any[]) {
    return characters.map(char => {
      const characterEvents = events.filter(e =>
        e.characters_involved?.includes(char.character_name)
      )

      const arcPosition = characterEvents.length === 0
        ? 'Not yet introduced'
        : characterEvents.length < 3
        ? 'Early development'
        : characterEvents.length < 6
        ? 'Mid-journey'
        : 'Approaching resolution'

      const hasInternalConflict = char.internal_conflicts && char.internal_conflicts.length > 0
      const hasGoals = char.goals_longterm && char.goals_longterm.length > 0

      const nextDevelopment = !hasInternalConflict
        ? 'Establish internal conflict'
        : !hasGoals
        ? 'Define clear goals'
        : characterEvents.length < 3
        ? 'Test character beliefs'
        : 'Major character decision moment'

      return {
        name: char.character_name,
        arcPosition,
        nextDevelopment,
        eventsCount: characterEvents.length
      }
    })
  }

  /**
   * Extract active conflicts from story events
   */
  private extractActiveConflicts(events: any[]) {
    const conflicts: Array<{ type: string; description: string; intensity: number }> = []

    events.forEach(event => {
      if (event.unresolved_threads && event.unresolved_threads.length > 0) {
        event.unresolved_threads.forEach((thread: string) => {
          conflicts.push({
            type: 'unresolved',
            description: thread,
            intensity: event.tension_level === 'high' ? 8 : event.tension_level === 'medium' ? 5 : 3
          })
        })
      }
    })

    return conflicts
  }

  /**
   * Extract active mysteries and estimate reveal timing
   */
  private extractActiveMysteries(events: any[], timeline: any[]) {
    const mysteries: Array<{ mystery: string; chaptersUntilReveal: number }> = []

    events.forEach(event => {
      if (event.foreshadowing_elements) {
        mysteries.push({
          mystery: event.foreshadowing_elements,
          chaptersUntilReveal: Math.floor(Math.random() * 5) + 3 // 3-7 chapters
        })
      }
    })

    timeline.forEach(t => {
      if (t.mystery_elements) {
        mysteries.push({
          mystery: t.mystery_elements,
          chaptersUntilReveal: Math.floor(Math.random() * 4) + 2 // 2-5 chapters
        })
      }
    })

    return mysteries.slice(0, 10) // Limit to top 10
  }

  /**
   * Validate generated outlines for quality and consistency
   */
  private validateOutlines(outlines: any[], startChapter: number, currentStakes: number) {
    const warnings: string[] = []

    // Check stakes escalation
    const stakesLevels = outlines.map(o => o.stakes_level || 5)
    const allSameStakes = stakesLevels.every(s => s === stakesLevels[0])
    if (allSameStakes && stakesLevels.length > 2) {
      warnings.push('Stakes remain flat - consider escalation')
    }

    // Check pacing variety
    const pacingTargets = outlines.map(o => o.pacing_target)
    const allSamePacing = pacingTargets.every(p => p === pacingTargets[0])
    if (allSamePacing && pacingTargets.length > 3) {
      warnings.push('Pacing lacks variety - mix slow/moderate/fast chapters')
    }

    // Check for character development
    const hasCharacterFocus = outlines.some(o =>
      (o.conflicts_to_escalate || []).some((c: any) => c.conflict_type === 'internal')
    )
    if (!hasCharacterFocus) {
      warnings.push('No internal character conflicts planned - story may feel plot-driven only')
    }

    // Check mystery management
    const revealsWithoutSetup = outlines.filter(o =>
      (o.mysteries_to_reveal || []).length > 0 && (o.mysteries_to_deepen || []).length === 0
    )
    if (revealsWithoutSetup.length > outlines.length / 2) {
      warnings.push('Too many reveals without setup - plant more clues first')
    }

    return { warnings, isValid: warnings.length < 3 }
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
