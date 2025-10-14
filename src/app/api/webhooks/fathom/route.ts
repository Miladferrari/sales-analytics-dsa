import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  validateWebhookSignature,
  validateFathomPayload,
  sanitizeFathomPayload,
  isDuplicateWebhook
} from '@/lib/fathom/webhook-validator'
import { matchSalesRep, getClientParticipants } from '@/lib/fathom/rep-matcher'
import {
  WebhookLogger,
  PerformanceTimer,
  logWebhookRequest,
  storeUnmatchedCall,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/fathom/webhook-logger'
import { FathomWebhookPayload } from '@/types/fathom'

const logger = new WebhookLogger('Fathom Webhook')

/**
 * POST /api/webhooks/fathom
 * Receives webhook notifications from Fathom.ai when calls are completed
 */
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const webhookSecret = process.env.FATHOM_WEBHOOK_SECRET!

  // Initialize Supabase client with service role for server-side operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Step 1: Get raw body and signature
    const rawBody = await request.text()
    const signature = request.headers.get('x-fathom-signature')

    logger.info('Webhook received', {
      hasSignature: !!signature,
      bodyLength: rawBody.length
    })

    // Step 2: Validate webhook signature
    if (!webhookSecret) {
      logger.error('FATHOM_WEBHOOK_SECRET not configured')
      const response = createErrorResponse(500, 'Webhook secret not configured')
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload: { error: 'No webhook secret' },
        status_code: 500,
        error_message: 'FATHOM_WEBHOOK_SECRET not configured',
        processing_time_ms: timer.elapsed()
      }, supabase)
      return NextResponse.json(response.body, { status: response.statusCode })
    }

    const isValidSignature = validateWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValidSignature) {
      logger.error('Invalid webhook signature')
      const response = createErrorResponse(401, 'Invalid webhook signature')
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload: rawBody,
        status_code: 401,
        error_message: 'Invalid signature',
        processing_time_ms: timer.elapsed()
      }, supabase)
      return NextResponse.json(response.body, { status: response.statusCode })
    }

    logger.success('Signature validated')

    // Step 3: Parse and validate payload structure
    let payload: FathomWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      logger.error('Failed to parse JSON payload', error)
      const response = createErrorResponse(400, 'Invalid JSON payload')
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload: rawBody,
        status_code: 400,
        error_message: 'Invalid JSON',
        processing_time_ms: timer.elapsed()
      }, supabase)
      return NextResponse.json(response.body, { status: response.statusCode })
    }

    const validationResult = validateFathomPayload(payload)
    if (!validationResult.valid) {
      logger.error('Payload validation failed', validationResult)
      const response = createErrorResponse(400, validationResult.error || 'Invalid payload', {
        missing_fields: validationResult.missing_fields
      })
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload,
        status_code: 400,
        error_message: validationResult.error,
        processing_time_ms: timer.elapsed()
      }, supabase)
      return NextResponse.json(response.body, { status: response.statusCode })
    }

    logger.success('Payload validated', {
      event: payload.event,
      call_id: payload.call_id,
      participants: payload.meeting.participants.length
    })

    // Step 4: Check for duplicate webhook (idempotency)
    const isDuplicate = await isDuplicateWebhook(payload.call_id, supabase)
    if (isDuplicate) {
      logger.warn('Duplicate webhook detected', { call_id: payload.call_id })
      const response = createSuccessResponse(
        { call_id: payload.call_id, status: 'duplicate' },
        'Webhook already processed'
      )
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload,
        status_code: 200,
        error_message: 'Duplicate webhook',
        processing_time_ms: timer.elapsed()
      }, supabase)
      return NextResponse.json(response.body, { status: response.statusCode })
    }

    // Step 5: Sanitize payload
    const sanitizedPayload = sanitizeFathomPayload(payload)

    // Step 6: Match sales rep from participants
    const matchResult = await matchSalesRep(sanitizedPayload.meeting.participants, supabase)

    logger.info('Sales rep matching result', {
      matched: matchResult.matched,
      rep_email: matchResult.rep_email
    })

    // Step 7: Process based on match result
    if (matchResult.matched && matchResult.rep_id) {
      // Get client participants (non-sales-reps)
      const clientParticipants = await getClientParticipants(
        sanitizedPayload.meeting.participants,
        supabase
      )

      // Store call in calls table
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert([{
          sales_rep_id: matchResult.rep_id,
          date: new Date(sanitizedPayload.meeting.start_time).toISOString(),
          duration: sanitizedPayload.meeting.duration,
          outcome: 'completed',
          fathom_call_id: sanitizedPayload.call_id,
          transcript: sanitizedPayload.meeting.transcript,
          recording_url: sanitizedPayload.meeting.recording_url,
          participants: sanitizedPayload.meeting.participants,
          meeting_title: sanitizedPayload.meeting.title,
          fathom_synced_at: new Date().toISOString(),
          fathom_status: 'completed',
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (callError) {
        logger.error('Failed to store call', callError)
        const response = createErrorResponse(500, 'Failed to store call', callError)
        await logWebhookRequest({
          endpoint: '/api/webhooks/fathom',
          method: 'POST',
          payload: sanitizedPayload,
          status_code: 500,
          error_message: callError.message,
          processing_time_ms: timer.elapsed()
        }, supabase)
        return NextResponse.json(response.body, { status: response.statusCode })
      }

      logger.success('Call stored successfully', {
        call_id: callData.id,
        rep_email: matchResult.rep_email,
        fathom_call_id: sanitizedPayload.call_id
      })

      // Trigger background analysis (non-blocking)
      // We don't await this - it runs in the background
      triggerCallAnalysis(callData.id).catch((err) => {
        logger.error('Failed to trigger analysis', err)
        // Don't fail the webhook if analysis trigger fails
      })

      // Log webhook request
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload: sanitizedPayload,
        status_code: 200,
        processing_time_ms: timer.elapsed()
      }, supabase)

      const response = createSuccessResponse({
        call_id: callData.id,
        fathom_call_id: sanitizedPayload.call_id,
        rep_matched: true,
        rep_email: matchResult.rep_email,
        client_participants: clientParticipants.length,
        analysis_triggered: true
      })

      return NextResponse.json(response.body, { status: response.statusCode })

    } else {
      // No sales rep matched - store as unmatched for manual review
      logger.warn('No sales rep matched', {
        fathom_call_id: sanitizedPayload.call_id,
        participants: sanitizedPayload.meeting.participants.map(p => p.email)
      })

      const unmatchedCallId = await storeUnmatchedCall(sanitizedPayload, supabase)

      if (!unmatchedCallId) {
        logger.error('Failed to store unmatched call')
        const response = createErrorResponse(500, 'Failed to store unmatched call')
        await logWebhookRequest({
          endpoint: '/api/webhooks/fathom',
          method: 'POST',
          payload: sanitizedPayload,
          status_code: 500,
          error_message: 'Failed to store unmatched call',
          processing_time_ms: timer.elapsed()
        }, supabase)
        return NextResponse.json(response.body, { status: response.statusCode })
      }

      logger.success('Unmatched call stored for review', {
        unmatched_call_id: unmatchedCallId,
        fathom_call_id: sanitizedPayload.call_id
      })

      // Log webhook request
      await logWebhookRequest({
        endpoint: '/api/webhooks/fathom',
        method: 'POST',
        payload: sanitizedPayload,
        status_code: 200,
        processing_time_ms: timer.elapsed()
      }, supabase)

      const response = createSuccessResponse({
        fathom_call_id: sanitizedPayload.call_id,
        rep_matched: false,
        unmatched_call_id: unmatchedCallId,
        status: 'stored_for_review'
      }, 'Call stored for manual review - no sales rep matched')

      return NextResponse.json(response.body, { status: response.statusCode })
    }

  } catch (error) {
    logger.error('Unexpected error processing webhook', error)

    const response = createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    await logWebhookRequest({
      endpoint: '/api/webhooks/fathom',
      method: 'POST',
      payload: { error: 'Unexpected error' },
      status_code: 500,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: timer.elapsed()
    }, supabase)

    return NextResponse.json(response.body, { status: response.statusCode })
  }
}

/**
 * GET /api/webhooks/fathom
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'fathom-webhook',
    timestamp: new Date().toISOString()
  })
}

/**
 * Helper: Trigger background analysis for a call
 * This function makes a non-blocking call to the analysis API
 */
async function triggerCallAnalysis(callId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  logger.info('Triggering background analysis', { call_id: callId })

  // Make async call to analysis endpoint
  // We use fetch instead of waiting to avoid blocking the webhook
  fetch(`${baseUrl}/api/calls/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ callId })
  }).catch((error) => {
    // Log error but don't throw - this shouldn't block webhook
    logger.error('Analysis trigger failed', { call_id: callId, error })
  })

  logger.success('Analysis triggered', { call_id: callId })
}
