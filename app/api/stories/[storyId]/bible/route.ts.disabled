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
  { params }: { params: { storyId: string } }
) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult
  const { storyId } = params

  try {
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
    const estimatedCredits = ESTIMATED_CREDIT_COSTS.FOUNDATION || 200
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

    // Fetch story details
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      console.error('Database error fetching story:', storyError)
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Validate user owns the story
    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to generate a bible for this story' },
        { status: 403 }
      )
    }

    // Generate story bible from premise
    console.log(`[Story Bible Generation] Starting for story ${storyId}`)

    const bibleData = await claudeService.generateStoryBibleFromPremise({
      premise: story.premise || '',
      genre: story.genre || 'General Fiction',
      title: story.title || '',
      storyId,
      userId: user.id
    })

    // Save extracted facts to database
    const savedFacts = await claudeService.saveExtractedFacts({
      facts: bibleData,
      storyId,
      chapterId: null, // Story-level facts
      userId: user.id
    })

    // Calculate actual tokens and cost from the generation
    const inputTokens = savedFacts.inputTokens || 0
    const outputTokens = savedFacts.outputTokens || 0
    const totalTokens = inputTokens + outputTokens
    const costUSD = savedFacts.cost || 0
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
        chapter_id: null,
        operation_type: 'story_bible_generation',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost_usd: costUSD,
        credits_used: actualCreditsUsed,
        model_used: savedFacts.model || 'claude-sonnet-4',
        success: true,
        metadata: {
          genre: story.genre,
          premise_length: story.premise?.length || 0,
          fact_counts: {
            characters: bibleData.characters.length,
            locations: bibleData.locations.length,
            world_rules: bibleData.world_rules.length,
            themes: bibleData.themes.length
          }
        }
      })

    if (logError) {
      console.error('Database error logging generation:', logError)
      // Non-critical error, continue
    }

    console.log(`[Story Bible Generation] Success for story ${storyId}:`, {
      characters: bibleData.characters.length,
      locations: bibleData.locations.length,
      world_rules: bibleData.world_rules.length,
      themes: bibleData.themes.length,
      cost: costUSD,
      tokens: totalTokens
    })

    return NextResponse.json({
      success: true,
      message: 'Story bible generated successfully',
      factCounts: {
        characters: bibleData.characters.length,
        locations: bibleData.locations.length,
        world_rules: bibleData.world_rules.length,
        themes: bibleData.themes.length,
        plot_events: 0,
        timeline: 0
      },
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
    console.error('Unexpected error in POST /api/stories/[storyId]/bible:', error)
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
