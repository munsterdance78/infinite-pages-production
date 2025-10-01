-- ============================================================================
-- 006-add-extraction-model-column.sql
-- Purpose: Add extraction_model column to all 6 fact tables
-- Created: 2025-09-30
--
-- This migration adds the extraction_model column to track which AI model
-- was used to extract each fact. This is useful for quality analysis and
-- cost tracking across different model versions.
-- ============================================================================

-- ============================================================================
-- Add extraction_model to character_facts
-- ============================================================================
ALTER TABLE character_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN character_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Add extraction_model to location_facts
-- ============================================================================
ALTER TABLE location_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN location_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Add extraction_model to plot_event_facts
-- ============================================================================
ALTER TABLE plot_event_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN plot_event_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Add extraction_model to world_rule_facts
-- ============================================================================
ALTER TABLE world_rule_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN world_rule_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Add extraction_model to timeline_facts
-- ============================================================================
ALTER TABLE timeline_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN timeline_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Add extraction_model to theme_facts
-- ============================================================================
ALTER TABLE theme_facts
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

COMMENT ON COLUMN theme_facts.extraction_model IS 'AI model used for extraction (e.g., claude-sonnet-4-20250514)';

-- ============================================================================
-- Create indexes for analytics queries
-- ============================================================================
-- These indexes will help with queries that filter or group by model version
CREATE INDEX IF NOT EXISTS idx_character_facts_extraction_model ON character_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_location_facts_extraction_model ON location_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_plot_event_facts_extraction_model ON plot_event_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_world_rule_facts_extraction_model ON world_rule_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_timeline_facts_extraction_model ON timeline_facts(extraction_model);
CREATE INDEX IF NOT EXISTS idx_theme_facts_extraction_model ON theme_facts(extraction_model);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the columns were added:
--
-- SELECT
--   table_name,
--   column_name,
--   data_type,
--   character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND column_name = 'extraction_model'
-- AND table_name IN (
--   'character_facts',
--   'location_facts',
--   'plot_event_facts',
--   'world_rule_facts',
--   'timeline_facts',
--   'theme_facts'
-- )
-- ORDER BY table_name;
--
-- Expected: 6 rows, all with data_type = 'character varying', length = 100
-- ============================================================================

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This column allows us to:
-- 1. Track which model version extracted each fact
-- 2. Compare quality across model versions
-- 3. Analyze cost/quality tradeoffs
-- 4. Debug extraction issues by model version
-- ============================================================================
