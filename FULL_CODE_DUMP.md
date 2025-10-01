# FULL CODE DUMP - Infinite Pages Production

This document contains the complete, unabridged source code of 4 critical files from the Infinite Pages v3 production codebase.

---

## File 1: src/lib/supabase/migrations/add-missing-tables.sql

```sql
-- Missing Tables Migration
-- Adds tables that are referenced in code but missing from database schema
-- Priority: HIGH - These tables are causing immediate TypeScript errors

-- ============================================================================
-- 1. subscription_logs - Audit trail for subscription events
-- ============================================================================
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

-- Indexes for subscription_logs
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_event_type ON subscription_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at ON subscription_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_stripe_subscription ON subscription_logs(stripe_subscription_id);

-- RLS for subscription_logs
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription logs"
  ON subscription_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscription logs"
  ON subscription_logs FOR INSERT
  WITH CHECK (true);  -- Only service role should insert, enforced by RLS bypass

CREATE POLICY "Admins can view all subscription logs"
  ON subscription_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- 2. character_voice_patterns - Character dialogue consistency tracking
-- ============================================================================
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

-- Indexes for character_voice_patterns
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_story_id ON character_voice_patterns(story_id);
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_character_name ON character_voice_patterns(character_name);
CREATE INDEX IF NOT EXISTS idx_character_voice_patterns_created_at ON character_voice_patterns(created_at DESC);

-- RLS for character_voice_patterns
ALTER TABLE character_voice_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view character patterns for their stories"
  ON character_voice_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id::text = character_voice_patterns.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert character patterns for their stories"
  ON character_voice_patterns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id::text = character_voice_patterns.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update character patterns for their stories"
  ON character_voice_patterns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id::text = character_voice_patterns.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete character patterns for their stories"
  ON character_voice_patterns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id::text = character_voice_patterns.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. infinite_pages_cache - Content caching system
-- ============================================================================
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

-- Indexes for infinite_pages_cache
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_content_type ON infinite_pages_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_user_id ON infinite_pages_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_content_hash ON infinite_pages_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_expires_at ON infinite_pages_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_metadata ON infinite_pages_cache USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_infinite_pages_cache_lookup ON infinite_pages_cache(content_type, user_id, content_hash);

-- RLS for infinite_pages_cache
ALTER TABLE infinite_pages_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cache entries"
  ON infinite_pages_cache FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own cache entries"
  ON infinite_pages_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own cache entries"
  ON infinite_pages_cache FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own cache entries"
  ON infinite_pages_cache FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage all cache entries"
  ON infinite_pages_cache FOR ALL
  USING (true);  -- Service role bypasses RLS

-- ============================================================================
-- 4. claude_analytics - AI usage tracking and cost analytics
-- ============================================================================
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

-- Indexes for claude_analytics
CREATE INDEX IF NOT EXISTS idx_claude_analytics_user_id ON claude_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_operation ON claude_analytics(operation);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_model ON claude_analytics(model);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_created_at ON claude_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_success ON claude_analytics(success);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_cached ON claude_analytics(cached);
CREATE INDEX IF NOT EXISTS idx_claude_analytics_metadata ON claude_analytics USING GIN(metadata);

-- RLS for claude_analytics
ALTER TABLE claude_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON claude_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics"
  ON claude_analytics FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS

CREATE POLICY "Admins can view all analytics"
  ON claude_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_character_voice_patterns_updated_at
  BEFORE UPDATE ON character_voice_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Cache cleanup function (run periodically to remove expired entries)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM infinite_pages_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE subscription_logs IS 'Audit trail for subscription events (creation, updates, payments, cancellations)';
COMMENT ON TABLE character_voice_patterns IS 'Tracks character dialogue patterns for consistency across story generation';
COMMENT ON TABLE infinite_pages_cache IS 'Content caching system for reusable story elements to reduce AI costs';
COMMENT ON TABLE claude_analytics IS 'Tracks AI usage, costs, and performance metrics for analytics and optimization';

COMMENT ON COLUMN subscription_logs.event_type IS 'Event types: subscription_created, subscription_updated, subscription_cancelled, payment_succeeded, payment_failed';
COMMENT ON COLUMN character_voice_patterns.speech_patterns IS 'Array of speech pattern descriptors (JSONB)';
COMMENT ON COLUMN character_voice_patterns.dialogue_examples IS 'Array of example dialogues for consistency checking (JSONB)';
COMMENT ON COLUMN infinite_pages_cache.content_type IS 'Types: foundation, character, chapter, outline, etc.';
COMMENT ON COLUMN claude_analytics.metadata IS 'Operation-specific data (story_id, chapter_number, optimization_used, etc.)';

-- ============================================================================
-- MEDIUM PRIORITY TABLES - Choice Books & Reading Analytics
-- ============================================================================

-- ============================================================================
-- 5. reader_paths - Track individual reader journeys through choice-based stories
-- ============================================================================
CREATE TABLE IF NOT EXISTS reader_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  choices_made JSONB DEFAULT '[]',
  current_chapter VARCHAR(255),
  path_completion DECIMAL(5,2) DEFAULT 0,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  ending_reached VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for reader_paths
CREATE INDEX IF NOT EXISTS idx_reader_paths_user_id ON reader_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_reader_paths_story_id ON reader_paths(story_id);
CREATE INDEX IF NOT EXISTS idx_reader_paths_session_id ON reader_paths(session_id);
CREATE INDEX IF NOT EXISTS idx_reader_paths_session_start ON reader_paths(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_reader_paths_user_story ON reader_paths(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_reader_paths_choices ON reader_paths USING GIN(choices_made);

-- RLS for reader_paths
ALTER TABLE reader_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading paths"
  ON reader_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading paths"
  ON reader_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading paths"
  ON reader_paths FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Story creators can view paths for their stories"
  ON reader_paths FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = reader_paths.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. choice_analytics - Track user choices and decision patterns
-- ============================================================================
CREATE TABLE IF NOT EXISTS choice_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  choice_point_id VARCHAR(255) NOT NULL,
  choice_id VARCHAR(255) NOT NULL,
  selection_count INTEGER DEFAULT 0,
  average_decision_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(story_id, choice_point_id, choice_id)
);

-- Indexes for choice_analytics
CREATE INDEX IF NOT EXISTS idx_choice_analytics_story_id ON choice_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_choice_analytics_choice_point ON choice_analytics(choice_point_id);
CREATE INDEX IF NOT EXISTS idx_choice_analytics_selection_count ON choice_analytics(selection_count DESC);

-- RLS for choice_analytics
ALTER TABLE choice_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story creators can view analytics for their stories"
  ON choice_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = choice_analytics.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage choice analytics"
  ON choice_analytics FOR ALL
  USING (true);  -- Service role manages this

-- ============================================================================
-- SERIES/STORY BIBLE TABLES - Multi-book series management
-- ============================================================================

-- ============================================================================
-- 7. series - Main series table for multi-book novels
-- ============================================================================
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  planned_books INTEGER DEFAULT 1,
  universe_id VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  genre VARCHAR(100) DEFAULT '',
  target_audience VARCHAR(100) DEFAULT '',
  themes JSONB DEFAULT '[]',
  current_book_count INTEGER DEFAULT 0,
  world_rules JSONB DEFAULT '{}',
  character_relationships JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for series
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_universe_id ON series(universe_id);
CREATE INDEX IF NOT EXISTS idx_series_genre ON series(genre);
CREATE INDEX IF NOT EXISTS idx_series_created_at ON series(created_at DESC);

-- RLS for series
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own series"
  ON series FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series"
  ON series FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series"
  ON series FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series"
  ON series FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. series_facts - Comprehensive series continuity data
-- ============================================================================
CREATE TABLE IF NOT EXISTS series_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL UNIQUE,
  facts_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for series_facts
CREATE INDEX IF NOT EXISTS idx_series_facts_series_id ON series_facts(series_id);
CREATE INDEX IF NOT EXISTS idx_series_facts_data ON series_facts USING GIN(facts_data);

-- RLS for series_facts
ALTER TABLE series_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facts for their series"
  ON series_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = series_facts.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage facts for their series"
  ON series_facts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = series_facts.series_id
      AND series.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. character_arcs - Track character development across series books
-- ============================================================================
CREATE TABLE IF NOT EXISTS character_arcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  character_name VARCHAR(255) NOT NULL,
  overall_arc TEXT,
  current_book_development JSONB DEFAULT '{}',
  personality_evolution JSONB DEFAULT '[]',
  key_relationships JSONB DEFAULT '[]',
  current_status VARCHAR(100) DEFAULT 'alive',
  last_appearance_book INTEGER DEFAULT 1,
  arc_completion_percentage INTEGER DEFAULT 0,
  major_turning_points JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(series_id, character_name)
);

-- Indexes for character_arcs
CREATE INDEX IF NOT EXISTS idx_character_arcs_series_id ON character_arcs(series_id);
CREATE INDEX IF NOT EXISTS idx_character_arcs_character_name ON character_arcs(character_name);
CREATE INDEX IF NOT EXISTS idx_character_arcs_current_status ON character_arcs(current_status);
CREATE INDEX IF NOT EXISTS idx_character_arcs_completion ON character_arcs(arc_completion_percentage);

-- RLS for character_arcs
ALTER TABLE character_arcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view character arcs of their series"
  ON character_arcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = character_arcs.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert character arcs for their series"
  ON character_arcs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = character_arcs.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update character arcs of their series"
  ON character_arcs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = character_arcs.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete character arcs of their series"
  ON character_arcs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = character_arcs.series_id
      AND series.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. world_state_changes - Track world evolution throughout series
-- ============================================================================
CREATE TABLE IF NOT EXISTS world_state_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  book_number INTEGER NOT NULL,
  chapter_number INTEGER,
  change_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  scope VARCHAR(50) DEFAULT 'local',
  consequences JSONB DEFAULT '[]',
  affects_future_books BOOLEAN DEFAULT true,
  reversible BOOLEAN DEFAULT false,
  caused_by VARCHAR(255),
  duration VARCHAR(50) DEFAULT 'permanent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for world_state_changes
CREATE INDEX IF NOT EXISTS idx_world_state_changes_series_id ON world_state_changes(series_id);
CREATE INDEX IF NOT EXISTS idx_world_state_changes_book_number ON world_state_changes(book_number);
CREATE INDEX IF NOT EXISTS idx_world_state_changes_change_type ON world_state_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_world_state_changes_scope ON world_state_changes(scope);

-- RLS for world_state_changes
ALTER TABLE world_state_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view world state changes of their series"
  ON world_state_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = world_state_changes.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage world state changes of their series"
  ON world_state_changes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = world_state_changes.series_id
      AND series.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. plot_threads - Track multi-book plot threads and resolution
-- ============================================================================
CREATE TABLE IF NOT EXISTS plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  introduced_book INTEGER NOT NULL,
  current_status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(50) DEFAULT 'secondary',
  expected_resolution_book INTEGER,
  characters_involved JSONB DEFAULT '[]',
  complexity VARCHAR(50) DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for plot_threads
CREATE INDEX IF NOT EXISTS idx_plot_threads_series_id ON plot_threads(series_id);
CREATE INDEX IF NOT EXISTS idx_plot_threads_current_status ON plot_threads(current_status);
CREATE INDEX IF NOT EXISTS idx_plot_threads_priority ON plot_threads(priority);
CREATE INDEX IF NOT EXISTS idx_plot_threads_introduced_book ON plot_threads(introduced_book);

-- RLS for plot_threads
ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plot threads of their series"
  ON plot_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = plot_threads.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage plot threads of their series"
  ON plot_threads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = plot_threads.series_id
      AND series.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 12. foreshadowing_elements - Track foreshadowing and payoffs
-- ============================================================================
CREATE TABLE IF NOT EXISTS foreshadowing_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  element TEXT NOT NULL,
  introduced_book INTEGER NOT NULL,
  introduced_chapter INTEGER,
  payoff_book INTEGER,
  payoff_chapter INTEGER,
  subtlety_level VARCHAR(50) DEFAULT 'moderate',
  importance VARCHAR(50) DEFAULT 'moderate',
  status VARCHAR(50) DEFAULT 'planted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for foreshadowing_elements
CREATE INDEX IF NOT EXISTS idx_foreshadowing_series_id ON foreshadowing_elements(series_id);
CREATE INDEX IF NOT EXISTS idx_foreshadowing_status ON foreshadowing_elements(status);
CREATE INDEX IF NOT EXISTS idx_foreshadowing_introduced_book ON foreshadowing_elements(introduced_book);
CREATE INDEX IF NOT EXISTS idx_foreshadowing_importance ON foreshadowing_elements(importance);

-- RLS for foreshadowing_elements
ALTER TABLE foreshadowing_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view foreshadowing of their series"
  ON foreshadowing_elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = foreshadowing_elements.series_id
      AND series.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage foreshadowing of their series"
  ON foreshadowing_elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM series
      WHERE series.id = foreshadowing_elements.series_id
      AND series.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 13. error_reports - Server-side error tracking (BONUS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  component VARCHAR(255),
  operation VARCHAR(255),
  api_endpoint VARCHAR(255),
  status_code INTEGER,
  response_time INTEGER,
  memory_usage BIGINT,
  custom_data JSONB,
  fingerprint VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for error_reports
CREATE INDEX IF NOT EXISTS idx_error_reports_category ON error_reports(category);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_fingerprint ON error_reports(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_api_endpoint ON error_reports(api_endpoint);

-- RLS for error_reports
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert error reports"
  ON error_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all error reports"
  ON error_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- Additional Triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_reader_paths_updated_at
  BEFORE UPDATE ON reader_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_choice_analytics_updated_at
  BEFORE UPDATE ON choice_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_facts_updated_at
  BEFORE UPDATE ON series_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_arcs_updated_at
  BEFORE UPDATE ON character_arcs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plot_threads_updated_at
  BEFORE UPDATE ON plot_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foreshadowing_elements_updated_at
  BEFORE UPDATE ON foreshadowing_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Additional Comments for documentation
-- ============================================================================
COMMENT ON TABLE reader_paths IS 'Tracks individual reader journeys through choice-based stories';
COMMENT ON TABLE choice_analytics IS 'Aggregates choice selection data for analytics and optimization';
COMMENT ON TABLE series IS 'Main series table for multi-book novel management';
COMMENT ON TABLE series_facts IS 'Stores comprehensive series continuity data as JSONB';
COMMENT ON TABLE character_arcs IS 'Tracks character development and growth across series books';
COMMENT ON TABLE world_state_changes IS 'Records how the world evolves throughout a series';
COMMENT ON TABLE plot_threads IS 'Manages multi-book plot threads and their resolution tracking';
COMMENT ON TABLE foreshadowing_elements IS 'Tracks foreshadowing elements and their eventual payoffs';
COMMENT ON TABLE error_reports IS 'Server-side error monitoring and tracking system';

COMMENT ON COLUMN reader_paths.choices_made IS 'Array of choice objects with choice_id, choice_point_id, chapter_id, timestamp';
COMMENT ON COLUMN choice_analytics.average_decision_time IS 'Average time in milliseconds to make this choice';
COMMENT ON COLUMN series.world_rules IS 'Magic systems, technology levels, universal laws (JSONB)';
COMMENT ON COLUMN character_arcs.arc_completion_percentage IS 'How complete the character arc is (0-100)';
COMMENT ON COLUMN world_state_changes.scope IS 'Scale of change: local, regional, global';
COMMENT ON COLUMN plot_threads.current_status IS 'Status: active, resolved, abandoned';
COMMENT ON COLUMN foreshadowing_elements.status IS 'Status: planted, reinforced, paid_off';
COMMENT ON COLUMN error_reports.fingerprint IS 'Hash for deduplication of similar errors';
```

