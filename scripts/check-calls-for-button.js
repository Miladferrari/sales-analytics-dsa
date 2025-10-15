const {createClient} = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get Milad's rep ID
  const {data: reps} = await s
    .from('sales_reps')
    .select('id, name, email')
    .eq('email', 'milad@splitty.nl');

  if (!reps || reps.length === 0) {
    console.log('❌ Geen sales rep gevonden met email milad@splitty.nl');
    return;
  }

  const rep = reps[0];
  console.log('✅ Sales Rep gevonden:', rep.name);
  console.log('   ID:', rep.id);
  console.log('');

  // Get calls for this rep
  const {data: calls} = await s
    .from('calls')
    .select('id, meeting_title, transcript, analysis(id)')
    .eq('rep_id', rep.id)
    .order('date', {ascending: false})
    .limit(10);

  if (!calls || calls.length === 0) {
    console.log('❌ Geen calls gevonden voor deze rep');
    return;
  }

  console.log('📞 Calls voor ' + rep.name + ':');
  console.log('━'.repeat(70));
  console.log('');

  let canAnalyzeCount = 0;

  calls.forEach((call, i) => {
    const hasTranscript = call.transcript && call.transcript.length > 50;
    const hasAnalysis = call.analysis && call.analysis.length > 0;

    console.log((i+1) + '. ' + call.meeting_title);
    console.log('   Transcript: ' + (hasTranscript ? '✅ JA (' + call.transcript.length + ' chars)' : '❌ NEE/TE KORT'));
    console.log('   Analyse: ' + (hasAnalysis ? '✅ JA (al gedaan)' : '❌ NEE (kan geanalyseerd worden!)'));

    if (hasTranscript && !hasAnalysis) {
      console.log('   → 🎯 DEZE CALL KAN JE ANALYSEREN! Je ziet hier de knop!');
      canAnalyzeCount++;
    } else if (!hasTranscript) {
      console.log('   → ⚠️  Geen knop, transcript te kort');
    } else if (hasAnalysis) {
      console.log('   → ℹ️  Geen knop, al geanalyseerd (zie score)');
    }
    console.log('');
  });

  console.log('━'.repeat(70));
  console.log('');
  console.log('📊 SAMENVATTING:');
  console.log('   Totaal calls: ' + calls.length);
  console.log('   Kunnen geanalyseerd worden: ' + canAnalyzeCount);
  console.log('');

  if (canAnalyzeCount === 0) {
    console.log('⚠️  Je hebt geen calls die kunnen worden geanalyseerd!');
    console.log('   Reden: Alle calls hebben ofwel geen transcript, ofwel zijn al geanalyseerd.');
  } else {
    console.log('✅ Je zou ' + canAnalyzeCount + ' "DSA Analyseer" knop(pen) moeten zien!');
  }
}

check();
