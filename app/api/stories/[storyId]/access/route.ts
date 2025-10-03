import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'User not authenticated' 
      })
    }

    const { storyId } = params

    // Check if user is the creator
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id, is_published')
      .eq('id' as any, storyId as any)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'Story not found' 
      })
    }

    // Creator always has access
    if (story.user_id === user.id) {
      return NextResponse.json({ 
        hasAccess: true, 
        reason: 'User is the creator',
        isCreator: true
      })
    }

    // Check if story is published
    if (!story.is_published) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'Story is not published' 
      })
    }

    // Check if user has unlocked the story
    const { data: unlock, error: unlockError } = await supabase
      .from('story_reads')
      .select('id, unlocked_at')
      .eq('reader_id', user.id)
      .eq('story_id', storyId)
      .single()

    if (unlockError && unlockError.code !== 'PGRST116') {
      console.error('Error checking unlock status:', unlockError)
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'Error checking access status' 
      })
    }

    if (unlock) {
      return NextResponse.json({ 
        hasAccess: true, 
        reason: 'User has unlocked this story',
        unlockedAt: unlock.unlocked_at
      })
    }

    // No access
    return NextResponse.json({ 
      hasAccess: false, 
      reason: 'Please unlock this story to read it',
      unlockRequired: true
    })

  } catch (error) {
    console.error('Error in access check API:', error)
    return NextResponse.json({ 
      hasAccess: false, 
      reason: 'Internal server error' 
    })
  }
}
