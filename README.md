# Sales Analytics CRM

AI-powered Sales Analytics CRM system for Dropshipping Academy. Automates call analysis using OpenAI GPT-4 and provides real-time insights into sales team performance.

## Overview

This system eliminates the bottleneck of manual call review by automatically analyzing sales calls using a 3-pillar framework. It provides:

- Automatic call transcript import from Fathom.ai
- AI-powered analysis against your sales framework
- Real-time scoring and feedback
- Automated notifications via Telegram/Slack
- Comprehensive dashboard for analytics

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Analysis**: OpenAI GPT-4 API
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Notifications**: Telegram Bot API & Slack Webhooks

## Architecture

```
Fathom.ai → Webhook → Next.js API → OpenAI Analysis → Supabase Storage → Dashboard Display
                                              ↓
                                    Telegram/Slack Notifications
```

## Project Structure

```
sales-analytics-crm/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   └── webhooks/
│   │   │       └── fathom/       # Fathom webhook endpoint
│   │   ├── calls/
│   │   │   └── [id]/             # Individual call detail page
│   │   ├── reps/                 # Sales reps overview page
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Dashboard home
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── dashboard/            # Dashboard components
│   │       ├── StatsGrid.tsx     # Stats cards
│   │       ├── RecentCalls.tsx   # Recent calls list
│   │       └── RepPerformanceChart.tsx  # Performance chart
│   ├── lib/
│   │   ├── supabase/             # Supabase client setup
│   │   │   ├── client.ts         # Client-side client
│   │   │   └── server.ts         # Server-side client (admin)
│   │   └── openai/               # OpenAI client setup
│   │       └── client.ts
│   ├── services/                 # Business logic
│   │   ├── call-analysis.service.ts  # AI call analysis
│   │   ├── telegram.service.ts   # Telegram notifications
│   │   └── slack.service.ts      # Slack notifications
│   └── types/                    # TypeScript types
│       ├── database.types.ts     # Supabase types
│       └── index.ts              # Shared types
├── supabase/
│   ├── migrations/               # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                  # Sample data
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- A Supabase account and project
- An OpenAI API key
- Telegram Bot (optional)
- Slack Workspace (optional)

### 2. Clone and Install

```bash
cd sales-analytics-crm
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key
- `FATHOM_WEBHOOK_SECRET`: Secret for validating Fathom webhooks

Optional (for notifications):
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat/channel ID
- `SLACK_WEBHOOK_URL`: Your Slack incoming webhook URL

### 4. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration
5. (Optional) Run `supabase/seed.sql` to add sample sales reps

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# (Optional) Run seed data
supabase db seed
```

### 5. Configure Your Sales Framework

Edit the `SALES_FRAMEWORK` constant in `src/services/call-analysis.service.ts` to match your specific 3-pillar framework:

```typescript
const SALES_FRAMEWORK = {
  pillar1: {
    name: 'Your Pillar 1 Name',
    description: 'Description',
    keyPoints: ['Point 1', 'Point 2', ...],
  },
  // ... customize pillar2 and pillar3
}
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Configure Fathom.ai Webhook

1. Log in to your Fathom.ai account
2. Go to Settings → Integrations → Webhooks
3. Add a new webhook with URL: `https://your-domain.com/api/webhooks/fathom`
4. Set the webhook secret (same as `FATHOM_WEBHOOK_SECRET` in your `.env`)
5. Subscribe to the `call.completed` event

## Database Schema

### sales_reps
- `id`: UUID (Primary Key)
- `name`: Text
- `email`: Text (Unique)
- `telegram_id`: Text (Optional)
- `qualification_status`: Enum ('qualified', 'unqualified')
- `created_at`: Timestamp
- `updated_at`: Timestamp

### calls
- `id`: UUID (Primary Key)
- `rep_id`: UUID (Foreign Key → sales_reps)
- `fathom_id`: Text (Unique)
- `transcript`: Text
- `date`: Timestamp
- `duration`: Integer (seconds)
- `outcome`: Text (Optional)
- `customer_name`: Text (Optional)
- `customer_email`: Text (Optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### analysis
- `id`: UUID (Primary Key)
- `call_id`: UUID (Foreign Key → calls)
- `framework_score`: Integer (0-100)
- `pillar_1_score`: Integer (0-100)
- `pillar_2_score`: Integer (0-100)
- `pillar_3_score`: Integer (0-100)
- `overall_rating`: Enum ('excellent', 'good', 'needs_improvement', 'poor')
- `feedback`: Text
- `key_strengths`: Text[]
- `areas_for_improvement`: Text[]
- `red_flags`: Text[]
- `alert_sent`: Boolean
- `alert_sent_at`: Timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Features

### 1. Dashboard
- Real-time statistics (total calls, average score, calls today)
- Performance charts showing top reps
- Recent calls with quick access to details

### 2. Call Analysis
- Automatic AI analysis of each call transcript
- Scoring based on 3-pillar framework
- Detailed feedback with strengths and improvement areas
- Red flag detection for concerning behaviors

### 3. Notifications
- Instant alerts for poor-performing calls
- Celebration messages for excellent calls
- Daily summary reports
- Multi-channel support (Telegram & Slack)

### 4. Sales Rep Profiles
- Individual performance tracking
- Call history and trends
- Qualification status tracking

## API Endpoints

### POST /api/webhooks/fathom
Receives webhook notifications from Fathom.ai when calls are completed.

**Headers:**
- `x-webhook-secret`: Webhook verification secret

**Body:**
```json
{
  "event_type": "call.completed",
  "call_data": {
    "id": "fathom-call-id",
    "title": "Call Title",
    "transcript": "Full transcript...",
    "participants": [...],
    ...
  }
}
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Other Platforms

This Next.js app can be deployed to any platform that supports Node.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Digital Ocean App Platform

## Customization

### Modify the Sales Framework

Edit `src/services/call-analysis.service.ts` to update your framework criteria.

### Add New Notification Channels

Create a new service in `src/services/` following the pattern of `telegram.service.ts`.

### Customize Dashboard

Components are in `src/components/dashboard/` - modify as needed for your use case.

## Troubleshooting

### Webhook not receiving data
- Verify your webhook URL is publicly accessible
- Check the webhook secret matches in both Fathom and your `.env`
- Review server logs for errors

### Database connection issues
- Verify Supabase credentials are correct
- Check if Row Level Security policies allow your operations
- Ensure database migrations have been run

### OpenAI API errors
- Verify your API key is valid
- Check if you have sufficient credits
- Review rate limits

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

## License

MIT License - feel free to use this for your business needs.

---

Built with ❤️ for efficient sales team management
# sales-analytics-dsa
