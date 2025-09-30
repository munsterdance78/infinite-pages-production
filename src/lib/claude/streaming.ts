import Anthropic from '@anthropic-ai/sdk'
import { 
  CLAUDE_PRICING, 
  calculateCost, 
  MODERATION_PATTERNS,
  INJECTION_PATTERNS,
  CONTENT_LIMITS
} from '@/lib/constants'

export interface StreamResponse {
  content: string
  isComplete: boolean
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost?: number
  error?: string
}

export class ClaudeStreamingService {
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
   * Stream content generation with real-time updates
   */
  async *streamContent({
    prompt,
    model = this.defaultModel,
    maxTokens = 4000,
    temperature = 0.7,
    systemPrompt
  }: {
    prompt: string
    model?: string
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
  }): AsyncGenerator<StreamResponse, void, unknown> {
    // Validate input
    this.validateInput(prompt)
    
    // Check for prompt injection
    if (this.detectPromptInjection(prompt)) {
      yield {
        content: '',
        isComplete: true,
        error: 'Potential prompt injection detected'
      }
      return
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'user' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ]

    try {
      const stream = await this.getAnthropic().messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
        stream: true
      })

      let fullContent = ''
      let inputTokens = 0
      let outputTokens = 0

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens
        } else if (chunk.type === 'content_block_delta') {
          const text = (chunk.delta as { type: string; text?: string }).text
          if (text) {
            fullContent += text
          }
          
          // Yield incremental content
          yield {
            content: fullContent,
            isComplete: false
          }
        } else if (chunk.type === 'message_delta') {
          outputTokens = chunk.usage.output_tokens
        } else if (chunk.type === 'message_stop') {
          // Moderate final content
          const moderationResult = await this.moderateContent(fullContent)
          if (!moderationResult.isValid) {
            yield {
              content: '',
              isComplete: true,
              error: `Content moderation failed: ${moderationResult.reason}`
            }
            return
          }

          const totalTokens = inputTokens + outputTokens
          const cost = calculateCost(inputTokens, outputTokens)

          // Final response with usage stats
          yield {
            content: fullContent,
            isComplete: true,
            usage: {
              inputTokens,
              outputTokens,
              totalTokens
            },
            cost
          }
        }
      }
    } catch (error: unknown) {
      console.error('Claude streaming error:', error)
      yield {
        content: '',
        isComplete: true,
        error: this.handleStreamingError(error)
      }
    }
  }

  /**
   * Stream story foundation generation
   */
  async *streamStoryFoundation({
    title,
    genre,
    premise
  }: {
    title?: string
    genre: string
    premise: string
  }): AsyncGenerator<StreamResponse, void, unknown> {
    const systemPrompt = `You are a professional story architect and creative writing expert. Your task is to create comprehensive, engaging story foundations that serve as blueprints for complete novels. Focus on creating compelling characters, well-structured plots, and rich thematic elements.

Always respond with valid JSON format. Structure your response as a complete JSON object with all required fields.`

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

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
    })
  }

  /**
   * Stream chapter generation with context
   */
  async *streamChapter({
    storyContext,
    chapterNumber,
    previousChapters,
    targetWordCount = 2000
  }: {
    storyContext: string
    chapterNumber: number
    previousChapters: Array<{ number: number; content: string; summary: string }>
    targetWordCount?: number
  }): AsyncGenerator<StreamResponse, void, unknown> {
    const systemPrompt = `You are a professional novelist and creative writing expert. Your task is to write compelling, well-crafted chapters that advance the story while maintaining consistency with established characters, plot, and themes. Focus on engaging dialogue, vivid descriptions, and meaningful character development.

Always respond with valid JSON format containing the chapter data.`

    const previousContext = previousChapters.length > 0
      ? `Previous Chapters Context:\n${previousChapters.map(ch => 
          `Chapter ${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}...`
        ).join('\n\n')}`
      : 'This is the first chapter.'

    const prompt = `Write Chapter ${chapterNumber} for this story:

${storyContext}

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

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: 6000
    })
  }

  /**
   * Stream content improvement
   */
  async *streamContentImprovement({
    content,
    feedback,
    improvementType = 'general'
  }: {
    content: string
    feedback: string
    improvementType?: 'general' | 'dialogue' | 'description' | 'pacing' | 'character'
  }): AsyncGenerator<StreamResponse, void, unknown> {
    const systemPrompt = `You are a professional editor and writing coach. Your task is to improve existing content based on specific feedback while maintaining the author's voice and style. Focus on enhancing clarity, engagement, and overall quality.

Always respond with valid JSON format containing the improved content.`

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

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
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
   * Handle streaming errors
   */
  private handleStreamingError(error: unknown): string {
    const errorWithStatus = error as { status?: number; message?: string }

    if (errorWithStatus?.status === 429) {
      return 'Rate limit exceeded. Please wait a moment before trying again.'
    }

    if (errorWithStatus?.status === 401) {
      return 'API authentication failed. Please contact support.'
    }

    if (errorWithStatus?.status === 400) {
      return 'Invalid request. Please check your input and try again.'
    }

    if (errorWithStatus?.status && errorWithStatus.status >= 500) {
      return 'Claude service is temporarily unavailable. Please try again later.'
    }

    return errorWithStatus?.message || 'An unexpected error occurred with Claude.'
  }
}

// Export singleton instance
export const claudeStreamingService = new ClaudeStreamingService()




