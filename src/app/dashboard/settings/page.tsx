'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { getUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Users, Mail, UserPlus, Trash2, User, Eye, EyeOff, Save, HelpCircle, Plug2 } from 'lucide-react'

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

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Settings Navigation State
  const [activeTab, setActiveTab] = useState<'sync' | 'users' | 'connection' | 'faq'>('sync')

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

  // Delete User State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<CRMUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Resend Invitation State
  const [resending, setResending] = useState<string | null>(null) // stores user ID being processed

  // Sync Voorkeur State
  const [defaultSyncHours, setDefaultSyncHours] = useState<number>(24) // 24, 168 (7 days), or 720 (30 days)
  const [savingSyncPreference, setSavingSyncPreference] = useState(false)
  const [showManualSync, setShowManualSync] = useState(false) // Toggle for manual sync section

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([])

  // Fathom Configuration State
  const [fathomConfig, setFathomConfig] = useState<any>(null)
  const [loadingFathomConfig, setLoadingFathomConfig] = useState(false)
  const [fathomApiKey, setFathomApiKey] = useState('')
  const [fathomWebhookSecret, setFathomWebhookSecret] = useState('')
  const [showFathomApiKey, setShowFathomApiKey] = useState(false)
  const [showFathomWebhookSecret, setShowFathomWebhookSecret] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [savingFathomConfig, setSavingFathomConfig] = useState(false)
  const [fathomTestResult, setFathomTestResult] = useState<{ success: boolean; message: string } | null>(null)

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
    loadLastSyncTime()
    loadUsers()
    loadSyncPreference()
  }, [])

  // Load Fathom config when connection tab is active
  useEffect(() => {
    if (activeTab === 'connection') {
      loadFathomConfig()
    }
  }, [activeTab])

  function loadSyncPreference() {
    const savedPreference = localStorage.getItem('fathomSyncPeriod')
    if (savedPreference) {
      setDefaultSyncHours(parseInt(savedPreference))
    }
  }

  function saveSyncPreference() {
    setSavingSyncPreference(true)
    try {
      localStorage.setItem('fathomSyncPeriod', defaultSyncHours.toString())
      const label = defaultSyncHours === 24 ? '24 uur' : defaultSyncHours === 168 ? '7 dagen' : '30 dagen'
      showToast('success', `Sync voorkeur opgeslagen: ${label}`)
    } catch (error) {
      console.error('Error saving sync preference:', error)
      showToast('error', 'Fout bij opslaan voorkeur')
    } finally {
      setSavingSyncPreference(false)
    }
  }

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
      showToast('success', `Gebruiker succesvol toegevoegd! Een uitnodigingsmail is gestuurd naar ${newUser.email}`)

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

  function openDeleteModal(user: CRMUser) {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  function closeDeleteModal() {
    setUserToDelete(null)
    setShowDeleteModal(false)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return

    setDeleting(true)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('error', 'Geen geldige sessie. Log opnieuw in.')
        setDeleting(false)
        return
      }

      // Call API to delete user
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || 'Fout bij verwijderen gebruiker')
        setDeleting(false)
        return
      }

      // Success! First remove from local state (optimistic update)
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id))

      // Close modal
      closeDeleteModal()

      // Show success message
      showToast('success', `Gebruiker ${userToDelete.email} succesvol verwijderd!`)

      // Reload users list from server to ensure sync
      await loadUsers()

    } catch (error) {
      console.error('Error deleting user:', error)
      showToast('error', error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setDeleting(false)
    }
  }

  async function handleResendInvitation(user: CRMUser) {
    setResending(user.id)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('error', 'Geen geldige sessie. Log opnieuw in.')
        setResending(null)
        return
      }

      // Call API to resend invitation
      const response = await fetch(`/api/users/${user.id}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data.error || 'Fout bij versturen uitnodiging')
        setResending(null)
        return
      }

      // Success!
      showToast('success', `Uitnodiging succesvol opnieuw verstuurd naar ${data.email}!`)

    } catch (error) {
      console.error('Error resending invitation:', error)
      showToast('error', error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden')
    } finally {
      setResending(null)
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

  async function loadFathomConfig() {
    setLoadingFathomConfig(true)
    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('error', 'Geen geldige sessie. Log opnieuw in.')
        setLoadingFathomConfig(false)
        return
      }

      const response = await fetch('/api/settings/fathom', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        setFathomConfig(data)
        // Set form values (use full values for editing)
        setFathomApiKey(data.apiKeyFull || '')
        setFathomWebhookSecret(data.webhookSecretFull || '')
      } else {
        showToast('error', 'Kon configuratie niet laden')
      }
    } catch (error) {
      console.error('Error loading Fathom config:', error)
      showToast('error', 'Fout bij laden configuratie')
    } finally {
      setLoadingFathomConfig(false)
    }
  }

  async function handleTestFathomConnection() {
    if (!fathomApiKey.trim()) {
      showToast('error', 'Vul eerst een API Key in')
      return
    }

    setTestingConnection(true)
    setFathomTestResult(null)

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('error', 'Geen geldige sessie. Log opnieuw in.')
        setTestingConnection(false)
        return
      }

      const response = await fetch('/api/settings/fathom/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ apiKey: fathomApiKey })
      })

      const data = await response.json()

      if (data.success) {
        setFathomTestResult({
          success: true,
          message: `${data.message} Team: ${data.teamName}`
        })
        showToast('success', 'Verbinding succesvol getest!')
      } else {
        setFathomTestResult({
          success: false,
          message: data.message || data.error || 'Verbinding mislukt'
        })
        showToast('error', 'Verbinding mislukt')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setFathomTestResult({
        success: false,
        message: 'Netwerk fout bij testen verbinding'
      })
      showToast('error', 'Fout bij testen verbinding')
    } finally {
      setTestingConnection(false)
    }
  }

  async function handleSaveFathomConfig() {
    if (!fathomApiKey.trim()) {
      showToast('error', 'API Key is verplicht')
      return
    }

    setSavingFathomConfig(true)

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('error', 'Geen geldige sessie. Log opnieuw in.')
        setSavingFathomConfig(false)
        return
      }

      const response = await fetch('/api/settings/fathom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          apiKey: fathomApiKey.trim(),
          webhookSecret: fathomWebhookSecret.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast('success', 'Configuratie opgeslagen!')
        // Reload config to show updated masked values
        await loadFathomConfig()
      } else {
        showToast('error', data.message || 'Opslaan mislukt')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      showToast('error', 'Fout bij opslaan configuratie')
    } finally {
      setSavingFathomConfig(false)
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
    { id: 'connection' as const, label: 'Fathom Koppeling', icon: Plug2, color: 'purple' },
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle, color: 'blue' },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-1">Instellingen</h1>
            <p className="text-xs sm:text-sm text-gray-500">Beheer je CRM configuratie en integraties</p>
          </div>

          {/* Settings Container with Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar Navigation */}
              <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
                <div className="p-3 sm:p-4">
                  <nav className="flex lg:flex-col gap-2 lg:space-y-1 overflow-x-auto lg:overflow-x-visible">
                    {settingsMenu.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id

                      // Define colors based on item type
                      const activeColors = item.id === 'sync'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : item.id === 'users'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : item.id === 'connection'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'

                      const iconColor = item.id === 'sync'
                        ? 'text-indigo-600'
                        : item.id === 'users'
                        ? 'text-green-600'
                        : item.id === 'connection'
                        ? 'text-purple-600'
                        : 'text-blue-600'

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap lg:w-full ${
                            isActive
                              ? activeColors
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 ${isActive ? iconColor : 'text-gray-400'}`} />
                          <span className="hidden sm:inline">{item.label}</span>
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
                    <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Fathom Sync</h2>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">Synchroniseer calls van Fathom naar je CRM</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
              {/* Default Sync Periode Voorkeur */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Default Sync Periode</h3>
                    <p className="text-xs text-gray-600">
                      Deze instelling wordt gebruikt voor de "Ververs" knop op sales rep profielen
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={() => setDefaultSyncHours(24)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all text-left ${
                      defaultSyncHours === 24
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {defaultSyncHours === 24 && (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="font-semibold text-sm">24 Uur</span>
                    </div>
                    <p className="text-xs text-gray-600">Dagelijks</p>
                  </button>

                  <button
                    onClick={() => setDefaultSyncHours(168)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all text-left ${
                      defaultSyncHours === 168
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {defaultSyncHours === 168 && (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="font-semibold text-sm">7 Dagen</span>
                    </div>
                    <p className="text-xs text-gray-600">Wekelijks</p>
                  </button>

                  <button
                    onClick={() => setDefaultSyncHours(720)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all text-left ${
                      defaultSyncHours === 720
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {defaultSyncHours === 720 && (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="font-semibold text-sm">30 Dagen</span>
                    </div>
                    <p className="text-xs text-gray-600">Maandelijks</p>
                  </button>
                </div>

                <button
                  onClick={saveSyncPreference}
                  disabled={savingSyncPreference}
                  className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingSyncPreference ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Voorkeur Opslaan
                    </>
                  )}
                </button>
              </div>

              {/* Last Sync Info */}
              {lastSyncTime && (
                <div className="mb-5 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Laatste sync: {formatDate(lastSyncTime)}</span>
                </div>
              )}

              {/* Emergency/Backup Manual Sync - Collapsible */}
              <div className="mb-5 sm:mb-6">
                <button
                  onClick={() => setShowManualSync(!showManualSync)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">Fathom Sync Reset</h3>
                      <p className="text-xs text-gray-600">Bulk sync voor alle sales reps (noodoptie)</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showManualSync ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Manual Sync Section */}
                {showManualSync && (
                  <div className="mt-4 p-4 bg-orange-50/50 border-2 border-orange-200 rounded-lg">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <p className="text-xs font-semibold text-orange-900">Gebruik alleen bij problemen</p>
                      </div>
                      <p className="text-xs text-orange-800">
                        Deze sync importeert calls voor <strong>alle actieve sales reps</strong> in één keer.
                        Gebruik dit alleen na technische problemen of initiële setup.
                      </p>
                    </div>

              {/* Sync Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Quick Sync - 24 hours */}
                <button
                  onClick={() => handleSync(24)}
                  disabled={syncing}
                  className="group relative p-4 sm:p-5 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <RefreshCw className={`w-5 h-5 text-indigo-600 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      24u
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Quick Sync</h3>
                  <p className="text-xs text-gray-600">
                    Laatste 24 uur
                  </p>
                </button>

                {/* Weekly Sync - 7 days */}
                <button
                  onClick={() => handleSync(168)}
                  disabled={syncing}
                  className="group relative p-4 sm:p-5 border-2 border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <RefreshCw className={`w-5 h-5 text-teal-600 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                      7d
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Weekly Sync</h3>
                  <p className="text-xs text-gray-600">
                    Laatste 7 dagen
                  </p>
                </button>

                {/* Full Resync - 30 days */}
                <button
                  onClick={() => handleSync(720)}
                  disabled={syncing}
                  className="group relative p-4 sm:p-5 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <RefreshCw className={`w-5 h-5 text-purple-600 ${syncing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      30d
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Full Resync</h3>
                  <p className="text-xs text-gray-600">
                    Laatste 30 dagen
                  </p>
                </button>
              </div>

              {/* Sync Status */}
              {syncing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 mt-4">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Synchroniseren...</p>
                    <p className="text-xs text-blue-700">Dit kan even duren, even geduld</p>
                  </div>
                </div>
              )}

              {/* Sync Result */}
              {syncResult && !syncing && (
                <div className={`rounded-lg p-4 border mt-4 ${
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
                  </div>
                )}
              </div>

                    </div>
                  </div>
                )}

                {/* User Management Content */}
                {activeTab === 'users' && (
                  <div>
                    <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Gebruikersbeheer</h2>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Beheer toegang tot je CRM ({users.length} gebruiker{users.length !== 1 ? 's' : ''})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={loadUsers}
                            disabled={loadingUsers}
                            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Lijst verversen"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Ververs</span>
                          </button>
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            className="flex items-center justify-center gap-1.5 px-3 sm:px-3 lg:px-4 py-2.5 sm:py-2 bg-green-600 text-white text-sm sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                          >
                            <UserPlus className="w-5 h-5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Gebruiker Toevoegen</span>
                            <span className="sm:hidden">Toevoegen</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
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
                      className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 bg-white border-2 border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 ${
                        u.status === 'invited' ? 'hover:border-amber-200' : 'hover:border-green-200'
                      }`}
                    >
                      {/* Top section - User Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mb-3 sm:mb-0">
                        {/* Avatar with status ring */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-shadow duration-200 ${
                            u.status === 'invited'
                              ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                              : 'bg-gradient-to-br from-green-400 to-teal-600'
                          }`}>
                            <span className="text-white font-bold text-sm sm:text-base">
                              {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {/* Status indicator */}
                          {u.status === 'active' ? (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                          ) : (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-amber-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {u.first_name && u.last_name
                                ? `${u.first_name} ${u.last_name}`
                                : u.email}
                            </p>
                            {u.role === 'admin' && (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full border border-indigo-200 flex-shrink-0">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="hidden xs:inline">Admin</span>
                              </span>
                            )}
                            {u.status === 'invited' && (
                              <span className="flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full border border-amber-200 flex-shrink-0">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="hidden xs:inline">Uitnodiging</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <p className="text-xs sm:text-sm font-normal text-gray-600 truncate">{u.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom section - Actions */}
                      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                        {u.id === user?.id ? (
                          <>
                            <span className="text-xs font-medium text-green-700 px-2.5 py-1.5 bg-green-100 rounded-lg border border-green-200 text-center xs:text-left whitespace-nowrap">
                              Dit ben jij
                            </span>
                            <button
                              onClick={() => router.push('/dashboard/profile')}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Ga naar profiel</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                            {u.status === 'invited' && (
                              <button
                                className="px-3 py-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 text-xs font-medium border border-amber-200 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-center xs:text-left whitespace-nowrap"
                                title="Uitnodiging opnieuw versturen"
                                onClick={() => handleResendInvitation(u)}
                                disabled={resending === u.id}
                              >
                                {resending === u.id ? 'Versturen...' : 'Opnieuw versturen'}
                              </button>
                            )}
                            <button
                              className="flex items-center justify-center gap-1.5 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group/btn xs:w-auto"
                              title="Verwijder gebruiker"
                              onClick={() => openDeleteModal(u)}
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              <span className="xs:hidden text-xs font-medium text-red-600 group-hover/btn:text-red-700">Verwijderen</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subtle hover overlay */}
                      <div className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 ${
                        u.status === 'invited'
                          ? 'bg-gradient-to-r from-amber-50/0 to-orange-50/0 group-hover:from-amber-50/20 group-hover:to-orange-50/20'
                          : 'bg-gradient-to-r from-green-50/0 to-teal-50/0 group-hover:from-green-50/20 group-hover:to-teal-50/20'
                      }`}></div>
                    </div>
                  ))}
                </div>
              )}
                    </div>
                  </div>
                )}

                {/* Fathom Connection Content */}
                {activeTab === 'connection' && (
                  <div>
                    <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Plug2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Fathom Koppeling</h2>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">Configureer je Fathom API verbinding</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                      {/* Loading State */}
                      {loadingFathomConfig ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                          <p className="text-sm text-gray-600 font-medium">Configuratie laden...</p>
                        </div>
                      ) : (
                        <>
                          {/* Connection Status */}
                          {fathomConfig?.connectionStatus && (
                            <div className={`mb-6 p-3 sm:p-4 rounded-lg border ${
                              fathomConfig.connectionStatus === 'connected'
                                ? 'bg-green-50 border-green-200'
                                : fathomConfig.connectionStatus === 'error'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                {fathomConfig.connectionStatus === 'connected' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-900">Verbonden</span>
                                  </>
                                ) : fathomConfig.connectionStatus === 'error' ? (
                                  <>
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-900">Verbinding mislukt</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Nog niet geconfigureerd</span>
                                  </>
                                )}
                                {fathomConfig.lastTested && (
                                  <span className="text-xs text-gray-600 ml-auto">
                                    {formatDate(fathomConfig.lastTested)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* API Key Input */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              API Key <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showFathomApiKey ? "text" : "password"}
                                value={fathomApiKey}
                                onChange={(e) => setFathomApiKey(e.target.value)}
                                placeholder="Plak je Fathom API key hier..."
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFathomApiKey(!showFathomApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showFathomApiKey ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Webhook Secret Input */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Webhook Secret <span className="text-gray-400 text-xs">(Optioneel)</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showFathomWebhookSecret ? "text" : "password"}
                                value={fathomWebhookSecret}
                                onChange={(e) => setFathomWebhookSecret(e.target.value)}
                                placeholder="Optioneel..."
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFathomWebhookSecret(!showFathomWebhookSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showFathomWebhookSecret ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Test Result */}
                          {fathomTestResult && (
                            <div className={`mb-6 p-4 rounded-lg border ${
                              fathomTestResult.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-start gap-3">
                                {fathomTestResult.success ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                )}
                                <div>
                                  <p className={`text-sm font-medium ${
                                    fathomTestResult.success ? 'text-green-900' : 'text-red-900'
                                  }`}>
                                    {fathomTestResult.success ? 'Test Succesvol!' : 'Test Mislukt'}
                                  </p>
                                  <p className="text-xs text-gray-700 mt-1">
                                    {fathomTestResult.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={handleTestFathomConnection}
                              disabled={testingConnection || !fathomApiKey.trim()}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-300"
                            >
                              {testingConnection ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Testen...</span>
                                </>
                              ) : (
                                <>
                                  <Plug2 className="w-4 h-4" />
                                  <span>Test Verbinding</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={handleSaveFathomConfig}
                              disabled={savingFathomConfig || !fathomApiKey.trim()}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {savingFathomConfig ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Opslaan...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  <span>Opslaan</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Help Link */}
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setActiveTab('faq')}
                              className="text-xs text-gray-600 hover:text-purple-600 font-medium flex items-center gap-1.5 group transition-colors"
                            >
                              <HelpCircle className="w-4 h-4 group-hover:text-purple-600" />
                              <span>Hulp nodig met je API key?</span>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* FAQ Content */}
                {activeTab === 'faq' && (
                  <div>
                    <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">FAQ</h2>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">Veelgestelde vragen over de CRM</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* FAQ Item 0 - Fathom API Key */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Hoe krijg ik mijn Fathom API Key?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6 space-y-2">
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Log in op je Fathom account</li>
                              <li>Ga naar Settings → Integrations → API</li>
                              <li>Klik op "Generate API Key"</li>
                              <li>Kopieer de key en plak in Settings → Fathom Koppeling</li>
                              <li>Klik op "Test Verbinding" en daarna "Opslaan"</li>
                            </ol>
                            <a
                              href="https://help.fathom.video"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-blue-600 hover:text-blue-700 underline mt-2"
                            >
                              Meer info in Fathom Help Center →
                            </a>
                          </div>
                        </div>

                        {/* FAQ Item 1 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600 flex-shrink-0">Q:</span>
                            Hoe werkt Fathom Sync?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6 space-y-2">
                            <p><strong>Individueel syncen:</strong> Ga naar een sales rep profiel en klik op de "Ververs" knop. Deze gebruikt je opgeslagen default periode (24u, 7d of 30d).</p>
                            <p><strong>Bulk syncen (noodoptie):</strong> Ga naar Settings → Fathom Sync → klik op "Fathom Sync Reset" en kies 24u, 7d of 30d. Dit importeert calls voor alle actieve sales reps tegelijk.</p>
                          </div>
                        </div>

                        {/* FAQ Item 2 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600 flex-shrink-0">Q:</span>
                            Welke calls worden geïmporteerd?
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-700 pl-4 sm:pl-6">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Alleen calls van <strong>actieve sales reps</strong> (niet gearchiveerd)</li>
                              <li>Alleen calls uit het juiste <strong>Fathom team</strong> (indien geconfigureerd)</li>
                              <li><strong>Alle soorten calls</strong> - inclusief solo calls en 1-on-1 gesprekken</li>
                              <li>Duplicate calls worden automatisch geskipped</li>
                            </ul>
                          </div>
                        </div>

                        {/* FAQ Item 3 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Hoe stel ik mijn default sync periode in?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6">
                            <p>Ga naar Settings → Fathom Sync → kies "24 Uur", "7 Dagen" of "30 Dagen" in het bovenste blok → klik op "Voorkeur Opslaan". Deze instelling wordt automatisch gebruikt door alle "Ververs" knoppen.</p>
                          </div>
                        </div>

                        {/* FAQ Item 4 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Wat is het verschil tussen de sync periodes?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6">
                            <ul className="list-disc list-inside space-y-1">
                              <li><strong>24 uur:</strong> Snelle dagelijkse sync voor recente calls</li>
                              <li><strong>7 dagen:</strong> Wekelijkse sync voor calls van de afgelopen week</li>
                              <li><strong>30 dagen:</strong> Uitgebreide sync voor historische data of na team wijzigingen</li>
                            </ul>
                          </div>
                        </div>

                        {/* FAQ Item 5 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Hoe voeg ik een nieuwe gebruiker toe?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6">
                            <p>Ga naar Settings → Gebruikersbeheer → klik "Gebruiker Toevoegen". Vul de gegevens in en je eigen wachtwoord voor beveiliging. De nieuwe gebruiker ontvangt een uitnodigingsmail met een password reset link.</p>
                          </div>
                        </div>

                        {/* FAQ Item 6 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Kan ik gebruikers verwijderen?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6">
                            <p>Ja! Ga naar Settings → Gebruikersbeheer → klik op het prullenbak icoon naast de gebruiker → bevestig de actie. Let op: je kunt jezelf niet verwijderen.</p>
                          </div>
                        </div>

                        {/* FAQ Item 7 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">Q:</span>
                            Hoe configureer ik Fathom teams voor een sales rep?
                          </h3>
                          <div className="text-sm text-gray-700 pl-6">
                            <p>Ga naar het sales rep profiel → scroll naar "Fathom Team Configuratie" → voeg team namen toe (bijv. "Sales", "Support") → klik "Opslaan". Alleen calls uit deze teams worden geïmporteerd.</p>
                          </div>
                        </div>

                        {/* Help Section */}
                        <div className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 sm:p-5">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Meer hulp nodig?</h3>
                              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                                Staat je vraag er niet tussen? Neem contact op met de support voor hulp.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                  Contact Support
                                </button>
                                <a
                                  href="https://fathom.video/help"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors text-center"
                                >
                                  Fathom Help Center
                                </a>
                              </div>
                            </div>
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

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Gebruiker Verwijderen</h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={deleting}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Let Op!</p>
                    <p className="text-sm text-red-800">
                      Deze actie kan niet ongedaan worden gemaakt. De gebruiker wordt permanent verwijderd.
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Weet je zeker dat je de volgende gebruiker wilt verwijderen?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {userToDelete.first_name?.charAt(0) || userToDelete.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {userToDelete.first_name && userToDelete.last_name
                          ? `${userToDelete.first_name} ${userToDelete.last_name}`
                          : userToDelete.email}
                      </p>
                      <p className="text-xs text-gray-600">{userToDelete.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verwijderen...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ja, Verwijderen</span>
                    </>
                  )}
                </button>
              </div>
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
