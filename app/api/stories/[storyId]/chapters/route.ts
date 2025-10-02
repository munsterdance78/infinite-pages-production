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
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('tokens_remaining, tokens_used_total, words_generated')
      .eq('id', user.id)
      .single()

    const profile = data as { tokens_remaining: number; tokens_used_total: number; words_generated: number } | null

    if (profileError || !profile) {
      console.error('Database error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check token balance
    const estimatedCredits = ESTIMATED_CREDIT_COSTS.CHAPTER_GENERATION
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
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select('chapter_number, content')
      .eq('story_id', storyId)
      .lt('chapter_number', chapterNumber)
      .order('chapter_number', { ascending: true })

    const previousChapters = chaptersData as Array<{ chapter_number: number; content: string }> | null

    if (chaptersError) {
      console.error('Database error fetching chapters:', chaptersError)
      return NextResponse.json(
        { error: 'Failed to fetch previous chapters' },
        { status: 500 }
      )
    }

    // Prepare chapter context (summary column doesn't exist in DB yet)
    const previousChapterContext = (previousChapters || []).map((ch) => ({
      number: ch.chapter_number,
      content: ch.content || '',
      summary: '' // Summary column not yet in database schema
    }))

    // OUTLINE INTEGRATION: Check if outline exists for this chapter
    let { data: outlineData } = await supabase
      .from('story_outline')
      .select('*')
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .single()

    let chapterOutline = outlineData as any

    // If no outline exists, generate outlines for next 5 chapters
    if (!chapterOutline) {
      console.log(`[Chapter Generation] No outline found for chapter ${chapterNumber}, generating outlines...`)

      // Fetch all existing facts for outline generation
      const { data: allCharacters } = await supabase
        .from('character_facts')
        .select('*')
        .eq('story_id', storyId)

      const { data: allLocations } = await supabase
        .from('location_facts')
        .select('*')
        .eq('story_id', storyId)

      const { data: allEvents } = await supabase
        .from('plot_event_facts')
        .select('*')
        .eq('story_id', storyId)

      const { data: allRules } = await supabase
        .from('world_rule_facts')
        .select('*')
        .eq('story_id', storyId)

      const { data: allTimeline } = await supabase
        .from('timeline_facts')
        .select('*')
        .eq('story_id', storyId)

      const { data: allThemes } = await supabase
        .from('theme_facts')
        .select('*')
        .eq('story_id', storyId)

      try {
        const outlineResult = await claudeService.generateStoryOutline({
          story: {
            id: storyId,
            title: story.title || 'Untitled',
            premise: story.premise || '',
            genre: story.genre || 'Fiction',
            target_chapter_count: story.target_chapter_count || 30,
            foundation: story.foundation
          },
          currentChapterNumber: chapterNumber,
          chaptersToOutline: 5,
          allExistingFacts: {
            characters: allCharacters || [],
            locations: allLocations || [],
            events: allEvents || [],
            rules: allRules || [],
            timeline: allTimeline || [],
            themes: allThemes || []
          },
          storyArcTarget: 'three-act'
        })

        console.log(`[Chapter Generation] Generated outlines for chapters ${outlineResult.fromChapter}-${outlineResult.toChapter}`)

        // Save generated outlines to database
        if (outlineResult.outlines && outlineResult.outlines.length > 0) {
          for (const outline of outlineResult.outlines) {
            await (supabase as any).from('story_outline').upsert({
              story_id: storyId,
              chapter_number: outline.chapter_number,
              planned_purpose: outline.planned_purpose,
              new_characters_to_introduce: outline.new_characters_to_introduce || [],
              new_locations_to_introduce: outline.new_locations_to_introduce || [],
              conflicts_to_escalate: outline.conflicts_to_escalate || [],
              conflicts_to_resolve: outline.conflicts_to_resolve || [],
              mysteries_to_deepen: outline.mysteries_to_deepen || [],
              mysteries_to_reveal: outline.mysteries_to_reveal || [],
              emotional_target: outline.emotional_target,
              pacing_target: outline.pacing_target,
              stakes_level: outline.stakes_level,
              chapter_type: outline.chapter_type,
              key_events_planned: outline.key_events_planned || [],
              foreshadowing_to_plant: outline.foreshadowing_to_plant || [],
              callbacks_to_earlier_chapters: outline.callbacks_to_earlier_chapters || [],
              tone_guidance: outline.tone_guidance,
              word_count_target: outline.word_count_target,
              outline_generated_at: new Date().toISOString()
            }, { onConflict: 'story_id,chapter_number' })
          }

          // Fetch the outline we just created for this chapter
          const { data: newOutline } = await supabase
            .from('story_outline')
            .select('*')
            .eq('story_id', storyId)
            .eq('chapter_number', chapterNumber)
            .single()

          chapterOutline = newOutline
        }
      } catch (outlineError) {
        console.error('[Chapter Generation] Failed to generate outline:', outlineError)
        // Continue without outline if generation fails
      }
    } else {
      console.log(`[Chapter Generation] Using existing outline for chapter ${chapterNumber}`)
    }

    // PHASE 3: Fetch existing facts for consistency checking (only from last 3 chapters)
    // First, get IDs of last 3 chapters
    const { data: recentChaptersData } = await supabase
      .from('chapters')
      .select('id')
      .eq('story_id', storyId)
      .order('chapter_number', { ascending: false })
      .limit(3)

    const recentChapterIds = recentChaptersData as Array<{ id: string }> | null
    const chapterIdList = recentChapterIds?.map(ch => ch.id) || []

    // Fetch facts only from these recent chapters (if any chapters exist)
    const { data: factsData } = chapterIdList.length > 0
      ? await supabase
          .from('story_facts')
          .select('fact_type, entity_name, fact_data')
          .eq('story_id', storyId)
          .in('chapter_id', chapterIdList)
          .order('extracted_at', { ascending: false })
      : { data: null }

    const existingFacts = factsData as Array<{ fact_type: string; entity_name: string; fact_data: any }> | null

    // Build fact context grouped by type
    let factContext = ''
    if (existingFacts && existingFacts.length > 0) {
      const factsByType: Record<string, any[]> = {}

      existingFacts.forEach(fact => {
        if (!factsByType[fact.fact_type]) {
          factsByType[fact.fact_type] = []
        }
        factsByType[fact.fact_type]!.push(fact)
      })

      const sections: string[] = []

      if (factsByType['character'] && factsByType['character'].length > 0) {
        sections.push('**CHARACTERS:**\n' + factsByType['character'].map(f =>
          `- ${f.entity_name}: ${JSON.stringify(f.fact_data)}`
        ).join('\n'))
      }

      if (factsByType['location'] && factsByType['location'].length > 0) {
        sections.push('**LOCATIONS:**\n' + factsByType['location'].map(f =>
          `- ${f.entity_name}: ${JSON.stringify(f.fact_data)}`
        ).join('\n'))
      }

      if (factsByType['plot_event'] && factsByType['plot_event'].length > 0) {
        sections.push('**PLOT EVENTS:**\n' + factsByType['plot_event'].map(f =>
          `- ${f.entity_name || 'Event'}: ${JSON.stringify(f.fact_data)}`
        ).join('\n'))
      }

      if (factsByType['world_rule'] && factsByType['world_rule'].length > 0) {
        sections.push('**WORLD RULES:**\n' + factsByType['world_rule'].map(f =>
          `- ${f.entity_name || 'Rule'}: ${JSON.stringify(f.fact_data)}`
        ).join('\n'))
      }

      factContext = sections.join('\n\n')
    }

    // Generate chapter using Claude service WITH outline + facts
    let claudeResponse
    try {
      const generateParams: any = {
        storyContext: story.foundation || story,
        chapterNumber,
        previousChapters: previousChapterContext,
        targetWordCount: chapterOutline?.word_count_target || 2000,
        useOptimizedContext: true
      }

      if (chapterPlan) {
        generateParams.chapterPlan = {
          purpose: chapterPlan.purpose || 'Advance the story',
          keyEvents: Array.isArray(chapterPlan.keyEvents) ? chapterPlan.keyEvents : [],
          ...chapterPlan
        }
      }

      if (factContext) {
        generateParams.factContext = factContext
      }

      if (chapterOutline) {
        generateParams.chapterOutline = chapterOutline
      }

      claudeResponse = await claudeService.generateChapter(generateParams)
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
        // Strip markdown code blocks if present (```json ... ```)
        let contentToParse = content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

        // Try to parse as JSON
        try {
          const parsed = JSON.parse(contentToParse)
          chapterData = {
            title: parsed.title || `Chapter ${chapterNumber}`,
            content: parsed.content || contentToParse,
            summary: parsed.summary || '',
            wordCount: parsed.wordCount || (parsed.content || contentToParse).split(/\s+/).length,
            keyEvents: parsed.keyEvents || [],
            characterDevelopment: parsed.characterDevelopment || '',
            foreshadowing: parsed.foreshadowing || ''
          }
        } catch {
          // Not JSON, use as plain text
          chapterData = {
            title: `Chapter ${chapterNumber}`,
            content: contentToParse,
            summary: '',
            wordCount: contentToParse.split(/\s+/).length
          }
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

    // Save chapter to database with metadata columns (added in migration 008)
    const { data: newChapter, error: createError } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        chapter_number: chapterNumber,
        content: chapterData.content,
        word_count: wordCount,
        generation_cost_usd: costUSD,
        title: chapterData.title || `Chapter ${chapterNumber}`
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
    console.log(`[Fact Extraction] 1/3 Starting background extraction for chapter ${newChapter.id}`)
    console.log(`[Fact Extraction] Content length: ${chapterData.content.length} characters`)

    claudeService
      .extractChapterFacts({
        chapterContent: chapterData.content,
        storyId,
        chapterId: newChapter.id,
        userId: user.id,
        genre: story.genre || 'Fiction'
      })
      .then(async (factResult) => {
        console.log(`[Fact Extraction] 2/3 Extraction complete. Results:`)
        console.log(`  - Characters: ${factResult.characters?.length || 0}`)
        console.log(`  - Locations: ${factResult.locations?.length || 0}`)
        console.log(`  - Plot Events: ${factResult.plot_events?.length || 0}`)
        console.log(`  - World Rules: ${factResult.world_rules?.length || 0}`)
        console.log(`  - Timeline: ${factResult.timeline?.length || 0}`)
        console.log(`  - Themes: ${factResult.themes?.length || 0}`)
        console.log(`  - Cost: $${factResult.extractionCost.toFixed(6)}`)

        // Save facts to database (Session 2: 6 specialized tables)
        console.log(`[Fact Extraction] 3/3 Saving facts to database...`)
        const saveResult = await claudeService.saveExtractedFacts(
          {
            characters: factResult.characters || [],
            locations: factResult.locations || [],
            plot_events: factResult.plot_events || [],
            world_rules: factResult.world_rules || [],
            timeline: factResult.timeline || [],
            themes: factResult.themes || []
          },
          supabase
        )
        console.log(
          `[Fact Extraction] COMPLETE - Story: ${storyId}, Chapter: ${newChapter.id}\n` +
            `  Characters: ${saveResult.characters}, Locations: ${saveResult.locations}, ` +
            `Events: ${saveResult.events}, Rules: ${saveResult.rules}, ` +
            `Timeline: ${saveResult.timeline}, Themes: ${saveResult.themes}\n` +
            `  Total: ${saveResult.totalSaved}, Duplicates: ${saveResult.duplicatesSkipped}, ` +
            `Updated: ${saveResult.updatedWithNewDetails}, Cost: $${factResult.extractionCost.toFixed(6)}`
        )
      })
      .catch((error) => {
        console.error(
          `[Fact Extraction Error] FAILED - Story: ${storyId}, Chapter: ${newChapter.id}`,
          error
        )
        console.error('[Fact Extraction Error] Stack trace:', error.stack)
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
