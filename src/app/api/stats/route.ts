import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ApiResponse, DashboardStats } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get total reps
    const { count: totalReps } = await supabaseAdmin
      .from('sales_reps')
      .select('*', { count: 'exact', head: true })

    // Get all calls with analysis
    const { data: calls, error: callsError } = await supabaseAdmin
      .from('calls')
      .select(
        `
        id,
        date,
        analysis (
          framework_score,
          overall_rating
        )
      `
      ) as { data: any[] | null, error: any }

    if (callsError) throw callsError

    const totalCalls = calls?.length || 0
    const callsToday = calls?.filter((c: any) => c.date.startsWith(today)).length || 0

    const analysisData = calls
      ?.map((c: any) => c.analysis?.[0])
      .filter(Boolean) || []

    const averageScore =
      analysisData.length > 0
        ? analysisData.reduce((sum: number, a: any) => sum + a.framework_score, 0) /
          analysisData.length
        : 0

    const excellentCalls =
      analysisData.filter((a: any) => a.overall_rating === 'excellent').length
    const poorCalls =
      analysisData.filter((a: any) => a.overall_rating === 'poor').length

    const stats: DashboardStats = {
      totalCalls,
      averageScore: Math.round(averageScore * 10) / 10,
      totalReps: totalReps || 0,
      callsToday,
      excellentCalls,
      poorCalls,
    }

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500 }
    )
  }
}
