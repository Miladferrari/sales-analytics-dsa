/**
 * Cron Job: Sync Fathom Calls
 *
 * This endpoint polls Fathom API for new calls and processes them.
 * Run every 5 minutes via:
 * - Vercel Cron (vercel.json)
 * - External cron (curl)
 * - Manual trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createFathomClient, FathomCall } from '@/lib/fathom/api-client'
import { matchSalesRep } from '@/lib/fathom/rep-matcher'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SyncResult {
  success: boolean
  processed: number
  imported: number
  skipped: number
  errors: number
  lastSyncTime: string
  calls: Array<{
    fathom_call_id: string
    status: 'imported' | 'skipped' | 'error'
    reason?: string
  }>
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  console.log('🔄 Starting Fathom sync...')

  // Verify authorization (optional but recommended)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const fathomClient = createFathomClient()

    // Check if a custom hours parameter is provided (for manual sync)
    const url = new URL(request.url)
    const hoursParam = url.searchParams.get('hours')
    const customHours = hoursParam ? parseInt(hoursParam) : null

    // Step 1: Get last sync time from database (or use custom time range)
    const lastSyncTime = customHours
      ? getCustomSyncTime(customHours)
      : await getLastSyncTime(supabase)

    console.log(`📅 Syncing from: ${lastSyncTime}${customHours ? ` (custom: ${customHours}h)` : ''}`)

    // Step 2: Fetch new calls from Fathom API
    console.log('📡 Fetching new calls from Fathom...')
    const newCalls = await fathomClient.getCallsSince(lastSyncTime, 100)
    console.log(`📞 Found ${newCalls.length} new calls`)

    if (newCalls.length === 0) {
      console.log('✅ No new calls to process')
      return NextResponse.json({
        success: true,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        lastSyncTime,
        message: 'No new calls to process',
        duration_ms: Date.now() - startTime
      })
    }

    // Step 3: Process each call
    const result: SyncResult = {
      success: true,
      processed: newCalls.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      lastSyncTime: new Date().toISOString(),
      calls: []
    }

    for (const call of newCalls) {
      try {
        const callResult = await processCall(call, supabase)
        result.calls.push(callResult)

        if (callResult.status === 'imported') {
          result.imported++
        } else if (callResult.status === 'skipped') {
          result.skipped++
        } else {
          result.errors++
        }
      } catch (error) {
        console.error(`❌ Error processing call ${call.id}:`, error)
        result.errors++
        result.calls.push({
          fathom_call_id: call.id,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Step 4: Update last sync time
    await updateLastSyncTime(supabase, result.lastSyncTime)

    const duration = Date.now() - startTime
    console.log(`✅ Sync completed in ${duration}ms`)
    console.log(`📊 Stats: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`)

    return NextResponse.json({
      ...result,
      duration_ms: duration
    })

  } catch (error) {
    console.error('❌ Sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

/**
 * Detect if transcript contains multiple speakers
 * This helps identify calls where someone joined via link (not in calendar invitees)
 *
 * Returns true if:
 * - Transcript has speaker labels like "Speaker 1:", "Speaker 2:", etc.
 * - OR has multiple distinct names/speakers
 *
 * Returns false if:
 * - No transcript available (call too short or processing not done)
 * - Only one speaker detected
 */
function detectMultipleSpeakers(transcript: string | null | undefined): boolean {
  if (!transcript || transcript.trim().length < 50) {
    // No transcript or too short - can't determine
    return false
  }

  // Method 1: Look for speaker labels (e.g., "Speaker 1:", "Speaker 2:", "Milad Azizi:", etc.)
  const speakerPatterns = [
    /Speaker \d+:/gi,           // "Speaker 1:", "Speaker 2:"
    /\w+\s+\w+:/g,              // "John Doe:", "Milad Azizi:"
    /\[.*?\]:/g,                // "[Milad]:", "[Client]:"
  ]

  for (const pattern of speakerPatterns) {
    const matches = transcript.match(pattern)
    if (matches) {
      // Get unique speakers
      const uniqueSpeakers = new Set(matches.map(m => m.toLowerCase().trim()))
      if (uniqueSpeakers.size >= 2) {
        console.log(`   → Detected ${uniqueSpeakers.size} unique speakers in transcript`)
        return true
      }
    }
  }

  // Method 2: If transcript is long enough but no clear speakers, assume it's a conversation
  // (Some transcripts don't have speaker labels but are clearly multi-person)
  if (transcript.length > 500) {
    console.log(`   → Long transcript (${transcript.length} chars) without clear speaker labels - assuming multi-person`)
    return true
  }

  return false
}

