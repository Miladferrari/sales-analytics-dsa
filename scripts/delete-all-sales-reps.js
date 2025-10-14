#!/usr/bin/env node
/**
 * Delete ALL Sales Reps - Clean Database
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function deleteAllSalesReps() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🗑️  Deleting ALL sales reps...\n')

  // Get count before
  const { count: beforeCount } = await supabase
    .from('sales_reps')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Found ${beforeCount} sales reps to delete\n`)

  if (beforeCount === 0) {
    console.log('✅ Database is already clean - no sales reps\n')
    return
  }

  // Delete all
  const { error } = await supabase
    .from('sales_reps')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (this condition is always true)

  if (error) {
    console.error('❌ Error deleting sales reps:', error)
    return
  }

  // Verify
  const { count: afterCount } = await supabase
    .from('sales_reps')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Deleted ${beforeCount} sales reps`)
  console.log(`📊 Remaining: ${afterCount}\n`)
  console.log('🎉 Database is now completely clean!\n')
}

deleteAllSalesReps()
