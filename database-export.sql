-- ============================================================================
-- INFINITE PAGES - DATABASE SCHEMA EXPORT
-- Complete schema for Supabase migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (Base schema)
-- ============================================================================

-- Profiles table (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  subscription_tier VARCHAR(20) DEFAULT 'basic',
  credits_balance INTEGER DEFAULT 0,
  tokens_remaining INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  premise TEXT,
  foundation JSONB,
  outline JSONB,
  characters JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  word_count INTEGER DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  target_length INTEGER DEFAULT 60000,
  target_chapters INTEGER DEFAULT 30,
  target_chapter_length INTEGER DEFAULT 2000,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  generation_cost_usd DECIMAL(10,6) DEFAULT 0,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

-- Generation logs table
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  model VARCHAR(100),
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MIGRATION 002: Story Facts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  fact_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(255),
  fact_data JSONB NOT NULL,
  source_text TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_model VARCHAR(100),
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  last_validated TIMESTAMP WITH TIME ZONE,
  validated_by_user BOOLEAN DEFAULT false,
  correction_count INTEGER DEFAULT 0,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_entity_fact UNIQUE(story_id, fact_type, entity_name)
);

-- ============================================================================
-- MIGRATION 003: Fact Tables Restructure (6 specialized tables)
-- ============================================================================

-- Character facts
CREATE TABLE IF NOT EXISTS character_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  character_name VARCHAR(255) NOT NULL,
  physical_description TEXT,
  age_mentioned VARCHAR(50),
  appearance_details TEXT,
  personality_traits JSONB DEFAULT '[]'::jsonb,
  speech_patterns JSONB DEFAULT '{"vocabulary": "", "accent": "", "verbal_tics": [], "tone": ""}'::jsonb,
  dialogue_examples JSONB DEFAULT '[]'::jsonb,
  backstory_elements JSONB DEFAULT '[]'::jsonb,
  relationships JSONB DEFAULT '[]'::jsonb,
  goals_shortterm JSONB DEFAULT '[]'::jsonb,
  goals_longterm JSONB DEFAULT '[]'::jsonb,
  fears_motivations JSONB DEFAULT '{}'::jsonb,
  internal_conflicts TEXT,
  skills_abilities JSONB DEFAULT '[]'::jsonb,
  emotional_state TEXT,
  character_arc_notes TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_character UNIQUE(story_id, character_name)
);

-- Location facts
CREATE TABLE IF NOT EXISTS location_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  physical_layout TEXT,
  atmosphere_mood TEXT,
  sensory_details JSONB DEFAULT '{"sounds": [], "smells": [], "temperature": "", "lighting": ""}'::jsonb,
  location_history TEXT,
  controlled_by TEXT,
  connected_locations JSONB DEFAULT '[]'::jsonb,
  danger_level TEXT,
  character_interactions TEXT,
  emotional_associations TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_location UNIQUE(story_id, location_name)
);

-- Plot event facts
CREATE TABLE IF NOT EXISTS plot_event_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  event_description TEXT NOT NULL,
  chapter_position INTEGER,
  characters_involved JSONB DEFAULT '[]'::jsonb,
  significance TEXT,
  immediate_consequences TEXT,
  longterm_implications TEXT,
  foreshadowing_elements TEXT,
  payoff_for_setup TEXT,
  unresolved_threads JSONB DEFAULT '[]'::jsonb,
  emotional_impact TEXT,
  tension_level TEXT,
  pacing_notes TEXT,
  stakes TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- World rule facts
CREATE TABLE IF NOT EXISTS world_rule_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT NOT NULL,
  category VARCHAR(100),
  mechanics TEXT,
  costs_limitations TEXT,
  exceptions TEXT,
  implications TEXT,
  consistency_notes TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_rule UNIQUE(story_id, rule_name)
);

-- Timeline facts
CREATE TABLE IF NOT EXISTS timeline_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  chronological_order INTEGER,
  time_reference TEXT,
  is_flashback BOOLEAN DEFAULT false,
  parallel_storyline TEXT,
  reader_knowledge_gap TEXT,
  mystery_elements TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Theme facts
