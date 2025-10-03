import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storyId } = params

    // Check if already unlocked
    const { data: existingUnlock, error: unlockCheckError } = await supabase
      .from('story_reads')
      .select('id')
      .eq('reader_id', user.id)
      .eq('story_id', storyId)
      .single()

    if (unlockCheckError && unlockCheckError.code !== 'PGRST116') {
      console.error('Error checking unlock status:', unlockCheckError)
      return NextResponse.json({ error: 'Failed to check unlock status' }, { status: 500 })
    }

    if (existingUnlock) {
      return NextResponse.json({ 
        success: true, 
        message: 'Story already unlocked',
        already_unlocked: true
      })
    }

    // Verify story is published and get creator info
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, title, is_published')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    if (!story.is_published) {
      return NextResponse.json({ error: 'Story is not published' }, { status: 400 })
    }

    // Check if user is trying to unlock their own story
    if (story.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot unlock your own story' }, { status: 400 })
    }

    // Get reader's current credit balance
    const { data: readerProfile, error: readerError } = await supabase
      .from('profiles')
      .select('tokens_remaining, credits_balance')
      .eq('id', user.id)
      .single()

    if (readerError || !readerProfile) {
      return NextResponse.json({ error: 'Reader profile not found' }, { status: 404 })
    }

    const readerCredits = readerProfile.credits_balance || readerProfile.tokens_remaining
    const unlockCost = 250

    if (readerCredits < unlockCost) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        details: `You need ${unlockCost} credits to unlock this story. You have ${readerCredits} credits.`
      }, { status: 400 })
    }

    // Get creator's current credit balance
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('tokens_remaining, credits_balance')
      .eq('id', story.user_id)
      .single()

    if (creatorError || !creatorProfile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    const creatorCredits = creatorProfile.credits_balance || creatorProfile.tokens_remaining

    // Calculate earnings split
    const creatorEarnings = 125 // 50% of 250
    const platformEarnings = 125 // 50% of 250

    // Use admin client for transaction
    const adminClient = createClientAdmin(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!
    )

    // Process the unlock transaction atomically
    const { error: transactionError } = await adminClient.rpc('process_story_unlock', {
      p_reader_id: user.id,
      p_story_id: storyId,
      p_creator_id: story.user_id,
      p_unlock_cost: unlockCost,
      p_creator_earnings: creatorEarnings,
      p_platform_earnings: platformEarnings
    })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return NextResponse.json({ error: 'Failed to process unlock transaction' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Story unlocked successfully',
      credits_deducted: unlockCost,
      creator_earned: creatorEarnings
    })

  } catch (error) {
    console.error('Error in unlock API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
