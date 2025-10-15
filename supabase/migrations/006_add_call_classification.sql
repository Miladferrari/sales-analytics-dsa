-- Add call classification fields to analysis table
-- This allows us to distinguish sales calls from team meetings, demos, etc.

ALTER TABLE analysis
  ADD COLUMN IF NOT EXISTS is_sales_call BOOLEAN,
  ADD COLUMN IF NOT EXISTS call_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_analysis_is_sales_call ON analysis(is_sales_call);
CREATE INDEX IF NOT EXISTS idx_analysis_call_type ON analysis(call_type);
CREATE INDEX IF NOT EXISTS idx_analysis_confidence_score ON analysis(confidence_score);

-- Add comments for documentation
COMMENT ON COLUMN analysis.is_sales_call IS 'Boolean: true if this is a sales call, false if team meeting/demo/etc';
COMMENT ON COLUMN analysis.call_type IS 'Type of call: sales_call, team_meeting, demo, support, unknown';
COMMENT ON COLUMN analysis.confidence_score IS 'AI confidence (0.0-1.0) in the classification';
COMMENT ON COLUMN analysis.rejection_reason IS 'Why this is not a sales call (if applicable)';