CREATE TABLE IF NOT EXISTS theme_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  theme_name VARCHAR(255) NOT NULL,
  motif_description TEXT,
  symbolic_elements JSONB DEFAULT '[]'::jsonb,
  related_conflicts TEXT,
  message_meaning TEXT,
  narrative_voice TEXT,
  prose_style_notes TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  extraction_model VARCHAR(100),
  genre_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_theme UNIQUE(story_id, theme_name)
);

-- ============================================================================
-- MIGRATION 004: Story Outline System
-- ============================================================================
CREATE TABLE IF NOT EXISTS story_outline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  planned_purpose TEXT NOT NULL,
  new_characters_to_introduce JSONB DEFAULT '[]'::jsonb,
  new_locations_to_introduce JSONB DEFAULT '[]'::jsonb,
  conflicts_to_escalate JSONB DEFAULT '[]'::jsonb,
  conflicts_to_resolve JSONB DEFAULT '[]'::jsonb,
  mysteries_to_deepen JSONB DEFAULT '[]'::jsonb,
  mysteries_to_reveal JSONB DEFAULT '[]'::jsonb,
  emotional_target TEXT,
  pacing_target TEXT,
  stakes_level INTEGER CHECK (stakes_level >= 1 AND stakes_level <= 10),
  chapter_type TEXT,
  key_events_planned JSONB DEFAULT '[]'::jsonb,
  foreshadowing_to_plant JSONB DEFAULT '[]'::jsonb,
  callbacks_to_earlier_chapters JSONB DEFAULT '[]'::jsonb,
  tone_guidance TEXT,
  word_count_target INTEGER,
  outline_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_story_chapter_outline UNIQUE(story_id, chapter_number)
);

-- ============================================================================
-- MIGRATION 010: Publish Fields
-- ============================================================================
-- (Already included in stories table above)

-- ============================================================================
-- MIGRATION 011: Story Reads Table
-- ============================================================================
CREATE TABLE story_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_paid INTEGER NOT NULL DEFAULT 250,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (reader_id, story_id)
);

-- ============================================================================
-- ADDITIONAL TABLES FROM add-missing-tables.sql
-- ============================================================================

-- Subscription logs
CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  subscription_tier VARCHAR(20),
  subscription_status VARCHAR(50),
  credits_granted INTEGER,
  stripe_session_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Character voice patterns
CREATE TABLE IF NOT EXISTS character_voice_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name VARCHAR(255) NOT NULL,
  story_id VARCHAR(255) NOT NULL,
  speech_patterns JSONB DEFAULT '[]',
  vocabulary_style TEXT DEFAULT '',
  tonal_characteristics TEXT DEFAULT '',
  dialogue_examples JSONB DEFAULT '[]',
  consistency_markers JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(character_name, story_id)
);

-- Infinite pages cache
CREATE TABLE IF NOT EXISTS infinite_pages_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  cached_content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  hit_count INTEGER DEFAULT 0,
  token_cost_saved INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Claude analytics
CREATE TABLE IF NOT EXISTS claude_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  operation VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  cached BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_chapter ON chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_story_id ON generation_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_chapter_id ON generation_logs(chapter_id);

-- Fact table indexes
CREATE INDEX IF NOT EXISTS idx_story_facts_story_id ON story_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_story_facts_chapter_id ON story_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_story_facts_fact_type ON story_facts(fact_type);
CREATE INDEX IF NOT EXISTS idx_character_facts_story_id ON character_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_character_facts_character_name ON character_facts(character_name);
CREATE INDEX IF NOT EXISTS idx_location_facts_story_id ON location_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_location_facts_location_name ON location_facts(location_name);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_story_id ON plot_event_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_story_id ON world_rule_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_story_id ON timeline_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_theme_facts_story_id ON theme_facts(story_id);

-- Story outline indexes
CREATE INDEX IF NOT EXISTS idx_story_outline_story_id ON story_outline(story_id);
CREATE INDEX IF NOT EXISTS idx_story_outline_chapter_number ON story_outline(chapter_number);

