'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { Building2, Menu, LogOut } from 'lucide-react'
import type { Korisnik } from '@/lib/types/database'
import { logout } from '@/lib/actions/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<Korisnik | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Čitanje korisnika iz cookie-a na klijentu
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const userCookie = getCookie('user')
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie))
        setUser(userData)
      } catch {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  async function handleLogout() {
    await logout()
  }

  const isAdmin = user?.stsstatus === 'admin' || user?.stsstatus === 'manager'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar 
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white shadow-lg border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2.5 bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-xl transition-all shadow-md hover:shadow-lg border border-white/10"
                  title={sidebarCollapsed ? 'Proširi navigaciju' : 'Smanji navigaciju'}
                >
                  <Menu className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl items-center justify-center shadow-md shadow-amber-500/20">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">AuditClaw</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">Admin Panel</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {isAdmin && (
                  <span className="text-xs bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-semibold border border-amber-300/50">
                    Admin
                  </span>
                )}
                <span className="text-sm text-gray-600 truncate font-medium">
                  {user?.naziv || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Odjavi se</span>
                  <span className="sm:hidden">Odjava</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
