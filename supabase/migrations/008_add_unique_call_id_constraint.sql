-- Add UNIQUE constraint to prevent duplicate analyses for the same call
-- This ensures only one analysis can exist per call

-- First, remove any existing duplicates (keep most recent)
WITH ranked_analyses AS (
  SELECT
    id,
    call_id,
    analyzed_at,
    ROW_NUMBER() OVER (PARTITION BY call_id ORDER BY analyzed_at DESC) as rn
  FROM analysis
  WHERE call_id IS NOT NULL
)
DELETE FROM analysis
WHERE id IN (
  SELECT id
  FROM ranked_analyses
  WHERE rn > 1
);

-- Now add the UNIQUE constraint
ALTER TABLE analysis
  ADD CONSTRAINT analysis_call_id_unique
  UNIQUE (call_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT analysis_call_id_unique ON analysis
  IS 'Ensures only one analysis can exist per call';
