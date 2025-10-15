const {createClient} = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteCalls() {
  console.log('🔍 Zoeken naar Milad Azizi...');

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
    .select('id, meeting_title, fathom_id')
    .eq('rep_id', rep.id);

  if (!calls || calls.length === 0) {
    console.log('❌ Geen calls gevonden voor deze rep');
    return;
  }

  console.log('📞 Gevonden ' + calls.length + ' calls:');
  calls.forEach((call, i) => {
    console.log('   ' + (i+1) + '. ' + call.meeting_title + ' (Fathom ID: ' + call.fathom_id + ')');
  });
  console.log('');

  console.log('🗑️  Verwijderen van ' + calls.length + ' calls...');

  // Delete all calls
  const {error: deleteError} = await s
    .from('calls')
    .delete()
    .eq('rep_id', rep.id);

  if (deleteError) {
    console.log('❌ Fout bij verwijderen:', deleteError);
    return;
  }

  console.log('✅ Alle ' + calls.length + ' calls succesvol verwijderd!');
  console.log('');
  console.log('━'.repeat(70));
  console.log('');
  console.log('📝 VOLGENDE STAPPEN:');
  console.log('');
  console.log('1️⃣  Sync opnieuw vanuit Fathom:');
  console.log('   → curl http://localhost:3000/api/cron/sync-fathom');
  console.log('   OF');
  console.log('   → Ga naar Settings in de app → "Sync Fathom Calls"');
  console.log('');
  console.log('2️⃣  Als je calls in Fathom WEL transcripts hebben:');
  console.log('   → Ze worden nu opnieuw geïmporteerd MET transcripts!');
  console.log('   → Je ziet dan de "DSA Analyseer" knop!');
  console.log('');
  console.log('3️⃣  Als je calls in Fathom GEEN transcripts hebben:');
  console.log('   → Check in Fathom of de calls wel zijn getranscribeerd');
  console.log('   → Misschien waren de calls te kort (< 1 min)');
  console.log('');
}

deleteCalls();
