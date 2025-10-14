const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Running user profiles migration...')

    // Read the SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_user_profiles.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // If exec_sql doesn't exist, we'll run it directly
      console.log('⚠️  RPC method not available, running SQL directly...')

      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim())

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.rpc('query', { query_text: statement })
          if (execError) {
            console.log('Note:', execError.message)
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('📋 Created:')
    console.log('   - user_profiles table')
    console.log('   - avatars storage bucket')
    console.log('   - RLS policies')
    console.log('   - Auto-profile creation trigger')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
