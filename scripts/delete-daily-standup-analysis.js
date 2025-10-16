const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteAnalysis() {
  console.log('🗑️  Deleting Daily stand-up analysis to trigger re-analysis...\n')

  const callId = '66a48280-26aa-4a89-a472-53497abe572f' // Most recent Daily stand-up

  // Delete the analysis
  const { error } = await supabase
    .from('analysis')
    .delete()
    .eq('call_id', callId)

  if (error) {
    console.error('❌ Error deleting analysis:', error)
    return
  }

  console.log('✅ Analysis deleted!')
  console.log('   Now you can click "DSA Analyseer" to get Frankie\'s NEW, longer feedback!\n')
}

deleteAnalysis().catch(console.error)
