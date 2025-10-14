#!/usr/bin/env node
/**
 * Manually add archived_at column if missing
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function addArchivedColumn() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔧 Adding archived_at column to sales_reps...\n')

  // Run the SQL directly
  const { data, error } = await supabase.rpc('query', {
    query_text: `
      -- Add archived_at column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sales_reps' AND column_name = 'archived_at'
        ) THEN
          ALTER TABLE sales_reps ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
          CREATE INDEX idx_sales_reps_archived_at ON sales_reps(archived_at);
          COMMENT ON COLUMN sales_reps.archived_at IS 'Timestamp when the sales rep was archived (soft deleted). NULL means active.';
        END IF;
      END $$;
    `
  })

  if (error) {
    console.error('❌ RPC failed, trying direct SQL...\n')

    // Try with PostgREST SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_text: `
          ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
          CREATE INDEX IF NOT EXISTS idx_sales_reps_archived_at ON sales_reps(archived_at);
        `
      })
    })

    if (!response.ok) {
      console.error('❌ Direct SQL also failed')
      console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log('\n```sql')
      console.log('ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;')
      console.log('CREATE INDEX IF NOT EXISTS idx_sales_reps_archived_at ON sales_reps(archived_at);')
      console.log('```\n')
      return
    }
  }

  console.log('✅ Column added successfully!\n')

  // Verify
  const { data: testData, error: testError } = await supabase
    .from('sales_reps')
    .select('id, name, archived_at')
    .limit(1)

  if (testError) {
    console.error('❌ Verification failed:', testError)
  } else {
    console.log('✅ Verification successful - archived_at column exists!\n')
  }
}

addArchivedColumn()
