-- ============================================================================
-- 003-fact-tables-restructure.sql
-- Purpose: Comprehensive fact storage system for story consistency
-- Created: 2025-09-30
--
-- ⚠️ BREAKING CHANGE - NO DATA MIGRATION
-- This migration creates 6 specialized fact tables to replace the generic
-- story_facts table with rich, structured data for advanced consistency checking.
--
-- IMPORTANT:
-- - Existing data in story_facts table will NOT be migrated
-- - Old story_facts data will be ignored by the new system
-- - New fact extractions will use the new 6-table structure
-- - This is acceptable as existing facts are test data only
--
-- The new structure provides:
-- 1. character_facts - Comprehensive character tracking with voice patterns
-- 2. location_facts - Detailed settings with sensory information
-- 3. plot_event_facts - Events with pacing, stakes, and emotional impact
-- 4. world_rule_facts - Magic systems and world mechanics
-- 5. timeline_facts - Chronological tracking with mystery elements
-- 6. theme_facts - Themes, motifs, and narrative style
-- ============================================================================

-- ============================================================================
-- 1. CHARACTER_FACTS - Comprehensive character tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS character_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  character_name VARCHAR(255) NOT NULL,

  -- Physical attributes
  physical_description TEXT,
  age_mentioned VARCHAR(50),
  appearance_details TEXT,

  -- Personality and voice
  personality_traits JSONB DEFAULT '[]'::jsonb,
  speech_patterns JSONB DEFAULT '{
    "vocabulary": "",
    "accent": "",
    "verbal_tics": [],
    "tone": ""
  }'::jsonb,
  dialogue_examples JSONB DEFAULT '[]'::jsonb, -- Actual quotes for voice matching

  -- Background and relationships
  backstory_elements JSONB DEFAULT '[]'::jsonb,
  relationships JSONB DEFAULT '[]'::jsonb, -- [{with_character, relationship_type, dynamic, history}]

  -- Goals and motivations
  goals_shortterm JSONB DEFAULT '[]'::jsonb,
  goals_longterm JSONB DEFAULT '[]'::jsonb,
  fears_motivations JSONB DEFAULT '{}'::jsonb,
  internal_conflicts TEXT, -- Character's inner struggles

  -- Abilities and state
  skills_abilities JSONB DEFAULT '[]'::jsonb,
  emotional_state TEXT,
  character_arc_notes TEXT,

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_story_character UNIQUE(story_id, character_name)
);

-- Indexes for character_facts
CREATE INDEX IF NOT EXISTS idx_character_facts_story_id ON character_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_character_facts_chapter_id ON character_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_character_facts_character_name ON character_facts(character_name);
CREATE INDEX IF NOT EXISTS idx_character_facts_created_at ON character_facts(created_at DESC);

-- RLS for character_facts
ALTER TABLE character_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view character facts for their stories"
  ON character_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = character_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert character facts for their stories"
  ON character_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = character_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update character facts for their stories"
  ON character_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = character_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete character facts for their stories"
  ON character_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = character_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE character_facts IS 'Stores comprehensive character information for consistency checking and character development tracking';

-- ============================================================================
-- 2. LOCATION_FACTS - Detailed setting and atmosphere tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS location_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,

  -- Physical description
  physical_layout TEXT,
  atmosphere_mood TEXT,
  sensory_details JSONB DEFAULT '{
    "sounds": [],
    "smells": [],
    "temperature": "",
    "lighting": ""
  }'::jsonb,

  -- Context and relationships
  location_history TEXT,
  controlled_by TEXT,
  connected_locations JSONB DEFAULT '[]'::jsonb,
  danger_level TEXT,

  -- Interactions and emotions
  character_interactions TEXT,
  emotional_associations TEXT, -- How this place makes characters feel
  features JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_story_location UNIQUE(story_id, location_name)
);

-- Indexes for location_facts
CREATE INDEX IF NOT EXISTS idx_location_facts_story_id ON location_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_location_facts_chapter_id ON location_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_location_facts_location_name ON location_facts(location_name);
CREATE INDEX IF NOT EXISTS idx_location_facts_created_at ON location_facts(created_at DESC);

-- RLS for location_facts
ALTER TABLE location_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view location facts for their stories"
  ON location_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = location_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert location facts for their stories"
  ON location_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = location_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update location facts for their stories"
  ON location_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = location_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete location facts for their stories"
  ON location_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = location_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE location_facts IS 'Stores comprehensive location information for setting consistency and atmospheric continuity';

