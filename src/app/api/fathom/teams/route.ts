/**
 * API endpoint to get all Fathom organization teams
 * This fetches the official teams from the Fathom organization
 */

import { NextResponse } from 'next/server'

const FATHOM_API_KEY = process.env.FATHOM_API_KEY!

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch teams from Fathom organization
    const response = await fetch('https://api.fathom.ai/external/v1/teams', {
      headers: {
        'X-Api-Key': FATHOM_API_KEY,
      },
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
