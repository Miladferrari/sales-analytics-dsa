-- Update fathom_status to include 'analyzing' status
-- This allows us to track when OpenAI is analyzing a call

-- First, drop the existing constraint
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_fathom_status_check;

-- Add the new constraint with 'analyzing' status
ALTER TABLE calls
ADD CONSTRAINT calls_fathom_status_check
CHECK (fathom_status IN ('pending', 'analyzing', 'completed', 'failed'));

-- Update comment
COMMENT ON COLUMN calls.fathom_status IS 'Processing status: pending (just received), analyzing (OpenAI processing), completed (analysis done), failed (error occurred)';

-- Optionally: Add index for faster queries on analyzing status
CREATE INDEX IF NOT EXISTS idx_calls_analyzing ON calls(fathom_status) WHERE fathom_status = 'analyzing';
