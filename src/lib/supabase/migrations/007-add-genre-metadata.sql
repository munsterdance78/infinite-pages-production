-- Migration 007: Add genre_metadata JSONB column to all fact tables
-- This allows storing genre-specific attributes for facts across all categories

-- Add genre_metadata column to character_facts
ALTER TABLE character_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Add genre_metadata column to location_facts
ALTER TABLE location_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Add genre_metadata column to plot_event_facts
ALTER TABLE plot_event_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Add genre_metadata column to world_rule_facts
ALTER TABLE world_rule_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Add genre_metadata column to timeline_facts
ALTER TABLE timeline_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Add genre_metadata column to theme_facts
ALTER TABLE theme_facts
ADD COLUMN genre_metadata JSONB DEFAULT '{}'::jsonb;

-- Create GIN indexes for efficient JSON queries on each table
CREATE INDEX idx_character_facts_genre_metadata ON character_facts USING GIN (genre_metadata);
CREATE INDEX idx_location_facts_genre_metadata ON location_facts USING GIN (genre_metadata);
CREATE INDEX idx_plot_event_facts_genre_metadata ON plot_event_facts USING GIN (genre_metadata);
CREATE INDEX idx_world_rule_facts_genre_metadata ON world_rule_facts USING GIN (genre_metadata);
CREATE INDEX idx_timeline_facts_genre_metadata ON timeline_facts USING GIN (genre_metadata);
CREATE INDEX idx_theme_facts_genre_metadata ON theme_facts USING GIN (genre_metadata);

-- Verification query to confirm all columns were added successfully
DO $$
DECLARE
    table_name TEXT;
    column_exists BOOLEAN;
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check each table for the genre_metadata column
    FOR table_name IN
        SELECT unnest(ARRAY[
            'character_facts',
            'location_facts',
            'plot_event_facts',
            'world_rule_facts',
            'timeline_facts',
            'theme_facts'
        ])
    LOOP
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_name
            AND column_name = 'genre_metadata'
        ) INTO column_exists;

        IF NOT column_exists THEN
            missing_columns := array_append(missing_columns, table_name);
        END IF;
    END LOOP;

    -- Report results
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Migration verification failed: genre_metadata column missing in tables: %',
            array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'Migration verification successful: genre_metadata column added to all 6 fact tables';
    END IF;
END $$;
