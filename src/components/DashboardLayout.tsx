'use client'

import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-20 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