-- Story reads indexes
CREATE INDEX IF NOT EXISTS idx_story_reads_reader_story ON story_reads(reader_id, story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_story_id ON story_reads(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_creator_id ON story_reads(creator_id);

-- Additional table indexes
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_story_id ON character_voice_patterns(story_id);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_content_type ON infinite_pages_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_user_id ON infinite_pages_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_user_id ON claude_analytics(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_event_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_rule_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_outline ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_voice_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE infinite_pages_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Users can view their own stories" ON stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stories" ON stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON stories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Published stories are viewable by all" ON stories FOR SELECT USING (is_published = true);

-- Chapters policies
CREATE POLICY "Users can view chapters of their stories" ON chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = chapters.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert chapters to their stories" ON chapters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = chapters.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update chapters of their stories" ON chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = chapters.story_id AND stories.user_id = auth.uid())
);

-- Generation logs policies
CREATE POLICY "Users can view their own generation logs" ON generation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert generation logs" ON generation_logs FOR INSERT WITH CHECK (true);

-- Story reads policies
CREATE POLICY "Users can view their own story unlocks" ON story_reads FOR SELECT USING (auth.uid() = reader_id);
CREATE POLICY "Creators can view unlocks of their stories" ON story_reads FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create their own story unlocks" ON story_reads FOR INSERT WITH CHECK (auth.uid() = reader_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Story unlock transaction function
CREATE OR REPLACE FUNCTION process_story_unlock(
  p_reader_id UUID,
  p_story_id UUID,
  p_creator_id UUID,
  p_unlock_cost INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_platform_share INTEGER;
  v_creator_share INTEGER;
  v_current_reader_credits INTEGER;
  v_current_creator_credits INTEGER;
BEGIN
  -- Calculate shares (50% to creator, 50% to platform)
  v_creator_share := p_unlock_cost / 2;
  v_platform_share := p_unlock_cost - v_creator_share;

  -- Check reader's credits
  SELECT credits_balance INTO v_current_reader_credits
  FROM public.profiles
  WHERE id = p_reader_id;

  IF v_current_reader_credits < p_unlock_cost THEN
    RAISE EXCEPTION 'Insufficient credits for reader %', p_reader_id;
  END IF;

  -- Deduct credits from reader
  UPDATE public.profiles
  SET credits_balance = credits_balance - p_unlock_cost
  WHERE id = p_reader_id;

  -- Add credits to creator
  UPDATE public.profiles
  SET credits_balance = credits_balance + v_creator_share
  WHERE id = p_creator_id;

  -- Insert record into story_reads
  INSERT INTO public.story_reads (reader_id, story_id, creator_id, credits_paid, unlocked_at)
  VALUES (p_reader_id, p_story_id, p_creator_id, p_unlock_cost, NOW());

  -- Log the transaction
  INSERT INTO public.generation_logs (user_id, story_id, operation_type, credits_spent, cost_usd, details)
  VALUES (p_reader_id, p_story_id, 'story_unlock_read', p_unlock_cost, p_unlock_cost * 0.001,
          jsonb_build_object(
              'reader_id', p_reader_id,
              'creator_id', p_creator_id,
              'platform_earnings', v_platform_share,
              'creator_earnings', v_creator_share
          ));
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles and subscription information';
COMMENT ON TABLE stories IS 'User-created stories with metadata and content';
COMMENT ON TABLE chapters IS 'Individual chapters within stories';
COMMENT ON TABLE generation_logs IS 'AI generation cost and usage tracking';
COMMENT ON TABLE story_reads IS 'Tracks when readers unlock stories for reading';
COMMENT ON TABLE character_facts IS 'Comprehensive character information for consistency checking';
COMMENT ON TABLE location_facts IS 'Detailed setting and atmosphere tracking';
COMMENT ON TABLE plot_event_facts IS 'Story events with pacing, stakes, and narrative structure';
COMMENT ON TABLE world_rule_facts IS 'World-building rules and systems for internal consistency';
COMMENT ON TABLE timeline_facts IS 'Chronological events and narrative timeline';
COMMENT ON TABLE theme_facts IS 'Thematic elements, motifs, and narrative style';
COMMENT ON TABLE story_outline IS 'AI-assisted chapter planning for structured story progression';

-- ============================================================================
-- EXPORT COMPLETE
-- ============================================================================
