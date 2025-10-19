'use client'

/**
 * Self-Learning AI Dashboard
 *
 * Monitor and manage the AI learning system
 * View analytics, patterns, and performance metrics
 */

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, Target, Star, AlertCircle, BarChart3, CheckCircle } from 'lucide-react'

interface LearningAnalytics {
  timeframe: string
  summary: {
    total_calls: number
    closed_won: number
    closed_lost: number
    in_progress: number
    close_rate: string
    avg_deal_value: string
    total_revenue: string
  }
  scores: {
    avg_closed_won: string
    avg_closed_lost: string
    difference: string
    insight: string
  }
  benchmark: {
    total: number
    ready_for_learning: number
    avg_score: string
  }
  data_quality: {
    total_calls: number
    calls_with_outcome: number
    calls_with_lead_quality: number
    calls_with_performance: number
    benchmark_calls: number
    validated_calls: number
    data_completeness_rate: number
  }
}

export default function LearningDashboard() {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/learning/analytics?timeframe=${timeframe}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              Self-Learning AI Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor AI learning performance and manage benchmark calls
            </p>
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Calls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {analytics.summary.total_calls}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
        </div>

        {/* Close Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {analytics.summary.close_rate}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Close Rate</h3>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.summary.closed_won} won / {analytics.summary.closed_lost} lost
          </p>
        </div>

        {/* Benchmark Calls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">
              {analytics.benchmark.total}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Benchmark Calls</h3>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.benchmark.ready_for_learning} validated
          </p>
        </div>

        {/* Avg Deal Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">
              €{analytics.summary.avg_deal_value}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Avg Deal Value</h3>
          <p className="text-xs text-gray-500 mt-1">
            Total: €{analytics.summary.total_revenue}
          </p>
        </div>
      </div>

      {/* Score Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Score Analysis: Closed Won vs Lost
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Closed Won Average</span>
                <span className="text-lg font-bold text-green-600">
                  {analytics.scores.avg_closed_won}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${analytics.scores.avg_closed_won}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Closed Lost Average</span>
                <span className="text-lg font-bold text-red-600">
                  {analytics.scores.avg_closed_lost}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all"
                  style={{ width: `${analytics.scores.avg_closed_lost}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Score Difference</span>
                <span className="text-xl font-bold text-indigo-600">
                  +{analytics.scores.difference} pts
                </span>
              </div>
              <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                💡 {analytics.scores.insight}
              </p>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Data Quality Metrics
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Calls with Outcome</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {analytics.data_quality.calls_with_outcome}/{analytics.data_quality.total_calls}
                </span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lead Quality Tagged</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {analytics.data_quality.calls_with_lead_quality}/{analytics.data_quality.total_calls}
                </span>
                {analytics.data_quality.calls_with_lead_quality > analytics.data_quality.total_calls * 0.7 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance Tagged</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {analytics.data_quality.calls_with_performance}/{analytics.data_quality.total_calls}
                </span>
                {analytics.data_quality.calls_with_performance > analytics.data_quality.total_calls * 0.7 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Validated Calls</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {analytics.data_quality.validated_calls}/{analytics.data_quality.total_calls}
                </span>
                <CheckCircle className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Data Completeness</span>
                <span className="text-lg font-bold text-indigo-600">
                  {analytics.data_quality.data_completeness_rate.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${analytics.data_quality.data_completeness_rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {analytics.data_quality.data_completeness_rate >= 70
                  ? '✅ Good data quality for AI learning'
                  : '⚠️ More tagging needed for reliable AI learning'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          Next Steps for AI Learning
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">1.</div>
            <h4 className="font-semibold text-gray-900 mb-2">Tag More Calls</h4>
            <p className="text-sm text-gray-600">
              Tag {Math.max(0, 20 - analytics.benchmark.total)} more calls as benchmarks to start AI training.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">2.</div>
            <h4 className="font-semibold text-gray-900 mb-2">Validate Quality</h4>
            <p className="text-sm text-gray-600">
              Ensure lead quality and closer performance are tagged for accurate pattern detection.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">3.</div>
            <h4 className="font-semibold text-gray-900 mb-2">Run Analysis</h4>
            <p className="text-sm text-gray-600">
              Once 20+ benchmarks are validated, AI can detect patterns and improve coaching.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
