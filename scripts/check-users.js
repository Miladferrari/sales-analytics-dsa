/**
 * Debug script to check all users in Supabase Auth
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUsers() {
  console.log('🔍 Checking all users in Supabase Auth...\n')

  try {
    // Get all auth users
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      process.exit(1)
    }

    console.log(`📊 Total users found: ${data.users.length}\n`)

    // Check for specific user
    const targetEmail = 'miladjani980@gmail.com'
    const targetUser = data.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())

    if (targetUser) {
      console.log('✅ Found user with email:', targetEmail)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('ID:', targetUser.id)
      console.log('Email:', targetUser.email)
      console.log('Email Confirmed:', targetUser.email_confirmed_at ? '✓' : '✗')
      console.log('Created:', new Date(targetUser.created_at).toLocaleString())
      console.log('Last Sign In:', targetUser.last_sign_in_at ? new Date(targetUser.last_sign_in_at).toLocaleString() : 'Never')
      console.log('Status:', targetUser.last_sign_in_at ? 'ACTIVE' : 'INVITED (not logged in yet)')
      console.log('Role:', targetUser.user_metadata?.role || 'user')
      console.log('Metadata:', JSON.stringify(targetUser.user_metadata, null, 2))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } else {
      console.log('❌ User NOT found with email:', targetEmail)
      console.log('This user does not exist in Supabase Auth!\n')
    }

    // List all users
    console.log('📋 All users in database:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    data.users.forEach((user, index) => {
      const status = user.last_sign_in_at ? '🟢 Active' : '🟠 Invited'
      console.log(`${index + 1}. ${status} - ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Last Login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
      console.log('')
    })

    // Check user_profiles table
    console.log('\n🔍 Checking user_profiles table...')
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError.message)
    } else {
      console.log(`📊 Total profiles found: ${profiles.length}`)
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.first_name || 'N/A'} ${profile.last_name || 'N/A'} (ID: ${profile.id})`)
      })
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

checkUsers()
