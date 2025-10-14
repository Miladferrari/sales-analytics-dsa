-- Add archived_at column to sales_reps table for soft delete
-- When archived_at is NULL, the sales rep is active
-- When archived_at has a timestamp, the sales rep is archived

ALTER TABLE sales_reps
ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for faster filtering of archived vs active reps
CREATE INDEX idx_sales_reps_archived_at ON sales_reps(archived_at);

-- Add comment for clarity
COMMENT ON COLUMN sales_reps.archived_at IS 'Timestamp when the sales rep was archived (soft deleted). NULL means active.';
