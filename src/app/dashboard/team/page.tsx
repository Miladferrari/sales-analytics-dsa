'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import { SalesRep } from '@/types'
import { User, Search, Clock, Mail, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

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
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([])

  function showToast(type: 'success' | 'error' | 'info', message: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  useEffect(() => {
    loadUser()
    loadReps()
    loadArchivedCount()
  }, [])

  // Load available Fathom teams when modal opens
  useEffect(() => {
    if (showAddModal) {
      loadFathomTeams()
    }
  }, [showAddModal])

  async function loadFathomTeams() {
    setLoadingTeams(true)
    try {
      const response = await fetch('/api/fathom/teams')
      const data = await response.json()
      if (data.success) {
        setAvailableTeams(data.teams)
      }
    } catch (error) {
      console.error('Error loading Fathom teams:', error)
    } finally {
      setLoadingTeams(false)
    }
  }

  function toggleTeam(team: string) {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    )
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Afbeelding te groot. Maximaal 5MB toegestaan.')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Alleen afbeeldingen zijn toegestaan.')
        return
      }

      setProfileImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeProfileImage() {
    setProfileImage(null)
    setProfileImagePreview(null)
  }

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
        showToast('error', 'Vul een geldig email adres in')
        setAddLoading(false)
        return
      }

      // Validate name
      if (!formData.name || formData.name.trim().length < 2) {
        showToast('error', 'Vul een geldige naam in (minimaal 2 karakters)')
        setAddLoading(false)
        return
      }

      let profileImageUrl = null

      // Upload profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('sales-rep-avatars')
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          showToast('error', 'Fout bij uploaden profielfoto')
          setAddLoading(false)
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('sales-rep-avatars')
          .getPublicUrl(filePath)

        profileImageUrl = publicUrl
      }

      const { data, error } = await supabase
        .from('sales_reps')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          qualification_status: 'unqualified',
          fathom_teams: selectedTeams,
          profile_image_url: profileImageUrl,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '23505') {
          showToast('error', 'Deze email bestaat al in het systeem')
        } else {
          showToast('error', 'Fout bij toevoegen medewerker: ' + error.message)
        }
        return
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
      })
      setProfileImage(null)
      setProfileImagePreview(null)
      setSelectedTeams([])
      setShowAddModal(false)

      // Reload reps list
      await loadReps()

      showToast('success', `Medewerker succesvol toegevoegd! Deze medewerker kan nu Fathom calls opnemen en die worden automatisch geïmporteerd.`)
    } catch (error) {
      console.error('Error adding member:', error)
      showToast('error', 'Er is een fout opgetreden bij het toevoegen van de medewerker.')
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
      <div className="p-4 sm:p-6">
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
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group relative">
                  {/* 3-dots menu */}
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {/* Vertical Centered Layout */}
                  <div className="flex flex-col items-center text-center">
                    {/* Large Avatar */}
                    <div className="relative mb-4">
                      {rep.profile_image_url ? (
                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-2 border-gray-200">
                          <img
                            src={rep.profile_image_url}
                            alt={rep.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg ${
                          rep.qualification_status === 'qualified'
                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                        }`}>
                          {rep.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {rep.name}
                    </h3>

                    {/* Email */}
                    <p className="text-sm text-gray-500 mb-4 truncate max-w-full px-2">
                      {rep.email}
                    </p>

                    {/* Progress Bar - Score Indicator */}
                    <div className="w-full mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="flex h-full">
                            {/* Calls Progress - Blue */}
                            <div
                              className="bg-indigo-500 transition-all"
                              style={{ width: `${Math.min((rep.totalCalls / 20) * 40, 40)}%` }}
                            ></div>
                            {/* Score Progress - Purple/Amber based on score */}
                            <div
                              className={`transition-all ${rep.averageScore >= 70 ? 'bg-purple-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min((rep.averageScore / 100) * 35, 35)}%` }}
                            ></div>
                            {/* Qualification Status - Green/Red */}
                            <div
                              className={`transition-all ${
                                rep.qualification_status === 'qualified' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: '25%' }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="font-medium">{rep.totalCalls}</span>
                          <span className="text-gray-500">calls</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${rep.averageScore >= 70 ? 'bg-purple-500' : 'bg-amber-500'}`}></div>
                          <span className="font-medium">{rep.averageScore || 0}</span>
                          <span className="text-gray-500">score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {rep.qualification_status === 'qualified' ? (
                            <>
                              <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-emerald-600 font-semibold text-[11px]">Q</span>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-rose-600 font-semibold text-[11px]">NQ</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role/Status */}
                    <div className={`text-xs font-semibold tracking-wider uppercase ${
                      rep.qualification_status === 'qualified'
                        ? 'text-emerald-600'
                        : 'text-gray-600'
                    }`}>
                      {rep.qualification_status === 'qualified' ? 'QUALIFIED' : 'SALES REP'}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
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

                {/* Profile Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profielfoto <span className="text-gray-400 text-xs font-normal">(Optioneel)</span>
                  </label>
                  <div className="flex items-start gap-5">
                    {/* Preview Circle */}
                    <div className="flex-shrink-0">
                      {profileImagePreview ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-white ring-2 ring-indigo-100 group">
                          <img
                            src={profileImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeProfileImage}
                            className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 flex items-center justify-center shadow-md border-4 border-white ring-2 ring-gray-100">
                          <svg className="w-12 h-12 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Upload Info & Button */}
                    <div className="flex-1 pt-1">
                      <label className="cursor-pointer group">
                        <div className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-300 transition-all text-sm font-semibold text-indigo-700 group-hover:shadow-md">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Profielfoto
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Ondersteunde formaten: JPG, PNG, GIF<br />
                        Maximale bestandsgrootte: 5MB
                      </p>
                    </div>
                  </div>
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

                {/* Fathom Teams Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fathom Teams (optioneel)
                    <span className="text-gray-400 font-normal ml-1">
                      - Selecteer teams voor call import
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
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <p className="text-sm text-gray-500 py-2">
                      Geen teams gevonden
                    </p>
                  )}
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

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border-2 min-w-[300px] max-w-md animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-900'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
            {toast.type === 'error' && (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            {toast.type === 'info' && (
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
