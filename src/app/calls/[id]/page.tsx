'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Call, Analysis, SalesRep } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  User,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Flag,
} from 'lucide-react'

export default function CallDetailPage() {
  const params = useParams()
  const [call, setCall] = useState<
    (Call & { analysis: Analysis; sales_rep: SalesRep }) | null
  >(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadCallDetails(params.id as string)
    }
  }, [params.id])

  async function loadCallDetails(callId: string) {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select(
          `
          *,
          analysis (*),
          sales_reps (*)
        `
        )
        .eq('id', callId)
        .single()

      if (error) throw error

      if (data) {
        setCall({
          ...data,
          analysis: data.analysis[0],
          sales_rep: data.sales_reps,
        })
      }
    } catch (error) {
      console.error('Error loading call details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading call details...</p>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Call not found</p>
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
      case 'needs_improvement':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      case 'poor':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">Call Details</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{call.sales_rep?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(call.date), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              <span>{Math.floor(call.duration / 60)} minutes</span>
            </div>
          </div>

          {call.analysis && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Overall Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {call.analysis.framework_score}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pillar 1
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {call.analysis.pillar_1_score}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pillar 2
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {call.analysis.pillar_2_score}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pillar 3
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {call.analysis.pillar_3_score}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Overall Rating
                  </h2>
                </div>
                <span
                  className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getRatingColor(
                    call.analysis.overall_rating
                  )}`}
                >
                  {call.analysis.overall_rating.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Feedback
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {call.analysis.feedback}
                </p>
              </div>

              {call.analysis.key_strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Key Strengths
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {call.analysis.key_strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {call.analysis.areas_for_improvement.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Areas for Improvement
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {call.analysis.areas_for_improvement.map((area, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-yellow-600 mt-1">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {call.analysis.red_flags.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flag className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">
                      Red Flags
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {call.analysis.red_flags.map((flag, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-red-900 dark:text-red-300"
                      >
                        <span className="text-red-600 mt-1">⚠</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Call Transcript
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {call.transcript}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
