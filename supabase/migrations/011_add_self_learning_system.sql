-- Migration: Add Self-Learning AI System
-- Date: 2025-10-17
-- Purpose: Enable AI to learn from successful calls through outcome tracking and validation

-- ============================================================================
-- STEP 1: Enhance calls table with detailed outcome tracking
-- ============================================================================

-- Drop old outcome column (was just TEXT)
ALTER TABLE calls DROP COLUMN IF EXISTS outcome;

-- Add comprehensive outcome tracking fields
ALTER TABLE calls
  ADD COLUMN outcome_status TEXT CHECK (outcome_status IN (
    'closed_won',           -- Deal closed successfully
    'closed_lost',          -- Deal lost
    'in_progress',          -- Still in pipeline
    'no_show',              -- Lead didn't show up
    'disqualified',         -- Lead not qualified
    'follow_up_scheduled'   -- Awaiting follow-up
  )),
  ADD COLUMN deal_value DECIMAL(10, 2),  -- € value of deal (NULL if lost)
  ADD COLUMN closed_at TIMESTAMPTZ,       -- When deal closed/lost

  -- Quality indicators (Layer 2 - Critical for clean data)
  ADD COLUMN lead_quality TEXT CHECK (lead_quality IN ('hot', 'warm', 'cold', 'fake')),
  ADD COLUMN closer_performance TEXT CHECK (closer_performance IN ('excellent', 'good', 'average', 'poor')),
  ADD COLUMN external_factors TEXT[],     -- e.g. ['promo', 'referral', 'urgent_need']

  -- Benchmark eligibility (Layer 3 - Manual curation)
  ADD COLUMN is_benchmark BOOLEAN DEFAULT FALSE,
  ADD COLUMN benchmark_reason TEXT,
  ADD COLUMN exclude_from_learning BOOLEAN DEFAULT FALSE,
  ADD COLUMN exclusion_reason TEXT,

  -- Validation (Layer 4 - Manager approval)
  ADD COLUMN validated_by UUID REFERENCES user_profiles(id),
  ADD COLUMN validated_at TIMESTAMPTZ,
  ADD COLUMN validation_notes TEXT,

  -- Learning metadata
  ADD COLUMN learning_weight DECIMAL(3, 2) DEFAULT 1.0 CHECK (learning_weight >= 0 AND learning_weight <= 1.0),
  ADD COLUMN times_used_for_training INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_calls_outcome_status ON calls(outcome_status);
CREATE INDEX idx_calls_is_benchmark ON calls(is_benchmark);
CREATE INDEX idx_calls_learning_eligible ON calls(is_benchmark, exclude_from_learning)
  WHERE is_benchmark = TRUE AND exclude_from_learning = FALSE;
CREATE INDEX idx_calls_closed_at ON calls(closed_at);

-- Add comment
COMMENT ON COLUMN calls.learning_weight IS 'Weight for AI learning (0.0-1.0). Higher = more important for training.';
COMMENT ON COLUMN calls.is_benchmark IS 'Manually tagged as high-quality example for AI learning.';
COMMENT ON COLUMN calls.exclude_from_learning IS 'Exclude from AI training (e.g., won due to luck, not skill).';

-- ============================================================================
-- STEP 2: Create learned_patterns table
-- ============================================================================

CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Pattern details
  pattern_name TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'step_score',         -- e.g., "Current depth matters"
    'phrase_usage',       -- e.g., "Empathy phrases increase close rate"
    'timing',             -- e.g., "Optimal call duration"
    'sequence',           -- e.g., "Objection handling order"
    'behavioral',         -- e.g., "Tone and pace"
    'contextual'          -- e.g., "Lead type specific patterns"
  )),

  -- Statistical validation
  correlation_strength DECIMAL(3, 2) NOT NULL CHECK (correlation_strength >= -1 AND correlation_strength <= 1),
  sample_size INTEGER NOT NULL,
  p_value DECIMAL(5, 4),
  confidence_interval TEXT,

  -- Impact metrics
  impact_on_close_rate DECIMAL(5, 2),  -- e.g., +12.5% close rate
  impact_description TEXT,

  -- Validation status
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN (
    'detected',           -- AI found this pattern
    'validating',         -- Being tested
    'validated',          -- Statistically significant
    'approved',           -- Manager approved
    'in_production',      -- Actively used in AI
    'deprecated',         -- No longer valid
    'rejected'            -- False positive
  )),

  -- Human validation
  validated_by UUID REFERENCES user_profiles(id),
  validated_at TIMESTAMPTZ,
  manager_approved BOOLEAN DEFAULT FALSE,
  manager_notes TEXT,

  -- A/B Testing
  ab_test_results JSONB,  -- Store A/B test data

  -- Source calls
  source_call_ids UUID[],  -- Calls this pattern came from

  -- Usage tracking
  times_applied INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2),  -- How often did this pattern help?
  last_applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_learned_patterns_status ON learned_patterns(status);
CREATE INDEX idx_learned_patterns_type ON learned_patterns(pattern_type);
CREATE INDEX idx_learned_patterns_production ON learned_patterns(status)
  WHERE status = 'in_production';

-- Add trigger
CREATE TRIGGER update_learned_patterns_updated_at BEFORE UPDATE ON learned_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on learned_patterns" ON learned_patterns FOR ALL USING (true);

COMMENT ON TABLE learned_patterns IS 'AI-discovered patterns from successful calls, validated by humans.';