-- ============================================================================
-- 3. PLOT_EVENT_FACTS - Story events, pacing, and narrative structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS plot_event_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,

  -- Event details
  event_description TEXT NOT NULL,
  chapter_position INTEGER,
  characters_involved JSONB DEFAULT '[]'::jsonb,

  -- Significance and consequences
  significance TEXT,
  immediate_consequences TEXT,
  longterm_implications TEXT,

  -- Narrative structure
  foreshadowing_elements TEXT,
  payoff_for_setup TEXT, -- Which earlier setup does this resolve?
  unresolved_threads JSONB DEFAULT '[]'::jsonb,

  -- Reader experience
  emotional_impact TEXT, -- How should reader feel?
  tension_level TEXT, -- low/medium/high/climax
  pacing_notes TEXT, -- fast action vs slow reflection
  stakes TEXT, -- What's at risk?

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for plot_event_facts
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_story_id ON plot_event_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_chapter_id ON plot_event_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_chapter_position ON plot_event_facts(chapter_position);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_created_at ON plot_event_facts(created_at DESC);

-- RLS for plot_event_facts
ALTER TABLE plot_event_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plot events for their stories"
  ON plot_event_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = plot_event_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert plot events for their stories"
  ON plot_event_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = plot_event_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plot events for their stories"
  ON plot_event_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = plot_event_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plot events for their stories"
  ON plot_event_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = plot_event_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE plot_event_facts IS 'Stores plot events with pacing, stakes, and narrative structure for story consistency';

-- ============================================================================
-- 4. WORLD_RULE_FACTS - Magic systems, laws, and world mechanics
-- ============================================================================
CREATE TABLE IF NOT EXISTS world_rule_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,

  -- Rule definition
  rule_description TEXT NOT NULL,
  category VARCHAR(100), -- magic, social, political, technology, law
  mechanics TEXT,

  -- Constraints and exceptions
  costs_limitations TEXT,
  exceptions TEXT,
  implications TEXT,
  consistency_notes TEXT, -- How to avoid breaking this rule

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_story_rule UNIQUE(story_id, rule_name)
);

-- Indexes for world_rule_facts
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_story_id ON world_rule_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_chapter_id ON world_rule_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_category ON world_rule_facts(category);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_created_at ON world_rule_facts(created_at DESC);

-- RLS for world_rule_facts
ALTER TABLE world_rule_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view world rules for their stories"
  ON world_rule_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = world_rule_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert world rules for their stories"
  ON world_rule_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = world_rule_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update world rules for their stories"
  ON world_rule_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = world_rule_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete world rules for their stories"
  ON world_rule_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = world_rule_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE world_rule_facts IS 'Stores world-building rules and systems for internal consistency';

-- ============================================================================
-- 5. TIMELINE_FACTS - Chronological events and narrative structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,

  -- Timeline details
  event_name VARCHAR(255) NOT NULL,
  chronological_order INTEGER,
  time_reference TEXT,
  is_flashback BOOLEAN DEFAULT false,
  parallel_storyline TEXT,

  -- Reader knowledge management
  reader_knowledge_gap TEXT, -- What reader doesn't know yet
  mystery_elements TEXT, -- Unanswered questions

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for timeline_facts
CREATE INDEX IF NOT EXISTS idx_timeline_facts_story_id ON timeline_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_chapter_id ON timeline_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_chronological_order ON timeline_facts(chronological_order);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_created_at ON timeline_facts(created_at DESC);

-- RLS for timeline_facts
ALTER TABLE timeline_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline facts for their stories"
  ON timeline_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = timeline_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline facts for their stories"
  ON timeline_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = timeline_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline facts for their stories"
  ON timeline_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = timeline_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline facts for their stories"
  ON timeline_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = timeline_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE timeline_facts IS 'Stores chronological events and narrative timeline for temporal consistency';

-- ============================================================================
-- 6. THEME_FACTS - Themes, motifs, and narrative style
-- ============================================================================
CREATE TABLE IF NOT EXISTS theme_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  theme_name VARCHAR(255) NOT NULL,

  -- Theme details
  motif_description TEXT,
  symbolic_elements JSONB DEFAULT '[]'::jsonb,
  related_conflicts TEXT,
  message_meaning TEXT,

  -- Narrative style
  narrative_voice TEXT, -- first/third person, tense, style
  prose_style_notes TEXT, -- lyrical vs terse, metaphor density

  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_story_theme UNIQUE(story_id, theme_name)
);

-- Indexes for theme_facts
CREATE INDEX IF NOT EXISTS idx_theme_facts_story_id ON theme_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_theme_facts_chapter_id ON theme_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_theme_facts_theme_name ON theme_facts(theme_name);
CREATE INDEX IF NOT EXISTS idx_theme_facts_created_at ON theme_facts(created_at DESC);

-- RLS for theme_facts
ALTER TABLE theme_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view theme facts for their stories"
  ON theme_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = theme_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert theme facts for their stories"
  ON theme_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = theme_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update theme facts for their stories"
  ON theme_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = theme_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete theme facts for their stories"
  ON theme_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = theme_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

COMMENT ON TABLE theme_facts IS 'Stores thematic elements, motifs, and narrative style for tonal consistency';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- NOTE: This migration creates 6 specialized fact tables to replace story_facts
-- Next steps:
-- 1. Update fact extraction code to populate these tables
-- 2. Update fact retrieval code to query these tables
-- 3. Consider migrating existing story_facts data if needed
-- 4. Update TypeScript types to match new schema
-- ============================================================================
