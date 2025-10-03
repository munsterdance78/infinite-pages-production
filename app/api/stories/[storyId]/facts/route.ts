import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  const supabase = createClient()
  const { storyId } = params

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Verify user owns the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id')
      .filter('id', 'eq', storyId)
      .single()

    if (storyError || !story) {
      console.error('Error fetching story or story not found:', storyError?.message)
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 })
    }

    // Type guard to ensure story has the expected properties
    if (!story || typeof story !== 'object' || !('user_id' in story)) {
      return NextResponse.json({ error: 'Invalid story data' }, { status: 500 })
    }

    if (story.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // 3. Fetch all fact types in parallel
    const [
      characterFactsResult,
      characterVoicePatternsResult,
      locationFactsResult,
      plotEventFactsResult,
      themeFactsResult,
      worldStateChangesResult
    ] = await Promise.all([
      // Character facts
      supabase
        .from('character_facts')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('character_name', { ascending: true }),

      // Character voice patterns
      supabase
        .from('character_voice_patterns')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('character_name', { ascending: true }),

      // Location facts
      supabase
        .from('location_facts')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('location_name', { ascending: true }),

      // Plot event facts
      supabase
        .from('plot_event_facts')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('chapter_position', { ascending: true, nullsFirst: false }),

      // Theme facts
      supabase
        .from('theme_facts')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('theme_name', { ascending: true }),

      // World state changes
      supabase
        .from('world_state_changes')
        .select('*')
        .filter('story_id', 'eq', storyId)
        .order('created_at', { ascending: true })
    ])

    // 4. Check for errors
    const errors = [
      characterFactsResult.error,
      characterVoicePatternsResult.error,
      locationFactsResult.error,
      plotEventFactsResult.error,
      themeFactsResult.error,
      worldStateChangesResult.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Error fetching facts:', errors)
      return NextResponse.json({ error: 'Failed to fetch story facts' }, { status: 500 })
    }

    // 5. Return structured data
    const facts = {
      characters: characterFactsResult.data || [],
      character_voices: characterVoicePatternsResult.data || [],
      locations: locationFactsResult.data || [],
      plot_events: plotEventFactsResult.data || [],
      themes: themeFactsResult.data || [],
      world_states: worldStateChangesResult.data || []
    }

    return NextResponse.json({ facts }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in /api/stories/[storyId]/facts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
