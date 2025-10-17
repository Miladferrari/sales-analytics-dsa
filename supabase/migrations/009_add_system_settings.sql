-- Migration: System Settings Table
-- Purpose: Store application-wide configuration (Fathom API keys, etc.)
-- Date: 2025-01-17

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Insert initial Fathom settings (empty, will be filled via UI)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('fathom_api_key', NULL, 'Fathom API Key voor authenticatie'),
  ('fathom_webhook_secret', NULL, 'Fathom Webhook Secret voor verificatie'),
  ('fathom_connection_status', 'not_configured', 'Status van Fathom connectie'),
  ('fathom_last_test', NULL, 'Laatste keer dat de verbinding getest is')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE system_settings IS 'Application-wide system configuration settings';
