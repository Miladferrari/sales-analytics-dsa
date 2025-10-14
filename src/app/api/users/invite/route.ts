import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, adminPassword } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !adminPassword) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
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

    if (userError || !currentUser || !currentUser.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd - sessie verlopen' },
        { status: 401 }
      )
    }

    // Verify admin password by creating a NEW client and signing in
    // This does NOT affect the user's current session
    const verifyClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: signInData, error: signInError } = await verifyClient.auth.signInWithPassword({
      email: currentUser.email,
      password: adminPassword
    })

    if (signInError || !signInData.user) {
      console.error('Password verification failed:', signInError?.message)
      return NextResponse.json(
        { error: '❌ Wachtwoord verificatie mislukt. Controleer je wachtwoord en probeer opnieuw.' },
        { status: 403 }
      )
    }

    // Use service role client to create user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email.toLowerCase())

    if (userExists) {
      return NextResponse.json(
        { error: 'Een gebruiker met dit email adres bestaat al' },
        { status: 400 }
      )
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'

    // Create user with Supabase Auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'user',
        first_name: firstName,
        last_name: lastName
      }
    })

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Fout bij aanmaken gebruiker: ' + createError?.message },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't fail if profile creation fails, user is already created
    }

    // Send password reset email (this serves as the invitation)
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase(),
    })

    if (resetError) {
      console.warn('Error sending reset email:', resetError)
      // Don't fail, user is created
    }

    return NextResponse.json({
      success: true,
      message: 'Gebruiker succesvol toegevoegd en uitnodiging verstuurd',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        firstName,
        lastName
      }
    })

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
