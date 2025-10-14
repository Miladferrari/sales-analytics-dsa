// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sales_reps: {
        Row: {
          id: string
          name: string
          email: string
          telegram_id: string | null
          qualification_status: 'qualified' | 'unqualified'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          telegram_id?: string | null
          qualification_status: 'qualified' | 'unqualified'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          telegram_id?: string | null
          qualification_status?: 'qualified' | 'unqualified'
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          rep_id: string
          fathom_id: string
          transcript: string
          date: string
          duration: number
          outcome: string | null
          customer_name: string | null
          customer_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rep_id: string
          fathom_id: string
          transcript: string
          date: string
          duration: number
          outcome?: string | null
          customer_name?: string | null
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rep_id?: string
          fathom_id?: string
          transcript?: string
          date?: string
          duration?: number
          outcome?: string | null
          customer_name?: string | null
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analysis: {
        Row: {
          id: string
          call_id: string
          framework_score: number
          pillar_1_score: number
          pillar_2_score: number
          pillar_3_score: number
          overall_rating: 'excellent' | 'good' | 'needs_improvement' | 'poor'
          feedback: string
          key_strengths: string[]
          areas_for_improvement: string[]
          red_flags: string[]
          alert_sent: boolean
          alert_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          call_id: string
          framework_score: number
          pillar_1_score: number
          pillar_2_score: number
          pillar_3_score: number
          overall_rating: 'excellent' | 'good' | 'needs_improvement' | 'poor'
          feedback: string
          key_strengths?: string[]
          areas_for_improvement?: string[]
          red_flags?: string[]
          alert_sent?: boolean
          alert_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          call_id?: string
          framework_score?: number
          pillar_1_score?: number
          pillar_2_score?: number
          pillar_3_score?: number
          overall_rating?: 'excellent' | 'good' | 'needs_improvement' | 'poor'
          feedback?: string
          key_strengths?: string[]
          areas_for_improvement?: string[]
          red_flags?: string[]
          alert_sent?: boolean
          alert_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper types
export type SalesRep = Database['public']['Tables']['sales_reps']['Row']
export type Call = Database['public']['Tables']['calls']['Row']
export type Analysis = Database['public']['Tables']['analysis']['Row']

export type InsertSalesRep = Database['public']['Tables']['sales_reps']['Insert']
export type InsertCall = Database['public']['Tables']['calls']['Insert']
export type InsertAnalysis = Database['public']['Tables']['analysis']['Insert']

export type UpdateSalesRep = Database['public']['Tables']['sales_reps']['Update']
export type UpdateCall = Database['public']['Tables']['calls']['Update']
export type UpdateAnalysis = Database['public']['Tables']['analysis']['Update']
