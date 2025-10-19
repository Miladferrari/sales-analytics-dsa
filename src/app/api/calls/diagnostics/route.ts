/**
 * Diagnostics endpoint for call analysis issues
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check calls in "analyzing" status (stuck?)
    const { data: analyzingCalls } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, created_at, fathom_synced_at')
      .eq('fathom_status', 'analyzing')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check calls without transcript
    const { data: noTranscriptCalls } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, fathom_id, created_at')
      .or('transcript.is.null,transcript.eq.')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check failed calls
    const { data: failedCalls } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, created_at')
      .eq('fathom_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check calls waiting for analysis (completed but no analysis)
    const { data: completedNoAnalysis } = await supabase
      .from('calls')
      .select(`
        id,
        meeting_title,
        fathom_status,
        created_at,
        analysis(id)
      `)
      .eq('fathom_status', 'completed')
      .is('analysis.id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      diagnostics: {
        analyzingCalls: {
          count: analyzingCalls?.length || 0,
          calls: analyzingCalls || [],
          issue: analyzingCalls && analyzingCalls.length > 0
            ? 'Calls stuck in analyzing status - analysis might have failed without updating status'
            : null
        },
        noTranscriptCalls: {
          count: noTranscriptCalls?.length || 0,
          calls: noTranscriptCalls || [],
          issue: noTranscriptCalls && noTranscriptCalls.length > 0
            ? 'Calls without transcript - Fathom might still be processing or recording failed'
            : null
        },
        failedCalls: {
          count: failedCalls?.length || 0,
          calls: failedCalls || [],
          issue: failedCalls && failedCalls.length > 0
            ? 'Calls that failed analysis - check logs for errors'
            : null
        },
        completedNoAnalysis: {
          count: completedNoAnalysis?.length || 0,
          calls: completedNoAnalysis || [],
          issue: completedNoAnalysis && completedNoAnalysis.length > 0
            ? 'Calls marked completed but have no analysis record'
            : null
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
