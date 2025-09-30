-- Series Architecture Database Migrations
-- Multi-book novel creation system

-- Series table
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  description TEXT,
  total_planned_books INTEGER DEFAULT 1,
  current_book_count INTEGER DEFAULT 0,
  world_rules JSONB DEFAULT '{}',
  character_relationships JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Character arcs table
CREATE TABLE IF NOT EXISTS character_arcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  character_name VARCHAR(255) NOT NULL,
  overall_arc TEXT,
  current_book_development JSONB DEFAULT '{}',
  personality_evolution JSONB DEFAULT '[]',
  key_relationships JSONB DEFAULT '[]',
  current_status VARCHAR(100) DEFAULT 'alive',
  last_appearance_book INTEGER DEFAULT 1,
  arc_completion_percentage INTEGER DEFAULT 0,
  major_turning_points JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(series_id, character_name)
);

-- World state changes table
CREATE TABLE IF NOT EXISTS world_state_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  book_number INTEGER NOT NULL,
  chapter_number INTEGER,
  change_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  scope VARCHAR(50) DEFAULT 'local',
  consequences JSONB DEFAULT '[]',
  affects_future_books BOOLEAN DEFAULT TRUE,
  reversible BOOLEAN DEFAULT FALSE,
  caused_by VARCHAR(255),
  duration VARCHAR(50) DEFAULT 'permanent',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plot threads table
CREATE TABLE IF NOT EXISTS plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  introduced_book INTEGER NOT NULL,
  current_status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(50) DEFAULT 'secondary',
  expected_resolution_book INTEGER,
  characters_involved JSONB DEFAULT '[]',
  complexity VARCHAR(50) DEFAULT 'moderate',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Foreshadowing elements table
CREATE TABLE IF NOT EXISTS foreshadowing_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  element TEXT NOT NULL,
  introduced_book INTEGER NOT NULL,
  introduced_chapter INTEGER,
  payoff_book INTEGER,
  payoff_chapter INTEGER,
  subtlety_level VARCHAR(50) DEFAULT 'moderate',
  importance VARCHAR(50) DEFAULT 'moderate',
  status VARCHAR(50) DEFAULT 'planted',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Series analytics table
CREATE TABLE IF NOT EXISTS series_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  total_books INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  avg_words_per_chapter INTEGER DEFAULT 0,
  character_arc_completion_rate DECIMAL(5,2) DEFAULT 0,
  plot_thread_resolution_rate DECIMAL(5,2) DEFAULT 0,
  world_consistency_score DECIMAL(5,2) DEFAULT 0,
  timeline_coherence_score DECIMAL(5,2) DEFAULT 0,
  cost_per_book DECIMAL(10,4) DEFAULT 0,
  generation_time_per_book INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update existing stories table to support series
ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS book_number INTEGER DEFAULT 1;

-- Add series context to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS series_context JSONB DEFAULT '{}';

-- Add series optimization tracking to generation logs
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE SET NULL;
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS book_number INTEGER;
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS context_optimization_metrics JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_genre ON series(genre);
CREATE INDEX IF NOT EXISTS idx_character_arcs_series_id ON character_arcs(series_id);
CREATE INDEX IF NOT EXISTS idx_character_arcs_character_name ON character_arcs(character_name);
CREATE INDEX IF NOT EXISTS idx_world_state_changes_series_id ON world_state_changes(series_id);
CREATE INDEX IF NOT EXISTS idx_world_state_changes_book_number ON world_state_changes(book_number);
CREATE INDEX IF NOT EXISTS idx_plot_threads_series_id ON plot_threads(series_id);
CREATE INDEX IF NOT EXISTS idx_plot_threads_status ON plot_threads(current_status);
CREATE INDEX IF NOT EXISTS idx_foreshadowing_series_id ON foreshadowing_elements(series_id);
CREATE INDEX IF NOT EXISTS idx_foreshadowing_status ON foreshadowing_elements(status);
CREATE INDEX IF NOT EXISTS idx_stories_series_id ON stories(series_id);
CREATE INDEX IF NOT EXISTS idx_stories_book_number ON stories(book_number);
CREATE INDEX IF NOT EXISTS idx_generation_logs_series_id ON generation_logs(series_id);

-- Row Level Security (RLS) policies
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own series" ON series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own series" ON series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own series" ON series FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own series" ON series FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE character_arcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view character arcs of their series" ON character_arcs FOR SELECT
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = character_arcs.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can insert character arcs for their series" ON character_arcs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM series WHERE series.id = character_arcs.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can update character arcs of their series" ON character_arcs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = character_arcs.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can delete character arcs of their series" ON character_arcs FOR DELETE
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = character_arcs.series_id AND series.user_id = auth.uid()));

