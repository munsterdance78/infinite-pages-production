import Anthropic from '@anthropic-ai/sdk'
import {
  CLAUDE_PRICING,
  calculateCost,
  MODERATION_PATTERNS,
  INJECTION_PATTERNS,
  CONTENT_LIMITS
} from '@/lib/utils/constants'

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
   * Validate input for security and content compliance
   */
  private validateInput(content: string): void {
    // Check for content injections
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error('Content contains potential security risks')
      }
    }

    // Check for inappropriate content
    for (const item of MODERATION_PATTERNS) {
      const pattern = 'pattern' in item ? item.pattern : item
      if (pattern.test(content.toLowerCase())) {
        throw new Error('Content violates community guidelines')
      }
    }

    // Check content limits
    if (content.length > CONTENT_LIMITS.MAX_PROMPT_LENGTH) {
      throw new Error(`Content exceeds maximum length of ${CONTENT_LIMITS.MAX_PROMPT_LENGTH} characters`)
    }
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

    const anthropic = this.getAnthropic()
    let accumulatedContent = ''
    let inputTokens = 0
    let outputTokens = 0

    try {
      const stream = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens
        } else if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            accumulatedContent += chunk.delta.text
            yield {
              content: accumulatedContent,
              isComplete: false
            }
          }
        } else if (chunk.type === 'message_delta') {
          outputTokens = chunk.usage.output_tokens
        } else if (chunk.type === 'message_stop') {
          const totalTokens = inputTokens + outputTokens
          const cost = calculateCost(totalTokens, model)

          yield {
            content: accumulatedContent,
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
    } catch (error: any) {
      yield {
        content: accumulatedContent,
        isComplete: true,
        error: error.message || 'Streaming failed'
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
    const systemPrompt = `You are an expert story architect specializing in creating compelling story foundations. Your task is to develop rich, detailed story foundations that will serve as the blueprint for full stories.

Create a comprehensive story foundation that includes:
1. **Story Overview** - A compelling summary that expands on the premise
2. **Main Characters** - 3-5 well-developed characters with distinct personalities, motivations, and backgrounds
3. **Setting** - Rich world-building with specific locations, time period, and atmosphere
4. **Central Conflict** - The primary tension that will drive the story forward
5. **Themes** - 2-3 meaningful themes the story will explore
6. **Plot Structure** - A three-act structure with key plot points and turning moments
7. **Tone & Style** - The narrative voice and writing style that best fits the story

Keep the foundation detailed enough to guide story development but flexible enough to allow for creative evolution during writing.`

    const prompt = `Create a story foundation for:
${title ? `Title: "${title}"` : ''}
Genre: ${genre}
Premise: ${premise}

Develop this into a comprehensive story foundation with all the elements outlined in the system prompt.`

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: 6000,
      temperature: 0.8
    })
  }

  /**
   * Stream chapter generation
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
    const systemPrompt = `You are an expert novelist with a talent for writing engaging chapters that advance both plot and character development. You excel at maintaining narrative consistency, pacing, and creating compelling prose.

Your task is to write a complete chapter that:
- Advances the main plot while developing characters
- Maintains consistency with previous chapters
- Uses vivid descriptions and engaging dialogue
- Creates appropriate pacing for the chapter's purpose
- Ends with a compelling hook or natural conclusion
- Stays true to the story's tone and style`

    const previousChapterSummaries = previousChapters
      .map(ch => `Chapter ${ch.number}: ${ch.summary}`)
      .join('\n')

    const prompt = `Write Chapter ${chapterNumber} based on the following:

STORY CONTEXT:
${storyContext}

PREVIOUS CHAPTERS:
${previousChapterSummaries}

TARGET LENGTH: Approximately ${targetWordCount} words

Write a complete, engaging chapter that continues the story naturally from where we left off.`

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: Math.ceil(targetWordCount * 1.5 / 0.75), // Estimate tokens needed
      temperature: 0.7
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
    const systemPrompts = {
      general: 'You are an expert editor specializing in comprehensive story improvement. Focus on enhancing overall quality, flow, and readability.',
      dialogue: 'You are an expert in crafting natural, engaging dialogue. Focus on making conversations more realistic, distinctive, and purposeful.',
      description: 'You are an expert in descriptive writing. Focus on creating vivid, immersive descriptions that enhance the reader experience.',
      pacing: 'You are an expert in narrative pacing. Focus on improving the rhythm and flow of the story to maintain reader engagement.',
      character: 'You are an expert in character development. Focus on making characters more distinct, relatable, and well-developed.'
    }

    const prompt = `Improve the following content based on this feedback: "${feedback}"

ORIGINAL CONTENT:
${content}

IMPROVEMENT FOCUS: ${improvementType}

Please provide the improved version that addresses the feedback while maintaining the original intent and style.`

    yield* this.streamContent({
      prompt,
      systemPrompt: systemPrompts[improvementType],
      maxTokens: Math.ceil(content.length * 1.3 / 0.75), // Estimate tokens for improved content
      temperature: 0.6
    })
  }

  /**
   * Stream story analysis and fact extraction
   */
  async *streamStoryAnalysis(content: string): AsyncGenerator<StreamResponse, void, unknown> {
    const systemPrompt = 'You are an expert story analyst. Analyze the provided content and extract key story elements including characters, settings, plot points, themes, and narrative structure. Provide insights that would be useful for continuing or improving the story.'

    const prompt = `Analyze this story content and provide a comprehensive breakdown:

${content}

Include:
1. Character analysis
2. Setting details
3. Plot progression
4. Themes and motifs
5. Writing style notes
6. Suggestions for continuation`

    yield* this.streamContent({
      prompt,
      systemPrompt,
      maxTokens: 4000,
      temperature: 0.3
    })
  }
}

// Export singleton instance
export const claudeStreamingService = new ClaudeStreamingService()

export default claudeStreamingService