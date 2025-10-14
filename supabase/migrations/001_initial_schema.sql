-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telegram_id TEXT,
    qualification_status TEXT NOT NULL CHECK (qualification_status IN ('qualified', 'unqualified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rep_id UUID NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
    fathom_id TEXT NOT NULL UNIQUE,
    transcript TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    outcome TEXT,
    customer_name TEXT,
    customer_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analysis table
CREATE TABLE IF NOT EXISTS analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    framework_score INTEGER NOT NULL CHECK (framework_score >= 0 AND framework_score <= 100),
    pillar_1_score INTEGER NOT NULL CHECK (pillar_1_score >= 0 AND pillar_1_score <= 100),
    pillar_2_score INTEGER NOT NULL CHECK (pillar_2_score >= 0 AND pillar_2_score <= 100),
    pillar_3_score INTEGER NOT NULL CHECK (pillar_3_score >= 0 AND pillar_3_score <= 100),
    overall_rating TEXT NOT NULL CHECK (overall_rating IN ('excellent', 'good', 'needs_improvement', 'poor')),
    feedback TEXT NOT NULL,
    key_strengths TEXT[] DEFAULT '{}',
    areas_for_improvement TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calls_rep_id ON calls(rep_id);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(date);
CREATE INDEX IF NOT EXISTS idx_analysis_call_id ON analysis(call_id);
CREATE INDEX IF NOT EXISTS idx_analysis_rating ON analysis(overall_rating);
CREATE INDEX IF NOT EXISTS idx_analysis_alert_sent ON analysis(alert_sent);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_reps_updated_at BEFORE UPDATE ON sales_reps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_updated_at BEFORE UPDATE ON analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, we'll allow all operations for authenticated users
-- You can customize these policies based on your security requirements

CREATE POLICY "Allow all operations on sales_reps" ON sales_reps
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on calls" ON calls
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on analysis" ON analysis
    FOR ALL USING (true);
