# Quick Start Guide

Get your Sales Analytics CRM up and running in 10 minutes!

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to finish setting up
4. Go to Project Settings → API
5. Copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Set Up Database (2 minutes)

1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. (Optional) Do the same with `supabase/seed.sql` to add sample reps

## Step 4: Get OpenAI API Key (1 minute)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Go to API Keys
4. Create a new secret key
5. Copy the key → `OPENAI_API_KEY`

## Step 5: Configure Environment (1 minute)

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
FATHOM_WEBHOOK_SECRET=your_secret_here

# Optional (for notifications)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SLACK_WEBHOOK_URL=your_webhook_url
```

## Step 6: Run the App (1 minute)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 7: Add Your Sales Reps

If you didn't run the seed file, add your reps directly in Supabase:

1. Go to Table Editor → sales_reps
2. Click "Insert row"
3. Fill in: name, email, qualification_status (qualified/unqualified)
4. Repeat for all 16 team members

## Step 8: Configure Fathom Webhook

Once deployed to production:

1. Log in to Fathom.ai
2. Go to Settings → Integrations → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/fathom`
4. Add your webhook secret (same as in `.env`)
5. Subscribe to `call.completed` event

## Optional: Set Up Notifications

### Telegram

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Start a chat with your bot
4. Get your chat ID from `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Slack

1. Create a Slack app
2. Enable Incoming Webhooks
3. Add webhook to workspace
4. Copy webhook URL

## Testing

### Test the Webhook Locally

Use the included test script:

```bash
# In another terminal
node scripts/test-webhook.js
```

### Test with ngrok (for Fathom integration during development)

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the ngrok URL in Fathom webhook settings
```

## Customization

### Update Your Sales Framework

Edit `src/services/call-analysis.service.ts`:

```typescript
const SALES_FRAMEWORK = {
  pillar1: {
    name: 'Your First Pillar',
    description: 'What this pillar measures',
    keyPoints: ['Point 1', 'Point 2', 'Point 3'],
  },
  // Update pillar2 and pillar3
}
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## Troubleshooting

**Dashboard shows no data?**
- Make sure you ran the database migration
- Check if sales reps are added to the database

**Webhook not working?**
- Verify webhook secret matches
- Check your API route is publicly accessible
- Review logs with `npm run dev`

**OpenAI errors?**
- Verify API key is correct
- Check your OpenAI account has credits
- Make sure you're using GPT-4 access

## Next Steps

1. Customize the sales framework to match your methodology
2. Add all 16 sales reps to the database
3. Deploy to production
4. Configure Fathom webhook
5. Set up notifications
6. Train your team on the new system

## Support

Need help? Check the main README.md for detailed documentation.

Happy selling! 🚀
