/**
 * Temporary script to add call classification columns to analysis table
 * This is a workaround because Supabase client doesn't support raw SQL
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function addClassificationColumns() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('⚠️  Manual migration needed!')
  console.log('')
  console.log('Please run the following SQL in your Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/qgqsgblputjitfwwbysi/sql/new')
  console.log('')
  console.log('=================== SQL TO EXECUTE ===================')
  console.log('')
  console.log(`
-- Add call classification fields to analysis table
ALTER TABLE analysis
  ADD COLUMN IF NOT EXISTS is_sales_call BOOLEAN,
  ADD COLUMN IF NOT EXISTS call_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_analysis_is_sales_call ON analysis(is_sales_call);
CREATE INDEX IF NOT EXISTS idx_analysis_call_type ON analysis(call_type);
CREATE INDEX IF NOT EXISTS idx_analysis_confidence_score ON analysis(confidence_score);
  `)
  console.log('')
  console.log('======================================================')
  console.log('')
  console.log('After running the SQL, press Enter to verify...')

  // Wait for user input
  process.stdin.once('data', async () => {
    console.log('\n✅ Verifying columns...')

    // Try to insert a test record
    const { data, error } = await supabase
      .from('analysis')
      .select('is_sales_call, call_type, confidence_score, rejection_reason')
      .limit(1)

    if (error) {
      console.error('❌ Columns not found:', error.message)
      console.log('\nPlease make sure you ran the SQL in Supabase SQL Editor')
    } else {
      console.log('✅ Columns successfully added!')
      console.log('\nYou can now re-analyze your calls.')
    }

    process.exit(0)
  })
}

addClassificationColumns()