---

## File 2: package.json

```json
{
  "name": "infinite-pages-v3",
  "version": "3.0.0",
  "description": "AI-powered story creation platform - Optimized Architecture",
  "private": true,
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",

    "monitor:gaps": "node tools/gap-detector.js",
    "monitor:bloat": "node tools/bloat-detector.js",
    "monitor:transfer": "node tools/transfer-tracker.js report",
    "monitor:all": "npm run monitor:gaps && npm run monitor:bloat && npm run monitor:transfer",

    "flags:scan": "node tools/auto-flag-system.js",
    "flags:list": "node tools/flag-manager.js list",
    "flags:resolve": "node tools/flag-manager.js resolve",
    "flags:progress": "node tools/flag-manager.js progress",
    "flags:note": "node tools/flag-manager.js note",
    "flags:summary": "node tools/flag-manager.js summary",
    "flags:next": "node tools/flag-manager.js next",

    "transfer:complete": "node tools/transfer-tracker.js complete",
    "transfer:revisit": "node tools/transfer-tracker.js revisit",

    "vercel:deploy": "vercel deploy --prod"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@stripe/react-stripe-js": "^4.0.2",
    "@stripe/stripe-js": "^7.9.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/supabase-js": "^2.57.4",
    "@tanstack/react-query": "^5.89.0",
    "@tanstack/react-query-devtools": "^5.89.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lru-cache": "^11.2.1",
    "lucide-react": "^0.294.0",
    "next": "^14.2.32",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "stripe": "^14.7.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.5.3",
    "@types/lru-cache": "^7.10.9",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.32",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.2"
  }
}
```

