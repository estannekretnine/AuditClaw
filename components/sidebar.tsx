'use client'

import { Building2, Users, Shield, ChevronDown, LogOut, Menu, X, Home, BarChart3, Upload } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import type { Korisnik } from '@/lib/types/database'

interface SidebarProps {
  user: Korisnik | null
  collapsed?: boolean
  onToggle?: () => void
}

export default function Sidebar({ user, collapsed = false, onToggle }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(true)
  const pathname = usePathname()

  const isAdmin = user?.stsstatus === 'admin' || user?.stsstatus === 'manager'
  const isAgent = user?.stsstatus === 'agent'

  const adminSubItems = [
    { id: 'korisnici', label: 'Korisnici', href: '/dashboard/korisnici', icon: Users },
    { id: 'ponude', label: 'Ponude', href: '/dashboard/ponude', icon: Home },
    { id: 'analitika', label: 'Analiza Logovanja', href: '/dashboard/analitika', icon: BarChart3 },
    { id: 'import-kupaca', label: 'Import kupaca', href: '/dashboard/import-kupaca', icon: Upload },
  ]

  // Agent vidi samo Ponude direktno (bez submenija)
  const agentItems = [
    { id: 'ponude', label: 'Ponude', href: '/dashboard/ponude', icon: Home },
  ]

  const menuItems = [
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      hasSubmenu: true,
      subItems: adminSubItems,
    }] : []),
  ]

  const isAdminActive = adminSubItems.some(item => pathname === item.href)

  async function handleLogout() {
    await logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/10"
        aria-label={isMobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
        type="button"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-gray-900 via-gray-900 to-black transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-all duration-300 ease-in-out min-h-screen lg:min-h-full flex flex-col border-r border-white/5`}
      >
        {/* Header */}
        <div className={`p-6 ${collapsed ? 'px-3 flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl tracking-tight">AuditClaw</h2>
                <p className="text-amber-400/80 text-xs font-medium">{isAgent ? 'Agent Panel' : 'Admin Panel'}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-5 pb-5">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">{(user.naziv || user.email || 'K')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.naziv || 'Korisnik'}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="px-5 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <ul className="space-y-2">
            {/* Dashboard link - samo za admin/manager */}
            {isAdmin && (
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    pathname === '/dashboard'
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-white border border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${pathname === '/dashboard' ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30' : 'bg-white/5'}`}>
                      <Building2 className={`w-4 h-4 ${pathname === '/dashboard' ? 'text-white' : ''}`} />
                    </div>
                    {!collapsed && <span className="font-medium">Dashboard</span>}
                  </div>
                </Link>
              </li>
            )}

            {/* Agent meni - samo Ponude direktno */}
            {isAgent && agentItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-white border border-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30' : 'bg-white/5'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      </div>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                  </Link>
                </li>
              )
            })}

            {/* Admin meni */}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'admin' && isAdminActive
              const isExpanded = item.id === 'admin' && isAdminOpen

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.id === 'admin') {
                        setIsAdminOpen(!isAdminOpen)
                      }
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-white border border-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                    type="button"
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30' : 'bg-white/5'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      </div>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!collapsed && item.hasSubmenu && (
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {!collapsed && item.hasSubmenu && isExpanded && (
                    <ul className="mt-2 ml-5 pl-4 border-l-2 border-amber-500/20 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubItemActive = pathname === subItem.href
                        
                        return (
                          <li key={subItem.id}>
                            <Link
                              href={subItem.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                isSubItemActive
                                  ? 'bg-white/10 text-amber-400'
                                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">{subItem.label}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer: Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200`}
            title={collapsed ? 'Odjavi se' : undefined}
            type="button"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-sm">Odjavi se</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
