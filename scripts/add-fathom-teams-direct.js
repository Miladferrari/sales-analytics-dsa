/**
 * Add fathom_teams column to sales_reps table
 * This uses raw SQL via supabase-js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addFathomTeamsColumn() {
  console.log('📝 Adding fathom_teams column to sales_reps...')

  // Use RPC to execute raw SQL
  const sql = `
    -- Add column
    ALTER TABLE sales_reps
    ADD COLUMN IF NOT EXISTS fathom_teams TEXT[] DEFAULT '{}';

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_sales_reps_fathom_teams
    ON sales_reps USING GIN(fathom_teams);

    -- Add comment
    COMMENT ON COLUMN sales_reps.fathom_teams IS 'Array of Fathom team names to import calls from. Empty array = import from all teams. Example: ["Sales", "Marketing"]';
  `

  try {
    // Try via RPC first
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.log('⚠️  RPC not available, trying direct SQL...')

      // If RPC fails, we need to use postgres REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql_query: sql })
      })

      if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`)
      }
    }

    console.log('✅ Column added successfully!')

    // Verify by checking a sales rep
    const { data: reps, error: selectError } = await supabase
      .from('sales_reps')
      .select('id, name, fathom_teams')
      .limit(1)

    if (selectError) {
      console.error('❌ Verification failed:', selectError.message)
    } else {
      console.log('✅ Verified! Sample rep:', reps[0])
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

addFathomTeamsColumn()
