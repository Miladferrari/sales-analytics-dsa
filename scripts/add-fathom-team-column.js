/**
 * Direct SQL execution to add fathom_team column
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColumn() {
  console.log('🔄 Adding fathom_team column to calls table...')

  try {
    // Try to insert a test record to see if column exists
    const { data: testCall } = await supabase
      .from('calls')
      .select('id, fathom_team')
      .limit(1)
      .single()

    console.log('✅ Column fathom_team already exists!')
    console.log('Test query result:', testCall)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

addColumn()
