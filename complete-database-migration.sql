-- ============================================================================
-- INFINITE PAGES - COMPLETE DATABASE MIGRATION
-- All migrations 001-011 combined into one comprehensive SQL file
-- Run this in Supabase SQL Editor to set up the complete database schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (Base schema - migrations 001-008)
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
-- MIGRATION 010: Publish Fields (already included in stories table above)
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_stories_target_length ON stories(target_length);
CREATE INDEX IF NOT EXISTS idx_stories_target_chapters ON stories(target_chapters);
CREATE INDEX IF NOT EXISTS idx_stories_target_chapter_length ON stories(target_chapter_length);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_chapter ON chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_word_count ON chapters(word_count);
CREATE INDEX IF NOT EXISTS idx_chapters_generation_cost ON chapters(generation_cost_usd);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_story_id ON generation_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_chapter_id ON generation_logs(chapter_id);

-- Fact table indexes
CREATE INDEX IF NOT EXISTS idx_story_facts_story_id ON story_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_story_facts_chapter_id ON story_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_story_facts_fact_type ON story_facts(fact_type);
CREATE INDEX IF NOT EXISTS idx_story_facts_entity_name ON story_facts(entity_name);
CREATE INDEX IF NOT EXISTS idx_story_facts_extracted_at ON story_facts(extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_facts_data ON story_facts USING GIN(fact_data);
CREATE INDEX IF NOT EXISTS idx_story_facts_lookup ON story_facts(story_id, fact_type, entity_name);

CREATE INDEX IF NOT EXISTS idx_character_facts_story_id ON character_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_character_facts_chapter_id ON character_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_character_facts_character_name ON character_facts(character_name);
CREATE INDEX IF NOT EXISTS idx_character_facts_created_at ON character_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_facts_extraction_model ON character_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_character_facts_genre_metadata ON character_facts USING GIN(genre_metadata);

CREATE INDEX IF NOT EXISTS idx_location_facts_story_id ON location_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_location_facts_chapter_id ON location_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_location_facts_location_name ON location_facts(location_name);
CREATE INDEX IF NOT EXISTS idx_location_facts_created_at ON location_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_facts_extraction_model ON location_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_location_facts_genre_metadata ON location_facts USING GIN(genre_metadata);

CREATE INDEX IF NOT EXISTS idx_plot_event_facts_story_id ON plot_event_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_chapter_id ON plot_event_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_chapter_position ON plot_event_facts(chapter_position);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_created_at ON plot_event_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_extraction_model ON plot_event_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_genre_metadata ON plot_event_facts USING GIN(genre_metadata);

CREATE INDEX IF NOT EXISTS idx_world_rule_facts_story_id ON world_rule_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_chapter_id ON world_rule_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_category ON world_rule_facts(category);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_created_at ON world_rule_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_extraction_model ON world_rule_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_genre_metadata ON world_rule_facts USING GIN(genre_metadata);

CREATE INDEX IF NOT EXISTS idx_timeline_facts_story_id ON timeline_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_chapter_id ON timeline_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_chronological_order ON timeline_facts(chronological_order);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_created_at ON timeline_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_extraction_model ON timeline_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_genre_metadata ON timeline_facts USING GIN(genre_metadata);

CREATE INDEX IF NOT EXISTS idx_theme_facts_story_id ON theme_facts(story_id);
CREATE INDEX IF NOT EXISTS idx_theme_facts_chapter_id ON theme_facts(chapter_id);
CREATE INDEX IF NOT EXISTS idx_theme_facts_theme_name ON theme_facts(theme_name);
CREATE INDEX IF NOT EXISTS idx_theme_facts_created_at ON theme_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_theme_facts_extraction_model ON theme_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_theme_facts_genre_metadata ON theme_facts USING GIN(genre_metadata);

-- Story outline indexes
CREATE INDEX IF NOT EXISTS idx_story_outline_story_id ON story_outline(story_id);
CREATE INDEX IF NOT EXISTS idx_story_outline_chapter_number ON story_outline(chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_outline_story_chapter ON story_outline(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_story_outline_chapter_type ON story_outline(chapter_type);
CREATE INDEX IF NOT EXISTS idx_story_outline_created_at ON story_outline(created_at DESC);

-- Story reads indexes
CREATE INDEX IF NOT EXISTS idx_story_reads_reader_story ON story_reads(reader_id, story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_story_id ON story_reads(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_creator_id ON story_reads(creator_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_unlocked_at ON story_reads(unlocked_at);

-- Additional table indexes
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_story_id ON character_voice_patterns(story_id);
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_character_name ON character_voice_patterns(character_name);
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_created_at ON character_voice_patterns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_event_type ON subscription_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at ON subscription_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_stripe_subscription ON subscription_logs(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_content_type ON infinite_pages_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_user_id ON infinite_pages_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_content_hash ON infinite_pages_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_expires_at ON infinite_pages_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_metadata ON infinite_pages_cache USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_lookup ON infinite_pages_cache(content_type, user_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_claude_analytics_user_id ON claude_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_operation ON claude_analytics(operation);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_model ON claude_analytics(model);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_created_at ON claude_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_success ON claude_analytics(success);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_cached ON claude_analytics(cached);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_metadata ON claude_analytics USING GIN(metadata);

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
ALTER TABLE character_voice_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;
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

-- Story facts policies
CREATE POLICY "Users can view facts for their stories" ON story_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Service role can insert facts" ON story_facts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update facts" ON story_facts FOR UPDATE USING (true);

-- Character facts policies
CREATE POLICY "Users can view character facts for their stories" ON character_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = character_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert character facts for their stories" ON character_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = character_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update character facts for their stories" ON character_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = character_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete character facts for their stories" ON character_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = character_facts.story_id AND stories.user_id = auth.uid())
);

-- Location facts policies
CREATE POLICY "Users can view location facts for their stories" ON location_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = location_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert location facts for their stories" ON location_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = location_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update location facts for their stories" ON location_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = location_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete location facts for their stories" ON location_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = location_facts.story_id AND stories.user_id = auth.uid())
);

-- Plot event facts policies
CREATE POLICY "Users can view plot events for their stories" ON plot_event_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = plot_event_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert plot events for their stories" ON plot_event_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = plot_event_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update plot events for their stories" ON plot_event_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = plot_event_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete plot events for their stories" ON plot_event_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = plot_event_facts.story_id AND stories.user_id = auth.uid())
);

-- World rule facts policies
CREATE POLICY "Users can view world rules for their stories" ON world_rule_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = world_rule_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert world rules for their stories" ON world_rule_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = world_rule_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update world rules for their stories" ON world_rule_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = world_rule_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete world rules for their stories" ON world_rule_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = world_rule_facts.story_id AND stories.user_id = auth.uid())
);

-- Timeline facts policies
CREATE POLICY "Users can view timeline facts for their stories" ON timeline_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = timeline_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert timeline facts for their stories" ON timeline_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = timeline_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update timeline facts for their stories" ON timeline_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = timeline_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete timeline facts for their stories" ON timeline_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = timeline_facts.story_id AND stories.user_id = auth.uid())
);

-- Theme facts policies
CREATE POLICY "Users can view theme facts for their stories" ON theme_facts FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = theme_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert theme facts for their stories" ON theme_facts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = theme_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update theme facts for their stories" ON theme_facts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = theme_facts.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete theme facts for their stories" ON theme_facts FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = theme_facts.story_id AND stories.user_id = auth.uid())
);

-- Story outline policies
CREATE POLICY "Users can view outlines for their stories" ON story_outline FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_outline.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert outlines for their stories" ON story_outline FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_outline.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update outlines for their stories" ON story_outline FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_outline.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete outlines for their stories" ON story_outline FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_outline.story_id AND stories.user_id = auth.uid())
);

-- Story reads policies
CREATE POLICY "Users can view their own story unlocks" ON story_reads FOR SELECT USING (auth.uid() = reader_id);
CREATE POLICY "Creators can view unlocks of their stories" ON story_reads FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create their own story unlocks" ON story_reads FOR INSERT WITH CHECK (auth.uid() = reader_id);

-- Character voice patterns policies
CREATE POLICY "Users can view character patterns for their stories" ON character_voice_patterns FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id::text = character_voice_patterns.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can insert character patterns for their stories" ON character_voice_patterns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stories WHERE stories.id::text = character_voice_patterns.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can update character patterns for their stories" ON character_voice_patterns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id::text = character_voice_patterns.story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users can delete character patterns for their stories" ON character_voice_patterns FOR DELETE USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id::text = character_voice_patterns.story_id AND stories.user_id = auth.uid())
);

