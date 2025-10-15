-- Fix NOT NULL constraints for non-sales calls
-- When a call is not a sales call, framework_score and sentiment_score should be NULL

ALTER TABLE analysis
  ALTER COLUMN framework_score DROP NOT NULL,
  ALTER COLUMN sentiment_score DROP NOT NULL;

-- Add comment to explain
COMMENT ON COLUMN analysis.framework_score IS 'DSA framework score (0-100) - NULL if not a sales call';
COMMENT ON COLUMN analysis.sentiment_score IS 'Sentiment score - NULL if not a sales call';