/**
 * Process a single Fathom call
 */
async function processCall(
  call: FathomCall,
  supabase: any
): Promise<{ fathom_call_id: string; status: 'imported' | 'skipped' | 'error'; reason?: string }> {
  console.log(`\n📞 Processing call: ${call.id}`)

  // Check if call already exists
  const { data: existingCall } = await supabase
    .from('calls')
    .select('id, fathom_team')
    .eq('fathom_id', call.id)
    .single()

  // If call exists but has no team info, update it
  if (existingCall) {
    const fathomTeam = (call as any).recorded_by?.team || null

    if (!existingCall.fathom_team && fathomTeam) {
      console.log(`🔄 Updating existing call ${call.id} with team: ${fathomTeam}`)
      await supabase
        .from('calls')
        .update({ fathom_team: fathomTeam })
        .eq('id', existingCall.id)

      return {
        fathom_call_id: call.id,
        status: 'skipped',
        reason: `Already exists - updated with team: ${fathomTeam}`
      }
    }

    console.log(`⏭️  Call ${call.id} already exists, skipping`)
    return {
      fathom_call_id: call.id,
      status: 'skipped',
      reason: 'Already exists in database'
    }
  }

  // FILTER 1: Check if the person who recorded this call is an ACTIVE sales rep in our database
  // This prevents importing calls from:
  // 1. Other teams/people (e.g. Thomas from Delivery team)
  // 2. Archived/inactive sales reps
  const recordedByEmail = (call as any).recorded_by?.email

  if (recordedByEmail) {
    const { data: recordedBySalesRep } = await supabase
      .from('sales_reps')
      .select('id, name, email, archived_at, fathom_teams')
      .eq('email', recordedByEmail.toLowerCase())
      .is('archived_at', null)  // ← Only active sales reps (not archived)
      .single()

    if (!recordedBySalesRep) {
      console.log(`⏭️  Call ${call.id} recorded by ${recordedByEmail} - not an active sales rep, skipping`)
      return {
        fathom_call_id: call.id,
        status: 'skipped',
        reason: `Recorded by ${recordedByEmail} who is not an active sales rep (might be archived or not in database)`
      }
    }

    console.log(`✅ Call recorded by ${recordedBySalesRep.name} (${recordedBySalesRep.email}) - is an active sales rep!`)

    // NEW FILTER: Check if call's team is allowed for this sales rep
    const callTeam = (call as any).recorded_by?.team
    const repTeams = recordedBySalesRep.fathom_teams || []

    // If rep has specific teams selected, check if call team is allowed
    if (repTeams.length > 0) {
      if (!callTeam || !repTeams.includes(callTeam)) {
        console.log(`⏭️  Call ${call.id} from team "${callTeam}" not allowed for ${recordedBySalesRep.name} (allowed teams: ${repTeams.join(', ')})`)
        return {
          fathom_call_id: call.id,
          status: 'skipped',
          reason: `Call from team "${callTeam}" - rep only imports from: ${repTeams.join(', ')}`
        }
      }
      console.log(`✓ Team "${callTeam}" is allowed for ${recordedBySalesRep.name}`)
    } else {
      // Empty array = import from all teams (backwards compatible)
      console.log(`✓ No team restrictions for ${recordedBySalesRep.name} - importing from all teams`)
    }
  }

  // FILTER 2: Import all calls from active sales reps
  // We now import ALL calls, including solo calls
  // The sales rep can review and delete unwanted calls later

  const participantCount = call.participants.length

  if (participantCount >= 2) {
    console.log(`✅ Call ${call.id} has ${participantCount} calendar invitees - importing`)
  } else if (participantCount === 1) {
    const hasMultipleSpeakers = detectMultipleSpeakers(call.transcript)
    if (hasMultipleSpeakers) {
      console.log(`✅ Call ${call.id} has 1 calendar invitee but transcript shows multiple speakers (link-based join) - importing`)
    } else {
      console.log(`✅ Call ${call.id} is a solo call - importing anyway (solo calls are now allowed)`)
    }
  } else {
    console.log(`✅ Call ${call.id} has ${participantCount} participants - importing`)
  }

  // Match sales rep from participants
  const matchResult = await matchSalesRep(call.participants, supabase)

  if (!matchResult.matched || !matchResult.rep_id) {
    console.log(`⚠️  No sales rep matched for call ${call.id}`)

    // Store in unmatched_fathom_calls for manual review
    await supabase
      .from('unmatched_fathom_calls')
      .insert({
        fathom_call_id: call.id,
        meeting_title: call.title,
        start_time: call.start_time,
        duration: call.duration,
        transcript: call.transcript,
        recording_url: call.recording_url,
        participants: call.participants,
        created_at: new Date().toISOString(),
        reviewed: false
      })

    return {
      fathom_call_id: call.id,
      status: 'skipped',
      reason: 'No sales rep matched - stored for review'
    }
  }

  console.log(`✅ Matched to sales rep: ${matchResult.rep_email}`)

  // Extract team information from recorded_by
  const fathomTeam = (call as any).recorded_by?.team || null
  if (fathomTeam) {
    console.log(`📋 Fathom team: ${fathomTeam}`)
  }

  // Insert call into database (without fathom_team due to schema cache issue - will add later)
  const { data: insertedCall, error: insertError} = await supabase
    .from('calls')
    .insert({
      rep_id: matchResult.rep_id,
      date: call.start_time,
      duration: call.duration,
      outcome: 'completed',
      fathom_id: call.id,
      transcript: call.transcript || '',
      recording_url: call.recording_url,
      participants: call.participants,
      meeting_title: call.title,
      fathom_synced_at: new Date().toISOString(),
      fathom_status: 'completed',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (insertError) {
    console.error(`❌ Failed to insert call ${call.id}:`, insertError)
    throw insertError
  }

  console.log(`✅ Call ${call.id} imported successfully`)

  // Trigger background analysis (non-blocking)
  if (insertedCall && call.transcript && call.transcript.length > 50) {
    triggerCallAnalysis(insertedCall.id).catch(err => {
      console.error(`⚠️  Failed to trigger analysis for call ${insertedCall.id}:`, err)
      // Don't fail the sync if analysis trigger fails
    })
  }

  return {
    fathom_call_id: call.id,
    status: 'imported',
    reason: `Matched to ${matchResult.rep_email}`
  }
}

/**
 * Get last sync time from database
 */
async function getLastSyncTime(supabase: any): Promise<string> {
  // Option 1: Get the most recent call's created_at
  const { data: latestCall } = await supabase
    .from('calls')
    .select('fathom_synced_at')
    .order('fathom_synced_at', { ascending: false })
    .limit(1)
    .single()

  if (latestCall?.fathom_synced_at) {
    return latestCall.fathom_synced_at
  }

  // Option 2: Default to 24 hours ago
  const yesterday = new Date()
  yesterday.setHours(yesterday.getHours() - 24)
  return yesterday.toISOString()
}

/**
 * Get custom sync time based on hours
 * Used for manual syncs with specific time ranges
 */
function getCustomSyncTime(hours: number): string {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}

/**
 * Update last sync time (for tracking)
 */
async function updateLastSyncTime(supabase: any, timestamp: string): Promise<void> {
  // You could store this in a separate sync_logs table if needed
  // For now, we just rely on fathom_synced_at in the calls table
  console.log(`📝 Last sync time: ${timestamp}`)
}

/**
 * Trigger background analysis for a call
 */
async function triggerCallAnalysis(callId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  console.log(`🤖 Triggering analysis for call ${callId}`)

  fetch(`${baseUrl}/api/calls/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ callId })
  }).catch(error => {
    console.error(`Analysis trigger failed for call ${callId}:`, error)
  })
}

/**
 * POST endpoint for manual sync trigger
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