-- Subscription logs policies
CREATE POLICY "Users can view their own subscription logs" ON subscription_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert subscription logs" ON subscription_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all subscription logs" ON subscription_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- Infinite pages cache policies
CREATE POLICY "Users can view their own cache entries" ON infinite_pages_cache FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own cache entries" ON infinite_pages_cache FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own cache entries" ON infinite_pages_cache FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete their own cache entries" ON infinite_pages_cache FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Service role can manage all cache entries" ON infinite_pages_cache FOR ALL USING (true);

-- Claude analytics policies
CREATE POLICY "Users can view their own analytics" ON claude_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert analytics" ON claude_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all analytics" ON claude_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

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

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION process_story_unlock TO service_role;

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

CREATE TRIGGER update_story_facts_updated_at
  BEFORE UPDATE ON story_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_facts_updated_at
  BEFORE UPDATE ON character_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_facts_updated_at
  BEFORE UPDATE ON location_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plot_event_facts_updated_at
  BEFORE UPDATE ON plot_event_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_rule_facts_updated_at
  BEFORE UPDATE ON world_rule_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_facts_updated_at
  BEFORE UPDATE ON timeline_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_facts_updated_at
  BEFORE UPDATE ON theme_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_outline_updated_at
  BEFORE UPDATE ON story_outline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_reads_updated_at
  BEFORE UPDATE ON story_reads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_voice_patterns_updated_at
  BEFORE UPDATE ON character_voice_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles and subscription information';
