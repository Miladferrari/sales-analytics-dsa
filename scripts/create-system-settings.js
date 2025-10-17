/**
 * Create system_settings table directly
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function createTable() {
  console.log('🚀 Creating system_settings table...\n')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' }
  })

  try {
    // Step 1: Create the table using a simple query
    console.log('📋 Step 1: Creating table structure...')
    
    // We'll use a workaround: create via the REST API if possible
    // But the easiest is to just execute individual operations
    
    // Let's try to insert the initial settings first (this will fail if table doesn't exist)
    const { data: testData, error: testError } = await supabase
      .from('system_settings')
      .select('setting_key')
      .limit(1)

    if (testError && testError.code === '42P01') {
      console.log('❌ Table does not exist yet.')
      console.log('\n💡 Please run the migration manually:')
      console.log('   1. Go to Supabase Dashboard → SQL Editor')
      console.log('   2. Copy the SQL from: supabase/migrations/009_add_system_settings.sql')
      console.log('   3. Paste and run it')
      console.log('\n   Or run this command:')
      console.log('   npx supabase db push')
      return
    }

    console.log('✅ Table already exists!')
    
    // Insert initial settings if they don't exist
    console.log('\n📥 Adding initial Fathom settings...')
    
    const settings = [
      { setting_key: 'fathom_api_key', setting_value: null, description: 'Fathom API Key voor authenticatie' },
      { setting_key: 'fathom_webhook_secret', setting_value: null, description: 'Fathom Webhook Secret voor verificatie' },
      { setting_key: 'fathom_connection_status', setting_value: 'not_configured', description: 'Status van Fathom connectie' },
      { setting_key: 'fathom_last_test', setting_value: null, description: 'Laatste keer dat de verbinding getest is' }
    ]

    for (const setting of settings) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(setting, { onConflict: 'setting_key' })

      if (error) {
        console.log(`   ⚠️  ${setting.setting_key}: ${error.message}`)
      } else {
        console.log(`   ✅ ${setting.setting_key}`)
      }
    }

    console.log('\n🎉 Setup complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
