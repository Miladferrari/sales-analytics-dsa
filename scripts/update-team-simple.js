/**
 * Simple script to update existing calls with team="Sales"
 * Since all Milad's calls are from the Sales team
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateTeam() {
  console.log('🔄 Updating all calls with team = "Sales"...\n')

  try {
    // Update all calls that have a fathom_id with team="Sales"
    const { data, error } = await supabase
      .from('calls')
      .update({ fathom_team: 'Sales' })
      .not('fathom_id', 'is', null)
      .select('id, meeting_title')

    if (error) {
      throw error
    }

    console.log(`✅ Updated ${data.length} calls with team="Sales"`)
    console.log('\nUpdated calls:')
    data.forEach(call => {
      console.log(`  - ${call.meeting_title}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

updateTeam()
