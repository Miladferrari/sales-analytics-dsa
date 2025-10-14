'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RepData {
  name: string
  averageScore: number
  totalCalls: number
}

export default function RepPerformanceChart() {
  const [data, setData] = useState<RepData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRepPerformance()
  }, [])

  async function loadRepPerformance() {
    try {
      const { data: reps } = await supabase
        .from('sales_reps')
        .select(`
          id,
          name,
          calls (
            id,
            analysis (
              framework_score
            )
          )
        `)

      if (reps) {
        const repData: RepData[] = reps.map((rep: any) => {
          const calls = rep.calls || []
          const scores = calls
            .filter((c: any) => c.analysis && c.analysis.length > 0)
            .map((c: any) => c.analysis[0].framework_score)

          const averageScore =
            scores.length > 0
              ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
              : 0

          return {
            name: rep.name,
            averageScore: Math.round(averageScore),
            totalCalls: calls.length,
          }
        })

        setData(repData.sort((a, b) => b.averageScore - a.averageScore).slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading rep performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Rep Performance
        </h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Top Performing Reps
      </h2>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageScore" fill="#0ea5e9" name="Average Score" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
