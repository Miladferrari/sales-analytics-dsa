/**
 * Test script voor OpenAI Call Analysis
 * Run met: node scripts/test-analysis.js
 *
 * Dit script:
 * 1. Maakt een test call aan in de database
 * 2. Triggert de OpenAI analyse
 * 3. Toont de resultaten
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Sample transcript van een sales call
const SAMPLE_TRANSCRIPT = `Sarah: Hi John, this is Sarah from Dropshipping Academy. Thanks for taking my call today. I understand you're interested in learning more about our program?

John: Yes, I've been looking to start an online business and I've heard dropshipping is a good way to get started.

Sarah: That's great! Can I ask what specifically attracted you to dropshipping? What are you hoping to achieve?

John: Well, I want to create an additional income stream. I'm currently working full-time but I'd like to build something that could eventually replace my job income.

Sarah: I completely understand. That's actually the goal for many of our students. Let me share how our program specifically helps people in your situation. We focus on three key areas...

First, we help you identify profitable niches and products that actually sell. We don't just give you a list - we teach you the methodology to find winning products consistently.

Second, we show you how to create compelling marketing that connects your products to the right customers. This includes Facebook ads, Instagram marketing, and even TikTok strategies.

Third, and this is where many people struggle on their own, we help you build the operational systems to scale. Things like supplier relationships, customer service, and managing your cash flow.

John: That sounds comprehensive. What kind of time commitment are we talking about?

Sarah: Great question. Most of our students dedicate 10-15 hours per week initially while they're building their foundation. Once you're up and running, many reduce that to 5-10 hours for management. Does that fit with your schedule?

John: Yes, I think I could manage that. What about the cost to get started?

Sarah: The program investment is $2,997, which includes 6 months of access to all our training modules, weekly live coaching calls, and our private community. You'll also need some working capital for your first inventory orders - we typically recommend having $1,000-2,000 set aside for that.

I know that's an investment, but most of our successful students see their first sales within 30-60 days and reach profitability within 3-4 months.

John: That's definitely something I need to think about.

Sarah: Of course! This is an important decision. Can I ask - is it the financial investment that you need to think about, or are there other concerns?

John: Mainly the financial side. I want to make sure this is the right fit before I commit.

Sarah: I totally get it. What would make you feel confident that this is the right decision for you?

John: I guess seeing some success stories from people in similar situations to mine.

Sarah: Perfect! I can absolutely share those with you. In fact, why don't we schedule a quick 15-minute follow-up call in the next couple days? I'll have some specific case studies ready that match your situation, and you can ask any other questions that come up.

How does Thursday at 2 PM work for you?

John: Yes, that works for me.

Sarah: Excellent! I'll send you a calendar invite right now, and I'll also email you a few resources to review before our call. Sound good?

John: Yes, thank you.

Sarah: My pleasure! Looking forward to speaking with you Thursday. Have a great rest of your day!`

async function testAnalysis() {
  console.log('\n🧪 Testing OpenAI Call Analysis\n')
  console.log('═'.repeat(60))

  // Check environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Missing OpenAI API key in .env.local')
    console.error('   Make sure OPENAI_API_KEY is set')
    process.exit(1)
  }

  console.log('✅ Environment variables loaded')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   OpenAI Key: ${process.env.OPENAI_API_KEY.slice(0, 8)}...`)
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Step 1: Find a sales rep to assign the call to
    console.log('📋 Step 1: Finding a sales rep...')
    const { data: reps, error: repError } = await supabase
      .from('sales_reps')
      .select('id, name, email')
      .limit(1)
      .single()

    if (repError || !reps) {
      console.error('❌ No sales reps found. Please add a sales rep first.')
      console.error('   You can do this via the dashboard: /dashboard/team')
      process.exit(1)
    }

    console.log(`✅ Found sales rep: ${reps.name} (${reps.email})`)
    console.log('')

    // Step 2: Create a test call
    console.log('📞 Step 2: Creating test call...')
    const testId = `test_${Date.now()}`
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        rep_id: reps.id,
        fathom_id: testId,
        transcript: SAMPLE_TRANSCRIPT,
        date: new Date().toISOString(),
        duration: 1800, // 30 minutes
        outcome: 'completed',
        meeting_title: 'Test Discovery Call - OpenAI Analysis',
        fathom_call_id: testId,
        fathom_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (callError) {
      console.error('❌ Failed to create test call:', callError.message)
      process.exit(1)
    }

    console.log(`✅ Test call created (ID: ${call.id})`)
    console.log(`   Transcript length: ${SAMPLE_TRANSCRIPT.length} characters`)
    console.log('')

    // Step 3: Trigger analysis
    console.log('🤖 Step 3: Triggering OpenAI analysis...')
    console.log('   This may take 10-30 seconds...')
    console.log('')

    const startTime = Date.now()

    const response = await fetch(`${APP_URL}/api/calls/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callId: call.id })
    })

    const duration = Date.now() - startTime
    const result = await response.json()

    console.log('═'.repeat(60))
    console.log('')

    if (!response.ok) {
      console.error('❌ Analysis failed!')
      console.error('   Status:', response.status)
      console.error('   Error:', result.error || result.message)
      console.error('')
      console.error('Full response:', JSON.stringify(result, null, 2))
      process.exit(1)
    }

    console.log('✅ Analysis completed successfully!')
    console.log(`   Processing time: ${duration}ms`)
    console.log(`   Overall score: ${result.score}/100`)
    console.log('')

    // Step 4: Fetch the full analysis from database
    console.log('📊 Step 4: Fetching analysis details...')
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis')
      .select('*')
      .eq('call_id', call.id)
      .single()

    if (analysisError || !analysis) {
      console.error('❌ Failed to fetch analysis:', analysisError?.message)
      process.exit(1)
    }

    console.log('')
    console.log('═'.repeat(60))
    console.log('📈 ANALYSIS RESULTS')
    console.log('═'.repeat(60))
    console.log('')
    console.log(`Overall Score: ${analysis.framework_score}/100`)
    console.log(`Sentiment Score: ${analysis.sentiment_score}/100`)
    console.log('')
    console.log('Key Topics:')
    if (analysis.key_topics && analysis.key_topics.length > 0) {
      analysis.key_topics.forEach(topic => console.log(`  • ${topic}`))
    } else {
      console.log('  (none)')
    }
    console.log('')

    if (analysis.analysis_data?.categories) {
      console.log('Category Breakdown:')
      analysis.analysis_data.categories.forEach(cat => {
        const emoji = cat.score >= 80 ? '🟢' : cat.score >= 60 ? '🟡' : '🔴'
        console.log(`  ${emoji} ${cat.name}: ${cat.score}/100`)
      })
      console.log('')
    }

    if (analysis.analysis_data?.strengths) {
      console.log('💪 Strengths:')
      analysis.analysis_data.strengths.forEach(s => console.log(`  • ${s}`))
      console.log('')
    }

    if (analysis.analysis_data?.improvements) {
      console.log('📝 Areas for Improvement:')
      analysis.analysis_data.improvements.forEach(i => console.log(`  • ${i}`))
      console.log('')
    }

    if (analysis.analysis_data?.summary) {
      console.log('📋 Summary:')
      console.log(`  ${analysis.analysis_data.summary}`)
      console.log('')
    }

    console.log('═'.repeat(60))
    console.log('🎉 Test completed successfully!')
    console.log('═'.repeat(60))
    console.log('')
    console.log('Next steps:')
    console.log('1. View the call in your dashboard: /dashboard/team')
    console.log('2. Customize the sales framework: src/lib/analysis/sales-framework.ts')
    console.log('3. Connect Fathom.ai webhook when ready')
    console.log('')

    // Cleanup option
    console.log('Note: Test call remains in database (ID: ' + call.id + ')')
    console.log('      You can delete it manually if needed.')
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error('')
    if (error.stack) {
      console.error('Stack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run the test
console.log('')
testAnalysis()
