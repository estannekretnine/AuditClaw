'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, Eye, Users, Clock, MessageCircle, Image, 
  Globe, Calendar, Filter, RefreshCw, TrendingUp,
  Phone, Mail, MapPin, ChevronDown, ChevronUp
} from 'lucide-react'
import { 
  getAnalyticsSummary, 
  getPonudeAnalytics, 
  getPoziviWithAnalytics,
  getKorisnici,
  getRecentLogs,
  getPonudeForFilter,
  getKampanjeForFilter
} from '@/lib/actions/analytics'
import type { 
  AnalyticsSummary, 
  PonudaAnalytics, 
  PoziviWithAnalytics,
  EventType,
  Language
} from '@/lib/types/webstrana-log'

type TabType = 'pregled' | 'ponude' | 'pozivi' | 'logovi'

export default function AnalitikaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pregled')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [ponudeAnalytics, setPonudeAnalytics] = useState<PonudaAnalytics[]>([])
  const [pozivi, setPozivi] = useState<PoziviWithAnalytics[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [korisnici, setKorisnici] = useState<any[]>([])
  const [ponudeFilter, setPonudeFilter] = useState<any[]>([])
  const [kampanjeFilter, setKampanjeFilter] = useState<any[]>([])

  // Filteri
  const [selectedPonuda, setSelectedPonuda] = useState<number | undefined>()
  const [selectedKampanja, setSelectedKampanja] = useState<number | undefined>()
  const [selectedKorisnik, setSelectedKorisnik] = useState<number | undefined>()
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'pregled') {
      loadSummary()
    } else if (activeTab === 'ponude') {
      loadPonudeAnalytics()
    } else if (activeTab === 'pozivi') {
      loadPozivi()
    } else if (activeTab === 'logovi') {
      loadRecentLogs()
    }
  }, [activeTab, selectedPonuda, selectedKampanja, selectedKorisnik, dateFrom, dateTo, selectedLanguage])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [korisniciData, ponudeData, kampanjeData] = await Promise.all([
        getKorisnici(),
        getPonudeForFilter(),
        getKampanjeForFilter()
      ])
      setKorisnici(korisniciData)
      setPonudeFilter(ponudeData)
      setKampanjeFilter(kampanjeData)
      await loadSummary()
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    setLoading(true)
    try {
      const data = await getAnalyticsSummary({
        ponudaId: selectedPonuda,
        kampanjaId: selectedKampanja,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        language: selectedLanguage
      })
      setSummary(data)
    } finally {
      setLoading(false)
    }
  }

  const loadPonudeAnalytics = async () => {
    setLoading(true)
    try {
      const data = await getPonudeAnalytics()
      setPonudeAnalytics(data)
    } finally {
      setLoading(false)
    }
  }

  const loadPozivi = async () => {
    setLoading(true)
    try {
      const data = await getPoziviWithAnalytics({
        ponudaId: selectedPonuda,
        korisnikId: selectedKorisnik,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setPozivi(data)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentLogs = async () => {
    setLoading(true)
    try {
      const data = await getRecentLogs(100)
      setRecentLogs(data)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSelectedPonuda(undefined)
    setSelectedKampanja(undefined)
    setSelectedKorisnik(undefined)
    setDateFrom('')
    setDateTo('')
    setSelectedLanguage(undefined)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'page_view': 'Pregled stranice',
      'photo_click': 'Klik na foto',
      'language_change': 'Promena jezika',
      'whatsapp_click': 'WhatsApp klik',
      'video_click': 'Video klik',
      '3d_tour_click': '3D tura klik',
      'map_interaction': 'Interakcija sa mapom',
      'page_leave': 'Napuštanje stranice'
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'page_view': 'bg-blue-500/20 text-blue-400',
      'photo_click': 'bg-purple-500/20 text-purple-400',
      'language_change': 'bg-cyan-500/20 text-cyan-400',
      'whatsapp_click': 'bg-green-500/20 text-green-400',
      'video_click': 'bg-red-500/20 text-red-400',
      '3d_tour_click': 'bg-violet-500/20 text-violet-400',
      'map_interaction': 'bg-amber-500/20 text-amber-400',
      'page_leave': 'bg-gray-500/20 text-gray-400'
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            Analiza Logovanja
          </h1>
          <p className="text-gray-400 mt-1">Praćenje aktivnosti korisnika na web stranicama</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'pregled') loadSummary()
            else if (activeTab === 'ponude') loadPonudeAnalytics()
            else if (activeTab === 'pozivi') loadPozivi()
            else if (activeTab === 'logovi') loadRecentLogs()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Osveži
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        {[
          { id: 'pregled', label: 'Pregled', icon: TrendingUp },
          { id: 'ponude', label: 'Po Ponudama', icon: Eye },
          { id: 'pozivi', label: 'Pozivi (WhatsApp)', icon: Phone },
          { id: 'logovi', label: 'Svi Logovi', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filteri
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800 rounded-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Ponuda filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ponuda</label>
              <select
                value={selectedPonuda || ''}
                onChange={(e) => setSelectedPonuda(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              >
                <option value="">Sve ponude</option>
                {ponudeFilter.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.naslovoglasa || `Ponuda #${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Kampanja filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Kampanja</label>
              <select
                value={selectedKampanja || ''}
                onChange={(e) => setSelectedKampanja(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              >
                <option value="">Sve kampanje</option>
                {kampanjeFilter.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.kodkampanje || `Kampanja #${k.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Korisnik filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Korisnik</label>
              <select
                value={selectedKorisnik || ''}
                onChange={(e) => setSelectedKorisnik(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              >
                <option value="">Svi korisnici</option>
                {korisnici.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.naziv} ({k.stsstatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Od datuma</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Do datuma</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              />
            </div>

            {/* Language filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Jezik</label>
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(e.target.value as Language || undefined)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
              >
                <option value="">Svi jezici</option>
                <option value="sr">Srpski</option>
                <option value="en">Engleski</option>
                <option value="de">Nemački</option>
              </select>
            </div>

            {/* Reset button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Resetuj filtere
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Pregled Tab */}
          {activeTab === 'pregled' && summary && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400 text-sm">Pregledi</span>
                  </div>
                  <div className="text-3xl font-bold">{summary.totalPageViews}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Jedinstveni posetioci</span>
                  </div>
                  <div className="text-3xl font-bold">{summary.uniqueSessions}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-gray-400 text-sm">Prosečno vreme</span>
                  </div>
                  <div className="text-3xl font-bold">{formatDuration(summary.avgTimeSpent)}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400 text-sm">WhatsApp klikovi</span>
                  </div>
                  <div className="text-3xl font-bold">{summary.totalWhatsappClicks}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Image className="w-5 h-5 text-amber-400" />
                    <span className="text-gray-400 text-sm">Foto klikovi</span>
                  </div>
                  <div className="text-3xl font-bold">{summary.totalPhotoClicks}</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Distribution */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Distribucija događaja</h3>
                  <div className="space-y-3">
                    {summary.eventDistribution.map(item => (
                      <div key={item.event_type} className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(item.event_type)}`}>
                          {getEventTypeLabel(item.event_type)}
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (item.count / Math.max(...summary.eventDistribution.map(e => e.count))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-12 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Distribution */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Distribucija po jeziku
                  </h3>
                  <div className="space-y-3">
                    {summary.languageDistribution.length > 0 ? (
                      summary.languageDistribution.map(item => (
                        <div key={item.language} className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-gray-700 rounded text-sm uppercase font-bold w-12 text-center">
                            {item.language}
                          </span>
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (item.count / Math.max(...summary.languageDistribution.map(l => l.count))) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-12 text-right">{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Nema podataka o jezicima</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Views */}
              {summary.dailyViews.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    Dnevni pregledi
                  </h3>
                  <div className="flex items-end gap-1 h-40">
                    {summary.dailyViews.slice(-30).map(day => {
                      const maxCount = Math.max(...summary.dailyViews.map(d => d.count))
                      const height = (day.count / maxCount) * 100
                      return (
                        <div 
                          key={day.date} 
                          className="flex-1 bg-amber-500/20 hover:bg-amber-500/40 transition-colors rounded-t group relative"
                          style={{ height: `${Math.max(5, height)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.date}: {day.count}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ponude Tab */}
          {activeTab === 'ponude' && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ponuda</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Pregledi</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Posetioci</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Prosečno vreme</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">WhatsApp</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Poslednja poseta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {ponudeAnalytics.map(item => (
                    <tr key={item.ponudaId} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.ponudaNaslov}</div>
                        <div className="text-sm text-gray-400">ID: {item.ponudaId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {item.totalViews}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          {item.uniqueVisitors}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {formatDuration(item.avgTimeSpent)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          {item.whatsappClicks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-400">
                        {item.lastVisit ? formatDate(item.lastVisit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {ponudeAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nema podataka o posećenosti ponuda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pozivi Tab */}
          {activeTab === 'pozivi' && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Datum</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ime kupca</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Kontakt</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Lokacija</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ponuda</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Kampanja</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Validacija</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pozivi.map(poziv => (
                    <tr key={poziv.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(poziv.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {poziv.imekupca || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {poziv.mobtel && (
                            <span className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-green-400" />
                              {poziv.mobtel}
                            </span>
                          )}
                          {poziv.email && (
                            <span className="flex items-center gap-1 text-sm text-gray-400">
                              <Mail className="w-3 h-3" />
                              {poziv.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {poziv.drzava && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {poziv.drzava}
                            {poziv.regija && `, ${poziv.regija}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {poziv.ponuda_naslov || (poziv.ponudaid ? `#${poziv.ponudaid}` : '-')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {poziv.kodkampanje || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {poziv.validacija_ag ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            {poziv.validacija_ag}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            Nije validiran
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pozivi.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Nema zabeleženih poziva
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Logovi Tab */}
          {activeTab === 'logovi' && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Vreme</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Događaj</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ponuda</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Jezik</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Sesija</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Detalji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(log.event_type)}`}>
                          {getEventTypeLabel(log.event_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.ponuda?.naslovoglasa || `#${log.ponuda_id}`}
                      </td>
                      <td className="px-4 py-3">
                        {log.language && (
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs uppercase font-bold">
                            {log.language}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {log.session_id.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {log.time_spent_seconds && `${formatDuration(log.time_spent_seconds)}`}
                        {log.event_data && typeof log.event_data === 'object' && (
                          <span className="text-xs">
                            {JSON.stringify(log.event_data).substring(0, 50)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {recentLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nema zabeleženih logova
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
