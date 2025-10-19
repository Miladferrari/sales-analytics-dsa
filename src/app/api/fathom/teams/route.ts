/**
 * API endpoint to get all Fathom organization teams
 * This fetches the official teams from the Fathom organization
 * Uses database-based Fathom configuration
 */

import { NextResponse } from 'next/server'
import { getFathomConfig } from '@/lib/config/system'
import { fetchWithRetry } from '@/lib/fathom/retry-helper'

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Get Fathom API key from database (with fallback to env)
    const config = await getFathomConfig()

    if (!config.apiKey) {
      console.error('❌ No Fathom API key configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Fathom API key not configured. Please configure in Settings.',
          teams: []
        },
        { status: 500 }
      )
    }

    // Fetch teams from Fathom organization using database config with retry logic
    const response = await fetchWithRetry('https://api.fathom.ai/external/v1/teams', {
      headers: {
        'X-Api-Key': config.apiKey,
      },
    }, {
      maxRetries: 2,
      initialDelay: 1000
    })

    if (!response.ok) {
      throw new Error(`Fathom API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract team names from the response
    const teams = data.items?.map((team: any) => team.name) || []

    console.log('📋 Fathom organization teams:', teams)

    return NextResponse.json({
      success: true,
      teams,
      count: teams.length
    })

  } catch (error) {
    console.error('❌ Error fetching Fathom teams:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        teams: []
      },
      { status: 500 }
    )
  }
}
