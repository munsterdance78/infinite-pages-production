-- Migration 008: Add Missing Chapter Metadata Columns
-- Fixes critical issue where UI displays word_count and generation_cost_usd but columns don't exist
-- Priority: CRITICAL - Frontend expects these columns

-- ============================================================================
-- Add missing metadata columns to chapters table
-- ============================================================================

ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_cost_usd DECIMAL(10,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS title TEXT;

-- ============================================================================
-- Add indexes for common queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chapters_word_count ON chapters(word_count);
CREATE INDEX IF NOT EXISTS idx_chapters_generation_cost ON chapters(generation_cost_usd);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN chapters.word_count IS 'Total word count of chapter content';
COMMENT ON COLUMN chapters.generation_cost_usd IS 'Cost in USD to generate this chapter using Claude API';
COMMENT ON COLUMN chapters.title IS 'Chapter title (optional, defaults to "Chapter N")';

-- ============================================================================
-- Migration Notes
-- ============================================================================

-- This migration adds columns that are already expected by:
-- 1. Frontend: src/components/features/stories/story-detail-view.tsx line 362
--    Displays: chapter.generation_cost_usd.toFixed(3)
-- 2. Frontend: src/components/features/stories/story-detail-view.tsx line 354
--    Displays: chapter.word_count.toLocaleString()
-- 3. API: app/api/stories/[storyId]/chapters/route.ts line 430
--    Calculates wordCount but doesn't save it

-- After applying this migration, update the API route to insert these columns.
