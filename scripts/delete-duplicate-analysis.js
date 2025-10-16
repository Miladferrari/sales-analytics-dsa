const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteDuplicate() {
  console.log('🗑️  Deleting duplicate analysis...\n')

  const duplicateId = '094dca81-02fe-4431-99df-426b5d838acd' // Older one

  const { error } = await supabase
    .from('analysis')
    .delete()
    .eq('id', duplicateId)

  if (error) {
    console.error('❌ Error deleting duplicate:', error)
    return
  }

  console.log('✅ Successfully deleted duplicate analysis!')
  console.log(`   Deleted ID: ${duplicateId}`)
  console.log()

  // Verify there's only 1 left
  const callId = '66a48280-26aa-4a89-a472-53497abe572f'
  const { data: remaining, error: checkError } = await supabase
    .from('analysis')
    .select('id, analyzed_at')
    .eq('call_id', callId)

  if (checkError) {
    console.error('❌ Error checking remaining analyses:', checkError)
    return
  }

  console.log(`✅ Remaining analyses for call: ${remaining?.length || 0}`)
  if (remaining && remaining.length > 0) {
    remaining.forEach((a, i) => {
      console.log(`   ${i + 1}. ID: ${a.id} - Created: ${a.analyzed_at}`)
    })
  }
}

deleteDuplicate().catch(console.error)
