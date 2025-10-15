import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * DELETE /api/users/[id]
 * Deletes a user from the system
 */
export async function DELETE(
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

    // Prevent user from deleting themselves
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Je kunt jezelf niet verwijderen' },
        { status: 400 }
      )
    }

    // Use service role client to delete user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Delete user from Supabase Auth first
    // This will automatically cascade delete the user_profiles record
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return NextResponse.json(
        { error: 'Fout bij verwijderen gebruiker: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log(`✅ User ${userId} successfully deleted by ${currentUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'Gebruiker succesvol verwijderd'
    })

  } catch (error) {
    console.error('Error in user delete API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
