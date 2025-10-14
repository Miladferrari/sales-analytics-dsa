'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { Camera, Mail, Lock, User as UserIcon, Save, X, Eye, EyeOff } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const currentUser = await getUser()
      setUser(currentUser)
      setEmail(currentUser?.email || '')

      // Load user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for new users
        console.error('Error loading profile:', profileError)
      }

      if (profile) {
        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
        setProfilePhoto(profile.profile_photo_url || null)
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ id: currentUser?.id, first_name: '', last_name: '' }])

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }
      }

    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const uploadPhoto = async (file: File) => {
    if (!user) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Bestand is te groot. Maximaal 2MB toegestaan.' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Alleen afbeeldingen zijn toegestaan.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // Delete old photo if exists
      if (profilePhoto) {
        const oldPath = profilePhoto.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfilePhoto(publicUrl)

      // Trigger realtime update by dispatching custom event
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl: publicUrl } }))

      setMessage({ type: 'success', text: 'Profielfoto succesvol bijgewerkt!' })
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      setMessage({ type: 'error', text: error.message || 'Er ging iets mis bij het uploaden van je foto' })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadPhoto(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadPhoto(file)
  }

  const handleRemovePhoto = async () => {
    if (!user || !profilePhoto) return

    setSaving(true)
    setMessage(null)

    try {
      // Extract file path from URL
      const filePath = profilePhoto.split('/avatars/')[1]

      if (filePath) {
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath])

        if (deleteError) throw deleteError
      }

      // Update database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_photo_url: null })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfilePhoto(null)

      // Trigger realtime update by dispatching custom event
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl: null } }))

      setMessage({ type: 'success', text: 'Profielfoto succesvol verwijderd!' })
    } catch (error: any) {
      console.error('Error removing photo:', error)
      setMessage({ type: 'error', text: error.message || 'Er ging iets mis bij het verwijderen van je foto' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      // Update profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Naam succesvol bijgewerkt!' })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Er ging iets mis bij het bijwerken van je profiel' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEmail = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ email })

      if (error) throw error

      setMessage({ type: 'success', text: 'Bevestigingsmail verstuurd naar je nieuwe email adres!' })
    } catch (error: any) {
      console.error('Error updating email:', error)
      setMessage({ type: 'error', text: error.message || 'Er ging iets mis bij het bijwerken van je email' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Wachtwoorden komen niet overeen' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 karakters zijn' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Wachtwoord succesvol gewijzigd!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: error.message || 'Er ging iets mis bij het wijzigen van je wachtwoord' })
    } finally {
      setSaving(false)
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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Profiel Instellingen</h1>
          <p className="text-xs sm:text-sm text-gray-500">Beheer je account instellingen en voorkeuren</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* 2-Column Grid Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Photo Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Profielfoto</h2>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-indigo-600" />
                      </div>
                    )}

                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={saving}
                      />
                    </label>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">
                      {isDragging ? 'Laat de foto hier los...' : 'Sleep een foto hierheen of klik op de camera'}
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG of GIF. Max 2MB.</p>
                  </div>

                  {profilePhoto && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={saving}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Foto verwijderen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Persoonlijke Informatie</h2>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voornaam
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="Voornaam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="Achternaam"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Email Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Email Adres</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="je@email.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Je ontvangt een bevestigingsmail op je nieuwe email adres
                </p>
              </div>

              <button
                onClick={handleUpdateEmail}
                disabled={saving || email === user?.email}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Opslaan...' : 'Email Bijwerken'}
              </button>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Wachtwoord Wijzigen</h2>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nieuw Wachtwoord
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bevestig Nieuw Wachtwoord
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Opslaan...' : 'Wachtwoord Wijzigen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
