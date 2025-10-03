import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Fetch published stories with creator information
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        genre,
        premise,
        target_length,
        word_count,
        chapter_count,
        is_published,
        published_at,
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching published stories:', error)
      return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 })
    }

    return NextResponse.json({ 
      stories: stories || [],
      count: stories?.length || 0
    })

  } catch (error) {
    console.error('Error in library API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
