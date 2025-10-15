const {createClient} = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get Milad's rep ID
  const {data: rep} = await s
    .from('sales_reps')
    .select('id')
    .eq('email', 'milad@splitty.nl')
    .single();

  if (!rep) {
    console.log('❌ Rep not found');
    return;
  }

  // Get calls with analysis
  const {data: calls, error} = await s
    .from('calls')
    .select(`
      id,
      meeting_title,
      transcript,
      analysis(id, framework_score)
    `)
    .eq('rep_id', rep.id)
    .order('date', {ascending: false})
    .limit(5);

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  if (!calls) {
    console.log('❌ No calls found');
    return;
  }

  console.log('📞 Top 5 calls for Milad:\n');
  calls.forEach((call, i) => {
    const hasTranscript = call.transcript && call.transcript.length > 50;
    const hasAnalysis = call.analysis && call.analysis.length > 0;
    const score = hasAnalysis ? call.analysis[0].framework_score : null;

    console.log(`${i + 1}. ${call.meeting_title}`);
    console.log(`   Transcript: ${hasTranscript ? '✅ ' + call.transcript.length + ' chars' : '❌ NO'}`);
    console.log(`   Analysis: ${hasAnalysis ? '✅ YES - Score: ' + score + '/100' : '❌ NO'}`);

    if (hasTranscript && !hasAnalysis) {
      console.log(`   → 🎯 SHOULD SHOW "DSA Analyseer" BUTTON`);
    } else if (hasAnalysis) {
      console.log(`   → 📊 SHOULD SHOW SCORE BADGE: ${score}/100`);
    }
    console.log('');
  });
}

check();
