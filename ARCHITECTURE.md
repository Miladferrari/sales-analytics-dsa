# Architecture Documentation

## System Overview

The Sales Analytics CRM is a full-stack Next.js application that automatically analyzes sales calls using AI and provides real-time insights.

## Data Flow

```
┌─────────────┐
│ Fathom.ai   │ Sales call completed
└──────┬──────┘
       │ Webhook POST
       ▼
┌─────────────────────────────────────────────────────┐
│ Next.js API Route (/api/webhooks/fathom)           │
│                                                     │
│ 1. Validates webhook secret                        │
│ 2. Extracts call data                              │
│ 3. Identifies sales rep                            │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│ Supabase Database                                   │
│                                                     │
│ Store call record in 'calls' table                 │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│ OpenAI GPT-4 Analysis Service                      │
│                                                     │
│ 1. Sends transcript with framework prompt          │
│ 2. Receives structured analysis JSON               │
│ 3. Scores each pillar (0-100)                      │
│ 4. Identifies strengths/improvements/red flags     │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│ Supabase Database                                   │
│                                                     │
│ Store analysis in 'analysis' table                 │
└──────┬──────────────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Telegram Bot │  │ Slack Webhook│  │ Dashboard    │
│              │  │              │  │              │
│ Send alert   │  │ Send alert   │  │ Display data │
│ if poor/     │  │ if poor/     │  │ Real-time    │
│ excellent    │  │ excellent    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **Recharts**: Data visualization
- **Lucide React**: Icon library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Supabase**: PostgreSQL database with real-time capabilities
- **OpenAI API**: GPT-4 for call analysis

### External Services
- **Fathom.ai**: Call recording and transcription
- **Telegram Bot API**: Notifications
- **Slack Webhooks**: Team notifications

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── stats/                # Dashboard statistics
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── fathom/           # Fathom webhook handler
│   │           └── route.ts
│   ├── calls/
│   │   └── [id]/                 # Dynamic route for call details
│   │       └── page.tsx
│   ├── reps/                     # Sales reps page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard home
│   └── globals.css               # Global styles
│
├── components/
│   └── dashboard/                # Dashboard components
│       ├── StatsGrid.tsx         # Statistics cards
│       ├── RecentCalls.tsx       # Recent calls list
│       └── RepPerformanceChart.tsx  # Performance visualization
│
├── config/
│   └── sales-framework.ts        # Sales framework configuration
│
├── lib/
│   ├── openai/
│   │   └── client.ts             # OpenAI client setup
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase
│   │   └── server.ts             # Server-side Supabase (admin)
│   └── utils.ts                  # Utility functions
│
├── services/                     # Business logic layer
│   ├── call-analysis.service.ts  # AI analysis logic
│   ├── telegram.service.ts       # Telegram notifications
│   └── slack.service.ts          # Slack notifications
│
└── types/                        # TypeScript definitions
    ├── database.types.ts         # Supabase generated types
    └── index.ts                  # Shared types
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│   sales_reps    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ telegram_id     │
│ qualification_  │
│   status        │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│     calls       │
├─────────────────┤
│ id (PK)         │
│ rep_id (FK)     │
│ fathom_id       │
│ transcript      │
│ date            │
│ duration        │
│ outcome         │
│ customer_name   │
│ customer_email  │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────┐
│    analysis     │
├─────────────────┤
│ id (PK)         │
│ call_id (FK)    │
│ framework_score │
│ pillar_1_score  │
│ pillar_2_score  │
│ pillar_3_score  │
│ overall_rating  │
│ feedback        │
│ key_strengths   │
│ areas_for_      │
│   improvement   │
│ red_flags       │
│ alert_sent      │
│ alert_sent_at   │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

## API Endpoints

### POST /api/webhooks/fathom
**Purpose**: Receive webhook notifications from Fathom.ai

**Authentication**: Custom webhook secret via header

**Request Headers**:
```
x-webhook-secret: your_webhook_secret
```

**Request Body**:
```typescript
{
  event_type: "call.completed",
  call_data: {
    id: string,
    title: string,
    start_time: string (ISO 8601),
    end_time: string (ISO 8601),
    duration: number,
    participants: Array<{
      name: string,
      email?: string
    }>,
    transcript: string,
    summary?: string
  }
}
```

**Response**:
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    callId: string,
    analysisId: string,
    score: number,
    rating: string
  },
  error?: string
}
```

