#!/usr/bin/env node
/**
 * Test Load Reps Query
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testLoadReps() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🧪 Testing loadReps query...\n')

  // Test 1: Simple query (what we're using as fallback)
  console.log('Test 1: Simple query without joins')
  const { data: simpleData, error: simpleError } = await supabase
    .from('sales_reps')
    .select('*')
    .is('archived_at', null)
    .order('name')

  if (simpleError) {
    console.error('❌ Simple query failed:', simpleError)
  } else {
    console.log(`✅ Found ${simpleData.length} sales reps`)
    simpleData.forEach((rep, i) => {
      console.log(`   ${i + 1}. ${rep.name} (${rep.email})`)
    })
  }

  console.log('\n---\n')

  // Test 2: Query with joins (what the code tries first)
  console.log('Test 2: Query with calls join')
  const { data: joinData, error: joinError } = await supabase
    .from('sales_reps')
    .select(`
      *,
      calls:calls!rep_id (
        id,
        date,
        analysis (
          framework_score
        )
      )
    `)
    .is('archived_at', null)
    .order('name')

  if (joinError) {
    console.error('❌ Join query failed:', joinError)
    console.log('   This is why the page shows empty - falling back to simple query\n')
  } else {
    console.log(`✅ Found ${joinData.length} sales reps with calls data`)
    joinData.forEach((rep, i) => {
      console.log(`   ${i + 1}. ${rep.name} - ${rep.calls?.length || 0} calls`)
    })
  }

  console.log('\n---\n')
  console.log('💡 Solution: The page should show data from fallback query')
  console.log('   Check browser console for errors\n')
}

testLoadReps()
