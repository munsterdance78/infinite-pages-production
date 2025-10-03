-- Migration 010: Add publish functionality to stories table

-- Add publish fields to stories table
ALTER TABLE stories
ADD COLUMN is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for the new columns
COMMENT ON COLUMN stories.is_published IS 'Whether the story is published to the public library';
COMMENT ON COLUMN stories.published_at IS 'Timestamp when the story was published to the public library';

-- Create index for efficient querying of published stories
CREATE INDEX IF NOT EXISTS idx_stories_is_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at);

-- Update existing stories to have is_published = false (already default)
UPDATE stories
SET is_published = FALSE
WHERE is_published IS NULL;
