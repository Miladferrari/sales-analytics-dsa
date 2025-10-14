export * from './database.types'

// Fathom Webhook Types
export interface FathomWebhookPayload {
  event_type: 'call.completed'
  call_id: string
  call_data: {
    id: string
    title: string
    start_time: string
    end_time: string
    duration: number
    participants: Array<{
      name: string
      email?: string
    }>
    transcript: string
    summary?: string
  }
}

// OpenAI Analysis Types
export interface CallAnalysisPrompt {
  transcript: string
  salesFramework: {
    pillar1: string
    pillar2: string
    pillar3: string
  }
}

export interface CallAnalysisResponse {
  frameworkScore: number
  pillar1Score: number
  pillar2Score: number
  pillar3Score: number
  overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  feedback: string
  keyStrengths: string[]
  areasForImprovement: string[]
  redFlags: string[]
}

// Dashboard Types
export interface DashboardStats {
  totalCalls: number
  averageScore: number
  totalReps: number
  callsToday: number
  excellentCalls: number
  poorCalls: number
}

export interface RepPerformance extends SalesRep {
  totalCalls: number
  averageScore: number
  recentCalls: Array<Call & { analysis: Analysis }>
}

// Notification Types
export interface NotificationPayload {
  type: 'daily_summary' | 'poor_call_alert' | 'excellent_call_alert'
  data: {
    repName?: string
    callId?: string
    score?: number
    summary?: string
    stats?: DashboardStats
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Sales Framework Configuration
export interface SalesFramework {
  pillar1: {
    name: string
    description: string
    keyPoints: string[]
  }
  pillar2: {
    name: string
    description: string
    keyPoints: string[]
  }
  pillar3: {
    name: string
    description: string
    keyPoints: string[]
  }
}

import { SalesRep, Call, Analysis } from './database.types'
