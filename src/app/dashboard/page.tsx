'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import { SalesRep, Call } from '@/types'
import DashboardLayout from '@/components/DashboardLayout'
import { format, subDays, startOfDay } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { nl } from 'date-fns/locale'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [reps, setReps] = useState<
    Array<
      SalesRep & {
        totalCalls: number
        averageScore: number
        recentCallsCount: number
      }
    >
  >([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
    loadData()
  }, [])

  async function loadUser() {
    try {
      const currentUser = await getUser()
      setUser(currentUser)

      // Load profile data for name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', currentUser?.id)
        .single()

      if (profile) {
        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
      }
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    }
  }

  async function loadData() {
    try {
      // Load reps with stats
      const { data: repsData } = await supabase
        .from('sales_reps')
        .select(
          `
          *,
          calls (
            id,
            date,
            analysis (
              framework_score
            )
          )
        `
        )
        .order('name')

      if (repsData) {
        const repsWithStats = repsData.map((rep: any) => {
          const calls = rep.calls || []
          const scores = calls
            .filter((c: any) => c.analysis && c.analysis.length > 0)
            .map((c: any) => c.analysis[0].framework_score)

          const averageScore =
            scores.length > 0
              ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
              : 0

          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const recentCallsCount = calls.filter(
            (c: any) => new Date(c.date) >= sevenDaysAgo
          ).length

          return {
            ...rep,
            totalCalls: calls.length,
            averageScore: Math.round(averageScore),
            recentCallsCount,
          }
        })

        setReps(repsWithStats)
      }

      // Load calls for chart (last 30 days)
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))
      const { data: callsData } = await supabase
        .from('calls')
        .select('id, date')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date')

      if (callsData) {
        // Group calls by date
        const callsByDate: { [key: string]: number } = {}

        // Initialize all dates with 0
        for (let i = 29; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'MMM dd')
          callsByDate[date] = 0
        }

        // Count calls per date
        callsData.forEach((call: any) => {
          const dateKey = format(new Date(call.date), 'MMM dd')
          if (dateKey in callsByDate) {
            callsByDate[dateKey]++
          }
        })

        // Convert to chart format
        const chartArray = Object.entries(callsByDate).map(([date, calls]) => ({
          date,
          calls,
        }))

        setChartData(chartArray)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCalls = reps.reduce((sum, r) => sum + r.totalCalls, 0)
  const avgTeamScore = reps.length > 0
    ? Math.round(reps.reduce((sum, r) => sum + r.averageScore, 0) / reps.length)
    : 0
  const totalRecentCalls = reps.reduce((sum, r) => sum + r.recentCallsCount, 0)

  // Calculate stats for cards
  const todayCalls = chartData.length > 0 ? chartData[chartData.length - 1]?.calls || 0 : 0
  const avgDailyCalls = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.calls, 0) / chartData.length)
    : 0
  const todayPercentage = avgDailyCalls > 0 ? Math.round((todayCalls / avgDailyCalls) * 100) : 0

  const monthTotal = totalRecentCalls * 4 // Rough estimate for month
  const monthTarget = 520
  const monthPercentage = Math.round((monthTotal / monthTarget) * 100)

  const npsScore = avgTeamScore // Using team score as NPS proxy

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Goedemorgen'
    if (hour < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }

  // Get user name from profile or fallback to email
  const getUserName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  const userName = getUserName()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Dashboard laden...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {getGreeting()}, {userName}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                  Vandaag
                </span>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">
                  {format(new Date(), 'EEEE, d MMMM yyyy', { locale: nl })}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Overzicht van de resultaten en prestaties van je salesteam
            </p>
          </div>

        {/* Clean Stat Cards - 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
          {/* Card 1: Calls Today */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                todayPercentage >= 100 ? 'bg-green-100 text-green-700' :
                todayPercentage >= 50 ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {todayPercentage}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Gesprekken Vandaag</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{todayCalls}</span>
              <span className="text-sm text-gray-500">/ {avgDailyCalls} gem</span>
            </div>
          </div>

          {/* Card 2: Calls This Month */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                monthPercentage >= 80 ? 'bg-green-100 text-green-700' :
                monthPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {monthPercentage}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Gesprekken Deze Maand</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{monthTotal}</span>
              <span className="text-sm text-gray-500">/ {monthTarget}</span>
            </div>
          </div>

          {/* Card 3: Team Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                npsScore >= 85 ? 'bg-green-100 text-green-700' :
                npsScore >= 70 ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {npsScore >= 85 ? 'Uitstekend' : npsScore >= 70 ? 'Goed' : 'Voldoende'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Team Prestaties</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">{npsScore}</span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Gesprekken Activiteit
              </h2>
              <p className="text-xs text-gray-500">
                Laatste 30 dagen • Totaal: {chartData.reduce((sum, d) => sum + d.calls, 0)} gesprekken
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-gray-600">Gesprekken</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#e5e7eb"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  stroke="#e5e7eb"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}
                  itemStyle={{ color: '#6366f1', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  name="Calls"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Team Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Team Overzicht</h3>
            <div className="space-y-4">
              {/* Qualified Reps */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Gekwalificeerde Reps</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {reps.filter(r => r.qualification_status === 'qualified').length} / {reps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(reps.filter(r => r.qualification_status === 'qualified').length / reps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Active This Week */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Actief Deze Week</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {reps.filter(r => r.recentCallsCount > 0).length} / {reps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(reps.filter(r => r.recentCallsCount > 0).length / reps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Prestatie Indicatoren</h3>
            <div className="space-y-4">
              {/* High Performers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Toppers (&gt;85)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {reps.filter(r => r.averageScore > 85).length} / {reps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(reps.filter(r => r.averageScore > 85).length / reps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Call Volume Target */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Doel Voortgang</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {totalCalls} / 1000
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalCalls / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Right Sidebar - Upcoming Calls */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 lg:sticky lg:top-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Geplande Gesprekken</h3>
                <p className="text-xs text-gray-500 mt-0.5">{totalRecentCalls} gepland deze week</p>
              </div>
              <button className="text-indigo-600 text-xs sm:text-sm font-medium hover:text-indigo-700 flex items-center gap-1">
                <span>+</span>
                <span className="hidden sm:inline">Plannen</span>
              </button>
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide">
              {[...Array(7)].map((_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const isToday = i === 0
                return (
                  <button
                    key={i}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-lg transition-all ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-medium">{format(date, 'd')}</span>
                    <span className="text-xs mt-0.5">{format(date, 'MMM', { locale: nl })}</span>
                  </button>
                )
              })}
            </div>

            {/* Time Slots */}
            <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {/* Sample scheduled calls */}
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="text-xs text-gray-500 w-16 flex-shrink-0 pt-1">10:00</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-medium text-gray-900 truncate">John Smith</p>
                  </div>
                  <p className="text-xs text-gray-500">Vervolggesprek</p>
                  <p className="text-xs text-gray-400 mt-1">10:00 - 10:30</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="text-xs text-gray-500 w-16 flex-shrink-0 pt-1">10:30</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-sm font-medium text-gray-900 truncate">Sarah Johnson</p>
                  </div>
                  <p className="text-xs text-gray-500">Demo gesprek</p>
                  <p className="text-xs text-gray-400 mt-1">10:30 - 11:00</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="text-xs text-indigo-600 w-16 flex-shrink-0 pt-1 font-medium">11:00</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    <p className="text-sm font-semibold text-indigo-900 truncate">Team Overleg</p>
                  </div>
                  <p className="text-xs text-indigo-600">Wekelijkse sync</p>
                  <p className="text-xs text-indigo-500 mt-1">11:00 - 11:30</p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="text-xs text-gray-500 w-16 flex-shrink-0 pt-1">11:30</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-sm font-medium text-gray-900 truncate">Chris Anderson</p>
                  </div>
                  <p className="text-xs text-gray-500">Onboarding gesprek</p>
                  <p className="text-xs text-gray-400 mt-1">11:30 - 12:00</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="text-xs text-gray-500 w-16 flex-shrink-0 pt-1">14:00</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-sm font-medium text-gray-900 truncate">Lauren Thomas</p>
                  </div>
                  <p className="text-xs text-gray-500">Kennismakingsgesprek</p>
                  <p className="text-xs text-gray-400 mt-1">14:00 - 14:30</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
