/**
 * API Endpoint: /api/calls/analyze
 *
 * Background service die calls analyseert met OpenAI
 * Wordt aangeroepen na het opslaan van een nieuwe call
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeCall } from '@/lib/analysis/openai-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/calls/analyze
 * Analyseer een specifieke call
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await request.json()
    const { callId } = body

    if (!callId) {
      return NextResponse.json(
        { error: 'Missing callId parameter' },
        { status: 400 }
      )
    }

    console.log(`📞 Starting analysis for call ${callId}`)

    // 1. Fetch call from database
    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select('*, sales_reps(name)')
      .eq('id', callId)
      .single()

    if (fetchError || !call) {
      console.error('Call not found:', fetchError)
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // 2. Check if already analyzed
    const { data: existingAnalysis } = await supabase
      .from('analysis')
      .select('id')
      .eq('call_id', callId)
      .single()

    if (existingAnalysis) {
      console.log(`⚠️ Call ${callId} already has analysis`)
      return NextResponse.json({
        success: true,
        message: 'Call already analyzed',
        callId,
        analysisId: existingAnalysis.id
      })
    }

    // 3. Check if transcript exists
    if (!call.transcript || call.transcript.trim().length < 50) {
      console.error('Transcript too short or missing')
      return NextResponse.json(
        { error: 'Transcript is too short or missing' },
        { status: 400 }
      )
    }

    // 4. Update call status to "analyzing"
    await supabase
      .from('calls')
      .update({ fathom_status: 'analyzing' })
      .eq('id', callId)

    // 5. Analyze with OpenAI
    const analysisResult = await analyzeCall({
      transcript: call.transcript,
      callId: call.id,
      salesRepName: call.sales_reps?.name,
      callDate: call.date,
      callDuration: call.duration
    })

    // 6. Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analysis')
      .insert({
        call_id: callId,
        framework_score: analysisResult.overall_score,
        sentiment_score: calculateSentimentScore(analysisResult),
        key_topics: extractKeyTopics(analysisResult),
        analysis_data: {
          categories: analysisResult.categories,
          strengths: analysisResult.strengths,
          improvements: analysisResult.improvements,
          summary: analysisResult.summary,
          model: analysisResult.model,
          tokensUsed: analysisResult.tokensUsed
        },
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save analysis:', saveError)
      throw new Error('Failed to save analysis to database')
    }

    // 7. Update call status to "completed"
    await supabase
      .from('calls')
      .update({ fathom_status: 'completed' })
      .eq('id', callId)

    console.log(`✅ Analysis completed and saved for call ${callId}`)
    console.log(`📊 Score: ${analysisResult.overall_score}/100`)

    return NextResponse.json({
      success: true,
      message: 'Analysis completed successfully',
      callId,
      analysisId: savedAnalysis.id,
      score: analysisResult.overall_score,
      analyzedAt: analysisResult.analyzedAt
    })
  } catch (error) {
    console.error('❌ Analysis failed:', error)

    // Update call status to "failed"
    if (error instanceof Error && error.message.includes('callId')) {
      try {
        const body = await request.json()
        await supabase
          .from('calls')
          .update({
            fathom_status: 'failed',
            // Optioneel: sla error op in een error_message veld
          })
          .eq('id', body.callId)
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calls/analyze
 * Analyse status checker - verwerk alle pending calls
 */
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Find all calls that need analysis
    const { data: pendingCalls, error } = await supabase
      .from('calls')
      .select('id, fathom_call_id')
      .eq('fathom_status', 'pending')
      .limit(10) // Process max 10 at a time

    if (error) {
      throw error
    }

    if (!pendingCalls || pendingCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending calls to analyze',
        processed: 0
      })
    }

    console.log(`🔄 Found ${pendingCalls.length} pending calls to analyze`)

    // Process each call (in parallel for speed)
    const results = await Promise.allSettled(
      pendingCalls.map(async (call) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callId: call.id })
          }
        )
        return { callId: call.id, status: response.status }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingCalls.length} calls`,
      processed: pendingCalls.length,
      successful,
      failed
    })
  } catch (error) {
    console.error('Failed to process pending calls:', error)
    return NextResponse.json(
      { error: 'Failed to process pending calls' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Calculate sentiment score from analysis
 */
function calculateSentimentScore(analysis: any): number {
  // Simpele berekening: score >= 70 = positive, 50-70 = neutral, <50 = negative
  if (analysis.overall_score >= 70) return 80
  if (analysis.overall_score >= 50) return 60
  return 40
}

/**
 * Helper: Extract key topics from analysis
 */
function extractKeyTopics(analysis: any): string[] {
  const topics: string[] = []

  // Extract from category names where score is high or low
  analysis.categories.forEach((cat: any) => {
    if (cat.score >= 80) {
      topics.push(`✓ ${cat.name}`)
    } else if (cat.score < 50) {
      topics.push(`⚠ ${cat.name}`)
    }
  })

  return topics.slice(0, 5) // Max 5 topics
}