---

## File 3: src/lib/claude/service.ts

```typescript
import Anthropic from '@anthropic-ai/sdk'
import {
  CLAUDE_PRICING,
  calculateCost,
  ERROR_MESSAGES,
  CONTENT_LIMITS,
  MODERATION_PATTERNS,
  INJECTION_PATTERNS
} from '@/lib/constants'
import { claudeCache } from './cache'
import { analyticsService } from './analytics'
import { promptTemplateManager } from './prompts'
import { contextOptimizer, type OptimizedContext } from './context-optimizer'
import { SFSLProcessor } from './sfsl-schema'

// Interface for Claude API errors
interface ClaudeAPIError {
  status?: number
  message?: string
}

// Constants for new fact-based features
const FACT_EXTRACTION_SYSTEM_PROMPT = 'You are a professional story analyst specializing in extracting structured facts from narrative content. Your task is to identify and organize story elements into precise, compressed facts while maintaining all essential information.'

const STORY_BIBLE_COMPLIANCE_PROMPT = 'You are a story consistency expert. Analyze the provided content against the established story facts and identify any inconsistencies, plot holes, or character voice deviations.'

// Enhanced Claude service with better error handling and features
export class ClaudeService {
  private anthropic: Anthropic | null = null
  private defaultModel: string

  constructor() {
    this.defaultModel = CLAUDE_PRICING.MODEL
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      if (!process.env['ANTHROPIC_API_KEY']) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required')
      }

      this.anthropic = new Anthropic({
        apiKey: process.env['ANTHROPIC_API_KEY']
      })
    }
    return this.anthropic
  }

  /**
   * Generate content with Claude using enhanced error handling and retry logic
   */
  async generateContent({
    prompt,
    model = this.defaultModel,
    maxTokens = 4000,
    temperature = 0.7,
    systemPrompt,
    retries = 3,
    useCache = true,
    userId,
    operation = 'general',
    trackAnalytics = true,
    context
  }: {
    prompt: string
    model?: string | undefined
    maxTokens?: number | undefined
    temperature?: number | undefined
    systemPrompt?: string | undefined
    retries?: number | undefined
    useCache?: boolean | undefined
    userId?: string | undefined
    operation?: string | undefined
    trackAnalytics?: boolean | undefined
    context?: Record<string, unknown> | undefined
  }) {
    // Validate input
    this.validateInput(prompt)

    // Check for prompt injection
    if (this.detectPromptInjection(prompt)) {
      throw new Error('Potential prompt injection detected')
    }

    // Check cache first if enabled
    if (useCache) {
      const cacheKey = claudeCache.getCachedResponse(prompt, {
        operation,
        cacheOptions: {
          model,
          maxTokens,
          temperature,
          ...(systemPrompt !== undefined && { systemPrompt })
        }
      })

      if (cacheKey) {
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: cacheKey.usage.inputTokens,
            outputTokens: cacheKey.usage.outputTokens,
            cost: cacheKey.cost,
            responseTime: 0,
            success: true,
            cached: true
          })
        }
        return cacheKey
      }
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'user' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ]

    let lastError: unknown
    const startTime = Date.now()

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.getAnthropic().messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages
        })

        const content = response.content[0]?.type === 'text'
          ? response.content[0].text
          : ''

        const usage = response.usage
        const cost = calculateCost(usage.input_tokens, usage.output_tokens)
        const responseTime = Date.now() - startTime

        // Moderate content for safety
        const moderationResult = await this.moderateContent(content)
        if (!moderationResult.isValid) {
          throw new Error(`Content moderation failed: ${moderationResult.reason}`)
        }

        const result = {
          content,
          usage: {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens
          },
          cost,
          model: response.model,
          attempt,
          responseTime
        }

        // Cache the result if enabled
        if (useCache) {
          claudeCache.cacheResponse(prompt, {
            content,
            usage: result.usage,
            model
          }, {
            ...(operation !== undefined && { operation }),
            ...(userId !== undefined && { userId }),
            cacheOptions: {
              model,
              maxTokens,
              temperature,
              ...(systemPrompt !== undefined && { systemPrompt })
            }
          })
        }

        // Track analytics
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            cost,
            responseTime,
            success: true,
            cached: false
          })
        }

        return result
      } catch (error: unknown) {
        lastError = error

        // Track failed analytics
        if (trackAnalytics) {
          await analyticsService.trackOperation({
            userId: userId || 'anonymous',
            operation,
            model,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            responseTime: Date.now() - startTime,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            cached: false
          })
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw this.handleClaudeError(error)
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw this.handleClaudeError(lastError)
  }

  /**
   * Generate story foundation with structured prompt
   */
  async generateStoryFoundation({
    title,
    genre,
    premise
  }: {
    title?: string | undefined
    genre: string
    premise: string
  }) {
    const systemPrompt = 'You are a professional story architect and creative writing expert. Your task is to create comprehensive, engaging story foundations that serve as blueprints for complete novels. Focus on creating compelling characters, well-structured plots, and rich thematic elements.'

    const prompt = `Create a comprehensive story foundation for a ${genre} story with this premise: "${premise}".

