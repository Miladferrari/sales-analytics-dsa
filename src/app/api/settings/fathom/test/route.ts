/**
 * API Endpoint: /api/settings/fathom/test
 *
 * Test Fathom API connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateFathomConnectionStatus } from '@/lib/config/system'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/settings/fathom/test
 * Test the Fathom API connection with provided or stored credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication via Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is required for testing' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing Fathom API connection...')

    // Test the Fathom API
    const testResult = await testFathomConnection(apiKey)

    if (testResult.success) {
      // Update connection status in database
      await updateFathomConnectionStatus('connected', user.id)

      return NextResponse.json({
        success: true,
        message: 'Verbinding succesvol!',
        teamName: testResult.teamName,
        teamId: testResult.teamId,
        callsCount: testResult.callsCount
      })
    } else {
      // Update connection status to error
      await updateFathomConnectionStatus('error', user.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Connection failed',
          message: testResult.error || 'Could not connect to Fathom API'
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error testing Fathom connection:', error)
    return NextResponse.json(
      { success: false, error: 'Test failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Test Fathom API connection
 */
async function testFathomConnection(apiKey: string): Promise<{
  success: boolean
  teamName?: string
  teamId?: string
  callsCount?: number
  error?: string
}> {
  try {
    // Test 1: Fetch calls to verify API key works
    const callsResponse = await fetch('https://api.fathom.ai/external/v1/meetings?limit=1', {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!callsResponse.ok) {
      const errorText = await callsResponse.text()
      console.error('Fathom API error:', errorText)

      if (callsResponse.status === 401 || callsResponse.status === 403) {
        return {
          success: false,
          error: 'Invalid API Key - Controleer of de API key correct is'
        }
      }

      return {
        success: false,
        error: `API Error ${callsResponse.status}: ${errorText}`
      }
    }

    const callsData = await callsResponse.json()

    // Test 2: Try to get team info (if available in response)
    // Fathom API doesn't have a dedicated teams endpoint, so we infer from calls
    let teamName = 'Unknown Team'
    let teamId = 'unknown'

    // Check if we can extract team info from the response
    // Note: Fathom's actual API structure may vary
    if (callsData && callsData.meetings) {
      teamName = 'Fathom Team' // Default name
      teamId = 'connected'
    }

    return {
      success: true,
      teamName,
      teamId,
      callsCount: callsData.meetings?.length || 0
    }
  } catch (error: any) {
    console.error('Exception testing Fathom connection:', error)
    return {
      success: false,
      error: error.message || 'Network error - Kan geen verbinding maken met Fathom'
    }
  }
}
