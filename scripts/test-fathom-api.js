#!/usr/bin/env node
/**
 * Test Fathom API Connection
 *
 * Tests if we can connect to Fathom API and fetch calls
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const FATHOM_API_KEY = process.env.FATHOM_API_KEY

if (!FATHOM_API_KEY) {
  console.error('❌ FATHOM_API_KEY not found in environment')
  console.error('   Make sure you have it in .env.local')
  process.exit(1)
}

console.log('[dotenv@17.2.3] injecting env (0) from .env.local\n')
console.log('🧪 Testing Fathom API Connection\n')
console.log('════════════════════════════════════════════════════════\n')
console.log('✅ Environment variables loaded')
console.log(`   Fathom API Key: ${FATHOM_API_KEY.substring(0, 15)}...\n`)

async function testFathomAPI() {
  try {
    console.log('📡 Step 1: Testing API connection...\n')

    // Correct Fathom API endpoint
    const endpoint = 'https://api.fathom.ai/external/v1/meetings'

    console.log(`   Using: ${endpoint}`)

    const response = await fetch(`${endpoint}?limit=5`, {
      method: 'GET',
      headers: {
        'X-Api-Key': FATHOM_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('\n❌ API request failed\n')
      console.error(`Status: ${response.status}`)
      console.error(`Error: ${errorText}\n`)
      console.error('💡 This could mean:')
      console.error('   1. API key is invalid or not activated yet')
      console.error('   2. No permissions to access meetings')
      console.error('   3. Account has no meetings yet\n')
      process.exit(1)
    }

    console.log('✅ API connection successful!\n')

    const data = await response.json()

    console.log('📞 Step 2: Fetching recent meetings...\n')

    if (!data.items || data.items.length === 0) {
      console.log('⚠️  No meetings found in your Fathom account')
      console.log('   This is normal if you haven\'t done any calls yet\n')
      console.log('✅ API is working! Do a test call to see data.\n')
      return
    }

    console.log(`✅ Found ${data.items.length} recent meetings:\n`)
    console.log('════════════════════════════════════════════════════════\n')

    data.items.forEach((meeting, index) => {
      console.log(`Meeting ${index + 1}:`)
      console.log(`   ID: ${meeting.recording_id}`)
      console.log(`   Title: ${meeting.meeting_title || 'Untitled'}`)
      console.log(`   Start: ${new Date(meeting.recording_start_time).toLocaleString()}`)
      console.log(`   Duration: ${Math.round((new Date(meeting.recording_end_time) - new Date(meeting.recording_start_time)) / 60000)} minutes`)
      console.log(`   Recorded by: ${meeting.recorded_by?.name} (${meeting.recorded_by?.email})`)
      console.log(`   Team: ${meeting.recorded_by?.team || 'N/A'}`)
      console.log(`   Participants: ${meeting.calendar_invitees?.length || 0}`)

      if (meeting.calendar_invitees && meeting.calendar_invitees.length > 0) {
        meeting.calendar_invitees.forEach(p => {
          console.log(`      - ${p.name || p.email} (${p.email})`)
        })
      }

      console.log(`   Has transcript: ${meeting.transcript ? '✅ Yes' : '❌ No (still processing)'}`)
      console.log(`   Share URL: ${meeting.share_url}`)
      console.log()
    })

    console.log('════════════════════════════════════════════════════════\n')
    console.log('🎉 Fathom API test completed successfully!\n')
    console.log('📝 Next steps:')
    console.log('   1. Add your sales reps to the database')
    console.log('   2. Run the sync: GET /api/cron/sync-fathom')
    console.log('   3. Check your dashboard for imported calls\n')

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error.message)
    console.error('\n💡 Check your network connection and API key\n')
    process.exit(1)
  }
}

testFathomAPI()
