'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SalesRep } from '@/types'
import { User, Mail, Phone, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function SalesRepsPage() {
  const [reps, setReps] = useState<
    Array<
      SalesRep & {
        totalCalls: number
        averageScore: number
      }
    >
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReps()
  }, [])

  async function loadReps() {
    try {
      const { data } = await supabase
        .from('sales_reps')
        .select(
          `
          *,
          calls (
            id,
            analysis (
              framework_score
            )
          )
        `
        )
        .order('name')

      if (data) {
        const repsWithStats = data.map((rep: any) => {
          const calls = rep.calls || []
          const scores = calls
            .filter((c: any) => c.analysis && c.analysis.length > 0)
            .map((c: any) => c.analysis[0].framework_score)

          const averageScore =
            scores.length > 0
              ? scores.reduce((sum: number, s: number) => sum + s, 0) /
                scores.length
              : 0

          return {
            ...rep,
            totalCalls: calls.length,
            averageScore: Math.round(averageScore),
          }
        })

        setReps(repsWithStats)
      }
    } catch (error) {
      console.error('Error loading reps:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Representatives
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reps.map((rep) => (
            <div
              key={rep.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rep.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        rep.qualification_status === 'qualified'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {rep.qualification_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{rep.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{rep.totalCalls} calls</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Score
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {rep.averageScore || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reps.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No sales reps found. Add reps to your Supabase database to get
              started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
