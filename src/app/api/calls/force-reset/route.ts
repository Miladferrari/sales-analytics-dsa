/**
 * FORCE reset ALL analyzing calls to pending
 * Use this when calls are stuck and need immediate reset
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get ALL calls in analyzing status (no time filter)
    const { data: analyzingCalls } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, created_at')
      .eq('fathom_status', 'analyzing')

    if (!analyzingCalls || analyzingCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No analyzing calls found',
        reset: 0
      })
    }

    console.log(`🔧 FORCE RESET: Resetting ${analyzingCalls.length} analyzing calls to pending...`)

    // Reset ALL to pending
    const { error: updateError } = await supabase
      .from('calls')
      .update({ fathom_status: 'pending' })
      .eq('fathom_status', 'analyzing')

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Force reset ${analyzingCalls.length} calls to pending`)

    return NextResponse.json({
      success: true,
      message: `Force reset ${analyzingCalls.length} calls to pending`,
      reset: analyzingCalls.length,
      calls: analyzingCalls.map(c => ({
        id: c.id,
        title: c.meeting_title
      }))
    })
  } catch (error) {
    console.error('Force reset error:', error)
    return NextResponse.json(
      {
        error: 'Failed to force reset calls',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
