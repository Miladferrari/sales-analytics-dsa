/**
 * Fix stuck calls in analyzing status
 * Reset them to pending so they can be re-analyzed
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Find all calls stuck in "analyzing" status for more than 2 minutes
    // (Analysis should complete within 1 minute, so 2 min is safe)
    const twoMinutesAgo = new Date()
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)

    const { data: stuckCalls } = await supabase
      .from('calls')
      .select('id, meeting_title, created_at, fathom_synced_at')
      .eq('fathom_status', 'analyzing')
      .lt('fathom_synced_at', twoMinutesAgo.toISOString())

    if (!stuckCalls || stuckCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck calls found',
        fixed: 0
      })
    }

    console.log(`🔧 Found ${stuckCalls.length} stuck calls (analyzing >2min), resetting to pending...`)

    // Reset them to pending so they can be re-analyzed
    const { error: updateError } = await supabase
      .from('calls')
      .update({ fathom_status: 'pending' })
      .eq('fathom_status', 'analyzing')
      .lt('fathom_synced_at', twoMinutesAgo.toISOString())

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Reset ${stuckCalls.length} calls to pending status`)

    return NextResponse.json({
      success: true,
      message: `Fixed ${stuckCalls.length} stuck calls`,
      fixed: stuckCalls.length,
      calls: stuckCalls.map(c => ({
        id: c.id,
        title: c.meeting_title
      }))
    })
  } catch (error) {
    console.error('Fix stuck calls error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fix stuck calls',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
