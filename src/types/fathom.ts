// Fathom.ai Webhook Types
// These types represent the data structure from Fathom.ai webhooks

export interface FathomParticipant {
  name: string
  email: string
}

export interface FathomMeeting {
  title: string
  start_time: string // ISO 8601 format
  duration: number // Duration in seconds
  transcript: string
  recording_url: string
  participants: FathomParticipant[]
}

export interface FathomWebhookPayload {
  event: 'call_completed' | 'call_started' | 'call_failed'
  call_id: string
  meeting: FathomMeeting
  timestamp?: string
}

// Database types for storing Fathom data
export interface FathomCallData {
  fathom_call_id: string
  transcript: string
  recording_url: string
  participants: FathomParticipant[]
  meeting_title: string
  start_time: Date
  duration: number
  fathom_status: 'pending' | 'processing' | 'completed' | 'failed'
  fathom_synced_at?: Date
}

// Unmatched call for review
export interface UnmatchedFathomCall {
  id?: string
  fathom_call_id: string
  meeting_title: string
  start_time: Date
  duration: number
  transcript: string
  recording_url: string
  participants: FathomParticipant[]
  created_at?: Date
  reviewed?: boolean
  notes?: string
}

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean
  call_id?: string
  rep_matched?: boolean
  rep_email?: string
  error?: string
  unmatched_call_id?: string
}

// Webhook log entry
export interface WebhookLogEntry {
  endpoint: string
  method: string
  payload: any
  status_code: number
  error_message?: string
  processing_time_ms: number
}

// Sales rep matching result
export interface SalesRepMatchResult {
  matched: boolean
  rep_id?: string
  rep_email?: string
  rep_name?: string
  participant_email?: string
}

// Webhook validation result
export interface WebhookValidationResult {
  valid: boolean
  error?: string
  missing_fields?: string[]
}