Please provide a structured JSON response with the following elements:
{
  "title": "${title || 'Untitled Story'}",
  "genre": "${genre}",
  "premise": "${premise}",
  "mainCharacters": [
    {
      "name": "Character Name",
      "role": "protagonist/antagonist/supporting",
      "description": "Detailed character description including appearance, personality, background",
      "motivation": "What drives this character",
      "arc": "How this character will change throughout the story"
    }
  ],
  "setting": {
    "time": "When the story takes place (specific era, season, etc.)",
    "place": "Where the story takes place (specific locations)",
    "atmosphere": "Mood and tone of the setting",
    "worldbuilding": "Unique aspects of this world"
  },
  "plotStructure": {
    "incitingIncident": "What kicks off the story",
    "risingAction": "Key conflicts and complications that build tension",
    "climax": "The story's turning point and highest tension",
    "fallingAction": "How tensions begin to resolve",
    "resolution": "How conflicts are ultimately resolved"
  },
  "themes": ["Primary themes and messages of the story"],
  "tone": "Overall tone and style (e.g., dark and gritty, light and humorous, etc.)",
  "targetAudience": "Who this story is intended for",
  "chapterOutline": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "What happens in this chapter",
      "purpose": "How this chapter serves the overall story",
      "keyEvents": ["Important events that occur"],
      "characterDevelopment": "How characters grow or change"
    }
  ]
}

