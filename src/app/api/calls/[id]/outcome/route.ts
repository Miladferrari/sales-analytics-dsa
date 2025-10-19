/**
 * API Route: Update Call Outcome
 *
 * Handles updating call outcomes for self-learning AI system
 * Includes validation and tagging functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const callId = params.id
    const body = await request.json()

    // Validate call exists
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single()

    if (callError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Layer 1: Basic outcome
    if (body.outcome_status !== undefined) {
      updates.outcome_status = body.outcome_status
    }
    if (body.deal_value !== undefined) {
      updates.deal_value = body.deal_value
    }

    // Layer 2: Quality indicators
    if (body.lead_quality !== undefined) {
      updates.lead_quality = body.lead_quality
    }
    if (body.closer_performance !== undefined) {
      updates.closer_performance = body.closer_performance
    }
    if (body.external_factors !== undefined) {
      updates.external_factors = body.external_factors
    }

    // Layer 3: Benchmark eligibility
    if (body.is_benchmark !== undefined) {
      updates.is_benchmark = body.is_benchmark

      // Validate: benchmark calls must be closed_won
      if (body.is_benchmark && updates.outcome_status && updates.outcome_status !== 'closed_won') {
        return NextResponse.json(
          { error: 'Benchmark calls must have outcome_status = closed_won' },
          { status: 400 }
        )
      }
    }
    if (body.benchmark_reason !== undefined) {
      updates.benchmark_reason = body.benchmark_reason
    }
    if (body.exclude_from_learning !== undefined) {
      updates.exclude_from_learning = body.exclude_from_learning
    }
    if (body.exclusion_reason !== undefined) {
      updates.exclusion_reason = body.exclusion_reason
    }

    // Layer 4: Validation (manager approval)
    if (body.validated_by !== undefined) {
      updates.validated_by = body.validated_by
      updates.validated_at = new Date().toISOString()
    }
    if (body.validation_notes !== undefined) {
      updates.validation_notes = body.validation_notes
    }

    // Learning weight
    if (body.learning_weight !== undefined) {
      updates.learning_weight = body.learning_weight
    }

    // Update call
    const { data: updatedCall, error: updateError } = await supabase
      .from('calls')
      .update(updates as any)
      .eq('id', callId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating call outcome:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call outcome' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call: updatedCall
    })

  } catch (error) {
    console.error('Call outcome update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const callId = params.id

    // Get call with outcome details
    const { data: call, error } = await supabase
      .from('calls')
      .select(`
        *,
        analysis(*),
        sales_reps(name, email)
      `)
      .eq('id', callId)
      .single()

    if (error || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      call
    })

  } catch (error) {
    console.error('Call outcome fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
