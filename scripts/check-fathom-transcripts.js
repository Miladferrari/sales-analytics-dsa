const https = require('https');

const FATHOM_API_KEY = '4jmc-aeVcsbvB2VqtgZQbQ.nJ4mK1ZEon2wToyjB8Jbo3LSlK7QDjCGmtBnAnxvKAs';

function fetchMeetings() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.fathom.ai',
      path: '/external/v1/meetings?limit=20',
      method: 'GET',
      headers: {
        'X-Api-Key': FATHOM_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function check() {
  console.log('🔍 Checking Fathom meetings for transcripts...\n');

  const response = await fetchMeetings();
  const meetings = response.items || [];

  console.log(`📊 Found ${meetings.length} meetings in Fathom\n`);
  console.log('━'.repeat(80));
  console.log('');

  let withTranscript = 0;
  let withoutTranscript = 0;

  meetings.forEach((meeting, i) => {
    const duration = meeting.recording_end_time && meeting.recording_start_time
      ? Math.floor((new Date(meeting.recording_end_time) - new Date(meeting.recording_start_time)) / 1000)
      : 0;

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationStr = `${minutes}min ${seconds}sec`;

    const hasTranscript = meeting.transcript && meeting.transcript.length > 50;

    if (hasTranscript) withTranscript++;
    else withoutTranscript++;

    console.log(`${i + 1}. ${meeting.title}`);
    console.log(`   Recording ID: ${meeting.recording_id}`);
    console.log(`   Duration: ${durationStr} (${duration}s)`);
    console.log(`   Transcript: ${hasTranscript ? '✅ YES (' + meeting.transcript.length + ' chars)' : '❌ NO/NULL'}`);

    if (!hasTranscript && duration > 60) {
      console.log(`   ⚠️  WARNING: Call is ${durationStr} but has no transcript!`);
    }

    console.log('');
  });

  console.log('━'.repeat(80));
  console.log('');
  console.log('📈 SUMMARY:');
  console.log(`   Total meetings: ${meetings.length}`);
  console.log(`   With transcript: ${withTranscript}`);
  console.log(`   Without transcript: ${withoutTranscript}`);
  console.log('');

  if (withoutTranscript > 0) {
    console.log('⚠️  MOGELIJKE OORZAKEN voor ontbrekende transcripts:');
    console.log('   1. Audio kwaliteit te slecht');
    console.log('   2. Geen gesproken woorden (alleen stilte)');
    console.log('   3. Transcriptie gefaald in Fathom');
    console.log('   4. Call nog in verwerking (onwaarschijnlijk na > 1 uur)');
    console.log('');
    console.log('💡 OPLOSSING:');
    console.log('   → Check in Fathom app of deze calls wel transcripts hebben');
    console.log('   → Als ze daar WEL transcripts hebben: mogelijk API issue');
    console.log('   → Als ze daar GEEN transcripts hebben: probleem met de opname');
  }
}

check().catch(console.error);
