'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, Settings, User, LogOut, Menu, X } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getUser } from '@/lib/supabase/auth'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    loadProfile()

    // Listen for profile photo updates
    const handleProfilePhotoUpdate = (event: any) => {
      setProfilePhoto(event.detail.photoUrl)
    }

    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate)

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate)
    }
  }, [])

  async function loadProfile() {
    try {
      const currentUser = await getUser()
      if (!currentUser) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, first_name')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        setProfilePhoto(profile.profile_photo_url || null)
        setFirstName(profile.first_name || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Team', path: '/dashboard/team' },
    { icon: Settings, label: 'Instellingen', path: '/dashboard/settings' },
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  const handleNavClick = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
      >
        {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full w-64 lg:w-20 bg-white border-r border-gray-200 flex flex-col py-6 shadow-xl lg:shadow-none">
          {/* Logo / Profile Photo */}
          <div className="mb-8 px-6 lg:px-0 lg:flex lg:justify-center">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
                </span>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 flex flex-col gap-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`relative w-full lg:w-12 h-12 rounded-lg flex items-center lg:justify-center px-4 lg:px-0 transition-all duration-200 group ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="lg:hidden ml-3 text-sm font-medium">{item.label}</span>

                  {/* Tooltip - Desktop only */}
                  <div className="hidden lg:block absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Divider */}
          <div className="w-10 h-px bg-gray-200 my-4 mx-auto lg:mx-3"></div>

          {/* User & Logout */}
          <div className="flex flex-col gap-2 px-3">
            <button
              onClick={() => handleNavClick('/dashboard/profile')}
              className={`relative w-full lg:w-12 h-12 rounded-lg flex items-center lg:justify-center px-4 lg:px-0 transition-all duration-200 group ${
                isActive('/dashboard/profile')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
              title="Profiel"
            >
              <User className="w-5 h-5 flex-shrink-0" />
              <span className="lg:hidden ml-3 text-sm font-medium">Profiel</span>
              <div className="hidden lg:block absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Profiel
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full lg:w-12 h-12 rounded-lg flex items-center lg:justify-center px-4 lg:px-0 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group relative"
              title="Uitloggen"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="lg:hidden ml-3 text-sm font-medium">Uitloggen</span>
              <div className="hidden lg:block absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Uitloggen
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
