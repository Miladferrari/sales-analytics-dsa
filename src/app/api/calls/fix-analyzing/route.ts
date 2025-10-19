/**
 * Fix calls stuck in "analyzing" status that actually have completed analysis
 * This updates their status to "completed" if they have an analysis record
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get all calls in "analyzing" status
    const { data: analyzingCalls } = await supabase
      .from('calls')
      .select(`
        id,
        meeting_title,
        fathom_status,
        analysis(id, framework_score)
      `)
      .eq('fathom_status', 'analyzing')

    if (!analyzingCalls || analyzingCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No analyzing calls found',
        fixed: 0
      })
    }

    console.log(`🔍 Found ${analyzingCalls.length} calls in analyzing status`)

    let fixedCount = 0
    const fixed = []
    const stillPending = []

    for (const call of analyzingCalls) {
      // Check if this call has an analysis record
      const hasAnalysis = Array.isArray(call.analysis) && call.analysis.length > 0

      if (hasAnalysis) {
        // Has analysis but status is still "analyzing" - FIX IT
        console.log(`✅ Fixing ${call.meeting_title} - has analysis, updating to completed`)

        await supabase
          .from('calls')
          .update({ fathom_status: 'completed' })
          .eq('id', call.id)

        fixedCount++
        fixed.push({
          id: call.id,
          title: call.meeting_title,
          score: call.analysis[0]?.framework_score
        })
      } else {
        // No analysis yet - reset to pending
        console.log(`⚠️  ${call.meeting_title} - no analysis found, resetting to pending`)

        await supabase
          .from('calls')
          .update({ fathom_status: 'pending' })
          .eq('id', call.id)

        stillPending.push({
          id: call.id,
          title: call.meeting_title
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} calls with completed analysis, reset ${stillPending.length} to pending`,
      fixed: fixedCount,
      callsFixed: fixed,
      callsResetToPending: stillPending
    })
  } catch (error) {
    console.error('Fix analyzing calls error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fix analyzing calls',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
