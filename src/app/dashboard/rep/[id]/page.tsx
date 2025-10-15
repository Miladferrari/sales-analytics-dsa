'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { SalesRep, Call, Analysis } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Sparkles,
} from 'lucide-react'

export default function RepProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [rep, setRep] = useState<SalesRep | null>(null)
  const [calls, setCalls] = useState<Array<Call & { analysis: Analysis }>>([])
  const [loading, setLoading] = useState(true)
  const [analyzingCallId, setAnalyzingCallId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCalls: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0,
    excellentCalls: 0,
    poorCalls: 0,
  })

  useEffect(() => {
    if (params.id) {
      loadRepData(params.id as string)
    }
  }, [params.id])

  async function loadRepData(repId: string) {
    try {
      // Load rep info
      const { data: repData, error: repError } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('id', repId)
        .single()

      if (repError) throw repError
      setRep(repData)

      // Load calls with analysis
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select(
          `
          *,
          analysis (*)
        `
        )
        .eq('rep_id', repId)
        .order('date', { ascending: false })

      if (callsError) throw callsError

      const callsWithAnalysis = callsData.map((call: any) => ({
        ...call,
        analysis: call.analysis[0] || null,
      }))

      setCalls(callsWithAnalysis)

      // Calculate stats
      const scores = callsWithAnalysis
        .filter((c) => c.analysis)
        .map((c) => c.analysis.framework_score)

      const totalCalls = callsWithAnalysis.length
      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const worstScore = scores.length > 0 ? Math.min(...scores) : 0
      const excellentCalls = callsWithAnalysis.filter(
        (c) => c.analysis?.overall_rating === 'excellent'
      ).length
      const poorCalls = callsWithAnalysis.filter(
        (c) => c.analysis?.overall_rating === 'poor'
      ).length

      setStats({
        totalCalls,
        averageScore: Math.round(averageScore),
        bestScore,
        worstScore,
        excellentCalls,
        poorCalls,
      })
    } catch (error) {
      console.error('Error loading rep data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeCall(callId: string) {
    setAnalyzingCallId(callId)

    try {
      toast.info('DSA analyse gestart...', {
        description: 'Dit kan 5-10 seconden duren'
      })

      const response = await fetch('/api/calls/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analyse mislukt')
      }

      toast.success('DSA analyse compleet!', {
        description: `Score: ${data.score}/100`
      })

      // Reload data to show new analysis
      if (params.id) {
        await loadRepData(params.id as string)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Analyse mislukt', {
        description: error instanceof Error ? error.message : 'Onbekende fout'
      })
    } finally {
      setAnalyzingCallId(null)
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Profiel laden...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!rep) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Sales rep niet gevonden</p>
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Terug naar dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Terug naar dashboard</span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-20 h-20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{rep.name}</h1>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    rep.qualification_status === 'qualified'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {rep.qualification_status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{rep.email}</span>
                </div>
                {rep.telegram_id && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{rep.telegram_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Calls</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCalls}</p>
              </div>
              <Phone className="w-12 h-12 text-primary-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gemiddelde Score</p>
                <p className={`text-3xl font-bold mt-2 ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-primary-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beste Score</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.bestScore}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Slechtste Score</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.worstScore}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Excellent Calls</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.excellentCalls}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Poor Calls</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.poorCalls}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Calls List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Call Geschiedenis</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {calls.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">Nog geen calls opgenomen</p>
              </div>
            ) : (
              calls.map((call) => (
                <div
                  key={call.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/calls/${call.id}`}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {call.meeting_title && (
                          <span className="font-medium text-gray-900">
                            {call.meeting_title}
                          </span>
                        )}
                        {call.analysis && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(
                              call.analysis.overall_rating
                            )}`}
                          >
                            {call.analysis.overall_rating.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                        {!call.analysis && call.transcript && call.transcript.length > 50 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            KLAAR VOOR ANALYSE
                          </span>
                        )}
                        {!call.analysis && (!call.transcript || call.transcript.length < 50) && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            GEEN TRANSCRIPT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(call.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(call.duration / 60)} min</span>
                        </div>
                        {call.customer_email && <span>{call.customer_email}</span>}
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 ml-4">
                      {call.analysis ? (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">DSA Score</p>
                          <p
                            className={`text-2xl font-bold ${getScoreColor(
                              call.analysis.framework_score
                            )}`}
                          >
                            {call.analysis.framework_score}
                          </p>
                        </div>
                      ) : call.transcript && call.transcript.length > 50 ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            analyzeCall(call.id)
                          }}
                          disabled={analyzingCallId === call.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {analyzingCallId === call.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Analyseren...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>DSA Analyseer</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Transcript te kort
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
