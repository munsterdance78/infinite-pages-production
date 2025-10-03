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

    // Verify user owns the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, is_published')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 })
    }

    // Type guard to ensure story has the expected properties
    if (!story || typeof story !== 'object' || !('is_published' in story)) {
      return NextResponse.json({ error: 'Invalid story data' }, { status: 500 })
    }

    if (story.is_published) {
      return NextResponse.json({ error: 'Story is already published' }, { status: 400 })
    }

    // Update story to published
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', storyId)

    if (updateError) {
      console.error('Error publishing story:', updateError)
      return NextResponse.json({ error: 'Failed to publish story' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Story published successfully',
      published_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in publish API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
