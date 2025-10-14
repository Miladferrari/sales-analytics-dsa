'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { getUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Users, Mail, UserPlus, Trash2, User, Eye, EyeOff } from 'lucide-react'

interface SyncResult {
  success: boolean
  processed: number
  imported: number
  skipped: number
  errors: number
  lastSyncTime: string
  duration_ms: number
  message?: string
}

interface CRMUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  role?: string
  status?: 'active' | 'invited'
  last_sign_in_at?: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Settings Navigation State
  const [activeTab, setActiveTab] = useState<'sync' | 'users'>('sync')

  // User Management State
  const [users, setUsers] = useState<CRMUser[]>([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    adminPassword: ''
  })

  useEffect(() => {
    loadUser()
    loadLastSyncTime()
    loadUsers()
  }, [])

  async function loadUser() {
    try {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadLastSyncTime() {
    try {
      // Try to get last sync from localStorage as cache
      const cached = localStorage.getItem('lastFathomSync')
      if (cached) {
        setLastSyncTime(cached)
      }
    } catch (error) {
      console.error('Error loading last sync time:', error)
    }
  }

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      console.log('🔄 Loading users from API...')
      // Get all users via API endpoint (server-side can use admin methods)
      const response = await fetch('/api/users/list')
      const data = await response.json()

      console.log('📊 API Response:', data)

      if (data.success && data.users) {
        console.log(`✅ Loaded ${data.users.length} users`)
        setUsers(data.users)
      } else {
        console.warn('⚠️ API call unsuccessful, using fallback')
        // Fallback: just show current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', currentUser.id)
            .single()

          setUsers([{
            id: currentUser.id,
            email: currentUser.email || '',
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            created_at: new Date().toISOString(),
            role: currentUser.user_metadata?.role || 'admin',
            status: 'active' // Current user is always active
          }])
        }
      }
    } catch (error) {
      console.error('❌ Error loading users:', error)
      // Final fallback: show current user from state
      if (user) {
        setUsers([{
          id: user.id,
          email: user.email || '',
          first_name: null,
          last_name: null,
          created_at: new Date().toISOString(),
          role: 'admin',
          status: 'active'
        }])
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  function closeAddUserModal() {
    setShowAddUserModal(false)
    setShowPassword(false)
    setAddUserError(null)
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      adminPassword: ''
    })
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setAddingUser(true)
    setAddUserError(null)

    try {
      // Validate fields
      if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
        setAddUserError('⚠️ Vul een geldige voor- en achternaam in')
        setAddingUser(false)
        return
      }

      if (!newUser.email.includes('@')) {
        setAddUserError('⚠️ Vul een geldig email adres in')
        setAddingUser(false)
        return
      }

      if (!newUser.adminPassword) {
        setAddUserError('⚠️ Vul je wachtwoord in ter verificatie')
        setAddingUser(false)
        return
      }

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setAddUserError('❌ Geen geldige sessie. Log opnieuw in.')
        setAddingUser(false)
        return
      }

      // Call API to create user and send invitation
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          firstName: newUser.firstName.trim(),
          lastName: newUser.lastName.trim(),
          email: newUser.email.toLowerCase().trim(),
          adminPassword: newUser.adminPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        setAddUserError(data.error || 'Fout bij toevoegen gebruiker')
        setAddingUser(false)
        return
      }

      // Success!
      alert(`✅ Gebruiker succesvol toegevoegd!\n\n📧 Een uitnodigingsmail is gestuurd naar ${newUser.email}\n\n💡 De gebruiker kan hun wachtwoord instellen via de link in de email.`)

      // Reset form and close modal
      closeAddUserModal()

      // Reload users list
      await loadUsers()

    } catch (error) {
      console.error('Error adding user:', error)
      setAddUserError(error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setAddingUser(false)
    }
  }

  async function handleSync(hours: number) {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch(`/api/cron/sync-fathom?hours=${hours}`, {
        method: 'POST',
      })

      const data = await response.json()
      setSyncResult(data)

      if (data.success) {
        setLastSyncTime(data.lastSyncTime || new Date().toISOString())
        localStorage.setItem('lastFathomSync', data.lastSyncTime || new Date().toISOString())
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncResult({
        success: false,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 1,
        lastSyncTime: new Date().toISOString(),
        duration_ms: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSyncing(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Zojuist'
    if (diffMins < 60) return `${diffMins} minuten geleden`
    if (diffHours < 24) return `${diffHours} uur geleden`
    if (diffDays < 7) return `${diffDays} dagen geleden`

    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Instellingen laden...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const settingsMenu = [
    { id: 'sync' as const, label: 'Fathom Sync', icon: RefreshCw, color: 'indigo' },
    { id: 'users' as const, label: 'Gebruikersbeheer', icon: Users, color: 'green' },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Instellingen</h1>
            <p className="text-xs sm:text-sm text-gray-500">Beheer je CRM configuratie en integraties</p>
          </div>

          {/* Settings Container with Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left Sidebar Navigation */}
              <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                <div className="p-4">
                  <nav className="space-y-1">
                    {settingsMenu.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id

                      // Define colors based on item type
                      const activeColors = item.id === 'sync'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-green-50 text-green-700 border border-green-200'

                      const iconColor = item.id === 'sync'
                        ? 'text-indigo-600'
                        : 'text-green-600'

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? activeColors
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? iconColor : 'text-gray-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 min-w-0">

                {/* Fathom Sync Content */}
                {activeTab === 'sync' && (
                  <div>
                    <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Fathom Sync</h2>
                          <p className="text-xs sm:text-sm text-gray-600">Synchroniseer calls van Fathom naar je CRM</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
              {/* Last Sync Info */}
              {lastSyncTime && (
                <div className="mb-5 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Laatste sync: {formatDate(lastSyncTime)}</span>
                </div>
              )}

              {/* Sync Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
                {/* Quick Sync - 24 hours */}
                <button
                  onClick={() => handleSync(24)}
                  disabled={syncing}
                  className="group relative p-5 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      24 uur
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Quick Sync</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Importeer calls van de laatste 24 uur. Ideaal voor dagelijkse sync.
                  </p>
                </button>

                {/* Full Resync - 30 days */}
                <button
                  onClick={() => handleSync(720)}
                  disabled={syncing}
                  className="group relative p-5 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-purple-600 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      30 dagen
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Full Resync</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Importeer calls van de laatste 30 dagen. Gebruik na team wijzigingen.
                  </p>
                </button>
              </div>

              {/* Sync Status */}
              {syncing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Synchroniseren...</p>
                    <p className="text-xs text-blue-700">Dit kan even duren, even geduld</p>
                  </div>
                </div>
              )}

              {/* Sync Result */}
              {syncResult && !syncing && (
                <div className={`rounded-lg p-4 border ${
                  syncResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {syncResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium mb-2 ${
                        syncResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {syncResult.success ? 'Sync succesvol!' : 'Sync mislukt'}
                      </p>

                      {syncResult.success && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Verwerkt:</span>
                            <span className="ml-1 font-semibold text-gray-900">{syncResult.processed}</span>
                          </div>
                          <div>
                            <span className="text-green-600">Geïmporteerd:</span>
                            <span className="ml-1 font-semibold text-green-700">{syncResult.imported}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Geskipped:</span>
                            <span className="ml-1 font-semibold text-amber-700">{syncResult.skipped}</span>
                          </div>
                          <div>
                            <span className="text-red-600">Errors:</span>
                            <span className="ml-1 font-semibold text-red-700">{syncResult.errors}</span>
                          </div>
                        </div>
                      )}

                      {syncResult.message && (
                        <p className="text-xs text-gray-600 mt-2">{syncResult.message}</p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Voltooid in {(syncResult.duration_ms / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>
              )}

                      {/* Info Box */}
                      <div className="mt-5 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Over Fathom Sync</p>
                            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                              <li>Alleen calls van actieve sales reps worden geïmporteerd</li>
                              <li>Calls met 2+ deelnemers (of meerdere speakers in transcript)</li>
                              <li>Team restrictions worden gerespecteerd</li>
                              <li>Duplicate calls worden automatisch geskipped</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management Content */}
                {activeTab === 'users' && (
                  <div>
                    <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50 px-5 sm:px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Gebruikersbeheer</h2>
                            <p className="text-xs sm:text-sm text-gray-600">Beheer toegang tot je CRM ({users.length} gebruiker{users.length !== 1 ? 's' : ''})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={loadUsers}
                            disabled={loadingUsers}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            title="Lijst verversen"
                          >
                            <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Ververs</span>
                          </button>
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Gebruiker Toevoegen</span>
                            <span className="sm:hidden">+</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
              {/* Users List */}
              {loadingUsers ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Gebruikers laden...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Geen gebruikers gevonden</p>
                  <button
                    onClick={loadUsers}
                    className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Probeer opnieuw
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`group relative flex items-center justify-between p-5 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 ${
                        u.status === 'invited' ? 'hover:border-amber-300' : 'hover:border-green-300'
                      }`}
                    >
                      {/* Left side - User Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar with status ring */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 ${
                            u.status === 'invited'
                              ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                              : 'bg-gradient-to-br from-green-400 to-teal-600'
                          }`}>
                            <span className="text-white font-bold text-base">
                              {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {/* Status indicator */}
                          {u.status === 'active' ? (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                          ) : (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-base font-semibold text-gray-900 truncate transition-colors ${
                              u.status === 'invited' ? 'group-hover:text-amber-700' : 'group-hover:text-green-700'
                            }`}>
                              {u.first_name && u.last_name
                                ? `${u.first_name} ${u.last_name}`
                                : u.email}
                            </p>
                            {u.role === 'admin' && (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full border border-indigo-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                Admin
                              </span>
                            )}
                            {u.status === 'invited' && (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full border border-amber-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Uitnodiging verzonden
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-normal text-gray-600">{u.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex items-center gap-2">
                        {u.id === user?.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-green-700 px-2.5 py-1.5 bg-green-100 rounded-lg border border-green-200">
                              Dit ben jij
                            </span>
                            <button
                              onClick={() => router.push('/dashboard/profile')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-sm hover:shadow-md"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Ga naar profiel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {u.status === 'invited' && (
                              <button
                                className="px-3 py-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 text-xs font-medium border border-amber-200 hover:border-amber-300"
                                title="Uitnodiging opnieuw versturen"
                                onClick={() => alert('Uitnodiging opnieuw versturen functionaliteit komt binnenkort!')}
                              >
                                Opnieuw versturen
                              </button>
                            )}
                            <button
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group/btn"
                              title="Verwijder gebruiker"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Hover gradient overlay */}
                      <div className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 ${
                        u.status === 'invited'
                          ? 'bg-gradient-to-r from-amber-50/0 to-orange-50/0 group-hover:from-amber-50/50 group-hover:to-orange-50/50'
                          : 'bg-gradient-to-r from-green-50/0 to-teal-50/0 group-hover:from-green-50/50 group-hover:to-teal-50/50'
                      }`}></div>
                    </div>
                  ))}
                </div>
              )}

                      {/* Info Box */}
                      <div className="mt-5 sm:mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-green-900">
                            <p className="font-medium mb-1">Over Gebruikersbeheer</p>
                            <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                              <li>Nieuwe gebruikers ontvangen een uitnodigingsmail met reset password link</li>
                              <li>Gebruikers moeten hun eigen wachtwoord instellen bij eerste login</li>
                              <li>Je wachtwoord is vereist om nieuwe gebruikers toe te voegen (beveiliging)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Gebruiker Toevoegen</h2>
                <button
                  onClick={closeAddUserModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Voeg een nieuwe gebruiker toe aan je CRM</p>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {/* Error Message */}
              {addUserError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{addUserError}</p>
                </div>
              )}

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="bijv. Jan"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="bijv. de Vries"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="bijv. jan@bedrijf.nl"
                />
                <p className="text-xs text-gray-500 mt-1">
                  📧 Er wordt een uitnodigingsmail gestuurd naar dit adres
                </p>
              </div>

              {/* Admin Password Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jouw Wachtwoord (verificatie) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newUser.adminPassword}
                    onChange={(e) => setNewUser({ ...newUser, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Vul je wachtwoord in"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Ter beveiliging vereist voor het toevoegen van nieuwe gebruikers
                </p>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Let op:</strong> De nieuwe gebruiker ontvangt een email met een link om hun wachtwoord in te stellen.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={addingUser}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Toevoegen...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Gebruiker Toevoegen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