Make this foundation comprehensive, engaging, and detailed. This will serve as the blueprint for writing a complete novel.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
    })
  }

  /**
   * Generate a chapter with optimized context (70% token reduction)
   */
  async generateChapter({
    storyContext,
    chapterNumber,
    previousChapters,
    targetWordCount = 2000,
    chapterPlan,
    useOptimizedContext = true
  }: {
    storyContext: string | Record<string, unknown>
    chapterNumber: number
    previousChapters: Array<{ number: number; content: string; summary: string }>
    targetWordCount?: number
    chapterPlan?: {
      purpose: string
      keyEvents: string[]
      [key: string]: unknown
    }
    useOptimizedContext?: boolean
  }) {
    const systemPrompt = 'You are a professional novelist and creative writing expert. Your task is to write compelling, well-crafted chapters that advance the story while maintaining consistency with established characters, plot, and themes. Focus on engaging dialogue, vivid descriptions, and meaningful character development.'

    let prompt: string
    let tokenAnalysis: {
      before_optimization: number
      after_optimization: number
      compression_ratio: number
      cost_savings_usd: number
    } | null = null

    if (useOptimizedContext && typeof storyContext === 'object') {
      // Use optimized context approach for 70% token reduction
      const optimizedContext = contextOptimizer.selectRelevantContext(
        chapterPlan || { purpose: 'advance story', keyEvents: [] },
        {
          ...storyContext,
          previousChapters
        }
      )

      // Calculate token savings
      const originalContextStr = `Story: ${JSON.stringify(storyContext)}\nPrevious: ${previousChapters.map(ch => `Ch${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}`).join('\n')}`
      tokenAnalysis = contextOptimizer.analyzeTokenReduction(originalContextStr, optimizedContext)

      prompt = this.buildOptimizedChapterPrompt(optimizedContext, chapterNumber, targetWordCount)
    } else {
      // Fallback to original verbose approach
      const previousContext = previousChapters.length > 0
        ? `Previous Chapters Context:\n${previousChapters.map(ch =>
            `Chapter ${ch.number}: ${ch.summary}\n${ch.content.slice(-500)}...`
          ).join('\n\n')}`
        : 'This is the first chapter.'

      prompt = `Write Chapter ${chapterNumber} for this story:

${typeof storyContext === 'string' ? storyContext : JSON.stringify(storyContext)}

${previousContext}

Please write a complete chapter that:
- Is approximately ${targetWordCount} words
- Maintains consistency with the story foundation and previous chapters
- Flows naturally from previous chapters (if any)
- Advances the plot meaningfully
- Includes engaging dialogue and vivid descriptions
- Develops characters in meaningful ways
- Ends with appropriate tension or resolution for this point in the story
- Uses proper pacing for this stage of the story

Return the response as JSON:
{
  "title": "Chapter ${chapterNumber} title",
  "content": "The full chapter content",
  "summary": "Brief summary of what happens in this chapter",
  "wordCount": number_of_words,
  "keyEvents": ["Important events that occur in this chapter"],
  "characterDevelopment": "How characters grow or change in this chapter",
  "foreshadowing": "Any hints or foreshadowing for future events"
}

Make this chapter compelling, well-written, and integral to the overall story.`
    }

    const result = await this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 6000,
      operation: 'chapter_generation'
    })

    // Add token optimization analytics
    if (tokenAnalysis) {
      (result as Record<string, unknown>)['optimization'] = {
        tokensSaved: tokenAnalysis.before_optimization - tokenAnalysis.after_optimization,
        compressionRatio: tokenAnalysis.compression_ratio,
        costSavings: tokenAnalysis.cost_savings_usd,
        optimizedContext: useOptimizedContext
      }
    }

    return result
  }

  /**
   * Build optimized prompt using fact-based context
   */
  private buildOptimizedChapterPrompt(context: OptimizedContext, chapterNumber: number, targetWordCount: number): string {
    const { core_facts, active_characters, recent_events, chapter_goals } = context

    return `STORY CORE:
Genre: ${core_facts.genre} | Setting: ${core_facts.setting.location} (${core_facts.setting.atmosphere})
Protagonist: ${core_facts.protagonist} | Conflict: ${core_facts.central_conflict}
Current: ${core_facts.setting.current_condition} | Features: ${core_facts.setting.key_features.join(', ')}

CHAPTER ${chapterNumber} - ${chapter_goals.primary_goal}:

ACTIVE CHARACTERS:
${active_characters.map(c => `${c.name}: wants ${c.current_goal}, ${c.key_trait}, feeling ${c.current_emotion}`).join('\n')}

RECENT EVENTS:
${recent_events.map(e => `Ch${e.number}: ${e.key_event} → ${e.consequences}`).join(' | ')}

GOALS:
1. ${chapter_goals.primary_goal}
2. ${chapter_goals.secondary_goal}
3. Advance: ${chapter_goals.plot_advancement}

Write ${targetWordCount} words. Focus on ACTION and DIALOGUE. Show don't tell.

Return as JSON:
{
  "title": "Chapter ${chapterNumber} title",
  "content": "The full chapter content",
  "summary": "Brief summary of what happens in this chapter",
  "wordCount": number_of_words,
  "keyEvents": ["Important events that occur in this chapter"],
  "characterDevelopment": "How characters grow or change in this chapter",
  "foreshadowing": "Any hints or foreshadowing for future events"
}`
  }

  /**
   * Improve existing content with specific feedback
   */
  async improveContent({
    content,
    feedback,
    improvementType = 'general'
  }: {
    content: string
    feedback: string
    improvementType?: 'general' | 'dialogue' | 'description' | 'pacing' | 'character' | undefined
  }) {
    const systemPrompt = 'You are a professional editor and writing coach. Your task is to improve existing content based on specific feedback while maintaining the author\'s voice and style. Focus on enhancing clarity, engagement, and overall quality.'

    const prompt = `Please improve the following content based on the feedback provided:

CONTENT TO IMPROVE:
${content}

FEEDBACK:
${feedback}

IMPROVEMENT TYPE: ${improvementType}

Return the improved content as JSON:
{
  "improvedContent": "The enhanced version of the content",
  "changes": ["List of specific changes made"],
  "reasoning": "Explanation of why these improvements were made",
  "wordCount": number_of_words,
  "improvementAreas": ["Areas that were specifically addressed"]
}

Focus on making meaningful improvements that enhance the overall quality while preserving the original intent and voice.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 4000
    })
  }

  /**
   * Analyze content for various metrics and suggestions
   */
  async analyzeContent(content: string) {
    const systemPrompt = 'You are a professional literary analyst and writing coach. Your task is to analyze content and provide detailed insights about writing quality, structure, and potential improvements.'

    const prompt = `Analyze the following content and provide a comprehensive assessment:

CONTENT:
${content}

Return your analysis as JSON:
{
  "overallQuality": "excellent|good|fair|needs_work",
  "wordCount": number_of_words,
  "readabilityScore": "score out of 100",
  "strengths": ["What the content does well"],
  "areasForImprovement": ["Areas that could be enhanced"],
  "writingStyle": {
    "tone": "Overall tone detected",
    "pacing": "Assessment of pacing",
    "dialogue": "Quality of dialogue (if present)",
    "description": "Quality of descriptions"
  },
  "suggestions": ["Specific actionable suggestions for improvement"],
  "targetAudience": "Who this content would appeal to",
  "genreAlignment": "How well it fits typical genre conventions"
}

Provide honest, constructive feedback that will help improve the writing quality.`

    return this.generateContent({
      prompt,
      systemPrompt,
      maxTokens: 2000
    })
  }

  /**
   * Content moderation for safety
   */
  private async moderateContent(content: string): Promise<{ isValid: boolean; reason?: string }> {
    // Check against moderation patterns
    for (const { pattern, reason } of MODERATION_PATTERNS) {
      if (pattern.test(content)) {
        return { isValid: false, reason }
      }
    }

    // Additional AI-powered moderation could be added here
    return { isValid: true }
  }

  /**
   * Detect potential prompt injection attempts
   */
  private detectPromptInjection(prompt: string): boolean {
    return INJECTION_PATTERNS.some(pattern => pattern.test(prompt))
  }

  /**
   * Validate input parameters
   */
  private validateInput(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty')
    }

    if (prompt.length > CONTENT_LIMITS.MAX_CONTENT_LENGTH) {
      throw new Error(`Prompt exceeds maximum length of ${CONTENT_LIMITS.MAX_CONTENT_LENGTH} characters`)
    }
  }

  /**
   * Handle Claude API errors with appropriate responses
   */
  private handleClaudeError(error: unknown) {
    console.error('Claude API error:', error)

    const apiError = error as ClaudeAPIError

    if (apiError.status === 429) {
      return new Error('Rate limit exceeded. Please wait a moment before trying again.')
    }

    if (apiError.status === 401) {
      return new Error('API authentication failed. Please contact support.')
    }

    if (apiError.status === 400) {
      return new Error('Invalid request. Please check your input and try again.')
    }

    if (apiError.status && apiError.status >= 500) {
      return new Error('Claude service is temporarily unavailable. Please try again later.')
    }

    return new Error(apiError.message || 'An unexpected error occurred with Claude.')
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    const nonRetryableStatuses = [400, 401, 403, 422]
    const apiError = error as ClaudeAPIError
    return apiError.status !== undefined && nonRetryableStatuses.includes(apiError.status)
  }

  /**
   * Generate content using a prompt template
   */
  async generateWithTemplate(
    templateId: string,
    variables: Array<{ name: string; value: string | number | boolean | string[] }>,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      userId?: string
      useCache?: boolean
      trackAnalytics?: boolean
    } = {}
  ) {
    const template = promptTemplateManager.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const prompt = promptTemplateManager.renderTemplate(templateId, variables)

    return this.generateContent({
      prompt,
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      userId: options.userId,
      operation: template.category,
      useCache: options.useCache,
      trackAnalytics: options.trackAnalytics
    })
  }

  /**
   * Batch generate content using multiple prompts
   */
  async batchGenerate(
    prompts: Array<{
      id: string
      prompt: string
      model?: string
      maxTokens?: number
      temperature?: number
      userId?: string
      operation?: string
    }>,
    options: {
      maxConcurrency?: number
      useCache?: boolean
      trackAnalytics?: boolean
    } = {}
  ) {
    const { batchProcessor } = await import('./batch')

    const operations = prompts.map(prompt => ({
      id: prompt.id,
      type: (prompt.operation || 'general') as 'story_foundation' | 'chapter_generation' | 'content_improvement' | 'content_analysis' | 'general',
      params: {
        prompt: prompt.prompt,
        model: prompt.model,
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature
      },
      userId: prompt.userId
    }))

    batchProcessor.addOperations(operations)
    return await batchProcessor.processBatch()
  }

  /**
   * Get analytics data
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }) {
    return await analyticsService.getAnalytics(timeRange)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return claudeCache.getStats()
  }

  /**
   * Clear cache
   */
  clearCache() {
    claudeCache.clear()
  }

  /**
   * Get prompt templates
   */
  getPromptTemplates(category?: string) {
    if (category) {
      return promptTemplateManager.getTemplatesByCategory(category)
    }
    return promptTemplateManager.getAllTemplates()
  }

  /**
   * Search prompt templates
   */
  searchPromptTemplates(query: string) {
    return promptTemplateManager.searchTemplates(query)
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance and cost' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable, highest cost' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest, most cost-effective' }
    ]
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const cacheStats = this.getCacheStats()
    const analytics = await this.getAnalytics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    })

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
        hitRate: 0 // Would need to track this separately
      },
      analytics: {
        totalRequests: analytics.totalRequests,
        successRate: analytics.successRate,
        averageResponseTime: analytics.averageResponseTime
      },
      models: this.getAvailableModels()
    }
  }

  // NEW: Fact extraction using existing infrastructure
  async extractAndCompressFacts({
    content,
    storyContext,
    factType = 'chapter'
  }: {
    content: string
    storyContext: Record<string, unknown>
    factType: 'universe' | 'series' | 'book' | 'chapter'
  }) {
    // Use existing generateContent() infrastructure
    const response = await this.generateContent({
      prompt: this.buildFactExtractionPrompt(content, storyContext, factType),
      systemPrompt: FACT_EXTRACTION_SYSTEM_PROMPT,
      operation: 'fact_extraction',
      useCache: true,
      trackAnalytics: true,
      userId: typeof storyContext['userId'] === 'string' ? storyContext['userId'] : undefined
    })

    // Process using new SFSL system
    const sfslProcessor = new SFSLProcessor()
    const facts = this.parseExtractedFacts(response.content)
    const compressed = sfslProcessor.compressFacts(facts)

    return {
      facts,
      compressed,
      compressionRatio: content.length / compressed.length,
      cost: response.cost,
      usage: response.usage
    }
  }

  // NEW: Generate with fact-based context
  async generateWithFactContext({
    storyId,
    chapterGoals,
    factHierarchy
  }: {
    storyId: string
    chapterGoals: {
      number: number
      targetWordCount?: number
      [key: string]: unknown
    }
    factHierarchy: Record<string, unknown>
  }) {
    // Use existing generateChapter with enhanced context
    const optimizedContext = contextOptimizer.selectRelevantFactContext(
      {
        purpose: chapterGoals['purpose'],
        keyEvents: chapterGoals['keyEvents'],
        plotAdvancement: chapterGoals['plotAdvancement']
      } as Parameters<typeof contextOptimizer.selectRelevantFactContext>[0],
      factHierarchy
    )

    return this.generateChapter({
      storyContext: optimizedContext as unknown as Record<string, unknown>,
      chapterNumber: chapterGoals.number,
      useOptimizedContext: true,
      targetWordCount: chapterGoals.targetWordCount || 2000,
      previousChapters: [],
      chapterPlan: {
        ...chapterGoals,
        purpose: (typeof chapterGoals['purpose'] === 'string' ? chapterGoals['purpose'] : undefined) || 'Advance the story',
        keyEvents: Array.isArray(chapterGoals['keyEvents']) ? chapterGoals['keyEvents'] : []
      }
    })
  }

  // NEW: Story bible compliance checking
  async analyzeStoryConsistency(storyId: string, newContent: string) {
    const storyFacts = await this.getStoredFacts(storyId)

    return this.generateContent({
      prompt: this.buildConsistencyAnalysisPrompt(newContent, storyFacts),
      systemPrompt: STORY_BIBLE_COMPLIANCE_PROMPT,
      operation: 'story_consistency_analysis',
      useCache: true
    })
  }

  // NEW: Enhanced content improvement with fact awareness
  async enhanceWithFactContext(content: string, storyFacts: Record<string, unknown>, feedback: string) {
    return this.improveContent({
      content,
      feedback: `${feedback}\n\nStory Context: ${JSON.stringify(storyFacts)}`,
      improvementType: 'general'
    })
  }

  // Helper methods for new functionality
  private buildFactExtractionPrompt(content: string, storyContext: Record<string, unknown>, factType: string): string {
    return `Extract structured facts from this ${factType} content:

CONTENT:
${content}

STORY CONTEXT:
${JSON.stringify(storyContext)}

Extract facts in these categories:
- Characters: names, traits, goals, relationships, voice patterns
- World: settings, rules, limitations, unique aspects
- Plot: threads, stakes, progression, consequences
- Timeline: events, impacts, character effects

Return as structured JSON with precise, compressed facts.`
  }

  private parseExtractedFacts(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content)
    } catch (e) {
      // Fallback parsing for non-JSON responses
      return {
        characters: this.extractCharacterFacts(content),
        world: this.extractWorldFacts(content),
        plot: this.extractPlotFacts(content),
        timeline: this.extractTimelineFacts(content)
      }
    }
  }

  private buildConsistencyAnalysisPrompt(newContent: string, storyFacts: Record<string, unknown>): string {
    return `Analyze this new content for consistency with established story facts:

NEW CONTENT:
${newContent}

ESTABLISHED STORY FACTS:
${JSON.stringify(storyFacts)}

Check for:
1. Character voice consistency
2. World-building rule violations
3. Timeline inconsistencies
4. Plot contradictions
5. Relationship/motivation conflicts

Return detailed analysis with specific issues and suggestions.`
  }

  private async getStoredFacts(storyId: string): Promise<Record<string, unknown>> {
    // This would typically fetch from database
    // For now, return empty structure
    return {
      characters: {},
      world: {},
      plot: {},
      timeline: {}
    }
  }

  private extractCharacterFacts(content: string): { names: string[] } {
    // Simple extraction logic - could be enhanced
    const names = content.match(/([A-Z][a-z]+)/g) || []
    return { names: Array.from(new Set(names)) }
  }

  private extractWorldFacts(content: string): { locations: string[] } {
    const locations = content.match(/(?:in|at|near)\s+([A-Z][a-z\s]+)/g) || []
    return { locations }
  }

  private extractPlotFacts(content: string): { key_events: string[] } {
    const events = content.split(/[.!?]+/).filter(s => s.length > 20).slice(0, 3)
    return { key_events: events }
  }

  private extractTimelineFacts(content: string): { markers: string[] } {
    const timeMarkers = content.match(/(?:after|before|during|when)\s+([^.]+)/gi) || []
    return { markers: timeMarkers }
  }
}

// Export singleton instance
export const claudeService = new ClaudeService()
```

---

## File 4: app/api/stories/route.ts

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { isAuthSuccess } from '@/lib/auth/utils'
import {
  CREDIT_SYSTEM,
  ESTIMATED_CREDIT_COSTS,
  CONTENT_LIMITS,
  ALLOWED_GENRES,
  GENERATION_TYPES,
  MODERATION_PATTERNS,
  INJECTION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getSubscriptionLimits
} from '@/lib/utils/constants'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/utils/subscription-config'
import { subscriptionAwareRateLimit, logRateLimitViolation } from '@/lib/middleware/rate-limit'
import { infinitePagesCache } from '@/lib/claude/infinitePagesCache'
import { claudeService } from '@/lib/claude/service'

// Using the centralized Claude service instead of direct Anthropic client

// Input validation schemas using constants
const createStorySchema = {
  title: {
    required: false,
    type: 'string' as const,
    minLength: 0,
    maxLength: CONTENT_LIMITS.STORY_TITLE_MAX_LENGTH,
    sanitize: true
  },
  genre: {
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: CONTENT_LIMITS.GENRE_MAX_LENGTH,
    allowedValues: [...ALLOWED_GENRES]
  },
  premise: {
    required: true,
    type: 'string' as const,
    minLength: CONTENT_LIMITS.PREMISE_MIN_LENGTH,
    maxLength: CONTENT_LIMITS.PREMISE_MAX_LENGTH,
    sanitize: true
  }
}

type ValidationRule = {
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
  sanitize?: boolean;
}

type ValidationSchema = Record<string, ValidationRule>

// Validation helper functions
function validateInput(data: any, schema: ValidationSchema): { isValid: boolean; errors: string[]; sanitizedData: any } {
  const errors: string[] = []
  const sanitizedData: any = {}

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field]

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitizedData[field] = rule.type === 'string' ? '' : null
      continue
    }

    // Type validation
    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`)
      continue
    }

    if (rule.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`)
      continue
    }

    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${field} must be a boolean`)
      continue
    }

    // String-specific validations
    if (rule.type === 'string') {
      const stringValue = value as string

      // Length validation
      if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters long`)
        continue
      }

      if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
        errors.push(`${field} must not exceed ${rule.maxLength} characters`)
        continue
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(stringValue)) {
        errors.push(`${field} must be one of: ${rule.allowedValues.join(', ')}`)
        continue
      }

      // Sanitization
      if (rule.sanitize) {
        sanitizedData[field] = sanitizeString(stringValue)
      } else {
        sanitizedData[field] = stringValue
      }
    } else {
      sanitizedData[field] = value
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  }
}

