/**
 * Migrate existing Fathom credentials from .env to database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fathomApiKey = process.env.FATHOM_API_KEY
const fathomWebhookSecret = process.env.FATHOM_WEBHOOK_SECRET

async function migrateCredentials() {
  console.log('🔄 Migrating Fathom credentials from .env to database...\n')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Update API Key
  if (fathomApiKey) {
    console.log('📝 Updating Fathom API Key...')
    const { error: apiKeyError } = await supabase
      .from('system_settings')
      .update({
        setting_value: fathomApiKey,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'fathom_api_key')

    if (apiKeyError) {
      console.error('❌ Error updating API Key:', apiKeyError.message)
    } else {
      console.log('✅ API Key migrated successfully')
      console.log(`   Key: ${fathomApiKey.substring(0, 7)}...${fathomApiKey.substring(fathomApiKey.length - 5)}`)
    }
  } else {
    console.log('⚠️  No FATHOM_API_KEY found in .env')
  }

  // Update Webhook Secret
  if (fathomWebhookSecret) {
    console.log('\n📝 Updating Fathom Webhook Secret...')
    const { error: webhookError } = await supabase
      .from('system_settings')
      .update({
        setting_value: fathomWebhookSecret,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'fathom_webhook_secret')

    if (webhookError) {
      console.error('❌ Error updating Webhook Secret:', webhookError.message)
    } else {
      console.log('✅ Webhook Secret migrated successfully')
      console.log(`   Secret: ${'•'.repeat(20)}`)
    }
  } else {
    console.log('⚠️  No FATHOM_WEBHOOK_SECRET found in .env')
  }

  // Set connection status to connected
  console.log('\n📝 Setting connection status to "connected"...')
  const { error: statusError } = await supabase
    .from('system_settings')
    .update({
      setting_value: 'connected',
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', 'fathom_connection_status')

  if (statusError) {
    console.error('❌ Error updating status:', statusError.message)
  } else {
    console.log('✅ Connection status updated')
  }

  // Set last test time
  console.log('\n📝 Setting last test time...')
  const { error: testError } = await supabase
    .from('system_settings')
    .update({
      setting_value: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', 'fathom_last_test')

  if (testError) {
    console.error('❌ Error updating test time:', testError.message)
  } else {
    console.log('✅ Last test time set')
  }

  console.log('\n🎉 Migration complete!')
  console.log('\n💡 Je kunt nu naar Settings → Fathom Koppeling gaan om je credentials te zien')
}

migrateCredentials()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
