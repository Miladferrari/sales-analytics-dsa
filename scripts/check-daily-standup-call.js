const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCall() {
  console.log('🔍 Checking for Daily stand-up Splitty call...\n')

  // Find the call
  const { data: calls, error: callError } = await supabase
    .from('calls')
    .select('*')
    .ilike('meeting_title', '%Daily stand-up%')
    .order('date', { ascending: false })
    .limit(5)

  if (callError) {
    console.error('❌ Error fetching call:', callError)
    return
  }

  if (!calls || calls.length === 0) {
    console.log('❌ No Daily stand-up calls found')
    return
  }

  console.log(`✅ Found ${calls.length} Daily stand-up call(s):\n`)

  for (const call of calls) {
    console.log(`📞 Call ID: ${call.id}`)
    console.log(`   Title: ${call.meeting_title}`)
    console.log(`   Date: ${call.date}`)
    console.log(`   Duration: ${call.duration}s`)
    console.log(`   Status: ${call.fathom_status}`)
    console.log(`   Has transcript: ${call.transcript ? 'Yes (' + call.transcript.length + ' chars)' : 'No'}`)
    console.log()

    // Check for analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis')
      .select('*')
      .eq('call_id', call.id)
      .single()

    if (analysisError) {
      console.log('   ❌ Analysis Error:', analysisError.message)
      console.log('   Details:', analysisError)
    } else if (analysis) {
      console.log('   ✅ Analysis found!')
      console.log('   - ID:', analysis.id)
      console.log('   - Is sales call:', analysis.is_sales_call)
      console.log('   - Call type:', analysis.call_type)
      console.log('   - Confidence:', analysis.confidence_score)
      console.log('   - Rejection reason:', analysis.rejection_reason)
      console.log('   - Framework score:', analysis.framework_score)
      console.log('   - Sentiment score:', analysis.sentiment_score)
      console.log('   - Analyzed at:', analysis.analyzed_at)
      console.log('   - Analysis data keys:', analysis.analysis_data ? Object.keys(analysis.analysis_data) : 'null')
      if (analysis.analysis_data) {
        console.log('   - Analysis data:', JSON.stringify(analysis.analysis_data, null, 2))
      }
    } else {
      console.log('   ❌ No analysis found for this call')
    }
    console.log('\n' + '='.repeat(80) + '\n')
  }
}

checkCall().catch(console.error)