function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, CONTENT_LIMITS.MAX_CONTENT_LENGTH) // Hard limit on length
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult

  // Apply rate limiting for general API requests
  const rateLimitResult = await subscriptionAwareRateLimit(
    request,
    'API_GENERAL'
  )

  if (rateLimitResult) {
    logRateLimitViolation('API_GENERAL', 'free', user.id)
    return rateLimitResult
  }

  try {
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        chapters (
          id, chapter_number, title, word_count,
          generation_cost_usd, created_at
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error fetching stories:', error)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    // Add rate limit headers to successful response
    const response = NextResponse.json(
      { stories },
      { headers: { 'Content-Type': 'application/json' } }
    )
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, String(value))
    })

    return response
  } catch (error) {
    console.error('Unexpected error in GET /api/stories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!isAuthSuccess(authResult)) return authResult

  const { user, supabase } = authResult

  try {
    // Get user profile first to determine subscription tier for rate limiting
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens_remaining, subscription_tier, stories_created, tokens_used_total, words_generated')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Database error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check subscription tier limits for story creation
    const tierConfig = SUBSCRIPTION_TIERS[profile.subscription_tier as SubscriptionTier]
    const limits = tierConfig?.features
    if (limits && typeof limits.stories_limit === 'number' && profile.stories_created >= limits.stories_limit) {
      return NextResponse.json({
        error: `Monthly story limit reached (${limits.stories_limit} for ${profile.subscription_tier} tier)`,
        upgrade_required: profile.subscription_tier === 'basic',
        current_tier: profile.subscription_tier,
        feature: 'story_creation'
      }, { status: 403 })
    }

    // Apply rate limiting for story creation with subscription awareness
    const rateLimitResult = await subscriptionAwareRateLimit(
      request,
      'STORY_CREATION'
    )

    if (rateLimitResult) {
      logRateLimitViolation('STORY_CREATION', 'free', user.id)
      return rateLimitResult
    }

    // Parse and validate request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json({ error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
    }

    // Validate input
    const validation = validateInput(requestBody, createStorySchema)
    if (!validation.isValid) {
      return NextResponse.json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        details: validation.errors
      }, { status: 400 })
    }

    const { title, genre, premise } = validation.sanitizedData
    const tierLimits = SUBSCRIPTION_TIERS[profile.subscription_tier as SubscriptionTier]?.features

    // Check story limits based on subscription
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: monthlyStories, error: storiesError } = await supabase
      .from('stories')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    if (storiesError) {
      console.error('Database error checking monthly stories:', storiesError)
      return NextResponse.json({ error: 'Failed to check story limits' }, { status: 500 })
    }

    const monthlyCount = monthlyStories?.length || 0

    if (tierLimits && typeof tierLimits.stories_limit === 'number' && monthlyCount >= tierLimits.stories_limit) {
      return NextResponse.json({
        error: ERROR_MESSAGES.MONTHLY_LIMIT_REACHED,
        details: [
          `You have created ${monthlyCount} stories this month. ` +
          (profile.subscription_tier === 'basic'
            ? 'Upgrade to Premium for more stories.'
            : 'Contact support if you need a higher limit.')
        ]
      }, { status: 400 })
    }

    // Check token balance using constants
    const estimatedCredits = ESTIMATED_CREDIT_COSTS.STORY_FOUNDATION
    if (profile.tokens_remaining < estimatedCredits) {
      return NextResponse.json({
        error: ERROR_MESSAGES.INSUFFICIENT_TOKENS,
        details: [
          `${estimatedCredits} credits required for story foundation. ` +
          `You have ${profile.tokens_remaining} credits remaining.`
        ]
      }, { status: 400 })
    }

    // PRIORITY 1: Generate story foundation with caching for 80% cost savings
    let claudeResponse
    let tokensSaved = 0
    let fromCache = false
    let cacheType = 'none'

    try {
      // Use the caching wrapper for immediate cost savings
      const cachedResult = await infinitePagesCache.wrapFoundationGeneration(
        () => claudeService.generateStoryFoundation({
          title,
          genre,
          premise
        }),
        genre as any, // Type assertion for now
        premise,
        user.id,
        title,
        { includeWritingTips: false }
      )

      claudeResponse = cachedResult.result
      tokensSaved = cachedResult.tokensSaved
      fromCache = cachedResult.fromCache
      cacheType = cachedResult.cacheType || 'none'

      console.log(`[Foundation Generation] ${fromCache ? 'CACHE HIT' : 'NEW GENERATION'} - Tokens saved: ${tokensSaved}, Type: ${cacheType}`)

    } catch (error: any) {
      console.error('Claude service error:', error)
      return NextResponse.json({
        error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        details: ['Please try again in a few moments.']
      }, { status: 503 })
    }

    const content = claudeResponse.content
    const inputTokens = claudeResponse.usage?.inputTokens || 0
    const outputTokens = claudeResponse.usage?.outputTokens || 0
    const costUSD = claudeResponse.cost || 0

    // Parse AI response (cached responses may already be parsed)
    let foundation
    try {
      if (typeof claudeResponse === 'object' && claudeResponse.content) {
        foundation = typeof claudeResponse.content === 'string'
          ? JSON.parse(claudeResponse.content)
          : claudeResponse.content
      } else if (typeof content === 'string') {
        foundation = JSON.parse(content)
      } else {
        foundation = claudeResponse // Already parsed from cache
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, storing as text:', parseError)
      foundation = typeof claudeResponse === 'object' ? claudeResponse : { content, rawResponse: true }
    }

    // Enhanced content moderation using constants
    const moderationResult = await moderateContent(content)
    if (!moderationResult.isValid) {
      console.warn('Content moderation failed:', moderationResult.reasons)
      return NextResponse.json({
        error: ERROR_MESSAGES.CONTENT_VIOLATION,
        details: ['Please try rephrasing your premise to avoid prohibited content.']
      }, { status: 400 })
    }

    const wordCount = content.split(/\s+/).length

    // Create story in database with transaction-like behavior
    const { data: story, error: createError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Story',
        genre,
        premise,
        foundation,
        total_tokens_used: inputTokens + outputTokens,
        total_cost_usd: costUSD,
        status: 'draft',
        word_count: wordCount,
        chapter_count: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error creating story:', createError)
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
    }

    // Update user credits based on actual AI cost (no additional markup)
    const actualCreditsUsed = CREDIT_SYSTEM.convertCostToCredits(costUSD)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        tokens_remaining: profile.tokens_remaining - actualCreditsUsed,
        tokens_used_total: (profile.tokens_used_total || 0) + (inputTokens + outputTokens),
        stories_created: profile.stories_created + 1,
        words_generated: (profile.words_generated || 0) + wordCount
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error updating profile:', updateError)
      // Note: Story was created but profile update failed - this should be logged for manual review
    }

    // Log generation for analytics using constants
    const { error: logError } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        story_id: story.id,
        operation_type: GENERATION_TYPES.FOUNDATION,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd: costUSD
      })

    if (logError) {
      console.error('Failed to log generation:', logError)
      // Non-critical error, continue
    }

    // Create successful response with rate limit headers and cache info
    const response = NextResponse.json({
      story,
      tokensUsed: actualCreditsUsed,
      tokensSaved: tokensSaved,
      fromCache: fromCache,
      cacheType: cacheType,
      remainingTokens: profile.tokens_remaining - actualCreditsUsed,
      message: fromCache
        ? `${SUCCESS_MESSAGES.STORY_CREATED} (${tokensSaved} tokens saved from cache)`
        : SUCCESS_MESSAGES.STORY_CREATED
    }, { headers: { 'Content-Type': 'application/json' } })

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, String(value))
    })

    return response

  } catch (error) {
    console.error('Unexpected error in POST /api/stories:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: ['An unexpected error occurred. Please try again.']
    }, { status: 500, headers: { 'Content-Type': 'application/json' } })
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

