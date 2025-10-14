import { WebhookLogEntry } from '@/types/fathom'

/**
 * Logs webhook requests to database for monitoring and debugging
 */
export async function logWebhookRequest(
  entry: WebhookLogEntry,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert([{
        endpoint: entry.endpoint,
        method: entry.method,
        payload: entry.payload,
        status_code: entry.status_code,
        error_message: entry.error_message,
        processing_time_ms: entry.processing_time_ms,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error logging webhook request:', error)
    }
  } catch (error) {
    console.error('Failed to log webhook request:', error)
  }
}

/**
 * Enhanced console logging with timestamps and context
 */
export class WebhookLogger {
  private context: string

  constructor(context: string = 'Fathom Webhook') {
    this.context = context
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : ''
    return `[${timestamp}] [${level}] [${this.context}] ${message}${dataStr}`
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('INFO', message, data))
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('ERROR', message, error))
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('WARN', message, data))
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, data))
    }
  }

  success(message: string, data?: any): void {
    console.log(this.formatMessage('SUCCESS', message, data))
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any
): { statusCode: number; body: any } {
  return {
    statusCode,
    body: {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string
): { statusCode: number; body: any } {
  return {
    statusCode: 200,
    body: {
      success: true,
      message: message || 'Webhook processed successfully',
      data,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Store unmatched call for manual review
 */
export async function storeUnmatchedCall(
  payload: any,
  supabase: any
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('unmatched_fathom_calls')
      .insert([{
        fathom_call_id: payload.call_id,
        meeting_title: payload.meeting.title,
        start_time: payload.meeting.start_time,
        duration: payload.meeting.duration,
        transcript: payload.meeting.transcript,
        recording_url: payload.meeting.recording_url,
        participants: payload.meeting.participants,
        created_at: new Date().toISOString(),
        reviewed: false
      }])
      .select('id')
      .single()

    if (error) {
      console.error('Error storing unmatched call:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Failed to store unmatched call:', error)
    return null
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  elapsed(): number {
    return Date.now() - this.startTime
  }

  reset(): void {
    this.startTime = Date.now()
  }
}
