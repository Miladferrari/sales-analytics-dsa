-- Add Fathom.ai integration fields to calls table
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS fathom_call_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS participants JSONB,
ADD COLUMN IF NOT EXISTS meeting_title TEXT,
ADD COLUMN IF NOT EXISTS fathom_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fathom_status TEXT DEFAULT 'pending' CHECK (fathom_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create index for faster Fathom call lookups
CREATE INDEX IF NOT EXISTS idx_calls_fathom_call_id ON calls(fathom_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_fathom_status ON calls(fathom_status);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(date);

-- Create table for unmatched Fathom calls (for review)
CREATE TABLE IF NOT EXISTS unmatched_fathom_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fathom_call_id TEXT UNIQUE NOT NULL,
  meeting_title TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER,
  transcript TEXT,
  recording_url TEXT,
  participants JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE unmatched_fathom_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all unmatched calls
CREATE POLICY "Admins can view unmatched calls"
  ON unmatched_fathom_calls
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create webhook log table for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status_code);

-- Enable Row Level Security
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN calls.fathom_call_id IS 'Unique identifier from Fathom.ai';
COMMENT ON COLUMN calls.transcript IS 'Full transcript from Fathom.ai';
COMMENT ON COLUMN calls.recording_url IS 'URL to Fathom.ai video recording';
COMMENT ON COLUMN calls.participants IS 'JSON array of meeting participants with name and email';
COMMENT ON COLUMN calls.fathom_status IS 'Processing status of Fathom webhook';
COMMENT ON TABLE unmatched_fathom_calls IS 'Stores Fathom calls that could not be matched to a sales rep';
COMMENT ON TABLE webhook_logs IS 'Logs all webhook requests for debugging and monitoring';
