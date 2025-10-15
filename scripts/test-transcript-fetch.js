const {createFathomClient} = require('../src/lib/fathom/api-client.ts');

async function test() {
  console.log('🧪 Testing new transcript fetch method...\n');

  const client = createFathomClient();

  // Test with Daily stand-up Splitty (recording_id: 94211667)
  console.log('📡 Fetching transcript for recording 94211667...');
  const transcript = await client.getTranscript('94211667');

  if (transcript) {
    console.log('✅ Transcript fetched successfully!');
    console.log('📝 Length:', transcript.length, 'chars');
    console.log('\n📄 First 500 characters:');
    console.log(transcript.substring(0, 500));
    console.log('\n...\n');
  } else {
    console.log('❌ No transcript returned');
  }
}

test().catch(console.error);
