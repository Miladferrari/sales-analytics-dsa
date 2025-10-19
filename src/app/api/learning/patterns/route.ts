/**
 * API Route: Learned Patterns Management
 *
 * Handles CRUD operations for AI-learned patterns
 * Includes validation workflow and approval process
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET: Retrieve learned patterns
 */
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // Filter by status
    const type = searchParams.get('type') // Filter by pattern_type

    let query = supabase
      .from('learned_patterns')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('pattern_type', type)
    }

    const { data: patterns, error } = await query

    if (error) {
      console.error('Error fetching patterns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patterns' },
        { status: 500 }
      )
    }

    // Calculate summary stats
    const stats = {
      total: patterns?.length || 0,
      by_status: {
        detected: patterns?.filter(p => p.status === 'detected').length || 0,
        validating: patterns?.filter(p => p.status === 'validating').length || 0,
        validated: patterns?.filter(p => p.status === 'validated').length || 0,
        approved: patterns?.filter(p => p.status === 'approved').length || 0,
        in_production: patterns?.filter(p => p.status === 'in_production').length || 0,
        deprecated: patterns?.filter(p => p.status === 'deprecated').length || 0,
        rejected: patterns?.filter(p => p.status === 'rejected').length || 0
      },
      by_type: {
        step_score: patterns?.filter(p => p.pattern_type === 'step_score').length || 0,
        phrase_usage: patterns?.filter(p => p.pattern_type === 'phrase_usage').length || 0,
        timing: patterns?.filter(p => p.pattern_type === 'timing').length || 0,
        sequence: patterns?.filter(p => p.pattern_type === 'sequence').length || 0,
        behavioral: patterns?.filter(p => p.pattern_type === 'behavioral').length || 0,
        contextual: patterns?.filter(p => p.pattern_type === 'contextual').length || 0
      },
      avg_success_rate: patterns && patterns.length > 0
        ? (patterns.reduce((sum, p) => sum + (p.success_rate || 0), 0) / patterns.length).toFixed(1)
        : 0
    }

    return NextResponse.json({
      success: true,
      patterns: patterns || [],
      stats
    })

  } catch (error) {
    console.error('Patterns fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new learned pattern
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.pattern_name || !body.pattern_description || !body.pattern_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert pattern
    const { data: pattern, error } = await supabase
      .from('learned_patterns')
      .insert({
        pattern_name: body.pattern_name,
        pattern_description: body.pattern_description,
        pattern_type: body.pattern_type,
        correlation_strength: body.correlation_strength || 0,
        sample_size: body.sample_size || 0,
        p_value: body.p_value,
        confidence_interval: body.confidence_interval,
        impact_on_close_rate: body.impact_on_close_rate,
        impact_description: body.impact_description,
        source_call_ids: body.source_call_ids,
        status: 'detected' // Always starts as detected
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pattern:', error)
      return NextResponse.json(
        { error: 'Failed to create pattern' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pattern
    })

  } catch (error) {
    console.error('Pattern creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Update pattern status (validation workflow)
 */
export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Pattern ID required' },
        { status: 400 }
      )
    }

    // If manager is approving, set validated_by
    if (updates.manager_approved === true) {
      updates.validated_by = user.id
      updates.validated_at = new Date().toISOString()
    }

    // Update pattern
    const { data: pattern, error } = await supabase
      .from('learned_patterns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating pattern:', error)
      return NextResponse.json(
        { error: 'Failed to update pattern' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pattern
    })

  } catch (error) {
    console.error('Pattern update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove a pattern
 */
export async function DELETE(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Pattern ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('learned_patterns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting pattern:', error)
      return NextResponse.json(
        { error: 'Failed to delete pattern' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Pattern deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
