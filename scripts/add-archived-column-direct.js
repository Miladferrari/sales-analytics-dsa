#!/usr/bin/env node
/**
 * Add archived_at column directly using pg client
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('📋 SQL to run in Supabase SQL Editor:\n')
console.log('=' .repeat(60))
console.log(`
-- Add archived_at column to sales_reps table
ALTER TABLE sales_reps
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sales_reps_archived_at
ON sales_reps(archived_at);

-- Add comment
COMMENT ON COLUMN sales_reps.archived_at IS
'Timestamp when the sales rep was archived (soft deleted). NULL means active.';
`)
console.log('=' .repeat(60))
console.log('\n✅ Copy this SQL and run it in:')
console.log('   https://supabase.com/dashboard/project/qgqsgblputjitfwwbysi/sql/new\n')
console.log('⏳ Waiting for you to run it...\n')
console.log('Press Ctrl+C when done\n')