**Process Flow**:
1. Validate webhook secret
2. Parse payload
3. Identify sales rep by email
4. Store call in database
5. Analyze transcript with OpenAI
6. Store analysis
7. Send notifications if needed
8. Return success response

### GET /api/stats
**Purpose**: Get dashboard statistics

**Response**:
```typescript
{
  success: boolean,
  data: {
    totalCalls: number,
    averageScore: number,
    totalReps: number,
    callsToday: number,
    excellentCalls: number,
    poorCalls: number
  }
}
```

## Services

### Call Analysis Service
**File**: `src/services/call-analysis.service.ts`

**Key Function**: `analyzeCallTranscript(transcript: string)`

**Process**:
1. Constructs system prompt with sales framework
2. Sends transcript to OpenAI GPT-4
3. Requests structured JSON response
4. Validates response structure
5. Returns analysis with scores and feedback

**OpenAI Configuration**:
- Model: GPT-4 Turbo Preview
- Temperature: 0.3 (consistent responses)
- Response Format: JSON object
- Max tokens: Default (varies by transcript length)

### Notification Services

#### Telegram Service
**File**: `src/services/telegram.service.ts`

**Function**: `sendTelegramNotification(payload: NotificationPayload)`

**Features**:
- Markdown formatting support
- Rich message templates
- Error handling with fallbacks

#### Slack Service
**File**: `src/services/slack.service.ts`

**Function**: `sendSlackNotification(payload: NotificationPayload)`

**Features**:
- Block Kit formatting
- Interactive buttons
- Rich cards with metadata

## Security Considerations

### Webhook Security
- Custom secret validation for Fathom webhooks
- Request origin validation
- Rate limiting (implement as needed)

### Database Security
- Row Level Security (RLS) enabled
- Service role key only used server-side
- Anon key for client-side queries
- Prepared statements prevent SQL injection

### API Keys
- All secrets in environment variables
- Never committed to version control
- Separate keys for dev/staging/production

### Data Privacy
- Call transcripts stored encrypted at rest (Supabase default)
- HTTPS required for all API calls
- Customer data handling complies with privacy regulations

## Performance Optimization

### Database
- Indexes on frequently queried columns
- Connection pooling via Supabase
- Efficient query patterns (avoid N+1)

### Frontend
- Server-side rendering for initial page load
- Client-side data fetching for updates
- Lazy loading for components
- Image optimization (if needed)

### API
- Serverless functions auto-scale
- Response caching where appropriate
- Async processing for notifications

## Monitoring & Logging

### Application Logs
- All errors logged to console
- Structured logging for debugging
- Request/response logging for webhooks

### Database Monitoring
- Supabase dashboard for query performance
- Connection pool monitoring
- Storage usage tracking

### External Services
- OpenAI API usage tracking
- Webhook delivery status
- Notification delivery confirmation

## Scaling Considerations

### Current Capacity
- Handles 100+ calls per day easily
- Database can scale to millions of records
- Serverless functions auto-scale

### Future Scaling
- Add Redis for caching
- Implement queue system for batch processing
- Consider CDN for static assets
- Optimize database queries as data grows

## Deployment

### Recommended Platform: Vercel
- Zero-config deployment
- Automatic HTTPS
- Edge network
- Serverless functions
- Environment variable management

### Alternative Platforms
- Netlify
- Railway
- Render
- AWS Amplify
- Digital Ocean App Platform

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Webhook URL configured in Fathom
- [ ] Domain configured (if custom)
- [ ] Monitoring set up
- [ ] Notifications tested
- [ ] SSL certificate active

## Maintenance

### Regular Tasks
- Monitor OpenAI API usage and costs
- Review database performance
- Check notification delivery
- Update dependencies monthly
- Backup database regularly (automatic in Supabase)

### Updates
- Framework updates: Quarterly
- Security patches: As needed
- Feature additions: As required
- Performance optimizations: Ongoing

---

Last Updated: 2024
