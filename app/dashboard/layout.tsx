'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { Building2, Menu, LogOut, GraduationCap } from 'lucide-react'
import type { KorisnikProfile } from '@/lib/types/database'
import { logout, getCurrentUserProfile } from '@/lib/actions/auth'
import { logCurrentVapiPageVisit } from '@/lib/actions/vapi-user-log'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<KorisnikProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const lastLoggedPathRef = useRef<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('auditclaw-sidebar-collapsed')
    if (saved === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('auditclaw-sidebar-collapsed', String(next))
      return next
    })
  }

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
        void getCurrentUserProfile().then((result) => {
          if (result.data) {
            setUser(result.data)
          }
        })
      } catch {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    if (!user) return

    if (user.stsstatus === 'vapi') {
      if (pathname === '/dashboard') {
        router.replace('/dashboard/vapi/assistants')
        return
      }
      if (!pathname.startsWith('/dashboard/vapi') && pathname !== '/dashboard/log-vapi') {
        router.replace('/dashboard/vapi/assistants')
      }
      return
    }

    if (pathname.startsWith('/dashboard/vapi') && user.stsstatus === 'agent') {
      router.replace('/dashboard/ponude')
    }
  }, [pathname, router, user])

  useEffect(() => {
    if (!user || user.stsstatus !== 'vapi') return
    if (!(pathname.startsWith('/dashboard/vapi') || pathname === '/dashboard/log-vapi')) return
    if (lastLoggedPathRef.current === pathname) return

    lastLoggedPathRef.current = pathname
    void logCurrentVapiPageVisit(pathname)
  }, [pathname, user])

  async function handleLogout() {
    await logout()
  }

  const isAdmin = user?.stsstatus === 'admin' || user?.stsstatus === 'manager'
  const isVapi = user?.stsstatus === 'vapi'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar 
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        <header className="bg-white shadow-lg border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
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
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {isVapi ? 'Vapi Panel' : 'Admin Panel'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {isAdmin && (
                  <span className="text-xs bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-semibold border border-amber-300/50">
                    Admin
                  </span>
                )}
                {isVapi && (
                  <span className="text-xs bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 px-3 py-1.5 rounded-lg font-semibold border border-indigo-300/50">
                    Vapi
                  </span>
                )}
                <div className="flex flex-col sm:items-end min-w-0">
                  <span className="text-sm text-gray-600 truncate font-medium">
                    {user?.naziv || user?.email}
                  </span>
                  {isVapi && user?.profesorNaziv && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 truncate max-w-[220px]">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      {user.profesorNaziv}
                    </span>
                  )}
                </div>
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

        <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
