'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Users, RefreshCw, Search, X, Archive, RotateCcw, Plus, Edit2,
  Building2, Mail, Phone, Calendar, Copy, Check, Gift, Link2, Share2
} from 'lucide-react'
import { getKlijenti, createKlijent, updateKlijent, archiveKlijent, restoreKlijent } from '@/lib/actions/klijenti'
import type { Klijent, KlijentFilterStatus } from '@/lib/types/klijenti'
import { getDigitalCardUrl, getReferralFormUrl } from '@/lib/utils/site-url'

export default function KlijentiPage() {
  const [loading, setLoading] = useState(false)
  const [klijenti, setKlijenti] = useState<Klijent[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<KlijentFilterStatus>('active')
  
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingKlijent, setEditingKlijent] = useState<Klijent | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [selectedKlijent, setSelectedKlijent] = useState<Klijent | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    firma: '',
    email: '',
    kontakt: '',
    stsagencijazanekretnine: false,
    stsinvestitor: false,
    stsinvestitoraudit: false,
    stskupac: false,
    stsprijateljsajta: false,
    stsprodavac: false,
    opis: '',
    preporukacodeodkoljenta: '',
  })

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      // ignore — buffer možda nije dostupan u nekim browser-ima
    }
  }

  const getKlijentFullName = (k: Klijent) =>
    [k.ime, k.prezime].filter(Boolean).join(' ') || 'Klijent'

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadKlijenti = useCallback(async (search?: string, status?: KlijentFilterStatus) => {
    setLoading(true)
    try {
      const result = await getKlijenti(50, 0, search, status ?? filterStatus)
      if (result.data) {
        setKlijenti(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadKlijenti(debouncedSearch, filterStatus)
  }, [debouncedSearch, filterStatus, loadKlijenti])

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const resetForm = () => {
    setFormData({
      ime: '',
      prezime: '',
      firma: '',
      email: '',
      kontakt: '',
      stsagencijazanekretnine: false,
      stsinvestitor: false,
      stsinvestitoraudit: false,
      stskupac: false,
      stsprijateljsajta: false,
      stsprodavac: false,
      opis: '',
      preporukacodeodkoljenta: '',
    })
    setEditingKlijent(null)
  }

  const openCreateModal = () => {
    resetForm()
    setFormModalOpen(true)
  }

  const openEditModal = (klijent: Klijent) => {
    setEditingKlijent(klijent)
    setFormData({
      ime: klijent.ime || '',
      prezime: klijent.prezime || '',
      firma: klijent.firma || '',
      email: klijent.email || '',
      kontakt: klijent.kontakt || '',
      stsagencijazanekretnine: klijent.stsagencijazanekretnine,
      stsinvestitor: klijent.stsinvestitor,
      stsinvestitoraudit: klijent.stsinvestitoraudit,
      stskupac: klijent.stskupac,
      stsprijateljsajta: klijent.stsprijateljsajta,
      stsprodavac: klijent.stsprodavac,
      opis: klijent.opis || '',
      preporukacodeodkoljenta: klijent.preporukacodeodkoljenta || '',
    })
    setFormModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('ime', formData.ime)
      fd.append('prezime', formData.prezime)
      fd.append('firma', formData.firma)
      fd.append('email', formData.email)
      fd.append('kontakt', formData.kontakt)
      fd.append('stsagencijazanekretnine', String(formData.stsagencijazanekretnine))
      fd.append('stsinvestitor', String(formData.stsinvestitor))
      fd.append('stsinvestitoraudit', String(formData.stsinvestitoraudit))
      fd.append('stskupac', String(formData.stskupac))
      fd.append('stsprijateljsajta', String(formData.stsprijateljsajta))
      fd.append('stsprodavac', String(formData.stsprodavac))
      fd.append('opis', formData.opis)
      fd.append('preporukacodeodkoljenta', formData.preporukacodeodkoljenta)

      let result
      if (editingKlijent) {
        result = await updateKlijent(editingKlijent.id, fd)
      } else {
        result = await createKlijent(fd)
      }

      if (!result.error) {
        setFormModalOpen(false)
        resetForm()
        await loadKlijenti(debouncedSearch, filterStatus)
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const openArchiveModal = (klijent: Klijent) => {
    setSelectedKlijent(klijent)
    setArchiveModalOpen(true)
  }

  const handleArchive = async () => {
    if (!selectedKlijent) return

    setArchiving(true)
    try {
      const result = await archiveKlijent(selectedKlijent.id)
      if (!result.error) {
        setArchiveModalOpen(false)
        setSelectedKlijent(null)
        await loadKlijenti(debouncedSearch, filterStatus)
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setArchiving(false)
    }
  }

  const openRestoreModal = (klijent: Klijent) => {
    setSelectedKlijent(klijent)
    setRestoreModalOpen(true)
  }

  const handleRestore = async () => {
    if (!selectedKlijent) return

    setRestoring(true)
    try {
      const result = await restoreKlijent(selectedKlijent.id)
      if (!result.error) {
        setRestoreModalOpen(false)
        setSelectedKlijent(null)
        await loadKlijenti(debouncedSearch, filterStatus)
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setRestoring(false)
    }
  }

  const isArchived = (klijent: Klijent) => klijent.stsarhiviran === true

  const StatusBadge = ({ label, active, color }: { label: string; active: boolean; color: string }) => {
    if (!active) return null
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {label}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
            Klijenti
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upravljanje klijentima
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novi klijent</span>
          </button>
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'active'
                  ? 'bg-amber-500 text-black font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Aktivni</span>
              <Users className="w-4 h-4 md:hidden" />
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'archived'
                  ? 'bg-orange-500 text-black font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Arhivirani</span>
              <Archive className="w-4 h-4 md:hidden" />
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Svi</span>
              <span className="md:hidden text-xs">Svi</span>
            </button>
          </div>
          <button
            onClick={() => loadKlijenti(debouncedSearch, filterStatus)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Osveži</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-gray-400">Ukupno klijenata</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {klijenti.filter(k => k.stsagencijazanekretnine).length}
              </p>
              <p className="text-xs text-gray-400">Agencije</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {klijenti.filter(k => k.stsinvestitor).length}
              </p>
              <p className="text-xs text-gray-400">Investitori</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {klijenti.filter(k => k.stskupac).length}
              </p>
              <p className="text-xs text-gray-400">Kupci</p>
            </div>
          </div>
        </div>
      </div>

      {/* Klijenti Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {filterStatus === 'archived' && <Archive className="w-5 h-5 text-orange-500" />}
              {filterStatus === 'all' && <Users className="w-5 h-5 text-blue-500" />}
              {debouncedSearch
                ? `Rezultati pretrage (${totalCount})`
                : filterStatus === 'archived'
                  ? `Arhivirani klijenti (${totalCount})`
                  : filterStatus === 'all'
                    ? `Svi klijenti (${totalCount})`
                    : 'Aktivni klijenti'}
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži po imenu, firmi, emailu..."
                className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Učitavam...</p>
          </div>
        ) : klijenti.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Nema klijenata</p>
            <p className="text-gray-500 text-sm">Kliknite &quot;Novi klijent&quot; da dodate prvog</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ime i prezime</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Firma</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Kontakt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Kod / Preporuka od</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Statusi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum upisa</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Akcije</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {klijenti.map((klijent) => (
                    <tr key={klijent.id} className={`hover:bg-slate-700/30 ${isArchived(klijent) ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-sm font-mono">{klijent.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isArchived(klijent) ? 'bg-orange-500/20' : 'bg-amber-500/20'
                          }`}>
                            <span className={`font-semibold text-sm ${
                              isArchived(klijent) ? 'text-orange-500' : 'text-amber-500'
                            }`}>
                              {(klijent.ime?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm">
                              {klijent.ime || '-'} {klijent.prezime || ''}
                            </span>
                            {isArchived(klijent) && filterStatus === 'all' && (
                              <span className="text-orange-400 text-xs">Arhiviran</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{klijent.firma || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{klijent.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{klijent.kontakt || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {klijent.preporukacode ? (
                            <>
                              <button
                                type="button"
                                onClick={() => copyText(klijent.preporukacode!, `code-${klijent.id}`)}
                                className="group inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 font-mono text-xs transition-colors w-fit"
                                title="Kopiraj kod"
                              >
                                {copiedKey === `code-${klijent.id}` ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                )}
                                <span>{klijent.preporukacode}</span>
                              </button>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      getDigitalCardUrl(klijent.preporukacode!, 'sr'),
                                      `card-${klijent.id}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-gray-300 text-[10px] transition-colors"
                                  title="Kopiraj link digitalne kartice"
                                >
                                  {copiedKey === `card-${klijent.id}` ? (
                                    <Check className="w-2.5 h-2.5 text-green-400" />
                                  ) : (
                                    <Link2 className="w-2.5 h-2.5" />
                                  )}
                                  Link kartice
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      getReferralFormUrl(
                                        klijent.preporukacode!,
                                        getKlijentFullName(klijent),
                                        'sr'
                                      ),
                                      `ref-${klijent.id}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-gray-300 text-[10px] transition-colors"
                                  title="Kopiraj link za preporuku"
                                >
                                  {copiedKey === `ref-${klijent.id}` ? (
                                    <Check className="w-2.5 h-2.5 text-green-400" />
                                  ) : (
                                    <Share2 className="w-2.5 h-2.5" />
                                  )}
                                  Link preporuke
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          {klijent.preporukacodeodkoljenta && (
                            <div className="flex flex-col gap-0.5" title="Preporučio ga je">
                              <span className="inline-flex items-center gap-1 text-gray-400">
                                <Gift className="w-3 h-3 text-purple-400" />
                                <span className="font-mono">{klijent.preporukacodeodkoljenta}</span>
                              </span>
                              {klijent.preporukaOd ? (
                                <span className="text-purple-300 text-[11px] pl-4">
                                  #{klijent.preporukaOd.id} {klijent.preporukaOd.ime || ''} {klijent.preporukaOd.prezime || ''}
                                </span>
                              ) : (
                                <span className="text-red-400/70 text-[11px] pl-4 italic">
                                  kod nije pronađen
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge label="Agencija" active={klijent.stsagencijazanekretnine} color="bg-blue-500/20 text-blue-400" />
                          <StatusBadge label="Investitor" active={klijent.stsinvestitor} color="bg-green-500/20 text-green-400" />
                          <StatusBadge label="AuditClaw-Project" active={klijent.stsinvestitoraudit} color="bg-cyan-500/20 text-cyan-400" />
                          <StatusBadge label="Kupac" active={klijent.stskupac} color="bg-amber-500/20 text-amber-400" />
                          <StatusBadge label="Prijatelj" active={klijent.stsprijateljsajta} color="bg-purple-500/20 text-purple-400" />
                          <StatusBadge label="Prodavac" active={klijent.stsprodavac} color="bg-red-500/20 text-red-400" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(klijent.datumupisa).toLocaleDateString('sr-RS')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(klijent)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            title="Izmeni"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isArchived(klijent) ? (
                            <button
                              onClick={() => openRestoreModal(klijent)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Vrati
                            </button>
                          ) : (
                            <button
                              onClick={() => openArchiveModal(klijent)}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Archive className="w-3 h-3" />
                              Arhiviraj
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700">
              {klijenti.map((klijent) => (
                <div key={klijent.id} className={`p-4 ${isArchived(klijent) ? 'opacity-75' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isArchived(klijent) ? 'bg-orange-500/20' : 'bg-amber-500/20'
                    }`}>
                      <span className={`font-semibold ${isArchived(klijent) ? 'text-orange-500' : 'text-amber-500'}`}>
                        {(klijent.ime?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {klijent.ime || '-'} {klijent.prezime || ''}
                        </p>
                        {isArchived(klijent) && filterStatus === 'all' && (
                          <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">Arhiviran</span>
                        )}
                      </div>
                      {klijent.firma && (
                        <p className="text-gray-400 text-sm">{klijent.firma}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    {klijent.email && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span className="truncate">{klijent.email}</span>
                      </div>
                    )}
                    {klijent.kontakt && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Phone className="w-3 h-3 text-green-400" />
                        <span>{klijent.kontakt}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-400 col-span-2">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">{new Date(klijent.datumupisa).toLocaleDateString('sr-RS')}</span>
                    </div>
                  </div>

                  {(klijent.preporukacode || klijent.preporukacodeodkoljenta) && (
                    <div className="flex flex-col gap-1.5 mb-3 text-xs">
                      {klijent.preporukacode && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyText(klijent.preporukacode!, `code-${klijent.id}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 font-mono w-fit"
                          >
                            {copiedKey === `code-${klijent.id}` ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{klijent.preporukacode}</span>
                          </button>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  getDigitalCardUrl(klijent.preporukacode!, 'sr'),
                                  `card-${klijent.id}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-gray-300 text-[10px]"
                            >
                              {copiedKey === `card-${klijent.id}` ? (
                                <Check className="w-2.5 h-2.5 text-green-400" />
                              ) : (
                                <Link2 className="w-2.5 h-2.5" />
                              )}
                              Link kartice
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  getReferralFormUrl(
                                    klijent.preporukacode!,
                                    getKlijentFullName(klijent),
                                    'sr'
                                  ),
                                  `ref-${klijent.id}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-gray-300 text-[10px]"
                            >
                              {copiedKey === `ref-${klijent.id}` ? (
                                <Check className="w-2.5 h-2.5 text-green-400" />
                              ) : (
                                <Share2 className="w-2.5 h-2.5" />
                              )}
                              Link preporuke
                            </button>
                          </div>
                        </>
                      )}
                      {klijent.preporukacodeodkoljenta && (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-300 font-mono w-fit">
                            <Gift className="w-3 h-3" />
                            <span>{klijent.preporukacodeodkoljenta}</span>
                          </span>
                          {klijent.preporukaOd ? (
                            <span className="text-purple-300 text-[11px] pl-2">
                              Preporučio: #{klijent.preporukaOd.id} {klijent.preporukaOd.ime || ''} {klijent.preporukaOd.prezime || ''}
                            </span>
                          ) : (
                            <span className="text-red-400/70 text-[11px] pl-2 italic">
                              kod nije pronađen
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    <StatusBadge label="Agencija" active={klijent.stsagencijazanekretnine} color="bg-blue-500/20 text-blue-400" />
                    <StatusBadge label="Investitor" active={klijent.stsinvestitor} color="bg-green-500/20 text-green-400" />
                    <StatusBadge label="AuditClaw-Project" active={klijent.stsinvestitoraudit} color="bg-cyan-500/20 text-cyan-400" />
                    <StatusBadge label="Kupac" active={klijent.stskupac} color="bg-amber-500/20 text-amber-400" />
                    <StatusBadge label="Prijatelj" active={klijent.stsprijateljsajta} color="bg-purple-500/20 text-purple-400" />
                    <StatusBadge label="Prodavac" active={klijent.stsprodavac} color="bg-red-500/20 text-red-400" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(klijent)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Izmeni
                    </button>
                    {isArchived(klijent) ? (
                      <button
                        onClick={() => openRestoreModal(klijent)}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Vrati
                      </button>
                    ) : (
                      <button
                        onClick={() => openArchiveModal(klijent)}
                        className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Archive className="w-3 h-3" />
                        Arhiviraj
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form Modal (Create/Edit) */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {editingKlijent ? (
                  <>
                    <Edit2 className="w-5 h-5 text-blue-500" />
                    Izmeni klijenta
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-amber-500" />
                    Novi klijent
                  </>
                )}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Ime</label>
                  <input
                    type="text"
                    value={formData.ime}
                    onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white"
                    style={{ color: 'white' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Prezime</label>
                  <input
                    type="text"
                    value={formData.prezime}
                    onChange={(e) => setFormData({ ...formData, prezime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Firma</label>
                <input
                  type="text"
                  value={formData.firma}
                  onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white"
                  style={{ color: 'white' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white"
                    style={{ color: 'white' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Kontakt</label>
                  <input
                    type="text"
                    value={formData.kontakt}
                    onChange={(e) => setFormData({ ...formData, kontakt: e.target.value })}
                    placeholder="Telefon"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white placeholder-gray-400"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Statusi</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.stsagencijazanekretnine}
                      onChange={(e) => setFormData({ ...formData, stsagencijazanekretnine: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Agencija za nekretnine</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.stsinvestitor}
                      onChange={(e) => setFormData({ ...formData, stsinvestitor: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-300">Investitor</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.stsinvestitoraudit}
                      onChange={(e) => setFormData({ ...formData, stsinvestitoraudit: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-300">Investitor AuditClaw-Project</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.stskupac}
                      onChange={(e) => setFormData({ ...formData, stskupac: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-300">Kupac</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.stsprijateljsajta}
                      onChange={(e) => setFormData({ ...formData, stsprijateljsajta: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Prijatelj sajta</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 col-span-2">
                    <input
                      type="checkbox"
                      checked={formData.stsprodavac}
                      onChange={(e) => setFormData({ ...formData, stsprodavac: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-500 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-300">Prodavac</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Opis</label>
                <textarea
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none caret-white"
                  style={{ color: 'white' }}
                />
              </div>

              {editingKlijent?.preporukacode && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Kod za preporuku (auto-generisan)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-amber-300 font-mono text-sm">
                      {editingKlijent.preporukacode}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(editingKlijent.preporukacode!, `edit-code-${editingKlijent.id}`)
                      }
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                      title="Kopiraj kod"
                    >
                      {copiedKey === `edit-code-${editingKlijent.id}` ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Kopirano</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Kopiraj</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          getDigitalCardUrl(editingKlijent.preporukacode!, 'sr'),
                          `edit-card-${editingKlijent.id}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg text-xs transition-colors"
                    >
                      {copiedKey === `edit-card-${editingKlijent.id}` ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                      Link kartice
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          getReferralFormUrl(
                            editingKlijent.preporukacode!,
                            getKlijentFullName(editingKlijent),
                            'sr'
                          ),
                          `edit-ref-${editingKlijent.id}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg text-xs transition-colors"
                    >
                      {copiedKey === `edit-ref-${editingKlijent.id}` ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}
                      Link preporuke
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kod je jedinstven i ne može se menjati. Klijent ga koristi za preporuku drugima.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-purple-400" />
                    Preporuka od (kod drugog klijenta)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.preporukacodeodkoljenta}
                  onChange={(e) => setFormData({ ...formData, preporukacodeodkoljenta: e.target.value })}
                  placeholder="AC-XXXXXXXX (opciono)"
                  spellCheck={false}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 caret-white placeholder-gray-400"
                  style={{ color: 'white' }}
                />
                {editingKlijent?.preporukaOd ? (
                  <p className="text-xs text-purple-300 mt-1">
                    Preporučio: <span className="font-medium">#{editingKlijent.preporukaOd.id} {editingKlijent.preporukaOd.ime || ''} {editingKlijent.preporukaOd.prezime || ''}</span>
                  </p>
                ) : editingKlijent?.preporukacodeodkoljenta ? (
                  <p className="text-xs text-red-400/80 mt-1 italic">
                    Kod nije pronađen u bazi klijenata.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Ako je klijent stigao preko preporuke drugog klijenta, unesite njegov kod ovde.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Čuvam...
                    </>
                  ) : editingKlijent ? (
                    'Sačuvaj izmene'
                  ) : (
                    'Dodaj klijenta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalOpen && selectedKlijent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-500" />
                Arhiviraj klijenta
              </h3>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedKlijent.ime || '-'} {selectedKlijent.prezime || ''}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedKlijent.firma || selectedKlijent.email || `ID: ${selectedKlijent.id}`}
                </p>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Da li ste sigurni da želite da arhivirate ovog klijenta?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setArchiveModalOpen(false)
                    setSelectedKlijent(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Ne
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {archiving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Arhiviram...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      Da, arhiviraj
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreModalOpen && selectedKlijent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-green-500" />
                Vraćanje u aktivne?
              </h3>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedKlijent.ime || '-'} {selectedKlijent.prezime || ''}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedKlijent.firma || selectedKlijent.email || `ID: ${selectedKlijent.id}`}
                </p>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Da li ste sigurni da želite da vratite ovog klijenta u aktivne?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRestoreModalOpen(false)
                    setSelectedKlijent(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Ne
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Vraćam...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Da
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
