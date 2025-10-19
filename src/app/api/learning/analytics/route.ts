/**
 * API Route: Learning Analytics
 *
 * Provides analytics for the self-learning AI system
 * Shows patterns in closed vs lost calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || '30' // days

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - parseInt(timeframe))

    // 1. Overall statistics
    const { data: calls } = await supabase
      .from('calls')
      .select(`
        *,
        analysis(framework_score, overall_rating)
      `)
      .gte('date', sinceDate.toISOString())

    if (!calls) {
      return NextResponse.json({
        success: true,
        analytics: null
      })
    }

    // 2. Calculate metrics by outcome
    const closedWon = calls.filter(c => c.outcome_status === 'closed_won')
    const closedLost = calls.filter(c => c.outcome_status === 'closed_lost')
    const inProgress = calls.filter(c => c.outcome_status === 'in_progress')
    const noShow = calls.filter(c => c.outcome_status === 'no_show')

    // 3. Benchmark calls
    const benchmarkCalls = calls.filter(
      c => c.is_benchmark && !c.exclude_from_learning
    )

    // 4. Average scores by outcome
    const avgScoreClosedWon = closedWon.length > 0
      ? closedWon.reduce((sum, c) => sum + (c.analysis?.[0]?.framework_score || 0), 0) / closedWon.length
      : 0

    const avgScoreClosedLost = closedLost.length > 0
      ? closedLost.reduce((sum, c) => sum + (c.analysis?.[0]?.framework_score || 0), 0) / closedLost.length
      : 0

    // 5. Average deal value
    const avgDealValue = closedWon.length > 0
      ? closedWon.reduce((sum, c) => sum + (c.deal_value || 0), 0) / closedWon.length
      : 0

    const totalRevenue = closedWon.reduce((sum, c) => sum + (c.deal_value || 0), 0)

    // 6. Lead quality distribution
    const leadQualityDistribution = {
      hot: calls.filter(c => c.lead_quality === 'hot').length,
      warm: calls.filter(c => c.lead_quality === 'warm').length,
      cold: calls.filter(c => c.lead_quality === 'cold').length,
      fake: calls.filter(c => c.lead_quality === 'fake').length,
      unknown: calls.filter(c => !c.lead_quality).length
    }

    // 7. Closer performance distribution
    const performanceDistribution = {
      excellent: calls.filter(c => c.closer_performance === 'excellent').length,
      good: calls.filter(c => c.closer_performance === 'good').length,
      average: calls.filter(c => c.closer_performance === 'average').length,
      poor: calls.filter(c => c.closer_performance === 'poor').length,
      unknown: calls.filter(c => !c.closer_performance).length
    }

    // 8. Close rate by lead quality
    const closeRateByLeadQuality = {
      hot: {
        total: calls.filter(c => c.lead_quality === 'hot').length,
        closed: closedWon.filter(c => c.lead_quality === 'hot').length,
        rate: 0
      },
      warm: {
        total: calls.filter(c => c.lead_quality === 'warm').length,
        closed: closedWon.filter(c => c.lead_quality === 'warm').length,
        rate: 0
      },
      cold: {
        total: calls.filter(c => c.lead_quality === 'cold').length,
        closed: closedWon.filter(c => c.lead_quality === 'cold').length,
        rate: 0
      }
    }

    // Calculate rates
    closeRateByLeadQuality.hot.rate = closeRateByLeadQuality.hot.total > 0
      ? (closeRateByLeadQuality.hot.closed / closeRateByLeadQuality.hot.total) * 100
      : 0

    closeRateByLeadQuality.warm.rate = closeRateByLeadQuality.warm.total > 0
      ? (closeRateByLeadQuality.warm.closed / closeRateByLeadQuality.warm.total) * 100
      : 0

    closeRateByLeadQuality.cold.rate = closeRateByLeadQuality.cold.total > 0
      ? (closeRateByLeadQuality.cold.closed / closeRateByLeadQuality.cold.total) * 100
      : 0

    // 9. Close rate by closer performance
    const closeRateByPerformance = {
      excellent: {
        total: calls.filter(c => c.closer_performance === 'excellent').length,
        closed: closedWon.filter(c => c.closer_performance === 'excellent').length,
        rate: 0
      },
      good: {
        total: calls.filter(c => c.closer_performance === 'good').length,
        closed: closedWon.filter(c => c.closer_performance === 'good').length,
        rate: 0
      },
      average: {
        total: calls.filter(c => c.closer_performance === 'average').length,
        closed: closedWon.filter(c => c.closer_performance === 'average').length,
        rate: 0
      },
      poor: {
        total: calls.filter(c => c.closer_performance === 'poor').length,
        closed: closedWon.filter(c => c.closer_performance === 'poor').length,
        rate: 0
      }
    }

    // Calculate rates
    Object.keys(closeRateByPerformance).forEach(key => {
      const perf = closeRateByPerformance[key as keyof typeof closeRateByPerformance]
      perf.rate = perf.total > 0 ? (perf.closed / perf.total) * 100 : 0
    })

    // 10. Score difference analysis
    const scoreDifference = avgScoreClosedWon - avgScoreClosedLost

    // 11. Data quality metrics
    const dataQualityMetrics = {
      total_calls: calls.length,
      calls_with_outcome: calls.filter(c => c.outcome_status).length,
      calls_with_lead_quality: calls.filter(c => c.lead_quality).length,
      calls_with_performance: calls.filter(c => c.closer_performance).length,
      benchmark_calls: benchmarkCalls.length,
      validated_calls: calls.filter(c => c.validated_by).length,
      data_completeness_rate: calls.length > 0
        ? ((calls.filter(c => c.outcome_status && c.lead_quality && c.closer_performance).length / calls.length) * 100)
        : 0
    }

    return NextResponse.json({
      success: true,
      analytics: {
        timeframe: `${timeframe} days`,
        summary: {
          total_calls: calls.length,
          closed_won: closedWon.length,
          closed_lost: closedLost.length,
          in_progress: inProgress.length,
          no_show: noShow.length,
          close_rate: calls.length > 0
            ? ((closedWon.length / (closedWon.length + closedLost.length)) * 100).toFixed(1)
            : 0,
          avg_deal_value: avgDealValue.toFixed(2),
          total_revenue: totalRevenue.toFixed(2)
        },
        scores: {
          avg_closed_won: avgScoreClosedWon.toFixed(1),
          avg_closed_lost: avgScoreClosedLost.toFixed(1),
          difference: scoreDifference.toFixed(1),
          insight: scoreDifference > 10
            ? `Closed calls score ${scoreDifference.toFixed(1)} points higher - significant pattern!`
            : 'Score difference is low - may need more data or review criteria'
        },
        lead_quality: {
          distribution: leadQualityDistribution,
          close_rates: closeRateByLeadQuality
        },
        closer_performance: {
          distribution: performanceDistribution,
          close_rates: closeRateByPerformance
        },
        benchmark: {
          total: benchmarkCalls.length,
          ready_for_learning: benchmarkCalls.filter(c => c.validated_by).length,
          avg_score: benchmarkCalls.length > 0
            ? (benchmarkCalls.reduce((sum, c) => sum + (c.analysis?.[0]?.framework_score || 0), 0) / benchmarkCalls.length).toFixed(1)
            : 0
        },
        data_quality: dataQualityMetrics
      }
    })

  } catch (error) {
    console.error('Learning analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
