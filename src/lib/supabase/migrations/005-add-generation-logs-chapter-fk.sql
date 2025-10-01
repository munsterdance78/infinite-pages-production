-- ============================================================================
-- 005-add-generation-logs-chapter-fk.sql
-- Purpose: Add foreign key constraint to generation_logs.chapter_id
-- Created: 2025-09-30
--
-- This migration ensures generation_logs.chapter_id properly references
-- the chapters table with CASCADE delete behavior.
-- ============================================================================

-- Add foreign key constraint if it doesn't exist
-- Note: We use DO block to handle the case where constraint might already exist
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'generation_logs_chapter_id_fkey'
    AND table_name = 'generation_logs'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE generation_logs
    ADD CONSTRAINT generation_logs_chapter_id_fkey
    FOREIGN KEY (chapter_id)
    REFERENCES chapters(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Foreign key constraint generation_logs_chapter_id_fkey added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint generation_logs_chapter_id_fkey already exists';
  END IF;
END $$;

-- Add index on chapter_id for query performance
CREATE INDEX IF NOT EXISTS idx_generation_logs_chapter_id ON generation_logs(chapter_id);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the constraint was added:
--
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- JOIN information_schema.referential_constraints AS rc
--   ON rc.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'generation_logs'
--   AND tc.constraint_type = 'FOREIGN KEY'
--   AND kcu.column_name = 'chapter_id';
--
-- Expected result:
-- constraint_name: generation_logs_chapter_id_fkey
-- table_name: generation_logs
-- column_name: chapter_id
-- foreign_table_name: chapters
-- foreign_column_name: id
-- delete_rule: CASCADE
-- ============================================================================
