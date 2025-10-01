import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import {
  CREDIT_SYSTEM,
  ESTIMATED_CREDIT_COSTS,
  ERROR_MESSAGES
} from '@/lib/utils/constants'
import { claudeService } from '@/lib/claude/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string; chapterNumber: string } }
) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult
  const { storyId, chapterNumber } = params

  try {
    // Parse chapter number
    const chapterNum = parseInt(chapterNumber, 10)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      )
    }

    // Fetch user profile for token validation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens_remaining, tokens_used_total')
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
    const estimatedCredits = ESTIMATED_CREDIT_COSTS.ANALYSIS || 50
    if (profile.tokens_remaining < estimatedCredits) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.INSUFFICIENT_TOKENS,
          details: {
            required: estimatedCredits,
            available: profile.tokens_remaining
          }
        },
        { status: 402 }
      )
    }

    // Verify story exists and user owns it
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id, genre')
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
        { error: 'You do not have permission to analyze this story' },
        { status: 403 }
      )
    }

    // Fetch chapter by story_id + chapter_number
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNum)
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: `Chapter ${chapterNum} not found` },
        { status: 404 }
      )
    }

    // Analyze chapter content
    console.log(`[Chapter Analysis] Starting for chapter ${chapterNum} of story ${storyId}`)

    const analysisResult = await claudeService.analyzeContent(chapter.content)

    // Calculate tokens and cost
    const inputTokens = analysisResult.usage?.inputTokens || 0
    const outputTokens = analysisResult.usage?.outputTokens || 0
    const totalTokens = inputTokens + outputTokens
    const costUSD = analysisResult.cost || 0
    const actualCreditsUsed = CREDIT_SYSTEM.convertCostToCredits(costUSD)

    // Update user credits and statistics
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        tokens_remaining: profile.tokens_remaining - actualCreditsUsed,
        tokens_used_total: (profile.tokens_used_total || 0) + totalTokens
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('Database error updating profile:', updateProfileError)
      // Non-critical error, continue
    }

    // Log to generation_logs table
    const { error: logError } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        story_id: storyId,
        chapter_id: chapter.id,
        operation_type: 'chapter_analysis',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost_usd: costUSD,
        credits_used: actualCreditsUsed,
        model_used: analysisResult.model || 'claude-sonnet-4',
        success: true,
        metadata: {
          chapter_number: chapterNum,
          word_count: chapter.word_count || 0,
          genre: story.genre
        }
      })

    if (logError) {
      console.error('Database error logging analysis:', logError)
      // Non-critical error, continue
    }

    console.log(`[Chapter Analysis] Success for chapter ${chapterNum}:`, {
      cost: costUSD,
      tokens: totalTokens
    })

    return NextResponse.json({
      success: true,
      analysis: analysisResult.content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        costUSD,
        creditsUsed: actualCreditsUsed
      },
      creditsRemaining: profile.tokens_remaining - actualCreditsUsed
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/stories/[storyId]/chapters/[chapterNumber]/analyze:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
