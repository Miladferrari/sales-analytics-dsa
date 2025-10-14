'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import { SalesRep } from '@/types'
import { User, Search, Clock, Mail, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function TeamPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reps, setReps] = useState<
    Array<
      SalesRep & {
        totalCalls: number
        averageScore: number
        recentCallsCount: number
      }
    >
  >([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'qualified' | 'unqualified'>('all')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedCount, setArchivedCount] = useState(0)
  const [archivedReps, setArchivedReps] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  useEffect(() => {
    loadUser()
    loadReps()
    loadArchivedCount()
  }, [])

  async function loadArchivedCount() {
    try {
      const { count } = await supabase
        .from('sales_reps')
        .select('*', { count: 'exact', head: true })
        .not('archived_at', 'is', null)

      setArchivedCount(count || 0)
    } catch (error) {
      console.error('Error loading archived count:', error)
    }
  }

  async function loadArchivedReps() {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) {
        console.error('Error loading archived reps:', error)
      } else {
        setArchivedReps(data || [])
      }
    } catch (error) {
      console.error('Error loading archived reps:', error)
    }
  }

  async function loadUser() {
    try {
      const currentUser = await getUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    }
  }

  async function loadReps() {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select(
          `
          *,
          calls:calls!rep_id (
            id,
            date,
            analysis (
              framework_score
            )
          )
        `
        )
        .is('archived_at', null)
        .order('name')

      if (error) {
        console.error('Error loading reps:', error)
        // Fallback: load without calls if join fails
        const { data: simpleData } = await supabase
          .from('sales_reps')
          .select('*')
          .is('archived_at', null)
          .order('name')

        if (simpleData) {
          const repsWithStats = simpleData.map((rep: any) => ({
            ...rep,
            totalCalls: 0,
            averageScore: 0,
            recentCallsCount: 0,
          }))
          setReps(repsWithStats)
        }
        return
      }

      if (data) {
        const repsWithStats = data.map((rep: any) => {
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
    } catch (error) {
      console.error('Error loading reps:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)

    try {
      // Validate email
      if (!formData.email || !formData.email.includes('@')) {
        alert('Vul een geldig email adres in')
        setAddLoading(false)
        return
      }

      // Validate name
      if (!formData.name || formData.name.trim().length < 2) {
        alert('Vul een geldige naam in (minimaal 2 karakters)')
        setAddLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('sales_reps')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          qualification_status: 'unqualified',
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '23505') {
          alert('Deze email bestaat al in het systeem')
        } else {
          alert('Fout bij toevoegen medewerker: ' + error.message)
        }
        return
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
      })
      setShowAddModal(false)

      // Reload reps list
      await loadReps()

      alert(`✅ Medewerker succesvol toegevoegd!\n\n📧 Email: ${data.email}\n\n💡 Deze medewerker kan nu Fathom calls opnemen en die worden automatisch geïmporteerd in het CRM!`)
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Er is een fout opgetreden bij het toevoegen van de medewerker.')
    } finally {
      setAddLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50'
    if (score >= 70) return 'text-blue-600 bg-blue-50'
    if (score >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const filteredReps = reps.filter((rep) => {
    const matchesSearch =
      rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' || rep.qualification_status === filterStatus
    return matchesSearch && matchesStatus
  })

  const qualifiedCount = reps.filter((r) => r.qualification_status === 'qualified').length
  const unqualifiedCount = reps.filter((r) => r.qualification_status === 'unqualified').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Team laden...</p>
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
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Team</h1>
                <p className="text-xs sm:text-sm text-gray-500">Beheer je sales medewerkers</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="self-start sm:self-auto px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                + Medewerker Toevoegen
              </button>
            </div>
          </div>

          {/* Stats Overview - Dashboard Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Totaal Team</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">{reps.length}</span>
                <span className="text-sm text-gray-500">medewerkers</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {reps.length > 0 ? Math.round((qualifiedCount / reps.length) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Qualified</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-600">{qualifiedCount}</span>
                <span className="text-sm text-gray-500">van {reps.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  {reps.length > 0 ? Math.round((unqualifiedCount / reps.length) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Unqualified</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-amber-600">{unqualifiedCount}</span>
                <span className="text-sm text-gray-500">van {reps.length}</span>
              </div>
            </div>

            {/* Archief Card - Smaller & Clickable */}
            <button
              onClick={() => {
                setShowArchived(true)
                loadArchivedReps()
              }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4 hover:shadow-md hover:border-gray-400 transition-all text-left group"
            >
              <div className="flex items-center justify-center mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1 text-center">Archief</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-700">{archivedCount}</span>
              </div>
              <p className="text-xs text-gray-400 text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Klik om te bekijken
              </p>
            </button>
          </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek op naam of email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Alle ({reps.length})
              </button>
              <button
                onClick={() => setFilterStatus('qualified')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'qualified' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Qualified ({qualifiedCount})
              </button>
              <button
                onClick={() => setFilterStatus('unqualified')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'unqualified' ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Unqualified ({unqualifiedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Team Members - Profile Style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredReps.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Geen teamleden gevonden</p>
            </div>
          ) : (
            filteredReps.map((rep) => (
              <Link key={rep.id} href={`/dashboard/team/${rep.id}`}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base ${
                        rep.qualification_status === 'qualified'
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                          : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                      }`}>
                        {rep.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        rep.qualification_status === 'qualified' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        <span className="text-white text-[10px] font-bold">
                          {rep.qualification_status === 'qualified' ? '✓' : '!'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Status */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {rep.name}
                        </h3>
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          rep.qualification_status === 'qualified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rep.qualification_status === 'qualified' ? 'Qualified' : 'Unqualified'}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">Totaal:</span>
                          <span className="text-sm font-semibold text-gray-900">{rep.totalCalls}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">Week:</span>
                          <span className="text-sm font-semibold text-indigo-600">{rep.recentCallsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">Score:</span>
                          <span className={`text-sm font-semibold ${
                            rep.averageScore >= 70 ? 'text-emerald-600' : rep.averageScore > 0 ? 'text-amber-600' : 'text-gray-400'
                          }`}>
                            {rep.averageScore || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Medewerker Toevoegen</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Vul de gegevens in van de nieuwe medewerker</p>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-5">
              {/* Essential Fields Only */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volledige Naam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Bijv. Jan de Vries"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="bijv. jan@bedrijf.nl"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Gebruik het email adres waarmee deze persoon Fathom calls opneemt
                  </p>
                </div>

              </div>

              {/* Info Boxes */}
              <div className="space-y-3">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Fathom Koppeling</p>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Zodra deze sales rep Fathom calls opneemt met dit email, worden ze automatisch geïmporteerd!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Status: Unqualified</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Nieuwe medewerkers starten als "Unqualified" tot ze gekwalificeerd worden
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Toevoegen...' : 'Medewerker Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archief Modal */}
      {showArchived && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Gearchiveerde Medewerkers</h2>
                  <p className="text-sm text-gray-500 mt-1">{archivedCount} medewerkers in archief</p>
                </div>
                <button
                  onClick={() => setShowArchived(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {archivedCount === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p className="text-gray-500 text-sm">Geen gearchiveerde medewerkers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedReps.map((rep) => (
                    <Link
                      key={rep.id}
                      href={`/dashboard/team/${rep.id}`}
                      onClick={() => setShowArchived(false)}
                    >
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0 group-hover:from-gray-400 group-hover:to-gray-500 transition-all">
                              <span className="text-white font-semibold text-sm">
                                {rep.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </span>
                            </div>

                            {/* Info */}
                            <div>
                              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{rep.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-sm text-gray-500">{rep.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Archived Date + Arrow */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Gearchiveerd</p>
                              <p className="text-xs text-gray-600">
                                {new Date(rep.archived_at).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
