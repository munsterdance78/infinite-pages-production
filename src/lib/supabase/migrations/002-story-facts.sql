-- Story Facts Table - Individual story-level fact extraction
-- Purpose: Store extracted facts from generated chapters for consistency checking
-- Cost: ~$0.005 per chapter extraction

CREATE TABLE IF NOT EXISTS story_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  
  -- Fact categorization
  fact_type VARCHAR(50) NOT NULL, -- 'character', 'location', 'plot_event', 'world_rule', 'timeline'
  entity_name VARCHAR(255), -- Character name, location name, etc.
  
  -- Fact content
  fact_data JSONB NOT NULL, -- Flexible storage for different fact types
  source_text TEXT, -- Original text that led to this fact
  
  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0, -- How confident we are (0.00-1.00)
  extraction_model VARCHAR(100), -- Which Claude model extracted this
  extraction_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Validation tracking
  last_validated TIMESTAMP WITH TIME ZONE,
  validated_by_user BOOLEAN DEFAULT false,
  correction_count INTEGER DEFAULT 0,
  
  -- Timestamps
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate facts
  CONSTRAINT unique_story_entity_fact UNIQUE(story_id, fact_type, entity_name)
);

-- Performance indexes
CREATE INDEX idx_story_facts_story_id ON story_facts(story_id);
CREATE INDEX idx_story_facts_chapter_id ON story_facts(chapter_id);
CREATE INDEX idx_story_facts_fact_type ON story_facts(fact_type);
CREATE INDEX idx_story_facts_entity_name ON story_facts(entity_name);
CREATE INDEX idx_story_facts_extracted_at ON story_facts(extracted_at DESC);
CREATE INDEX idx_story_facts_data ON story_facts USING GIN(fact_data);

-- Composite index for common queries
CREATE INDEX idx_story_facts_lookup ON story_facts(story_id, fact_type, entity_name);

-- RLS Policies
ALTER TABLE story_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view facts for their stories"
  ON story_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_facts.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert facts"
  ON story_facts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update facts"
  ON story_facts FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_story_facts_updated_at
  BEFORE UPDATE ON story_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documentation
COMMENT ON TABLE story_facts IS 'Stores extracted facts from story chapters for consistency checking and context building';
COMMENT ON COLUMN story_facts.fact_type IS 'Types: character, location, plot_event, world_rule, timeline';
COMMENT ON COLUMN story_facts.fact_data IS 'Flexible JSONB storage - structure varies by fact_type';
COMMENT ON COLUMN story_facts.confidence IS 'Extraction confidence score (0.00 = uncertain, 1.00 = certain)';
COMMENT ON COLUMN story_facts.correction_count IS 'Number of times user has corrected this fact';