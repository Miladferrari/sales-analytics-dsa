import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/users/[id]/resend
 * Resends invitation email to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'Gebruiker ID is verplicht' },
        { status: 400 }
      )
    }

    // Get current user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd - geen geldige sessie' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify current user with token
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd - sessie verlopen' },
        { status: 401 }
      )
    }

    // Use service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user details
    const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserById(userId)

    if (getUserError || !userData.user) {
      console.error('Error getting user:', getUserError)
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      )
    }

    const userEmail = userData.user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Gebruiker heeft geen email adres' },
        { status: 400 }
      )
    }

    // Send password reset email (serves as invitation)
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
    })

    if (resetError) {
      console.error('Error sending reset email:', resetError)
      return NextResponse.json(
        { error: 'Fout bij versturen uitnodiging: ' + resetError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Invitation resent to ${userEmail} by ${currentUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'Uitnodiging succesvol opnieuw verstuurd',
      email: userEmail
    })

  } catch (error) {
    console.error('Error in resend invitation API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
