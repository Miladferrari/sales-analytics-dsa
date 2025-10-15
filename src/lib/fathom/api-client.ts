/**
 * Fathom.ai API Client
 *
 * Docs: https://docs.fathom.video/docs/api-reference
 */

// Raw response from Fathom API
export interface FathomAPICall {
  title: string
  meeting_title: string
  url: string
  created_at: string
  scheduled_start_time: string
  scheduled_end_time: string
  recording_id: number
  recording_start_time: string
  recording_end_time: string
  calendar_invitees_domains_type: string
  transcript: string | null
  transcript_language: string
  default_summary: string | null
  action_items: string | null
  calendar_invitees: Array<{
    name: string
    email: string
    email_domain: string
    is_external: boolean
    matched_speaker_display_name: string | null
  }>
  recorded_by: {
    name: string
    email: string
    email_domain: string
    team: string
  }
  share_url: string
  crm_matches: any
}

// Our normalized format
export interface FathomCall {
  id: string
  title: string
  start_time: string // ISO 8601
  end_time: string
  duration: number // seconds
  summary?: string
  transcript?: string
  recording_url?: string
  participants: Array<{
    name: string
    email: string
  }>
  created_at: string
  updated_at: string
  recorded_by?: {
    name: string
    email: string
    team: string
  }
}

export interface FathomCallsResponse {
  items: FathomAPICall[]  // Raw API calls
  next_cursor?: string
  limit?: number
}

/**
 * Normalize Fathom API response to our internal format
 */
function normalizeCall(apiCall: FathomAPICall): FathomCall {
  const startTime = new Date(apiCall.recording_start_time)
  const endTime = new Date(apiCall.recording_end_time)
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

  return {
    id: apiCall.recording_id.toString(),
    title: apiCall.meeting_title || apiCall.title,
    start_time: apiCall.recording_start_time,
    end_time: apiCall.recording_end_time,
    duration: durationSeconds,
    summary: apiCall.default_summary || undefined,
    transcript: apiCall.transcript || undefined,
    recording_url: apiCall.share_url,
    participants: apiCall.calendar_invitees.map(inv => ({
      name: inv.name,
      email: inv.email
    })),
    created_at: apiCall.created_at,
    updated_at: apiCall.created_at, // Fathom doesn't provide updated_at
    recorded_by: apiCall.recorded_by ? {
      name: apiCall.recorded_by.name,
      email: apiCall.recorded_by.email,
      team: apiCall.recorded_by.team
    } : undefined
  }
}

export class FathomAPIClient {
  private apiKey: string
  private baseURL = 'https://api.fathom.ai/external/v1'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Fathom API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Get recent calls from Fathom
   *
   * @param limit - Max number of calls to fetch (default: 50)
   * @param cursor - Pagination cursor for next page
   */
  async getCalls(limit: number = 50, cursor?: string): Promise<FathomCallsResponse> {
    const url = new URL(`${this.baseURL}/meetings`)
    url.searchParams.set('limit', limit.toString())
    if (cursor) {
      url.searchParams.set('cursor', cursor)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fathom API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get a specific call by ID
   */
  async getCall(callId: string): Promise<FathomCall> {
    const response = await fetch(`${this.baseURL}/meetings/${callId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fathom API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get transcript for a specific recording
   * Returns formatted transcript text with speaker labels
   */
  async getTranscript(recordingId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/recordings/${recordingId}/transcript`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Recording might not have a transcript yet (still processing or failed)
        return null
      }

      const data = await response.json()

      if (!data.transcript || !Array.isArray(data.transcript)) {
        return null
      }

      // Format transcript: "Speaker Name: Text\n"
      const formattedLines = data.transcript.map((entry: any) => {
        const speaker = entry.speaker?.display_name || 'Unknown Speaker'
        const text = entry.text || ''
        return `${speaker}: ${text}`
      })

      return formattedLines.join('\n')
    } catch (error) {
      console.error(`Failed to fetch transcript for recording ${recordingId}:`, error)
      return null
    }
  }

  /**
   * Get calls created after a specific timestamp
   * This is useful for polling - only fetch new calls
   */
  async getCallsSince(sinceTimestamp: string, limit: number = 50): Promise<FathomCall[]> {
    const allCalls: FathomCall[] = []
    let cursor: string | undefined = undefined
    let hasMore = true

    while (hasMore && allCalls.length < limit) {
      const response = await this.getCalls(50, cursor)

      // Filter calls that are newer than sinceTimestamp
      const newCallsRaw = (response.items || []).filter(call => {
        return new Date(call.created_at) > new Date(sinceTimestamp)
      })

      // Normalize calls and fetch transcripts
      for (const apiCall of newCallsRaw) {
        const normalized = normalizeCall(apiCall)

        // Fetch transcript separately if not already included
        if (!normalized.transcript && apiCall.recording_id) {
          const transcript = await this.getTranscript(apiCall.recording_id.toString())
          if (transcript) {
            normalized.transcript = transcript
          }
        }

        allCalls.push(normalized)
      }

      // Stop if we've hit older calls or no more pages
      if (newCallsRaw.length < (response.items || []).length || !response.next_cursor) {
        hasMore = false
      } else {
        cursor = response.next_cursor
      }

      // Safety: Don't fetch more than limit
      if (allCalls.length >= limit) {
        break
      }
    }

    return allCalls.slice(0, limit)
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCalls(1)
      return true
    } catch (error) {
      console.error('Fathom API connection test failed:', error)
      return false
    }
  }
}

/**
 * Create a Fathom API client instance
 */
export function createFathomClient(apiKey?: string): FathomAPIClient {
  const key = apiKey || process.env.FATHOM_API_KEY

  if (!key) {
    throw new Error('FATHOM_API_KEY environment variable is not set')
  }

  return new FathomAPIClient(key)
}
