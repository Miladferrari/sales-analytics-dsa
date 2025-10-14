'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Phone, TrendingUp, CircleAlert, CircleCheckBig, Mail, ChevronRight, Plus, X, ExternalLink, Clock, Calendar, AlertCircle, CheckCircle, Bot, RefreshCw } from 'lucide-react'
import { format, addDays, startOfWeek, subDays, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TeamMemberPage() {
  const router = useRouter()
  const params = useParams()
  const repId = params.id as string

  const [rep, setRep] = useState<any>(null)
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(0) // 0 = today
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false)
  const [unarchivePassword, setUnarchivePassword] = useState('')
  const [unarchiveLoading, setUnarchiveLoading] = useState(false)
  const [showUnarchivePassword, setShowUnarchivePassword] = useState(false)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [selectedCallAnalysis, setSelectedCallAnalysis] = useState<any>(null)
  const [loadingCallDetails, setLoadingCallDetails] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showEditTeamsModal, setShowEditTeamsModal] = useState(false)
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [savingTeams, setSavingTeams] = useState(false)

  // Mock upcoming calls data (will be replaced with Zoom/Google Calendar integration)
  const upcomingCalls = [
    { time: '10:00', endTime: '10:30', title: 'Follow-up Gesprek', contact: 'John Smith', type: 'follow-up', color: 'blue' },
    { time: '10:30', endTime: '11:00', title: 'Demo Gesprek', contact: 'Sarah Johnson', type: 'demo', color: 'purple' },
    { time: '11:00', endTime: '11:30', title: 'Team Overleg', contact: 'Wekelijkse Sync', type: 'team', color: 'indigo', current: true },
    { time: '11:30', endTime: '12:00', title: 'Onboarding Gesprek', contact: 'Chris Anderson', type: 'onboarding', color: 'green' },
    { time: '14:00', endTime: '14:30', title: 'Kennismaking', contact: 'Lauren Thomas', type: 'discovery', color: 'orange' },
  ]

  // Generate next 7 days for date selector
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i)
    return {
      day: format(date, 'd'),
      month: format(date, 'MMM', { locale: nl }),
      isToday: i === 0
    }
  })

  useEffect(() => {
    loadRepData()
  }, [repId])

  async function loadRepData() {
    try {
      // Load rep details (including archived)
      const { data: repData } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('id', repId)
        .single()

      if (repData) {
        setRep(repData)
      }

      // Load calls with analysis (try with correct foreign key)
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select(`
          *,
          analysis (
            framework_score,
            sentiment_score,
            key_topics
          )
        `)
        .eq('rep_id', repId)
        .order('date', { ascending: false })

      if (callsError) {
        console.error('Error loading calls:', callsError)
        // Fallback: try with sales_rep_id
        const { data: fallbackCalls } = await supabase
          .from('calls')
          .select(`
            *,
            analysis (
              framework_score,
              sentiment_score,
              key_topics
            )
          `)
          .eq('sales_rep_id', repId)
          .order('date', { ascending: false })

        if (fallbackCalls) {
          setCalls(fallbackCalls)
        }
      } else if (callsData) {
        setCalls(callsData)
      }
    } catch (error) {
      console.error('Error loading rep data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCallDetails(call: any) {
    setSelectedCall(call)
    setLoadingCallDetails(true)

    try {
      // Load analysis for this call
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis')
        .select('*')
        .eq('call_id', call.id)
        .single()

      if (!analysisError && analysisData) {
        setSelectedCallAnalysis(analysisData)
      } else {
        setSelectedCallAnalysis(null)
      }
    } catch (error) {
      console.error('Error loading call details:', error)
      setSelectedCallAnalysis(null)
    } finally {
      setLoadingCallDetails(false)
    }
  }

  function closeCallDetails() {
    setSelectedCall(null)
    setSelectedCallAnalysis(null)
  }

  async function openEditTeamsModal() {
    setShowEditTeamsModal(true)
    setSelectedTeams(rep?.fathom_teams || [])
    loadFathomTeams()
  }

  async function loadFathomTeams() {
    setLoadingTeams(true)
    try {
      const response = await fetch('/api/fathom/teams')
      const data = await response.json()
      if (data.success) {
        setAvailableTeams(data.teams)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoadingTeams(false)
    }
  }

  function toggleTeam(team: string) {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    )
  }

  async function saveTeams() {
    setSavingTeams(true)
    try {
      const { error } = await supabase
        .from('sales_reps')
        .update({ fathom_teams: selectedTeams })
        .eq('id', repId)

      if (error) throw error

      // Refresh rep data
      await loadRepData()
      setShowEditTeamsModal(false)
    } catch (error) {
      console.error('Error saving teams:', error)
      alert('Er is een fout opgetreden bij het opslaan van teams')
    } finally {
      setSavingTeams(false)
    }
  }

  async function handleRefreshCalls() {
    setRefreshing(true)
    try {
      // Step 1: Trigger Fathom sync
      console.log('🔄 Triggering Fathom sync...')
      const syncResponse = await fetch('/api/cron/sync-fathom', {
        method: 'POST'
      })
      const syncResult = await syncResponse.json()
      console.log('✅ Sync result:', syncResult)

      // Step 2: Reload calls data
      await loadRepData()

      console.log('✅ Calls refreshed successfully')
    } catch (error) {
      console.error('❌ Error refreshing calls:', error)
      alert('Er is een fout opgetreden bij het verversen')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleArchiveRep() {
    if (!deletePassword) {
      alert('Vul je wachtwoord in om te bevestigen')
      return
    }

    setDeleteLoading(true)

    try {
      // Verify password by attempting to sign in
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: deletePassword
      })

      if (authError || !user) {
        alert('❌ Incorrect wachtwoord')
        setDeleteLoading(false)
        return
      }

      // Archive the sales rep (soft delete)
      const { error: updateError } = await supabase
        .from('sales_reps')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', repId)

      if (updateError) {
        console.error('Archive error:', updateError)
        alert('Er is een fout opgetreden bij het archiveren')
        return
      }

      alert(`✅ ${rep.name} is gearchiveerd en verplaatst naar het archief`)
      router.push('/dashboard/team')
    } catch (error) {
      console.error('Error archiving rep:', error)
      alert('Er is een fout opgetreden')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleUnarchiveRep() {
    if (!unarchivePassword) {
      alert('Vul je wachtwoord in om te bevestigen')
      return
    }

    setUnarchiveLoading(true)

    try {
      // Verify password by attempting to sign in
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: unarchivePassword
      })

      if (authError || !user) {
        alert('❌ Incorrect wachtwoord')
        setUnarchiveLoading(false)
        return
      }

      // Unarchive the sales rep (set archived_at to NULL)
      const { error: updateError } = await supabase
        .from('sales_reps')
        .update({ archived_at: null })
        .eq('id', repId)

      if (updateError) {
        console.error('Unarchive error:', updateError)
        alert('Er is een fout opgetreden bij het terugzetten')
        return
      }

      alert(`✅ ${rep.name} is teruggezet naar actieve medewerkers`)
      router.push('/dashboard/team')
    } catch (error) {
      console.error('Error unarchiving rep:', error)
      alert('Er is een fout opgetreden')
    } finally {
      setUnarchiveLoading(false)
    }
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
        <div className="p-4 sm:p-6">
          <p className="text-gray-600">Team lid niet gevonden</p>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate stats
  const totalCalls = calls.length
  const scores = calls
    .filter(c => c.analysis && c.analysis.length > 0)
    .map(c => c.analysis[0].framework_score)

  const goodCalls = scores.filter(s => s >= 70).length // Goede gesprekken: score >= 70
  const badCalls = scores.filter(s => s < 70).length // Slechte gesprekken: score < 70

  // Prepare chart data for last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const callsOnDay = calls.filter(call => {
      const callDate = format(parseISO(call.date), 'yyyy-MM-dd')
      return callDate === dateStr
    }).length

    return {
      date: format(date, 'MMM dd', { locale: nl }),
      calls: callsOnDay
    }
  })

  // Get status badge color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700'

    switch (status.toLowerCase()) {
      case 'qualified':
        return 'bg-green-100 text-green-700'
      case 'in training':
        return 'bg-blue-100 text-blue-700'
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Back Button + Header Section */}
          <div className="mb-6 sm:mb-8">
            {/* Back Button */}
            <button
              onClick={() => router.push('/dashboard/team')}
              className="inline-flex items-center gap-2 px-3 py-2 mb-4 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug naar team</span>
            </button>

            {/* Header with Name and Status - Responsive */}
            <div className="flex flex-col gap-4">
              {/* Top Row: Profile + Name + Email */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Profile Photo */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-lg sm:text-xl">
                    {rep.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>

                {/* Name and Email */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{rep.name}</h1>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(rep.qualification_status)}`}>
                      {rep.qualification_status === 'qualified' ? 'Qualified' : 'Unqualified'}
                    </span>
                    {rep.archived_at && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                        📦 Gearchiveerd
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{rep.email}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Date + Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
                {/* Date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                    Vandaag
                  </span>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">
                    {format(new Date(), 'EEEE, d MMMM yyyy', { locale: nl })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Archive Button - Only show if not archived */}
                  {!rep.archived_at && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-gray-200 hover:border-red-200 w-full sm:w-auto justify-center sm:justify-start"
                      title="Archiveer medewerker"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archiveren
                    </button>
                  )}

                  {/* Archived Info + Unarchive Button */}
                  {rep.archived_at && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400">Gearchiveerd op</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {new Date(rep.archived_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUnarchiveModal(true)}
                        className="text-sm text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-200 w-full sm:w-auto justify-center sm:justify-start"
                        title="Zet terug naar actief"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Terugzetten
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Compact 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
            {/* Total Calls */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Totaal Gesprekken</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">{totalCalls}</span>
              </div>
            </div>

            {/* Good Calls */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {totalCalls > 0 ? Math.round((goodCalls / totalCalls) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Goede Gesprekken</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-600">{goodCalls}</span>
                <span className="text-sm text-gray-500">≥70</span>
              </div>
            </div>

            {/* Bad Calls */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                  {totalCalls > 0 ? Math.round((badCalls / totalCalls) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Slechte Gesprekken</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-red-600">{badCalls}</span>
                <span className="text-sm text-gray-500">&lt;70</span>
              </div>
            </div>
          </div>

          {/* Gesprekken Activiteit Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">Gesprekken Activiteit</h2>
                <p className="text-xs text-gray-500">Laatste 30 dagen • Totaal: {totalCalls} gesprekken</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-gray-600">Gesprekken</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    labelStyle={{
                      color: '#111827',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={false}
                    name="Gesprekken"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Persoonlijke Informatie</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900">{rep.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Telefoonnummer</p>
                    <p className="text-sm text-gray-900">{rep.phone_number || 'Niet opgegeven'}</p>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Adres
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Straat + Huisnummer</p>
                    <p className="text-sm text-gray-900">{rep.street_address || 'Niet opgegeven'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Postcode</p>
                      <p className="text-sm text-gray-900">{rep.postal_code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stad</p>
                      <p className="text-sm text-gray-900">{rep.city || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Land</p>
                    <p className="text-sm text-gray-900">{rep.country || 'Nederland'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fathom Teams Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Fathom Teams</h3>
                <p className="text-xs text-gray-500">
                  {rep?.fathom_teams?.length > 0
                    ? 'Importeert alleen calls van geselecteerde teams'
                    : 'Importeert calls van alle teams'
                  }
                </p>
              </div>
              <button
                onClick={openEditTeamsModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bewerk
              </button>
            </div>

            {rep?.fathom_teams?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rep.fathom_teams.map((team: string) => (
                  <span
                    key={team}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {team}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Geen teams geselecteerd - importeert van alle teams
              </div>
            )}
          </div>

          {/* Call History List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gesprekken Geschiedenis</h2>
                {calls.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{calls.length} gesprekken geregistreerd</p>
                )}
              </div>
              <button
                onClick={handleRefreshCalls}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Ververs gesprekken"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Ververs</span>
              </button>
            </div>

            {calls.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nog geen gesprekken opgenomen</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {calls.map((call) => {
                  const analysis = call.analysis?.[0]
                  const score = analysis?.framework_score || 0
                  const status = call.fathom_status || 'pending'

                  // Format duration to readable format (e.g., "38 sec", "2min 15sec", "1u 15min")
                  const formatDuration = (seconds: number) => {
                    if (!seconds) return '-'

                    const minutes = Math.floor(seconds / 60)
                    const remainingSeconds = seconds % 60

                    // Less than 1 minute: show only seconds
                    if (minutes === 0) {
                      return `${seconds} sec`
                    }

                    // Less than 1 hour: show minutes and seconds
                    if (minutes < 60) {
                      if (remainingSeconds > 0) {
                        return `${minutes}min ${remainingSeconds}sec`
                      }
                      return `${minutes} min`
                    }

                    // 1 hour or more: show hours and minutes
                    const hours = Math.floor(minutes / 60)
                    const remainingMinutes = minutes % 60
                    return `${hours}u ${remainingMinutes}min`
                  }

                  return (
                    <button
                      key={call.id}
                      onClick={() => loadCallDetails(call)}
                      className="w-full text-left px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      {/* Mobile/Tablet: Stack vertically, Desktop: Horizontal */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        {/* Left: Call Info */}
                        <div className="flex-1 min-w-0">
                          {/* Call Title with Icon */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                              <Phone className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">
                              {call.meeting_title || 'Gesprek zonder titel'}
                            </h3>
                          </div>

                          {/* Date, Duration, and Team - Responsive */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 ml-10">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">
                                {/* Show short date on mobile, full on desktop */}
                                <span className="hidden sm:inline">
                                  {format(new Date(call.date), 'EEEE, d MMMM yyyy', { locale: nl })}
                                </span>
                                <span className="sm:hidden">
                                  {format(new Date(call.date), 'd MMM yyyy', { locale: nl })}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="whitespace-nowrap">{formatDuration(call.duration)}</span>
                            </div>
                            {/* Fathom Team Badge */}
                            {(call as any).fathom_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                {(call as any).fathom_team || 'Sales'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Score Badge + Arrow - Responsive */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-10 sm:ml-0 flex-shrink-0">
                          {status === 'completed' && analysis ? (
                            <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                              score >= 80 ? 'bg-green-100 text-green-700' :
                              score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              <span className="hidden sm:inline">Score: </span>{score}
                            </span>
                          ) : status === 'analyzing' ? (
                            <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                              <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="hidden sm:inline">Analyseren...</span>
                              <span className="sm:hidden">...</span>
                            </span>
                          ) : status === 'pending' ? (
                            <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                              <span className="hidden sm:inline">In wachtrij</span>
                              <span className="sm:hidden">Wachtrij</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              <span className="hidden sm:inline">Geen analyse</span>
                              <span className="sm:hidden">-</span>
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Upcoming Calls */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 lg:sticky lg:top-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Geplande Gesprekken</h3>
                <p className="text-xs text-gray-500 mt-0.5">{rep.name} - {upcomingCalls.length} gesprekken deze week</p>
              </div>
              <button className="text-indigo-600 text-xs sm:text-sm font-medium hover:text-indigo-700 flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Toevoegen</span>
              </button>
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide">
              {weekDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(index)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-lg transition-all ${
                    selectedDate === index
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs font-medium">{day.day}</span>
                  <span className="text-xs mt-0.5">{day.month}</span>
                </button>
              ))}
            </div>

            {/* Calls List */}
            <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {upcomingCalls.map((call, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    call.current
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className={`text-xs w-16 flex-shrink-0 pt-1 ${
                    call.current ? 'text-indigo-600 font-medium' : 'text-gray-500'
                  }`}>
                    {call.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        call.color === 'blue' ? 'bg-blue-500' :
                        call.color === 'purple' ? 'bg-purple-500' :
                        call.color === 'indigo' ? 'bg-indigo-600' :
                        call.color === 'green' ? 'bg-green-500' :
                        'bg-orange-500'
                      }`}></div>
                      <p className={`text-sm font-medium truncate ${
                        call.current ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {call.contact}
                      </p>
                    </div>
                    <p className={`text-xs ${
                      call.current ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {call.title}
                    </p>
                    <p className={`text-xs mt-1 ${
                      call.current ? 'text-indigo-500' : 'text-gray-400'
                    }`}>
                      {call.time} - {call.endTime}
                    </p>
                  </div>
                  <button className={`${
                    call.current ? 'text-indigo-600 hover:text-indigo-700' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete/Archive Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Medewerker Archiveren</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletePassword('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Weet je het zeker?
                    </p>
                    <p className="text-xs text-amber-700">
                      <strong>{rep.name}</strong> wordt verplaatst naar het archief. Je kunt dit later ongedaan maken via het archief.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleArchiveRep(); }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voer je wachtwoord in om te bevestigen
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Wachtwoord"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showDeletePassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Dit is een veiligheidsmaatregel om onbedoeld archiveren te voorkomen
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeletePassword('')
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || !deletePassword}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? 'Archiveren...' : 'Archiveren'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unarchive Confirmation Modal */}
      {showUnarchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Medewerker Terugzetten</h2>
                <button
                  onClick={() => {
                    setShowUnarchiveModal(false)
                    setUnarchivePassword('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Terugzetten naar actief
                    </p>
                    <p className="text-xs text-green-700">
                      <strong>{rep.name}</strong> wordt teruggezet naar de actieve medewerkers lijst.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUnarchiveRep(); }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voer je wachtwoord in om te bevestigen
                  </label>
                  <div className="relative">
                    <input
                      type={showUnarchivePassword ? "text" : "password"}
                      value={unarchivePassword}
                      onChange={(e) => setUnarchivePassword(e.target.value)}
                      placeholder="Wachtwoord"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnarchivePassword(!showUnarchivePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showUnarchivePassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Dit is een veiligheidsmaatregel om onbedoeld terugzetten te voorkomen
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnarchiveModal(false)
                      setUnarchivePassword('')
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={unarchiveLoading || !unarchivePassword}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unarchiveLoading ? 'Terugzetten...' : 'Terugzetten'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Call Detail Slide-over Panel */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeCallDetails}
          ></div>

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-2xl">
              <div className="h-full flex flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Call Details</h2>
                    <button
                      onClick={closeCallDetails}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingCallDetails ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Call Info */}
                      <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          {selectedCall.meeting_title || 'Gesprek zonder titel'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(selectedCall.date), 'EEEE, d MMMM yyyy', { locale: nl })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              {(() => {
                                const seconds = selectedCall.duration
                                const minutes = Math.floor(seconds / 60)
                                const remainingSeconds = seconds % 60
                                if (minutes === 0) return `${seconds} sec`
                                if (minutes < 60) {
                                  if (remainingSeconds > 0) return `${minutes}min ${remainingSeconds}sec`
                                  return `${minutes} min`
                                }
                                const hours = Math.floor(minutes / 60)
                                const remainingMinutes = minutes % 60
                                return `${hours}u ${remainingMinutes}min`
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            <span>{rep?.name || 'Onbekend'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating - Always show */}
                      <div className="mb-6">
                        {selectedCallAnalysis ? (
                          (() => {
                            const score = selectedCallAnalysis.framework_score || 0
                            const getRating = (score: number) => {
                              if (score >= 80) return { label: 'Goed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
                              if (score >= 50) return { label: 'Prima', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: TrendingUp }
                              return { label: 'Slecht', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
                            }
                            const rating = getRating(score)
                            const RatingIcon = rating.icon

                            return (
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">Gesprek Score:</span>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ${rating.color}`}>
                                  <RatingIcon className="w-5 h-5" />
                                  <span>{rating.label}</span>
                                  <span className="ml-2 opacity-75">({score}/100)</span>
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Gesprek Score:</span>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold bg-gray-100 text-gray-500 border-gray-200">
                              <AlertCircle className="w-5 h-5" />
                              <span>Nog niet geanalyseerd</span>
                            </div>
                          </div>
                        )}
                      </div>

                          {/* Summary Card - Always show */}
                          <div className={`rounded-lg border-2 p-5 mb-6 ${
                            selectedCallAnalysis?.analysis_data?.summary
                              ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                selectedCallAnalysis?.analysis_data?.summary
                                  ? 'bg-indigo-600'
                                  : 'bg-gray-400'
                              }`}>
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              Samenvatting
                            </h3>

                            {selectedCallAnalysis?.analysis_data?.summary ? (
                              <>
                                <p className="text-gray-700 leading-relaxed mb-3">
                                  <strong>{rep?.name || 'De sales rep'}</strong> heeft een call gedaan met{' '}
                                  <strong>
                                    {(() => {
                                      if (!selectedCall.participants || selectedCall.participants.length === 0) return 'onbekende prospect'
                                      const salesRepEmail = rep?.email?.toLowerCase()
                                      const clientParticipant = selectedCall.participants.find((p: any) =>
                                        p.email.toLowerCase() !== salesRepEmail
                                      )
                                      return clientParticipant?.name || 'een prospect'
                                    })()}
                                  </strong>.
                                </p>

                                <div className="bg-white rounded-lg p-4 mb-4">
                                  <p className="text-gray-700 leading-relaxed text-sm">
                                    {selectedCallAnalysis.analysis_data.summary}
                                  </p>
                                </div>

                                {/* Strengths */}
                                {selectedCallAnalysis.analysis_data.strengths && selectedCallAnalysis.analysis_data.strengths.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4" />
                                      Dit ging goed:
                                    </h4>
                                    <ul className="space-y-1.5">
                                      {selectedCallAnalysis.analysis_data.strengths.map((strength: string, index: number) => (
                                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                          <span className="text-green-600 mt-0.5">✓</span>
                                          <span>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Improvements */}
                                {selectedCallAnalysis.analysis_data.improvements && selectedCallAnalysis.analysis_data.improvements.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                                      <TrendingUp className="w-4 h-4" />
                                      Dit kan beter:
                                    </h4>
                                    <ul className="space-y-1.5">
                                      {selectedCallAnalysis.analysis_data.improvements.map((improvement: string, index: number) => (
                                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                          <span className="text-orange-600 mt-0.5">→</span>
                                          <span>{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                                <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                                  <AlertCircle className="w-5 h-5" />
                                  <span className="text-sm font-medium">Nog geen analyse beschikbaar</span>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                  De AI-analyse wordt automatisch uitgevoerd zodra het transcript beschikbaar is
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Recording Link */}
                          {selectedCall.recording_url && (
                            <div className="mb-6">
                              <a
                                href={selectedCall.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Bekijk opname in Fathom
                              </a>
                            </div>
                          )}

                          {/* Category Scores */}
                          {selectedCallAnalysis?.analysis_data?.categories && selectedCallAnalysis.analysis_data.categories.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gedetailleerde Scores</h3>
                              <div className="grid grid-cols-1 gap-3">
                                {selectedCallAnalysis.analysis_data.categories.map((category: any, index: number) => {
                                  const score = category.score
                                  const getRating = (score: number) => {
                                    if (score >= 80) return { color: 'bg-green-100 text-green-700 border-green-200' }
                                    if (score >= 50) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
                                    return { color: 'bg-red-100 text-red-700 border-red-200' }
                                  }
                                  const rating = getRating(score)

                                  return (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${rating.color}`}>
                                          {category.score}/100
                                        </span>
                                      </div>
                                      {category.feedback && (
                                        <p className="text-sm text-gray-600">{category.feedback}</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teams Modal */}
      {showEditTeamsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Bewerk Fathom Teams</h2>
                <button
                  onClick={() => setShowEditTeamsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecteer Teams
                    <span className="text-gray-400 font-normal ml-1">
                      - Kies welke teams te importeren
                    </span>
                  </label>

                  {loadingTeams ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Teams laden...
                    </div>
                  ) : availableTeams.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {availableTeams.map((team) => (
                          <button
                            key={team}
                            type="button"
                            onClick={() => toggleTeam(team)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedTeams.includes(team)
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300 hover:bg-indigo-200'
                                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            {selectedTeams.includes(team) && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {team}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedTeams.length === 0 ? (
                          '💡 Geen team geselecteerd = import uit alle teams'
                        ) : (
                          `✓ Import alleen uit: ${selectedTeams.join(', ')}`
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">Geen teams gevonden</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditTeamsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={saveTeams}
                    disabled={savingTeams}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingTeams ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
