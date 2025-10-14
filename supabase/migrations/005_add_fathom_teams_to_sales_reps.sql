-- Add fathom_teams column to sales_reps table
-- This stores which Fathom teams a sales rep's calls should be imported from
-- Empty array [] = import from ALL teams (backwards compatible)
-- ['Sales', 'Marketing'] = only import from these specific teams

ALTER TABLE sales_reps
ADD COLUMN IF NOT EXISTS fathom_teams TEXT[] DEFAULT '{}';

-- Add index for querying by teams
CREATE INDEX IF NOT EXISTS idx_sales_reps_fathom_teams ON sales_reps USING GIN(fathom_teams);

-- Add comment for documentation
COMMENT ON COLUMN sales_reps.fathom_teams IS 'Array of Fathom team names to import calls from. Empty array = import from all teams. Example: ["Sales", "Marketing"]';
