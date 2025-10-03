-- Migration 011: Create story_reads table for reading unlock system

-- Create story_reads table
CREATE TABLE story_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_paid INTEGER NOT NULL DEFAULT 250,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for the table and columns
COMMENT ON TABLE story_reads IS 'Tracks when readers unlock stories for reading';
COMMENT ON COLUMN story_reads.reader_id IS 'ID of the user who unlocked the story';
COMMENT ON COLUMN story_reads.story_id IS 'ID of the story that was unlocked';
COMMENT ON COLUMN story_reads.creator_id IS 'ID of the story creator (for earnings tracking)';
COMMENT ON COLUMN story_reads.credits_paid IS 'Number of credits paid to unlock the story';
COMMENT ON COLUMN story_reads.unlocked_at IS 'Timestamp when the story was unlocked';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_story_reads_reader_story ON story_reads(reader_id, story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_story_id ON story_reads(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_creator_id ON story_reads(creator_id);
CREATE INDEX IF NOT EXISTS idx_story_reads_unlocked_at ON story_reads(unlocked_at);

-- Enable RLS (Row Level Security)
ALTER TABLE story_reads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Readers can view their own unlocks
CREATE POLICY "Users can view their own story unlocks" ON story_reads
  FOR SELECT USING (auth.uid() = reader_id);

-- Creators can view unlocks of their stories
CREATE POLICY "Creators can view unlocks of their stories" ON story_reads
  FOR SELECT USING (auth.uid() = creator_id);

-- Users can insert their own unlocks
CREATE POLICY "Users can create their own story unlocks" ON story_reads
  FOR INSERT WITH CHECK (auth.uid() = reader_id);

-- Add unique constraint to prevent duplicate unlocks
ALTER TABLE story_reads 
ADD CONSTRAINT unique_reader_story UNIQUE (reader_id, story_id);