ALTER TABLE world_state_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view world state changes of their series" ON world_state_changes FOR SELECT
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = world_state_changes.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can insert world state changes for their series" ON world_state_changes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM series WHERE series.id = world_state_changes.series_id AND series.user_id = auth.uid()));

ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view plot threads of their series" ON plot_threads FOR SELECT
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = plot_threads.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can manage plot threads for their series" ON plot_threads FOR ALL
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = plot_threads.series_id AND series.user_id = auth.uid()));

ALTER TABLE foreshadowing_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view foreshadowing elements of their series" ON foreshadowing_elements FOR SELECT
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = foreshadowing_elements.series_id AND series.user_id = auth.uid()));
CREATE POLICY "Users can manage foreshadowing elements for their series" ON foreshadowing_elements FOR ALL
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = foreshadowing_elements.series_id AND series.user_id = auth.uid()));

ALTER TABLE series_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analytics of their series" ON series_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM series WHERE series.id = series_analytics.series_id AND series.user_id = auth.uid()));
CREATE POLICY "System can insert series analytics" ON series_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update series analytics" ON series_analytics FOR UPDATE USING (true);

-- Functions for series management
CREATE OR REPLACE FUNCTION update_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_series_updated_at_trigger
  BEFORE UPDATE ON series
  FOR EACH ROW
  EXECUTE FUNCTION update_series_updated_at();

CREATE TRIGGER update_character_arcs_updated_at_trigger
  BEFORE UPDATE ON character_arcs
  FOR EACH ROW
  EXECUTE FUNCTION update_series_updated_at();

CREATE TRIGGER update_plot_threads_updated_at_trigger
  BEFORE UPDATE ON plot_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_series_updated_at();

CREATE TRIGGER update_foreshadowing_elements_updated_at_trigger
  BEFORE UPDATE ON foreshadowing_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_series_updated_at();

CREATE TRIGGER update_series_analytics_updated_at_trigger
  BEFORE UPDATE ON series_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_series_updated_at();

-- Function to calculate series analytics
CREATE OR REPLACE FUNCTION calculate_series_analytics(series_uuid UUID)
RETURNS VOID AS $$
DECLARE
  book_count INTEGER;
  chapter_count INTEGER;
  word_count INTEGER;
  character_count INTEGER;
  avg_words INTEGER;
  arc_completion DECIMAL(5,2);
  thread_resolution DECIMAL(5,2);
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO book_count FROM stories WHERE series_id = series_uuid;

  SELECT COUNT(*) INTO chapter_count
  FROM chapters c
  JOIN stories s ON c.story_id = s.id
  WHERE s.series_id = series_uuid;

  SELECT COALESCE(SUM(s.word_count), 0) INTO word_count
  FROM stories s
  WHERE s.series_id = series_uuid;

  SELECT COUNT(DISTINCT character_name) INTO character_count
  FROM character_arcs
  WHERE series_id = series_uuid;

  -- Calculate average words per chapter
  IF chapter_count > 0 THEN
    avg_words := word_count / chapter_count;
  ELSE
    avg_words := 0;
  END IF;

  -- Calculate character arc completion rate
  SELECT COALESCE(AVG(arc_completion_percentage), 0) INTO arc_completion
  FROM character_arcs
  WHERE series_id = series_uuid;

  -- Calculate plot thread resolution rate
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE current_status = 'resolved') * 100.0 / COUNT(*))
    END INTO thread_resolution
  FROM plot_threads
  WHERE series_id = series_uuid;

  -- Insert or update analytics
  INSERT INTO series_analytics (
    series_id, total_books, total_chapters, total_words, total_characters,
    avg_words_per_chapter, character_arc_completion_rate, plot_thread_resolution_rate
  ) VALUES (
    series_uuid, book_count, chapter_count, word_count, character_count,
    avg_words, arc_completion, thread_resolution
  )
  ON CONFLICT (series_id) DO UPDATE SET
    total_books = EXCLUDED.total_books,
    total_chapters = EXCLUDED.total_chapters,
    total_words = EXCLUDED.total_words,
    total_characters = EXCLUDED.total_characters,
    avg_words_per_chapter = EXCLUDED.avg_words_per_chapter,
    character_arc_completion_rate = EXCLUDED.character_arc_completion_rate,
    plot_thread_resolution_rate = EXCLUDED.plot_thread_resolution_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to series_analytics
ALTER TABLE series_analytics ADD CONSTRAINT unique_series_analytics UNIQUE (series_id);