COMMENT ON TABLE stories IS 'User-created stories with metadata and content';
COMMENT ON TABLE chapters IS 'Individual chapters within stories';
COMMENT ON TABLE generation_logs IS 'AI generation cost and usage tracking';
COMMENT ON TABLE story_facts IS 'Stores extracted facts from story chapters for consistency checking and context building';
COMMENT ON TABLE character_facts IS 'Comprehensive character information for consistency checking and character development tracking';
COMMENT ON TABLE location_facts IS 'Detailed setting and atmosphere tracking for setting consistency and atmospheric continuity';
COMMENT ON TABLE plot_event_facts IS 'Story events with pacing, stakes, and narrative structure for story consistency';
COMMENT ON TABLE world_rule_facts IS 'World-building rules and systems for internal consistency';
COMMENT ON TABLE timeline_facts IS 'Chronological events and narrative timeline for temporal consistency';
COMMENT ON TABLE theme_facts IS 'Thematic elements, motifs, and narrative style for tonal consistency';
COMMENT ON TABLE story_outline IS 'AI-assisted chapter planning for structured story progression with conflict, mystery, and pacing management';
COMMENT ON TABLE story_reads IS 'Tracks when readers unlock stories for reading';
COMMENT ON TABLE character_voice_patterns IS 'Tracks character dialogue patterns for consistency across story generation';
COMMENT ON TABLE subscription_logs IS 'Audit trail for subscription events (creation, updates, payments, cancellations)';
COMMENT ON TABLE infinite_pages_cache IS 'Content caching system for reusable story elements to reduce AI costs';
COMMENT ON TABLE claude_analytics IS 'Tracks AI usage, costs, and performance metrics for analytics and optimization';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration creates the complete database schema for Infinite Pages
-- All tables, indexes, RLS policies, functions, and triggers are included
-- Run this in Supabase SQL Editor to set up the complete database
-- ============================================================================
