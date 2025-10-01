import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import {
  CREDIT_SYSTEM,
  ESTIMATED_CREDIT_COSTS,
  CONTENT_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  GENERATION_TYPES
} from '@/lib/utils/constants'
import { claudeService } from '@/lib/claude/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult
  const { storyId } = params

  try {
    // Validate request body
    let requestBody: {
      chapterNumber: number
      chapterPlan?: {
        purpose?: string
        keyEvents?: string[]
        characterDevelopment?: string
        [key: string]: unknown
      }
    }

    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 }
      )
    }

    const { chapterNumber, chapterPlan } = requestBody

    // Validate chapter number
    if (
      typeof chapterNumber !== 'number' ||
      chapterNumber < 1 ||
      chapterNumber > 1000
    ) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.INVALID_INPUT,
          details: ['Chapter number must be between 1 and 1000']
        },
        { status: 400 }
      )
    }

    // Fetch user profile for token validation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens_remaining, tokens_used_total, words_generated')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Database error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check token balance
    const estimatedCredits = ESTIMATED_CREDIT_COSTS.CHAPTER
    if (profile.tokens_remaining < estimatedCredits) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.INSUFFICIENT_TOKENS,
          details: [
            `${estimatedCredits} credits required for chapter generation. ` +
              `You have ${profile.tokens_remaining} credits remaining.`
          ]
        },
        { status: 400 }
      )
    }

    // Fetch story and validate ownership
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    if (storyError) {
      console.error('Database error fetching story:', storyError)
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Validate user owns the story
    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to add chapters to this story' },
        { status: 403 }
      )
    }

    // Check if chapter already exists
    const { data: existingChapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .single()

    if (existingChapter) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.INVALID_INPUT,
          details: [`Chapter ${chapterNumber} already exists for this story`]
        },
        { status: 400 }
      )
    }

    // Fetch previous chapters for context
    const { data: previousChapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('chapter_number, content, summary')
      .eq('story_id', storyId)
      .lt('chapter_number', chapterNumber)
      .order('chapter_number', { ascending: true })

    if (chaptersError) {
      console.error('Database error fetching chapters:', chaptersError)
      return NextResponse.json(
        { error: 'Failed to fetch previous chapters' },
        { status: 500 }
      )
    }

    // Prepare chapter context
    const previousChapterContext = (previousChapters || []).map((ch) => ({
      number: ch.chapter_number,
      content: ch.content || '',
      summary: ch.summary || ''
    }))

    // Generate chapter using Claude service
    let claudeResponse
    try {
      claudeResponse = await claudeService.generateChapter({
        storyContext: story.foundation || story,
        chapterNumber,
        previousChapters: previousChapterContext,
        targetWordCount: 2000,
        chapterPlan: chapterPlan
          ? {
              purpose: chapterPlan.purpose || 'Advance the story',
              keyEvents: Array.isArray(chapterPlan.keyEvents)
                ? chapterPlan.keyEvents
                : [],
              ...chapterPlan
            }
          : undefined,
        useOptimizedContext: true
      })
    } catch (error: unknown) {
      console.error('Claude service error:', error)
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          details: ['Failed to generate chapter. Please try again.']
        },
        { status: 503 }
      )
    }

    const content = claudeResponse.content
    const inputTokens = claudeResponse.usage?.inputTokens || 0
    const outputTokens = claudeResponse.usage?.outputTokens || 0
    const costUSD = claudeResponse.cost || 0

    // Parse AI response
    let chapterData: {
      title?: string
      content: string
      summary?: string
      wordCount?: number
      keyEvents?: string[]
      characterDevelopment?: string
      foreshadowing?: string
    }

    try {
      if (typeof content === 'string') {
        const parsed = JSON.parse(content)
        chapterData = {
          title: parsed.title || `Chapter ${chapterNumber}`,
          content: parsed.content || content,
          summary: parsed.summary || '',
          wordCount: parsed.wordCount || content.split(/\s+/).length,
          keyEvents: parsed.keyEvents || [],
          characterDevelopment: parsed.characterDevelopment || '',
          foreshadowing: parsed.foreshadowing || ''
        }
      } else {
        chapterData = {
          title: `Chapter ${chapterNumber}`,
          content: JSON.stringify(content),
          summary: '',
          wordCount: JSON.stringify(content).split(/\s+/).length
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse chapter JSON, using raw content')
      chapterData = {
        title: `Chapter ${chapterNumber}`,
        content:
          typeof content === 'string' ? content : JSON.stringify(content),
        summary: '',
        wordCount: content.toString().split(/\s+/).length
      }
    }

    const wordCount = chapterData.wordCount || 0

    // Save chapter to database
    const { data: newChapter, error: createError } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        chapter_number: chapterNumber,
        title: chapterData.title || `Chapter ${chapterNumber}`,
        content: chapterData.content,
        summary: chapterData.summary || '',
        word_count: wordCount,
        tokens_used: inputTokens + outputTokens,
        generation_cost_usd: costUSD,
        metadata: {
          keyEvents: chapterData.keyEvents || [],
          characterDevelopment: chapterData.characterDevelopment || '',
          foreshadowing: chapterData.foreshadowing || '',
          optimization: (claudeResponse as { optimization?: unknown }).optimization || null
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error creating chapter:', createError)
      return NextResponse.json(
        { error: 'Failed to create chapter' },
        { status: 500 }
      )
    }

    // Update story statistics
    const { error: updateStoryError } = await supabase
      .from('stories')
      .update({
        word_count: (story.word_count || 0) + wordCount,
        chapter_count: (story.chapter_count || 0) + 1,
        total_tokens_used: (story.total_tokens_used || 0) + inputTokens + outputTokens,
        total_cost_usd: (story.total_cost_usd || 0) + costUSD,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)

    if (updateStoryError) {
      console.error('Database error updating story:', updateStoryError)
      // Non-critical error, continue
    }

    // Update user credits and statistics
    const actualCreditsUsed = CREDIT_SYSTEM.convertCostToCredits(costUSD)

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        tokens_remaining: profile.tokens_remaining - actualCreditsUsed,
        tokens_used_total:
          (profile.tokens_used_total || 0) + (inputTokens + outputTokens),
        words_generated: (profile.words_generated || 0) + wordCount
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('Database error updating profile:', updateProfileError)
      // Non-critical error, continue
    }

    // Log generation for analytics
    const { error: logError } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        story_id: storyId,
        chapter_id: newChapter.id,
        operation_type: GENERATION_TYPES.CHAPTER,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd: costUSD
      })

    if (logError) {
      console.error('Failed to log generation:', logError)
      // Non-critical error, continue
    }

    // Extract facts in background (don't await, fire and forget)
    claudeService
      .extractChapterFacts({
        chapterContent: chapterData.content,
        storyId,
        chapterId: newChapter.id,
        userId: user.id
      })
      .then(async (factResult) => {
        // Save facts to database
        const saveResult = await claudeService.saveExtractedFacts(
          factResult.facts,
          supabase
        )
        console.log(
          `[Fact Extraction] Story: ${storyId}, Chapter: ${newChapter.id} - ` +
            `Saved: ${saveResult.saved}, Failed: ${saveResult.failed}, Cost: $${factResult.extractionCost.toFixed(6)}`
        )
      })
      .catch((error) => {
        console.error(
          `[Fact Extraction Error] Story: ${storyId}, Chapter: ${newChapter.id}`,
          error
        )
      })

    // Return successful response
    return NextResponse.json(
      {
        chapter: newChapter,
        tokensUsed: actualCreditsUsed,
        remainingTokens: profile.tokens_remaining - actualCreditsUsed,
        message: SUCCESS_MESSAGES.CHAPTER_GENERATED || 'Chapter generated successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/stories/[storyId]/chapters:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: ['An unexpected error occurred. Please try again.']
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult
  const { storyId } = params

  try {
    // Verify user owns the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this story' },
        { status: 403 }
      )
    }

    // Fetch all chapters for this story
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('chapter_number', { ascending: true })

    if (chaptersError) {
      console.error('Database error fetching chapters:', chaptersError)
      return NextResponse.json(
        { error: 'Failed to fetch chapters' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { chapters: chapters || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/stories/[storyId]/chapters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    }
  })
}
