#!/usr/bin/env node
/**
 * Check Sales Reps Status
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkSalesReps() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔍 Checking sales reps status...\n')

  // All sales reps
  const { data: allReps, count: totalCount } = await supabase
    .from('sales_reps')
    .select('*', { count: 'exact' })

  console.log(`📊 Total sales reps in database: ${totalCount}`)

  if (totalCount === 0) {
    console.log('✅ Database is clean - no sales reps yet\n')
    return
  }

  // Active reps
  const { count: activeCount } = await supabase
    .from('sales_reps')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null)

  // Archived reps
  const { count: archivedCount } = await supabase
    .from('sales_reps')
    .select('*', { count: 'exact', head: true })
    .not('archived_at', 'is', null)

  console.log(`✅ Active: ${activeCount}`)
  console.log(`📦 Archived: ${archivedCount}\n`)

  if (allReps && allReps.length > 0) {
    console.log('📋 All sales reps:\n')
    allReps.forEach((rep, i) => {
      const status = rep.archived_at ? '📦 [ARCHIVED]' : '✅ [ACTIVE]'
      console.log(`${i + 1}. ${status} ${rep.name} (${rep.email})`)
      if (rep.archived_at) {
        console.log(`   Archived at: ${new Date(rep.archived_at).toLocaleString()}`)
      }
    })
  }

  console.log('\n')
}

checkSalesReps()
