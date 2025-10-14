-- Add fathom_team column to calls table
-- This stores which Fathom team the call was recorded by (e.g., "Sales", "Marketing", "Delivery")

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS fathom_team TEXT;

-- Add index for filtering by team
CREATE INDEX IF NOT EXISTS idx_calls_fathom_team ON calls(fathom_team);

-- Add comment for documentation
COMMENT ON COLUMN calls.fathom_team IS 'The Fathom team that recorded this call (from recorded_by.team in Fathom API)';
