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
   * Get calls created after a specific timestamp
   * This is useful for polling - only fetch new calls
   */
  async getCallsSince(sinceTimestamp: string, limit: number = 50): Promise<FathomCall[]> {
    const allCalls: FathomCall[] = []
    let cursor: string | undefined = undefined
    let hasMore = true

    while (hasMore && allCalls.length < limit) {
      const response = await this.getCalls(50, cursor)

      // Filter calls that are newer than sinceTimestamp and normalize them
      const newCalls = (response.items || [])
        .filter(call => {
          return new Date(call.created_at) > new Date(sinceTimestamp)
        })
        .map(call => normalizeCall(call))

      allCalls.push(...newCalls)

      // Stop if we've hit older calls or no more pages
      if (newCalls.length < (response.items || []).length || !response.next_cursor) {
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
