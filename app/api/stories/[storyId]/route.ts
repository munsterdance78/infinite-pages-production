import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult
  const { storyId } = params

  try {
    // Fetch story with ownership validation
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    const story = storyData as any

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
        { error: 'You do not have permission to view this story' },
        { status: 403 }
      )
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Unexpected error in GET /api/stories/[storyId]:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
