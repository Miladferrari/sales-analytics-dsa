'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/supabase/auth'
import { Activity } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
