-- ============================================================================
-- 004-story-outline-system.sql
-- Purpose: Story outline planning system for structured chapter progression
-- Created: 2025-09-30
--
-- This migration creates the story_outline table for AI-assisted chapter planning.
-- Enables the system to plan ahead, track narrative arcs, manage mysteries,
-- control pacing, and ensure satisfying story progression.
--
-- Key features:
-- - Plan what each chapter should accomplish before writing
-- - Track character/location introductions
-- - Manage conflict escalation and resolution
-- - Plan mystery reveals and foreshadowing
-- - Control emotional beats and pacing
-- - Reference callbacks to earlier chapters
-- ============================================================================

-- ============================================================================
-- STORY_OUTLINE - Chapter planning and narrative structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_outline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,

  -- Chapter purpose and goals
  planned_purpose TEXT NOT NULL, -- What this chapter should accomplish

  -- Character and location introductions
  new_characters_to_introduce JSONB DEFAULT '[]'::jsonb, -- [{name, role, introduction_context}]
  new_locations_to_introduce JSONB DEFAULT '[]'::jsonb, -- [{name, why_visiting}]

  -- Conflict management
  conflicts_to_escalate JSONB DEFAULT '[]'::jsonb, -- [{conflict_type, how_it_escalates}]
  conflicts_to_resolve JSONB DEFAULT '[]'::jsonb, -- [{conflict_type, resolution_approach}]

  -- Mystery and revelation tracking
  mysteries_to_deepen JSONB DEFAULT '[]'::jsonb, -- [{mystery, new_clue}]
  mysteries_to_reveal JSONB DEFAULT '[]'::jsonb, -- [{mystery, what_gets_revealed}]

  -- Emotional and pacing targets
  emotional_target TEXT, -- triumph/tension/loss/wonder/fear/hope/despair
  pacing_target TEXT, -- slow/moderate/fast/climax
  stakes_level INTEGER CHECK (stakes_level >= 1 AND stakes_level <= 10), -- 1-10 escalation tracking
  chapter_type TEXT, -- setup/development/climax/resolution/transition

  -- Event planning
  key_events_planned JSONB DEFAULT '[]'::jsonb, -- Brief event descriptions

  -- Narrative structure
  foreshadowing_to_plant JSONB DEFAULT '[]'::jsonb, -- [{element, payoff_chapter}]
  callbacks_to_earlier_chapters JSONB DEFAULT '[]'::jsonb, -- [{chapter_ref, what_to_callback}]

  -- Writing guidance
  tone_guidance TEXT, -- How this chapter should feel (dark, hopeful, mysterious, etc.)
  word_count_target INTEGER,

  -- Metadata
  outline_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure one outline per chapter per story
  CONSTRAINT unique_story_chapter_outline UNIQUE(story_id, chapter_number)
);

-- Indexes for story_outline
CREATE INDEX IF NOT EXISTS idx_story_outline_story_id ON story_outline(story_id);
CREATE INDEX IF NOT EXISTS idx_story_outline_chapter_number ON story_outline(chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_outline_story_chapter ON story_outline(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_outline_chapter_type ON story_outline(chapter_type);
CREATE INDEX IF NOT EXISTS idx_story_outline_created_at ON story_outline(created_at DESC);

-- RLS for story_outline
ALTER TABLE story_outline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view outlines for their stories"
  ON story_outline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_outline.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outlines for their stories"
  ON story_outline FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_outline.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outlines for their stories"
  ON story_outline FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_outline.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outlines for their stories"
  ON story_outline FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_outline.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE story_outline IS 'Stores AI-assisted chapter planning for structured story progression with conflict, mystery, and pacing management';
COMMENT ON COLUMN story_outline.planned_purpose IS 'What this chapter should accomplish narratively';
COMMENT ON COLUMN story_outline.new_characters_to_introduce IS 'Characters to introduce: [{name, role, introduction_context}]';
COMMENT ON COLUMN story_outline.new_locations_to_introduce IS 'Locations to introduce: [{name, why_visiting}]';
COMMENT ON COLUMN story_outline.conflicts_to_escalate IS 'Conflicts to intensify: [{conflict_type, how_it_escalates}]';
COMMENT ON COLUMN story_outline.conflicts_to_resolve IS 'Conflicts to resolve: [{conflict_type, resolution_approach}]';
COMMENT ON COLUMN story_outline.mysteries_to_deepen IS 'Mysteries to develop: [{mystery, new_clue}]';
COMMENT ON COLUMN story_outline.mysteries_to_reveal IS 'Mysteries to reveal: [{mystery, what_gets_revealed}]';
COMMENT ON COLUMN story_outline.emotional_target IS 'Target emotional beat: triumph/tension/loss/wonder/fear/hope/despair';
COMMENT ON COLUMN story_outline.pacing_target IS 'Target pacing: slow/moderate/fast/climax';
COMMENT ON COLUMN story_outline.stakes_level IS 'Stakes intensity from 1 (low) to 10 (maximum)';
COMMENT ON COLUMN story_outline.chapter_type IS 'Narrative function: setup/development/climax/resolution/transition';
COMMENT ON COLUMN story_outline.key_events_planned IS 'Brief descriptions of planned events';
COMMENT ON COLUMN story_outline.foreshadowing_to_plant IS 'Elements to foreshadow: [{element, payoff_chapter}]';
COMMENT ON COLUMN story_outline.callbacks_to_earlier_chapters IS 'References to earlier chapters: [{chapter_ref, what_to_callback}]';
COMMENT ON COLUMN story_outline.tone_guidance IS 'How this chapter should feel (dark, hopeful, mysterious, tense, etc.)';
COMMENT ON COLUMN story_outline.word_count_target IS 'Target word count for this chapter';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get next chapter outline based on story progression
CREATE OR REPLACE FUNCTION get_next_chapter_plan(p_story_id UUID)
RETURNS TABLE (
  next_chapter_number INTEGER,
  previous_stakes_level INTEGER,
  last_emotional_target TEXT,
  unresolved_conflicts JSONB,
  active_mysteries JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(MAX(so.chapter_number), 0) + 1 as next_chapter_number,
    (SELECT stakes_level FROM story_outline WHERE story_id = p_story_id ORDER BY chapter_number DESC LIMIT 1) as previous_stakes_level,
    (SELECT emotional_target FROM story_outline WHERE story_id = p_story_id ORDER BY chapter_number DESC LIMIT 1) as last_emotional_target,
    (SELECT jsonb_agg(conflicts_to_escalate) FROM story_outline WHERE story_id = p_story_id AND conflicts_to_escalate != '[]'::jsonb) as unresolved_conflicts,
    (SELECT jsonb_agg(mysteries_to_deepen) FROM story_outline WHERE story_id = p_story_id AND mysteries_to_deepen != '[]'::jsonb) as active_mysteries
  FROM story_outline so
  WHERE so.story_id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_next_chapter_plan IS 'Helper function to determine next chapter planning based on story progression';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create AI service method to generate chapter outlines
-- 2. Integrate outline data into chapter generation
-- 3. Build outline visualization UI
-- 4. Add outline modification endpoints
-- ============================================================================
