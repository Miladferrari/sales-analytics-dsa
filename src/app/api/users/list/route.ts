import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all auth users (with pagination to ensure we get ALL users)
    let allUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
        page: page,
        perPage: 1000 // Max per page
      })

      if (authError) {
        console.error('Error fetching auth users:', authError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      if (authData && authData.users && authData.users.length > 0) {
        allUsers = allUsers.concat(authData.users)

        // Check if there are more pages
        hasMore = authData.users.length === 1000
        page++
      } else {
        hasMore = false
      }
    }

    console.log(`✅ Fetched ${allUsers.length} users from Supabase Auth`)

    // Get all profiles
    const { data: profiles, error: profileError } = await adminClient
      .from('user_profiles')
      .select('id, first_name, last_name')

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
    }

    // Combine auth users with profiles
    const users = allUsers.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)

      // Check if user has logged in at least once
      // Use != instead of !== to catch both null and undefined
      const hasLoggedIn = authUser.last_sign_in_at != null
      const status = hasLoggedIn ? 'active' : 'invited'

      return {
        id: authUser.id,
        email: authUser.email || '',
        first_name: profile?.first_name || authUser.user_metadata?.first_name || null,
        last_name: profile?.last_name || authUser.user_metadata?.last_name || null,
        created_at: authUser.created_at,
        role: authUser.user_metadata?.role || 'user',
        status: status,
        last_sign_in_at: authUser.last_sign_in_at
      }
    })

    console.log(`✅ Returning ${users.length} users to frontend`)

    return NextResponse.json({
      success: true,
      users
    })

  } catch (error) {
    console.error('Error in users list API:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
