'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Home, ArrowUp, ArrowDown, X, 
  Check, ChevronLeft, ChevronRight,
  Filter, LayoutGrid, LayoutList, Pencil, MoreVertical, Edit,
  Archive, ArchiveRestore
} from 'lucide-react'
import { getPonude, togglePonudaStatus, arhivirajPonuda, dearhivirajPonuda } from '@/lib/actions/ponude'
import type { Ponuda } from '@/lib/types/ponuda'
import type { Korisnik } from '@/lib/types/database'
import PonudaForm from '@/components/ponuda-form'

export default function PonudePage() {
  const [ponude, setPonude] = useState<Ponuda[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPonuda, setEditingPonuda] = useState<Ponuda | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [user, setUser] = useState<Korisnik | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  
  // Paginacija
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter za status (aktivne/arhivirane/sve)
  const [statusFilter, setStatusFilter] = useState<'aktivne' | 'arhivirane' | 'sve'>('aktivne')

  // Filteri za kolone
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    agencija_naziv: '',
    vrstaobjekta_ag: '',
    opstina_ag: '',
    lokacija_ag: '',
    adresa: '',
    kvadratura_ag: '',
    struktura_ag: '',
    cena_ag: ''
  })

  useEffect(() => {
    // Čitanje korisnika iz cookie-a
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
        console.error('Error parsing user cookie')
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadPonude()
    }
  }, [user])

  const isAdmin = user?.stsstatus === 'admin' || user?.stsstatus === 'manager'

  const loadPonude = async () => {
    try {
      setLoading(true)
      const { data, error } = await getPonude(user?.id, isAdmin)

      if (error) {
        alert('Greška pri učitavanju ponuda: ' + error)
        return
      }

      setPonude(data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (ponuda: Ponuda) => {
    const { error } = await togglePonudaStatus(ponuda.id, ponuda.stsaktivan)
    if (error) {
      alert('Greška pri promeni statusa: ' + error)
      return
    }
    loadPonude()
    setOpenActionMenu(null)
  }

  const handleArhiviraj = async (ponuda: Ponuda) => {
    if (ponuda.stsaktivan) {
      // Arhiviraj
      const { error } = await arhivirajPonuda(ponuda.id)
      if (error) {
        alert('Greška pri arhiviranju: ' + error)
        return
      }
    } else {
      // Dearhiviraj
      const { error } = await dearhivirajPonuda(ponuda.id)
      if (error) {
        alert('Greška pri dearhiviranju: ' + error)
        return
      }
    }
    loadPonude()
    setOpenActionMenu(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('sr-RS')
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block ml-1" />
    )
  }

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }))
    setCurrentPage(1)
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...ponude]

    // Primeni status filter
    if (statusFilter === 'aktivne') {
      data = data.filter(p => p.stsaktivan === true)
    } else if (statusFilter === 'arhivirane') {
      data = data.filter(p => p.stsaktivan === false || p.stsaktivan === null)
    }
    // 'sve' - ne filtrira

    // Primeni filtere kolona
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const filterLower = value.toLowerCase()
        data = data.filter((item) => {
          const itemValue = item[key as keyof Ponuda]
          if (itemValue === null || itemValue === undefined) return false
          
          // Za numerička polja, koristi >= filter
          if (['kvadratura_ag', 'struktura_ag', 'cena_ag'].includes(key)) {
            const numValue = Number(itemValue)
            const filterNum = Number(value)
            if (!isNaN(filterNum)) {
              return numValue >= filterNum
            }
          }
          
          return String(itemValue).toLowerCase().includes(filterLower)
        })
      }
    })

    // Sortiraj
    if (sortColumn) {
      data.sort((a, b) => {
        const aVal = a[sortColumn as keyof Ponuda]
        const bVal = b[sortColumn as keyof Ponuda]
        
        // Za numerička polja
        if (['id', 'kvadratura_ag', 'struktura_ag', 'cena_ag'].includes(sortColumn)) {
          const aNum = Number(aVal) || 0
          const bNum = Number(bVal) || 0
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        
        // Za datume
        if (sortColumn === 'created_at') {
          const aDate = new Date(aVal as string).getTime() || 0
          const bDate = new Date(bVal as string).getTime() || 0
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
        }
        
        // Za stringove
        const aStr = String(aVal || '').toLowerCase()
        const bStr = String(bVal || '').toLowerCase()
        if (sortDirection === 'asc') {
          return aStr > bStr ? 1 : aStr < bStr ? -1 : 0
        } else {
          return aStr < bStr ? 1 : aStr > bStr ? -1 : 0
        }
      })
    }

    return data
  }, [ponude, sortColumn, sortDirection, columnFilters, statusFilter])

  // Paginacija
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(start, start + itemsPerPage)
  }, [filteredAndSortedData, currentPage, itemsPerPage])

  const handleEdit = (ponuda: Ponuda) => {
    setEditingPonuda(ponuda)
    setShowForm(true)
    setOpenActionMenu(null)
  }

  const handleAdd = () => {
    setEditingPonuda(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPonuda(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPonuda(null)
    loadPonude()
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
          <Check className="w-3 h-3" /> Akt
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-600">
        Neakt
      </span>
    )
  }

  const getTipBadge = (tip: string | null) => {
    if (tip === 'prodaja' || tip === 'P') {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">
          P
        </span>
      )
    }
    if (tip === 'renta' || tip === 'R') {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
          R
        </span>
      )
    }
    return <span className="text-gray-400">-</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Ponude</h2>
          <p className="text-gray-500 mt-1">Upravljanje ponudama nekretnina</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj</span>
          </button>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => { setStatusFilter('aktivne'); setCurrentPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'aktivne' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Aktivne
        </button>
        <button
          onClick={() => { setStatusFilter('arhivirane'); setCurrentPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'arhivirane' 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Arhivirane
        </button>
        <button
          onClick={() => { setStatusFilter('sve'); setCurrentPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'sve' 
              ? 'bg-amber-100 text-amber-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sve
        </button>
      </div>

      {ponude.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema ponuda</p>
          <p className="text-gray-500 mb-6">Dodajte prvu ponudu</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj ponudu
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              {/* Header */}
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-1 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider w-14">FOTO</th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider w-14 cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID{getSortIcon('id')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('agencija_naziv')}>
                    <div className="flex items-center">AGENCIJA{getSortIcon('agencija_naziv')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('vrstaobjekta_ag')}>
                    <div className="flex items-center">VRSTA{getSortIcon('vrstaobjekta_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('opstina_ag')}>
                    <div className="flex items-center">OPŠTINA{getSortIcon('opstina_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('lokacija_ag')}>
                    <div className="flex items-center">LOKACIJA{getSortIcon('lokacija_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('adresa')}>
                    <div className="flex items-center">ULICA{getSortIcon('adresa')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider w-16 cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('kvadratura_ag')}>
                    <div className="flex items-center">M²{getSortIcon('kvadratura_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider w-12 cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('struktura_ag')}>
                    <div className="flex items-center">STR{getSortIcon('struktura_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('cena_ag')}>
                    <div className="flex items-center">CENA{getSortIcon('cena_ag')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">DATUM{getSortIcon('created_at')}</div>
                  </th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider w-16">STATUS</th>
                  <th className="px-2 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider w-12">TIP</th>
                  <th className="px-2 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              
              {/* Filter row */}
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-1 py-2"></th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.id}
                      onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                      placeholder=">"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.agencija_naziv}
                      onChange={(e) => handleColumnFilterChange('agencija_naziv', e.target.value)}
                      placeholder="*"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.vrstaobjekta_ag}
                      onChange={(e) => handleColumnFilterChange('vrstaobjekta_ag', e.target.value)}
                      placeholder="*"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.opstina_ag}
                      onChange={(e) => handleColumnFilterChange('opstina_ag', e.target.value)}
                      placeholder="*"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.lokacija_ag}
                      onChange={(e) => handleColumnFilterChange('lokacija_ag', e.target.value)}
                      placeholder="*"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.adresa}
                      onChange={(e) => handleColumnFilterChange('adresa', e.target.value)}
                      placeholder="*"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.kvadratura_ag}
                      onChange={(e) => handleColumnFilterChange('kvadratura_ag', e.target.value)}
                      placeholder=">"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.struktura_ag}
                      onChange={(e) => handleColumnFilterChange('struktura_ag', e.target.value)}
                      placeholder=">"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.cena_ag}
                      onChange={(e) => handleColumnFilterChange('cena_ag', e.target.value)}
                      placeholder=">"
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                  </th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              
              {/* Body */}
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((ponuda, index) => (
                  <tr 
                    key={ponuda.id} 
                    className="hover:bg-amber-50 border-l-2 border-l-transparent hover:border-l-amber-500 transition-all duration-200"
                  >
                    <td className="px-1 py-2 whitespace-nowrap">
                      {ponuda.glavna_foto_url ? (
                        <img 
                          src={ponuda.glavna_foto_url} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Home className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-amber-600 bg-amber-100 rounded">
                        {ponuda.id}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 truncate max-w-[120px]">
                      {ponuda.agencija_naziv || '-'}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-amber-500" />
                        <span className="truncate max-w-[100px]">{ponuda.vrstaobjekta_ag || '-'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 truncate max-w-[120px]">{ponuda.opstina_ag || '-'}</td>
                    <td className="px-2 py-3 text-sm text-gray-600 truncate max-w-[120px]">{ponuda.lokacija_ag || '-'}</td>
                    <td className="px-2 py-3 text-sm text-gray-600 truncate max-w-[120px]">{ponuda.adresa || '-'}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 font-medium">{formatNumber(ponuda.kvadratura_ag)}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 font-medium">{ponuda.struktura_ag || '-'}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 font-semibold">{formatNumber(ponuda.cena_ag)}</td>
                    <td className="px-2 py-3 text-sm text-gray-500">{formatDate(ponuda.created_at)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{getStatusBadge(ponuda.stsaktivan)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{getTipBadge(ponuda.stsrentaprodaja)}</td>
                    <td className="px-1 py-2 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionMenu(openActionMenu === ponuda.id ? null : ponuda.id)
                          }}
                          className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown meni - prikaži iznad za poslednja 2 reda */}
                        {openActionMenu === ponuda.id && (
                          <>
                            {/* Invisible overlay to close menu */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenActionMenu(null)}
                            />
                            <div className={`absolute right-0 w-36 bg-white rounded-lg shadow-2xl border border-gray-100 py-1 z-50 ${
                              index >= paginatedData.length - 2 
                                ? 'bottom-full mb-1' 
                                : 'top-full mt-1'
                            }`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(ponuda)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Izmeni
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArhiviraj(ponuda)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                {ponuda.stsaktivan ? (
                                  <>
                                    <Archive className="w-3 h-3" />
                                    Arhiviraj
                                  </>
                                ) : (
                                  <>
                                    <ArchiveRestore className="w-3 h-3" />
                                    Aktiviraj
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Prikaži</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>od {filteredAndSortedData.length} rezultata</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Strana {currentPage} od {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((ponuda) => (
            <div 
              key={ponuda.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              {/* Placeholder image */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                <Home className="w-12 h-12 text-gray-300" />
                <div className="absolute top-3 left-3">
                  {getTipBadge(ponuda.stsrentaprodaja)}
                </div>
                <div className="absolute top-3 right-3">
                  {getStatusBadge(ponuda.stsaktivan)}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-bold">
                  {formatNumber(ponuda.cena_ag)} €
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    #{ponuda.id}
                  </span>
                  <span className="text-xs text-gray-500">{ponuda.vrstaobjekta_ag}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {ponuda.lokacija_ag || ponuda.opstina_ag || 'Bez lokacije'}
                </h3>
                <p className="text-sm text-gray-500 truncate mb-3">{ponuda.adresa || '-'}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{formatNumber(ponuda.kvadratura_ag)} m²</span>
                  <span className="text-gray-600">{ponuda.struktura_ag || '-'} soba</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleEdit(ponuda)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowFilterModal(false) }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-white" />
                <h3 className="text-xl font-bold text-white">Filteri</h3>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-500 text-sm">Koristite filtere u header-u tabele za brzo pretraživanje.</p>
              <button
                onClick={() => {
                  setColumnFilters({
                    id: '',
                    agencija_naziv: '',
                    vrstaobjekta_ag: '',
                    opstina_ag: '',
                    lokacija_ag: '',
                    adresa: '',
                    kvadratura_ag: '',
                    struktura_ag: '',
                    cena_ag: ''
                  })
                  setShowFilterModal(false)
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Resetuj sve filtere
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ponuda Form Modal */}
      {showForm && (
        <PonudaForm
          ponuda={editingPonuda}
          userId={user?.id || null}
          userStatus={user?.stsstatus || null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
