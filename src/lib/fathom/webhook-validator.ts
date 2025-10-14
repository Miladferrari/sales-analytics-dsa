import crypto from 'crypto'
import { FathomWebhookPayload, WebhookValidationResult } from '@/types/fathom'

/**
 * Validates Fathom webhook signature for security
 *
 * Fathom signs webhooks with HMAC-SHA256
 * The signature is sent in the 'x-fathom-signature' header
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Validates the structure of Fathom webhook payload
 */
export function validateFathomPayload(
  payload: any
): WebhookValidationResult {
  const missingFields: string[] = []

  // Check required top-level fields
  if (!payload.event) missingFields.push('event')
  if (!payload.call_id) missingFields.push('call_id')
  if (!payload.meeting) missingFields.push('meeting')

  // Check required meeting fields
  if (payload.meeting) {
    if (!payload.meeting.title) missingFields.push('meeting.title')
    if (!payload.meeting.start_time) missingFields.push('meeting.start_time')
    if (payload.meeting.duration === undefined) missingFields.push('meeting.duration')
    if (!payload.meeting.transcript) missingFields.push('meeting.transcript')
    if (!payload.meeting.recording_url) missingFields.push('meeting.recording_url')
    if (!payload.meeting.participants || !Array.isArray(payload.meeting.participants)) {
      missingFields.push('meeting.participants')
    } else if (payload.meeting.participants.length === 0) {
      missingFields.push('meeting.participants (empty array)')
    }
  }

  // Validate participant structure
  if (payload.meeting?.participants && Array.isArray(payload.meeting.participants)) {
    payload.meeting.participants.forEach((participant: any, index: number) => {
      if (!participant.name) missingFields.push(`meeting.participants[${index}].name`)
      if (!participant.email) missingFields.push(`meeting.participants[${index}].email`)
    })
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: 'Missing required fields',
      missing_fields: missingFields
    }
  }

  // Validate event type
  const validEvents = ['call_completed', 'call_started', 'call_failed']
  if (!validEvents.includes(payload.event)) {
    return {
      valid: false,
      error: `Invalid event type: ${payload.event}. Must be one of: ${validEvents.join(', ')}`
    }
  }

  // Validate start_time format (ISO 8601)
  try {
    const startTime = new Date(payload.meeting.start_time)
    if (isNaN(startTime.getTime())) {
      return {
        valid: false,
        error: 'Invalid start_time format. Must be ISO 8601'
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid start_time format'
    }
  }

  // Validate email format for participants
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const participant of payload.meeting.participants) {
    if (!emailRegex.test(participant.email)) {
      return {
        valid: false,
        error: `Invalid email format: ${participant.email}`
      }
    }
  }

  return { valid: true }
}

/**
 * Sanitize payload data before storing in database
 */
export function sanitizeFathomPayload(payload: FathomWebhookPayload): FathomWebhookPayload {
  return {
    event: payload.event,
    call_id: payload.call_id.trim(),
    meeting: {
      title: payload.meeting.title.trim(),
      start_time: payload.meeting.start_time,
      duration: Math.max(0, payload.meeting.duration),
      transcript: payload.meeting.transcript.trim(),
      recording_url: payload.meeting.recording_url.trim(),
      participants: payload.meeting.participants.map(p => ({
        name: p.name.trim(),
        email: p.email.toLowerCase().trim()
      }))
    },
    timestamp: payload.timestamp
  }
}

/**
 * Check if webhook is a duplicate (already processed)
 */
export async function isDuplicateWebhook(
  fathomCallId: string,
  supabase: any
): Promise<boolean> {
  const { data, error } = await supabase
    .from('calls')
    .select('id')
    .eq('fathom_call_id', fathomCallId)
    .single()

  return !!data && !error
}
