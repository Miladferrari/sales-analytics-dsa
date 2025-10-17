/**
 * API Endpoint: /api/settings/fathom
 *
 * Manage Fathom API configuration settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFathomConfig, updateFathomConfig } from '@/lib/config/system'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/settings/fathom
 * Retrieve current Fathom configuration (masked for security)
 */
export async function GET(request: NextRequest) {
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

    // Get config from database
    const config = await getFathomConfig()

    // Mask sensitive data for security
    const maskedConfig = {
      apiKey: config.apiKey ? maskApiKey(config.apiKey) : null,
      apiKeyFull: config.apiKey, // For the UI to use (show/hide functionality)
      webhookSecret: config.webhookSecret ? maskSecret(config.webhookSecret) : null,
      webhookSecretFull: config.webhookSecret,
      connectionStatus: config.connectionStatus || 'not_configured',
      lastTested: config.lastTested,
      hasApiKey: !!config.apiKey,
      hasWebhookSecret: !!config.webhookSecret
    }

    return NextResponse.json(maskedConfig)
  } catch (error: any) {
    console.error('Error fetching Fathom config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/fathom
 * Update Fathom API configuration
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
    const { apiKey, webhookSecret } = body

    // Validate input
    if (!apiKey && !webhookSecret) {
      return NextResponse.json(
        { error: 'At least one field (apiKey or webhookSecret) is required' },
        { status: 400 }
      )
    }

    // Update configuration
    const result = await updateFathomConfig({
      apiKey: apiKey || undefined,
      webhookSecret: webhookSecret || undefined,
      userId: user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update configuration', message: result.error },
        { status: 500 }
      )
    }

    // Fetch updated config
    const updatedConfig = await getFathomConfig()

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        hasApiKey: !!updatedConfig.apiKey,
        hasWebhookSecret: !!updatedConfig.webhookSecret,
        connectionStatus: updatedConfig.connectionStatus
      }
    })
  } catch (error: any) {
    console.error('Error updating Fathom config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Helper: Mask API key for display
 * Shows first 7 and last 5 characters
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) return '•'.repeat(apiKey.length)

  const start = apiKey.substring(0, 7)
  const end = apiKey.substring(apiKey.length - 5)
  return `${start}...${end}`
}

/**
 * Helper: Mask secret completely
 */
function maskSecret(secret: string): string {
  return '•'.repeat(Math.min(secret.length, 20))
}
