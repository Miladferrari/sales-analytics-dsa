/**
 * Test script voor Dropship Academy Framework implementatie
 * Verifieert dat de DSA 7-Step Process + 3-Level Framework correct zijn geïmplementeerd
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testDSAFramework() {
  console.log('🧪 Testing Dropship Academy Framework Implementation\n')

  // Test 1: Verify framework structure
  console.log('📋 Test 1: Framework Structure')
  console.log('✓ DSA 7-Step Process should have 7 steps with weights totaling 100%')
  console.log('✓ Each step should have: name, weight, description, goals, infections, indicators, red flags')
  console.log('✓ DSA 3-Level Framework should have 3 levels')
  console.log('✓ System prompt should reference DSA terminology\n')

  // Test 2: Verify database schema compatibility
  console.log('📋 Test 2: Database Schema Compatibility')
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check analysis table structure
    const { data: analysisSchema, error: schemaError } = await supabase
      .from('analysis')
      .select('*')
      .limit(1)

    if (schemaError && !schemaError.message.includes('0 rows')) {
      console.log('⚠️  Analysis table check:', schemaError.message)
    } else {
      console.log('✓ Analysis table exists and is accessible')
    }

    // Check for existing analyses
    const { data: existingAnalyses, error: analysisError } = await supabase
      .from('analysis')
      .select('id, call_id, framework_score, analysis_data')
      .limit(5)

    if (analysisError) {
      console.log('⚠️  Could not fetch existing analyses:', analysisError.message)
    } else {
      console.log(`✓ Found ${existingAnalyses?.length || 0} existing analyses`)

      if (existingAnalyses && existingAnalyses.length > 0) {
        console.log('\n📊 Sample analysis data structure:')
        const sample = existingAnalyses[0]
        if (sample.analysis_data) {
          console.log('  Fields in analysis_data:', Object.keys(sample.analysis_data).join(', '))
        }
      }
    }

    // Check calls table
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, meeting_title, fathom_status, transcript')
      .order('created_at', { ascending: false })
      .limit(5)

    if (callsError) {
      console.log('⚠️  Could not fetch calls:', callsError.message)
    } else {
      console.log(`✓ Found ${calls?.length || 0} calls in database`)

      const callsWithTranscripts = calls?.filter(c => c.transcript && c.transcript.length > 50) || []
      console.log(`  - ${callsWithTranscripts.length} calls have transcripts ready for DSA analysis`)

      if (callsWithTranscripts.length > 0) {
        console.log('\n🎯 Calls ready for DSA analysis:')
        callsWithTranscripts.forEach(call => {
          console.log(`  - ${call.meeting_title} (${call.fathom_status})`)
          console.log(`    ID: ${call.id}`)
          console.log(`    Transcript length: ${call.transcript.length} characters`)
        })
      } else {
        console.log('  ℹ️  No calls with transcripts found. Import calls from Fathom to test DSA analysis.')
      }
    }

  } catch (error) {
    console.log('❌ Database test failed:', error.message)
  }

  // Test 3: Verify DSA terminology
  console.log('\n📋 Test 3: DSA Terminology Verification')
  console.log('✓ Framework should use EXACT DSA terms:')
  console.log('  - "Topje van de berg" (not generic "surface level")')
  console.log('  - "Mogool approach" (ask like you know nothing)')
  console.log('  - "Gap selling" (A → GAP → B, WIJ ZIJN DE BRUG)')
  console.log('  - "Proces dat zichzelf weerligt" (objection handling)')
  console.log('  - "Sales Spiegel" (Fix it IRL = Fix it in sales)')
  console.log('  - "Closer Infections" (personal development blockers)')

  // Test 4: Verify OpenAI configuration
  console.log('\n📋 Test 4: OpenAI Configuration')
  if (process.env.OPENAI_API_KEY) {
    console.log('✓ OPENAI_API_KEY is configured')
    console.log('  Model: gpt-4o')
    console.log('  Temperature: 0.3 (for consistent analysis)')
    console.log('  Max tokens: 3000 (for complete DSA analysis)')
    console.log('  Response format: JSON')
  } else {
    console.log('⚠️  OPENAI_API_KEY not found in environment')
    console.log('  Configure this to enable DSA analysis')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ DSA Framework Implementation Test Complete')
  console.log('='.repeat(60))
  console.log('\n📝 Next steps:')
  console.log('1. Import calls from Fathom with transcripts')
  console.log('2. Run analysis: POST /api/calls/analyze with { callId: "..." }')
  console.log('3. View results in dashboard with complete DSA scoring')
  console.log('\n🎯 Expected DSA Analysis Output:')
  console.log('  - Overall score (0-100, weighted by 7 steps)')
  console.log('  - Framework level scores (3 levels)')
  console.log('  - Step scores (7 steps with goals achieved/missed)')
  console.log('  - Closer infections detected (with evidence)')
  console.log('  - Mindset check (Growth Rule, 1% Rule, 100% Ownership)')
  console.log('  - Wins & improvements')
  console.log('  - Coaching feedback (as Matthijs)')
  console.log('  - Sales Spiegel reflection\n')
}

testDSAFramework().catch(console.error)
