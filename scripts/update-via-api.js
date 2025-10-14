/**
 * Update via raw SQL using PostgREST
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function updateTeam() {
  console.log('🔄 Updating calls with Sales team...\n')

  try {
    // Use raw HTTP request to bypass schema cache
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: "UPDATE calls SET fathom_team = 'Sales' WHERE fathom_id IS NOT NULL RETURNING id, meeting_title;"
      })
    })

    const result = await response.json()
    console.log('Result:', result)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

updateTeam()
