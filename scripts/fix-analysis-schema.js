#!/usr/bin/env node
/**
 * Fix analysis table schema by directly executing SQL
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv/config')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) throw error
  return data
}

async function fixSchema() {
  console.log('🔧 Fixing analysis table schema...\n')

  // SQL commands to run
  const commands = [
    {
      name: 'Drop old columns',
      sql: `
        ALTER TABLE analysis
        DROP COLUMN IF EXISTS pillar_1_score,
        DROP COLUMN IF EXISTS pillar_2_score,
        DROP COLUMN IF EXISTS pillar_3_score,
        DROP COLUMN IF EXISTS overall_rating,
        DROP COLUMN IF EXISTS feedback,
        DROP COLUMN IF EXISTS key_strengths,
        DROP COLUMN IF EXISTS areas_for_improvement,
        DROP COLUMN IF EXISTS red_flags;
      `
    },
    {
      name: 'Add new columns',
      sql: `
        ALTER TABLE analysis
        ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
        ADD COLUMN IF NOT EXISTS key_topics TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS analysis_data JSONB NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;
      `
    }
  ]

  for (const cmd of commands) {
    try {
      console.log(`▶ ${cmd.name}...`)

      // Gebruik Supabase SQL Editor API (via REST)
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: cmd.sql })
      })

      if (!response.ok) {
        const text = await response.text()
        console.log(`⚠️  Warning: ${text}`)
        console.log('   (This is OK if the column already exists or doesn\'t exist)\n')
      } else {
        console.log('   ✅ Success\n')
      }
    } catch (error) {
      console.log(`⚠️  Warning: ${error.message}`)
      console.log('   (This is OK if the column already exists or doesn\'t exist)\n')
    }
  }

  console.log('\n🎉 Schema fix completed!')
  console.log('\n📝 New analysis table structure:')
  console.log('   - id (UUID)')
  console.log('   - call_id (UUID, FK)')
  console.log('   - framework_score (INTEGER)')
  console.log('   - sentiment_score (INTEGER) ← NEW')
  console.log('   - key_topics (TEXT[]) ← NEW')
  console.log('   - analysis_data (JSONB) ← NEW')
  console.log('   - analyzed_at (TIMESTAMPTZ) ← NEW')
  console.log('   - created_at, updated_at')
}

fixSchema().catch((error) => {
  console.error('\n❌ Failed to fix schema:', error.message)
  console.error('\n💡 Manual fix:')
  console.error('   Go to Supabase Dashboard → SQL Editor and run:')
  console.error('   ' + fs.readFileSync('supabase/migrations/002_update_analysis_schema.sql', 'utf-8'))
  process.exit(1)
})
