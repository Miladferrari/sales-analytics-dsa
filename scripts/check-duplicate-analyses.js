const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate analyses...\n')

  const callId = '66a48280-26aa-4a89-a472-53497abe572f'

  // Get all analyses for this call
  const { data: analyses, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('call_id', callId)
    .order('analyzed_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${analyses?.length || 0} analysis/analyses for call ${callId}\n`)

  if (analyses && analyses.length > 0) {
    analyses.forEach((analysis, index) => {
      console.log(`Analysis #${index + 1}:`)
      console.log(`  ID: ${analysis.id}`)
      console.log(`  Created at: ${analysis.analyzed_at || 'Unknown'}`)
      console.log(`  Is sales call: ${analysis.is_sales_call}`)
      console.log(`  Call type: ${analysis.call_type}`)
      console.log(`  Confidence: ${analysis.confidence_score}`)
      console.log(`  Framework score: ${analysis.framework_score}`)
      console.log()
    })

    if (analyses.length > 1) {
      console.log('⚠️  DUPLICATE ANALYSES DETECTED!')
      console.log('   We should keep the most recent one and delete the others.')
      console.log()
      console.log(`   Keep: ${analyses[0].id} (created at ${analyses[0].analyzed_at})`)
      console.log(`   Delete: ${analyses.slice(1).map(a => a.id).join(', ')}`)
    }
  }
}

checkDuplicates().catch(console.error)
