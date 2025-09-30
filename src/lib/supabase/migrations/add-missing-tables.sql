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