interface ModerationResult {
  isValid: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

async function moderateContent(content: string): Promise<ModerationResult> {
  const result: ModerationResult = {
    isValid: true,
    reasons: [],
    severity: 'low',
    confidence: 0
  }

  const lowerContent = content.toLowerCase()
  let severityScore = 0
  let totalChecks = 0

  // Use constants for moderation patterns with severity scoring
  for (const { pattern, reason } of MODERATION_PATTERNS) {
    totalChecks++
    if (pattern.test(lowerContent)) {
      result.isValid = false
      result.reasons.push(reason)

      // Assign severity scores based on violation type
      switch (reason) {
        case 'explicit sexual content':
        case 'graphic violence':
        case 'hate speech':
          severityScore += 3
          break
        case 'illegal activities':
        case 'self-harm content':
          severityScore += 2
          break
        default:
          severityScore += 1
      }
    }
  }

  // Check for excessive length using constants
  if (content.length > CONTENT_LIMITS.MAX_CONTENT_LENGTH) {
    result.isValid = false
    result.reasons.push('content too long')
    severityScore += 1
    totalChecks++
  }

  // Check for potential prompt injection attempts using constants
  for (const pattern of INJECTION_PATTERNS) {
    totalChecks++
    if (pattern.test(content)) {
      result.isValid = false
      result.reasons.push('potential prompt injection')
      severityScore += 2
      break
    }
  }

  // Enhanced checks for AI-specific issues
  const aiPatterns = [
    { pattern: /ignore.{0,20}instructions/gi, reason: 'instruction bypass attempt', severity: 2 },
    { pattern: /assistant.{0,20}refuse/gi, reason: 'refusal bypass attempt', severity: 2 },
    { pattern: /roleplaying.{0,20}(evil|harmful)/gi, reason: 'harmful roleplay', severity: 2 },
    { pattern: /\b(jailbreak|DAN|do anything now)\b/gi, reason: 'jailbreak attempt', severity: 3 }
  ]

  for (const { pattern, reason, severity } of aiPatterns) {
    totalChecks++
    if (pattern.test(content)) {
      result.isValid = false
      result.reasons.push(reason)
      severityScore += severity
    }
  }

  // Calculate confidence and severity
  result.confidence = Math.min(1, severityScore / Math.max(totalChecks, 1))

  if (severityScore >= 5) {
    result.severity = 'high'
  } else if (severityScore >= 2) {
    result.severity = 'medium'
  } else if (severityScore >= 1) {
    result.severity = 'low'
  }

  // Additional context-aware checks
  const suspiciousPatterns = [
    /\b(bomb|weapon|kill|murder|death)\b.*\b(how|make|create|build)\b/gi,
    /\b(drug|narcotic)\b.*\b(synthesize|manufacture|cook)\b/gi,
    /\b(hack|exploit|breach)\b.*\b(system|database|account)\b/gi
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      result.isValid = false
      result.reasons.push('suspicious instructional content')
      result.severity = 'high'
      break
    }
  }

  // Log moderation results for improvement
  if (!result.isValid) {
    console.warn('Content moderation violation:', {
      reasons: result.reasons,
      severity: result.severity,
      confidence: result.confidence,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    })
  }

  return result
}
```

---

**End of Full Code Dump**
