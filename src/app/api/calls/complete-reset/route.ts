/**
 * COMPLETE RESET of all call statuses
 * This will fix all stuck calls by checking their actual state
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔧 Starting complete call status reset...')

    // Step 1: Get ALL calls
    const { data: allCalls, error: fetchError } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, transcript')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    if (!allCalls || allCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls found',
        processed: 0
      })
    }

    console.log(`📊 Found ${allCalls.length} total calls`)

    const updates = {
      fixedToCompleted: [] as any[],
      resetToPending: [] as any[],
      alreadyCorrect: 0
    }

    // Step 2: Process each call and determine correct status
    for (const call of allCalls) {
      const hasTranscript = call.transcript && call.transcript.length > 50

      // Check if analysis exists for this call
      const { data: analysisData } = await supabase
        .from('analysis')
        .select('id, framework_score')
        .eq('call_id', call.id)
        .limit(1)

      const hasAnalysis = analysisData && analysisData.length > 0
      const currentStatus = call.fathom_status

      let correctStatus: string

      if (hasAnalysis) {
        // Has analysis → should be "completed"
        correctStatus = 'completed'
      } else if (hasTranscript) {
        // Has transcript but no analysis → should be "pending" (waiting for analysis)
        correctStatus = 'pending'
      } else {
        // No transcript → should be "completed" (can't analyze)
        correctStatus = 'completed'
      }

      // Log ALL calls for debugging
      console.log(`📋 ${call.meeting_title}:`)
      console.log(`   Current: ${currentStatus}, Correct: ${correctStatus}, Analysis: ${hasAnalysis}, Transcript: ${hasTranscript ? 'yes' : 'no'}`)

      // Update if status is wrong
      if (currentStatus !== correctStatus) {
        console.log(`🔄 Fixing ${call.meeting_title}: ${currentStatus} → ${correctStatus}`)

        await supabase
          .from('calls')
          .update({ fathom_status: correctStatus })
          .eq('id', call.id)

        if (correctStatus === 'completed') {
          updates.fixedToCompleted.push({
            id: call.id,
            title: call.meeting_title,
            hadAnalysis: hasAnalysis,
            score: hasAnalysis && analysisData ? analysisData[0]?.framework_score : null
          })
        } else {
          updates.resetToPending.push({
            id: call.id,
            title: call.meeting_title
          })
        }
      } else {
        updates.alreadyCorrect++
      }
    }

    console.log(`✅ Reset complete!`)
    console.log(`   - Fixed to completed: ${updates.fixedToCompleted.length}`)
    console.log(`   - Reset to pending: ${updates.resetToPending.length}`)
    console.log(`   - Already correct: ${updates.alreadyCorrect}`)

    return NextResponse.json({
      success: true,
      message: 'Complete reset finished',
      totalProcessed: allCalls.length,
      fixedToCompleted: updates.fixedToCompleted.length,
      resetToPending: updates.resetToPending.length,
      alreadyCorrect: updates.alreadyCorrect,
      details: {
        fixedCalls: updates.fixedToCompleted,
        pendingCalls: updates.resetToPending
      }
    })
  } catch (error) {
    console.error('❌ Complete reset failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete reset',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
