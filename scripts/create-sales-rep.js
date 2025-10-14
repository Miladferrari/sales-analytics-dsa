#!/usr/bin/env node
/**
 * Script to create a test sales rep directly in the database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv/config')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSalesRep() {
  console.log('👤 Creating test sales rep...')

  const { data, error } = await supabase
    .from('sales_reps')
    .insert({
      name: 'John Smith',
      email: 'john.smith@example.com',
      telegram_id: null,
      qualification_status: 'qualified'
    })
    .select()
    .single()

  if (error) {
    // Check if already exists
    if (error.code === '23505') {
      console.log('⚠️  Sales rep already exists, fetching existing...')
      const { data: existing } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('email', 'john.smith@example.com')
        .single()

      if (existing) {
        console.log('✅ Sales rep exists:')
        console.log(`   ID: ${existing.id}`)
        console.log(`   Name: ${existing.name}`)
        console.log(`   Email: ${existing.email}`)
        return
      }
    }
    throw error
  }

  console.log('✅ Sales rep created successfully!')
  console.log(`   ID: ${data.id}`)
  console.log(`   Name: ${data.name}`)
  console.log(`   Email: ${data.email}`)
}

createSalesRep().catch((error) => {
  console.error('❌ Failed to create sales rep:', error.message)
  process.exit(1)
})
