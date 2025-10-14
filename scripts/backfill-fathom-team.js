/**
 * Backfill script: Update existing calls with Fathom team information
 *
 * This script:
 * 1. Fetches all calls that have a fathom_id but no fathom_team
 * 2. For each call, fetches the full data from Fathom API
 * 3. Extracts the team information from recorded_by.team
 * 4. Updates the call in the database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fathomApiKey = process.env.FATHOM_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!fathomApiKey) {
  console.error('❌ Missing FATHOM_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchFathomCall(callId) {
  const response = await fetch(`https://api.fathom.ai/external/v1/meetings/${callId}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': fathomApiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Fathom API error: ${response.status}`)
  }

  return response.json()
}

async function backfillFathomTeam() {
  console.log('🔄 Starting backfill of Fathom team information...\n')

  try {
    // Step 1: Get all calls with fathom_id
    console.log('📊 Fetching calls with Fathom ID...')
    const { data: calls, error: fetchError } = await supabase
      .from('calls')
      .select('id, fathom_id, meeting_title')
      .not('fathom_id', 'is', null)

    if (fetchError) {
      throw new Error(`Failed to fetch calls: ${fetchError.message}`)
    }

    if (!calls || calls.length === 0) {
      console.log('✅ No calls need updating. All calls already have team information!')
      return
    }

    console.log(`📞 Found ${calls.length} calls to update\n`)

    // Step 2: Process each call
    let successCount = 0
    let errorCount = 0

    for (const call of calls) {
      try {
        console.log(`Processing: ${call.meeting_title} (ID: ${call.fathom_id})`)

        // Fetch full call data from Fathom
        const fathomData = await fetchFathomCall(call.fathom_id)

        // Extract team information
        const team = fathomData.recorded_by?.team || null

        if (team) {
          // Update the call in database
          const { error: updateError } = await supabase
            .from('calls')
            .update({ fathom_team: team })
            .eq('id', call.id)

          if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`)
          }

          console.log(`  ✅ Updated with team: ${team}`)
          successCount++
        } else {
          console.log(`  ⚠️  No team information available in Fathom`)
          successCount++
        }

      } catch (error) {
        console.error(`  ❌ Error processing call ${call.fathom_id}:`, error.message)
        errorCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Backfill Summary:')
    console.log('='.repeat(50))
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📞 Total processed: ${calls.length}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Backfill failed:', error.message)
    process.exit(1)
  }
}

// Run the backfill
backfillFathomTeam()
  .then(() => {
    console.log('\n✅ Backfill completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error)
    process.exit(1)
  })