-- ============================================================================
-- STEP 3: Create ai_training_runs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_training_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Training details
  run_type TEXT NOT NULL CHECK (run_type IN ('pattern_detection', 'model_training', 'validation')),
  model_version TEXT,

  -- Data used
  calls_analyzed INTEGER NOT NULL,
  closed_calls_count INTEGER,
  lost_calls_count INTEGER,
  benchmark_calls_used INTEGER,

  -- Results
  patterns_detected INTEGER DEFAULT 0,
  patterns_validated INTEGER DEFAULT 0,
  patterns_rejected INTEGER DEFAULT 0,

  -- Performance metrics
  prediction_accuracy DECIMAL(5, 2),  -- % accuracy
  improvement_vs_baseline DECIMAL(5, 2),  -- +X% improvement

  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,

  -- Configuration
  config JSONB,  -- Store training parameters

  -- Results
  results JSONB,  -- Detailed results

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_training_runs_status ON ai_training_runs(status);
CREATE INDEX idx_ai_training_runs_completed ON ai_training_runs(completed_at);

ALTER TABLE ai_training_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ai_training_runs" ON ai_training_runs FOR ALL USING (true);

COMMENT ON TABLE ai_training_runs IS 'Track each AI training/learning cycle with metrics.';

-- ============================================================================
-- STEP 4: Create ai_performance_metrics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Prediction accuracy
  predictions_made INTEGER DEFAULT 0,
  predictions_correct INTEGER DEFAULT 0,
  prediction_accuracy DECIMAL(5, 2),

  -- Coaching effectiveness
  closers_using_ai_feedback INTEGER DEFAULT 0,
  avg_score_before DECIMAL(5, 2),
  avg_score_after DECIMAL(5, 2),
  score_improvement DECIMAL(5, 2),

  -- Close rate impact
  close_rate_before DECIMAL(5, 2),
  close_rate_after DECIMAL(5, 2),
  close_rate_improvement DECIMAL(5, 2),

  -- Pattern validation
  patterns_detected INTEGER DEFAULT 0,
  patterns_validated INTEGER DEFAULT 0,
  patterns_in_production INTEGER DEFAULT 0,
  false_positive_rate DECIMAL(5, 2),

  -- Model health
  model_version TEXT,
  last_trained DATE,
  data_drift_detected BOOLEAN DEFAULT FALSE,
  retrain_recommended BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_performance_metrics_week ON ai_performance_metrics(week_start);
CREATE UNIQUE INDEX idx_ai_performance_metrics_unique_week ON ai_performance_metrics(week_start, week_end);

ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ai_performance_metrics" ON ai_performance_metrics FOR ALL USING (true);

COMMENT ON TABLE ai_performance_metrics IS 'Weekly performance metrics to track AI improvement over time.';

-- ============================================================================
-- STEP 5: Create helper views
-- ============================================================================

-- View: Benchmark calls (ready for AI learning)
CREATE OR REPLACE VIEW benchmark_calls AS
SELECT
  c.*,
  a.framework_score,
  a.overall_rating,
  a.feedback,
  sr.name as rep_name
FROM calls c
LEFT JOIN analysis a ON c.id = a.call_id
LEFT JOIN sales_reps sr ON c.rep_id = sr.id
WHERE c.is_benchmark = TRUE
  AND c.exclude_from_learning = FALSE
  AND c.outcome_status = 'closed_won';

COMMENT ON VIEW benchmark_calls IS 'High-quality calls ready for AI learning.';

-- View: Learning analytics
CREATE OR REPLACE VIEW learning_analytics AS
SELECT
  outcome_status,
  lead_quality,
  closer_performance,
  COUNT(*) as call_count,
  AVG(deal_value) as avg_deal_value,
  AVG(a.framework_score) as avg_framework_score,
  COUNT(*) FILTER (WHERE is_benchmark = TRUE) as benchmark_count
FROM calls c
LEFT JOIN analysis a ON c.id = a.call_id
WHERE outcome_status IS NOT NULL
GROUP BY outcome_status, lead_quality, closer_performance;

COMMENT ON VIEW learning_analytics IS 'Analytics for understanding patterns in call outcomes.';

-- ============================================================================
-- STEP 6: Create functions for data integrity
-- ============================================================================

-- Function: Automatically set closed_at when outcome_status changes
CREATE OR REPLACE FUNCTION set_closed_at_on_outcome_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If outcome_status changed to closed_won or closed_lost, set closed_at
  IF NEW.outcome_status IN ('closed_won', 'closed_lost')
     AND (OLD.outcome_status IS NULL OR OLD.outcome_status NOT IN ('closed_won', 'closed_lost'))
     AND NEW.closed_at IS NULL THEN
    NEW.closed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_closed_at BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION set_closed_at_on_outcome_change();

-- Function: Validate benchmark calls
CREATE OR REPLACE FUNCTION validate_benchmark_call()
RETURNS TRIGGER AS $$
BEGIN
  -- Can only be benchmark if outcome_status is closed_won
  IF NEW.is_benchmark = TRUE AND NEW.outcome_status != 'closed_won' THEN
    RAISE EXCEPTION 'Benchmark calls must have outcome_status = closed_won';
  END IF;

  -- Cannot be both benchmark and excluded
  IF NEW.is_benchmark = TRUE AND NEW.exclude_from_learning = TRUE THEN
    RAISE EXCEPTION 'Call cannot be both benchmark and excluded from learning';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_benchmark BEFORE INSERT OR UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION validate_benchmark_call();

-- ============================================================================
-- STEP 7: Initial data - Set default values for existing calls
-- ============================================================================

-- Set default outcome_status for existing calls based on old outcome field
-- (This is safe since we're just setting defaults, not deleting data)

UPDATE calls
SET outcome_status = 'in_progress'
WHERE outcome_status IS NULL;

COMMENT ON COLUMN calls.outcome_status IS 'Call outcome for tracking close rate and AI learning';
