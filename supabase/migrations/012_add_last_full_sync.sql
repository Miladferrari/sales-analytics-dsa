-- Add last_full_sync column to sales_reps table
-- This tracks when a full sync was last performed for incremental sync reset
ALTER TABLE sales_reps
ADD COLUMN last_full_sync TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN sales_reps.last_full_sync IS 'Timestamp of the last full sync reset. Used for incremental sync to avoid re-syncing the same data multiple times.';
