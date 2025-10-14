const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUserProfile() {
  try {
    console.log('🔍 Fetching all users...')

    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) throw usersError

    console.log(`✅ Found ${users.length} user(s)`)

    for (const user of users) {
      console.log(`\n📝 Processing user: ${user.email}`)

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        console.log(`   ℹ️  Profile already exists`)
        continue
      }

      // Create profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          first_name: '',
          last_name: '',
          profile_photo_url: null
        }])

      if (insertError) {
        console.error(`   ❌ Error creating profile:`, insertError.message)
      } else {
        console.log(`   ✅ Profile created successfully!`)
      }
    }

    console.log('\n🎉 All done!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createUserProfile()
