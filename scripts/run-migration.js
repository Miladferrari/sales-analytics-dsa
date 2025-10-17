/**
 * Run database migration for system_settings table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runMigration() {
  console.log('🚀 Running system_settings migration...\n')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔍 Checking if table already exists...')
  const { data: existingData, error: checkError } = await supabase
    .from('system_settings')
    .select('setting_key')
    .limit(1)

  if (!checkError) {
    console.log('✅ Table already exists!')
    console.log('\n🎉 Migration not needed. You can use the Fathom Koppeling settings.')
    return
  }

  console.log('📝 Table does not exist yet. Creating...\n')

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/009_add_system_settings.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('💡 Please run this SQL in Supabase SQL Editor:')
  console.log('─'.repeat(80))
  console.log(sql)
  console.log('─'.repeat(80))
  console.log('\n📍 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
}

runMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
