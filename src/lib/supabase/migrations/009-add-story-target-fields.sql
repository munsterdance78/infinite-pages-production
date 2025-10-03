-- Migration 009: Add target fields to stories table
-- Adds target_length, target_chapters, and target_chapter_length fields

-- Add the new columns to stories table
ALTER TABLE stories 
ADD COLUMN target_length INTEGER DEFAULT 60000,
ADD COLUMN target_chapters INTEGER DEFAULT 30,
ADD COLUMN target_chapter_length INTEGER DEFAULT 2000;

-- Add comments for documentation
COMMENT ON COLUMN stories.target_length IS 'Target total word count for the story (default: 60000)';
COMMENT ON COLUMN stories.target_chapters IS 'Target number of chapters for the story (default: 30)';
COMMENT ON COLUMN stories.target_chapter_length IS 'Target word count per chapter (default: 2000)';

-- Add indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_stories_target_length ON stories(target_length);
CREATE INDEX IF NOT EXISTS idx_stories_target_chapters ON stories(target_chapters);
CREATE INDEX IF NOT EXISTS idx_stories_target_chapter_length ON stories(target_chapter_length);

-- Update existing stories to have default values if they don't already have them
UPDATE stories 
SET 
  target_length = 60000,
  target_chapters = 30,
  target_chapter_length = 2000
WHERE 
  target_length IS NULL 
  OR target_chapters IS NULL 
  OR target_chapter_length IS NULL;


