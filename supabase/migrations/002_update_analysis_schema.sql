-- Update analysis table to match new OpenAI-based structure
-- Drop old columns and add new ones

-- Remove old pillar columns
ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_1_score;
ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_2_score;
ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_3_score;
ALTER TABLE analysis DROP COLUMN IF EXISTS overall_rating;
ALTER TABLE analysis DROP COLUMN IF EXISTS feedback;
ALTER TABLE analysis DROP COLUMN IF EXISTS key_strengths;
ALTER TABLE analysis DROP COLUMN IF EXISTS areas_for_improvement;
ALTER TABLE analysis DROP COLUMN IF EXISTS red_flags;

-- Add new columns for OpenAI analysis
ALTER TABLE analysis ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100);
ALTER TABLE analysis ADD COLUMN IF NOT EXISTS key_topics TEXT[] DEFAULT '{}';
ALTER TABLE analysis ADD COLUMN IF NOT EXISTS analysis_data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE analysis ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- framework_score already exists, just make sure it's there
-- ALTER TABLE analysis ADD COLUMN IF NOT EXISTS framework_score INTEGER NOT NULL CHECK (framework_score >= 0 AND framework_score <= 100);
