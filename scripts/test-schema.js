#!/usr/bin/env node
/**
 * Test if analysis table has the correct columns
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv/config')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSchema() {
  console.log('🔍 Testing analysis table schema...\n')

  // Try to insert a minimal record to see what columns are required
  const testData = {
    call_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
    framework_score: 85,
    sentiment_score: 75,
    key_topics: ['test'],
    analysis_data: { test: true },
    analyzed_at: new Date().toISOString()
  }

  console.log('📝 Attempting to insert test record with new schema...')
  const { data, error } = await supabase
    .from('analysis')
    .insert(testData)
    .select()

  if (error) {
    console.error('\n❌ Schema test failed!')
    console.error('Error:', error)
    console.error('\n💡 The table likely still has the old schema.')
    console.error('   You need to manually run the migration in Supabase Dashboard.')
    console.error('\n📋 SQL to run:')
    console.error('   Go to: https://supabase.com/dashboard/project/qgqsgblputjitfwwbysi/sql/new')
    console.error('   Run this SQL:\n')
    console.error('-- Remove old columns')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_1_score;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_2_score;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS pillar_3_score;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS overall_rating;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS feedback;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS key_strengths;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS areas_for_improvement;')
    console.error('ALTER TABLE analysis DROP COLUMN IF EXISTS red_flags;')
    console.error('\n-- Add new columns')
    console.error('ALTER TABLE analysis ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100);')
    console.error('ALTER TABLE analysis ADD COLUMN IF NOT EXISTS key_topics TEXT[] DEFAULT \'{}\';')
    console.error('ALTER TABLE analysis ADD COLUMN IF NOT EXISTS analysis_data JSONB NOT NULL DEFAULT \'{}\';')
    console.error('ALTER TABLE analysis ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;')
    process.exit(1)
  }

  console.log('✅ Schema is correct!')
  console.log('   Test record created successfully')

  // Clean up test record
  await supabase.from('analysis').delete().eq('call_id', testData.call_id)
  console.log('   (Test record cleaned up)\n')
}

testSchema()
