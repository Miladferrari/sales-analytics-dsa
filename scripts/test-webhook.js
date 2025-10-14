/**
 * Test script for Fathom webhook endpoint
 * Run with: node scripts/test-webhook.js
 *
 * This script simulates a real Fathom.ai webhook with proper signature verification
 */

const axios = require('axios');
const crypto = require('crypto');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/fathom';
const WEBHOOK_SECRET = process.env.FATHOM_WEBHOOK_SECRET || 'your_webhook_secret_for_testing';

// Sample payload matching Fathom.ai webhook structure
const samplePayload = {
  event: 'call_completed',
  call_id: 'fathom_test_call_' + Date.now(),
  meeting: {
    title: 'Discovery Call - John Smith',
    start_time: new Date().toISOString(),
    duration: 1800, // 30 minutes in seconds
    participants: [
      {
        name: 'Sarah Johnson',
        email: 'sarah@company.com', // Should match a sales rep email in your DB
      },
      {
        name: 'John Smith',
        email: 'john.smith@prospect.com',
      },
    ],
    transcript: `Sarah: Hi John, this is Sarah from Dropshipping Academy. Thanks for taking my call today. I understand you're interested in learning more about our program?

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

Sarah: My pleasure! Looking forward to speaking with you Thursday. Have a great rest of your day!`,
    recording_url: 'https://fathom.video/call/test_recording_url',
  },
  timestamp: new Date().toISOString(),
};

/**
 * Generate HMAC signature for webhook verification
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

async function testWebhook() {
  console.log('🧪 Testing Fathom Webhook Endpoint\n');
  console.log('─'.repeat(60));
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Using secret: ${WEBHOOK_SECRET ? '***' + WEBHOOK_SECRET.slice(-4) : '(not set)'}\n`);

  try {
    // Convert payload to string for signature generation
    const payloadString = JSON.stringify(samplePayload);
    const signature = generateSignature(payloadString, WEBHOOK_SECRET);

    console.log('📤 Sending test payload...');
    console.log(`   Event: ${samplePayload.event}`);
    console.log(`   Call ID: ${samplePayload.call_id}`);
    console.log(`   Participants: ${samplePayload.meeting.participants.length}`);
    console.log(`   Signature: ${signature.slice(0, 8)}...`);
    console.log('');

    const response = await axios.post(WEBHOOK_URL, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-fathom-signature': signature,
      },
      validateStatus: () => true, // Don't throw on any status
    });

    console.log('─'.repeat(60));
    console.log(`✅ Response Status: ${response.status}`);
    console.log('─'.repeat(60));
    console.log('\n📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('\n' + '─'.repeat(60));
      console.log('🎉 Webhook test successful!');
      console.log('─'.repeat(60));

      if (response.data.data?.rep_matched) {
        console.log('\n✓ Sales rep matched successfully');
        console.log(`  Rep email: ${response.data.data.rep_email}`);
        console.log(`  Call ID: ${response.data.data.call_id}`);
        console.log(`  Client participants: ${response.data.data.client_participants}`);
      } else if (response.data.data?.status === 'stored_for_review') {
        console.log('\n⚠ No sales rep matched - stored for review');
        console.log(`  Unmatched call ID: ${response.data.data.unmatched_call_id}`);
        console.log('  Check unmatched_fathom_calls table for manual review');
      } else if (response.data.data?.status === 'duplicate') {
        console.log('\n⚠ Duplicate webhook detected');
        console.log('  This call was already processed');
      }

      console.log('\nNext steps:');
      console.log('1. Check your dashboard at http://localhost:3000/dashboard');
      console.log('2. Verify the call appears in the calls table');
      console.log('3. Check webhook_logs table for detailed logging');
      console.log('4. Review unmatched_fathom_calls if no rep matched');
    } else {
      console.log('\n' + '─'.repeat(60));
      console.log('❌ Webhook test failed!');
      console.log('─'.repeat(60));
      console.log('\nPossible issues:');
      console.log('• Invalid signature - check FATHOM_WEBHOOK_SECRET');
      console.log('• Missing required fields in payload');
      console.log('• Database connection issues');
      console.log('• Sales rep email not found in database');
      console.log('\nCheck the error message above and your server logs.');
    }
  } catch (error) {
    console.error('\n' + '─'.repeat(60));
    console.error('❌ Error testing webhook:');
    console.error('─'.repeat(60));
    if (error.response) {
      console.error('\nResponse status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\n⚠ No response received. Is your server running?');
      console.error('   Start it with: npm run dev (on port 3000)');
      console.error('\n   If using a different port, update WEBHOOK_URL in this script.');
    } else {
      console.error('\n', error.message);
    }
  }
}

// Run the test
console.log('\n');
testWebhook();
