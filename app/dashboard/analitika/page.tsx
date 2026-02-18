'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  BarChart3, Eye, Users, Clock, MessageCircle, Image, 
  Globe, Calendar, Filter, RefreshCw, TrendingUp,
  Phone, Mail, MapPin, ChevronDown, ChevronUp, Download,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { 
  getAnalyticsSummary, 
  getPonudeAnalytics, 
  getPoziviWithAnalytics,
  getKorisnici,
  getRecentLogs,
  getPonudeForFilter,
  getKampanjeForFilter,
  getAnalyticsByPeriod,
  getSyntheticReport,
  type PeriodType,
  type PeriodData,
  type SyntheticReport
} from '@/lib/actions/analytics'
import type { 
  AnalyticsSummary, 
  PonudaAnalytics, 
  PoziviWithAnalytics,
  EventType,
  Language
} from '@/lib/types/webstrana-log'

type TabType = 'izvestaj' | 'pregled' | 'grafikoni' | 'ponude' | 'pozivi' | 'logovi'

const CHART_COLORS = {
  primary: '#f59e0b',
  secondary: '#3b82f6', 
  tertiary: '#10b981',
  quaternary: '#8b5cf6',
  muted: '#6b7280'
}

export default function AnalitikaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('izvestaj')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [ponudeAnalytics, setPonudeAnalytics] = useState<PonudaAnalytics[]>([])
  const [pozivi, setPozivi] = useState<PoziviWithAnalytics[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [korisnici, setKorisnici] = useState<any[]>([])
  const [ponudeFilter, setPonudeFilter] = useState<any[]>([])
  const [kampanjeFilter, setKampanjeFilter] = useState<any[]>([])
  const [periodData, setPeriodData] = useState<PeriodData[]>([])
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>('daily')
  const [selectedMetric, setSelectedMetric] = useState<'pageViews' | 'uniqueVisitors' | 'whatsappClicks'>('pageViews')
  const [syntheticReport, setSyntheticReport] = useState<SyntheticReport | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

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
    if (activeTab === 'izvestaj') {
      loadSyntheticReport()
    } else if (activeTab === 'pregled') {
      loadSummary()
    } else if (activeTab === 'grafikoni') {
      loadPeriodData()
    } else if (activeTab === 'ponude') {
      loadPonudeAnalytics()
    } else if (activeTab === 'pozivi') {
      loadPozivi()
    } else if (activeTab === 'logovi') {
      loadRecentLogs()
    }
  }, [activeTab, selectedPonuda, selectedKampanja, selectedKorisnik, dateFrom, dateTo, selectedLanguage, selectedPeriodType])

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
      await loadSyntheticReport()
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

  const loadPeriodData = async () => {
    setLoading(true)
    try {
      const data = await getAnalyticsByPeriod(selectedPeriodType, {
        ponudaId: selectedPonuda,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setPeriodData(data)
    } finally {
      setLoading(false)
    }
  }

  const loadSyntheticReport = async () => {
    setLoading(true)
    try {
      const data = await getSyntheticReport({
        ponudaId: selectedPonuda,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setSyntheticReport(data)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportRef.current || exportingPDF) return
    
    setExportingPDF(true)
    
    try {
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = reportRef.current
      const opt = {
        margin: 10,
        filename: `analitika-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.8 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
      }
      
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Greška pri eksportu PDF-a. Pokušajte ponovo.')
    } finally {
      setExportingPDF(false)
    }
  }

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      pageViews: 'Pregledi',
      uniqueVisitors: 'Posetioci',
      whatsappClicks: 'WhatsApp'
    }
    return labels[metric] || metric
  }

  const getMetricColor = (metric: string) => {
    const colors: Record<string, string> = {
      pageViews: CHART_COLORS.primary,
      uniqueVisitors: CHART_COLORS.secondary,
      whatsappClicks: CHART_COLORS.tertiary
    }
    return colors[metric] || CHART_COLORS.muted
  }

  const calculateTrend = (data: PeriodData[], metric: 'pageViews' | 'uniqueVisitors' | 'whatsappClicks') => {
    if (data.length < 2) return { value: 0, direction: 'neutral' as const }
    const current = data[data.length - 1][metric]
    const previous = data[data.length - 2][metric]
    if (previous === 0) return { value: 0, direction: 'neutral' as const }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(Math.round(change)),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
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
      'page_leave': 'bg-slate-600/30 text-slate-200'
    }
    return colors[type] || 'bg-slate-600/30 text-slate-200'
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
          <p className="text-slate-200 mt-1">Praćenje aktivnosti korisnika na web stranicama</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            disabled={exportingPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              exportingPDF 
                ? 'bg-slate-600 text-slate-300 cursor-wait' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {exportingPDF ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportingPDF ? 'Generisanje...' : 'PDF'}
          </button>
        <button
          onClick={() => {
            if (activeTab === 'izvestaj') loadSyntheticReport()
            else if (activeTab === 'pregled') loadSummary()
            else if (activeTab === 'grafikoni') loadPeriodData()
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-600 pb-4 flex-wrap">
        {[
          { id: 'izvestaj', label: 'Sintetički Izveštaj', icon: BarChart3 },
          { id: 'pregled', label: 'Pregled', icon: TrendingUp },
          { id: 'grafikoni', label: 'Grafikoni', icon: BarChart3 },
          { id: 'ponude', label: 'Po Ponudama', icon: Eye },
          { id: 'pozivi', label: 'Pozivi (WhatsApp)', icon: Phone },
          { id: 'logovi', label: 'Svi Logovi', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              activeTab === tab.id
                ? 'bg-amber-400 text-black'
                : 'bg-slate-700 text-white hover:bg-slate-600'
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
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
        >
          <Filter className="w-4 h-4" />
          Filteri
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-slate-800 border border-slate-600 rounded-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Ponuda filter */}
            <div>
              <label className="block text-sm text-white mb-1 font-medium">Ponuda</label>
              <select
                value={selectedPonuda || ''}
                onChange={(e) => setSelectedPonuda(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
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
              <label className="block text-sm text-white mb-1 font-medium">Kampanja</label>
              <select
                value={selectedKampanja || ''}
                onChange={(e) => setSelectedKampanja(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
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
              <label className="block text-sm text-white mb-1 font-medium">Korisnik</label>
              <select
                value={selectedKorisnik || ''}
                onChange={(e) => setSelectedKorisnik(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
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
              <label className="block text-sm text-white mb-1 font-medium">Od datuma</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm text-white mb-1 font-medium">Do datuma</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
              />
            </div>

            {/* Language filter */}
            <div>
              <label className="block text-sm text-white mb-1 font-medium">Jezik</label>
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(e.target.value as Language || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
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
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
              >
                Resetuj filtere
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={reportRef}>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Sintetički Izveštaj Tab */}
          {activeTab === 'izvestaj' && syntheticReport && (
            <div className="space-y-6">
              {/* Glavni KPI */}
              <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-6 text-amber-300">Ključni pokazatelji</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <div className="text-5xl font-bold text-white">{syntheticReport.totalVisits.toLocaleString()}</div>
                    <div className="text-slate-200 mt-2 font-medium">Ukupno poseta</div>
                    <div className="text-sm text-slate-300 mt-1">(sa ponavljanjem)</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <div className="text-5xl font-bold text-blue-300">{syntheticReport.uniqueVisitors.toLocaleString()}</div>
                    <div className="text-slate-200 mt-2 font-medium">Jedinstvenih posetilaca</div>
                    <div className="text-sm text-slate-300 mt-1">(bez ponavljanja)</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <div className="text-5xl font-bold text-green-300">{syntheticReport.totalWhatsappClicks.toLocaleString()}</div>
                    <div className="text-slate-200 mt-2 font-medium">WhatsApp poruka</div>
                    <div className="text-sm text-green-300 mt-1 font-semibold">{syntheticReport.whatsappConversionRate}% konverzija</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <div className="text-5xl font-bold text-purple-300">{syntheticReport.totalPozivi.toLocaleString()}</div>
                    <div className="text-slate-200 mt-2 font-medium">Poziva/Kontakata</div>
                    <div className="text-sm text-purple-300 mt-1 font-semibold">{syntheticReport.poziviConversionRate}% konverzija</div>
                  </div>
                </div>
              </div>

              {/* Dodatne metrike */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-medium">Povratni posetioci</span>
                    <span className="text-2xl font-bold text-cyan-300">{syntheticReport.returningVisitors}</span>
                  </div>
                  <div className="text-sm text-slate-300 mt-1">Posetili više od jednom</div>
                </div>
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-medium">Prosek poseta po korisniku</span>
                    <span className="text-2xl font-bold text-amber-300">{syntheticReport.avgVisitsPerUser}</span>
                  </div>
                  <div className="text-sm text-slate-300 mt-1">Ukupno / Jedinstveni</div>
                </div>
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-medium">Prosečno vreme na stranici</span>
                    <span className="text-2xl font-bold text-pink-300">{formatDuration(syntheticReport.avgTimeOnPage)}</span>
                  </div>
                  <div className="text-sm text-slate-300 mt-1">Prosek svih sesija</div>
                </div>
              </div>

              {/* Poređenje perioda */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Poređenje: Poslednjih 30 dana vs. Prethodnih 30 dana</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-700/70 rounded-lg">
                    <div className="text-slate-200 text-sm mb-2 font-medium">Posete</div>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <div className="text-2xl font-bold text-white">{syntheticReport.periodComparison.currentPeriod.visits}</div>
                        <div className="text-xs text-slate-300">Trenutno</div>
                      </div>
                      <div className={`text-lg font-bold ${syntheticReport.periodComparison.changePercent.visits >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {syntheticReport.periodComparison.changePercent.visits >= 0 ? '+' : ''}{syntheticReport.periodComparison.changePercent.visits}%
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-400">{syntheticReport.periodComparison.previousPeriod.visits}</div>
                        <div className="text-xs text-slate-300">Prethodno</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/70 rounded-lg">
                    <div className="text-slate-200 text-sm mb-2 font-medium">WhatsApp</div>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <div className="text-2xl font-bold text-green-300">{syntheticReport.periodComparison.currentPeriod.whatsapp}</div>
                        <div className="text-xs text-slate-300">Trenutno</div>
                      </div>
                      <div className={`text-lg font-bold ${syntheticReport.periodComparison.changePercent.whatsapp >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {syntheticReport.periodComparison.changePercent.whatsapp >= 0 ? '+' : ''}{syntheticReport.periodComparison.changePercent.whatsapp}%
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-400">{syntheticReport.periodComparison.previousPeriod.whatsapp}</div>
                        <div className="text-xs text-slate-300">Prethodno</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/70 rounded-lg">
                    <div className="text-slate-200 text-sm mb-2 font-medium">Pozivi</div>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-300">{syntheticReport.periodComparison.currentPeriod.pozivi}</div>
                        <div className="text-xs text-slate-300">Trenutno</div>
                      </div>
                      <div className={`text-lg font-bold ${syntheticReport.periodComparison.changePercent.pozivi >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {syntheticReport.periodComparison.changePercent.pozivi >= 0 ? '+' : ''}{syntheticReport.periodComparison.changePercent.pozivi}%
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-400">{syntheticReport.periodComparison.previousPeriod.pozivi}</div>
                        <div className="text-xs text-slate-300">Prethodno</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top ponude sa korelacijama */}
              {syntheticReport.topPonude.length > 0 && (
                <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-slate-600 bg-slate-700/50">
                    <h3 className="font-semibold text-white">Top ponude - Korelacija poseta i konverzija</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ponuda</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Posete</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Jedinstveni</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">WhatsApp</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Pozivi</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Konverzija</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {syntheticReport.topPonude.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-700/50">
                            <td className="px-4 py-3">
                              <span className="text-amber-300 font-bold mr-2">#{idx + 1}</span>
                              <span className="text-white">{p.naslov}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-white font-semibold">{p.visits}</td>
                            <td className="px-4 py-3 text-right text-blue-300 font-medium">{p.uniqueVisitors}</td>
                            <td className="px-4 py-3 text-right text-green-300 font-medium">{p.whatsappClicks}</td>
                            <td className="px-4 py-3 text-right text-purple-300 font-medium">{p.pozivi}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-1 rounded text-sm font-bold ${
                                p.conversionRate >= 10 ? 'bg-green-600/30 text-green-200' :
                                p.conversionRate >= 5 ? 'bg-amber-600/30 text-amber-200' :
                                'bg-slate-600/50 text-slate-200'
                              }`}>
                                {p.conversionRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Po jeziku i zemlji */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Po jeziku */}
                {syntheticReport.byLanguage.length > 0 && (
                  <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-lg">
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-300" />
                      Konverzija po jeziku
                    </h3>
                    <div className="space-y-3">
                      {syntheticReport.byLanguage.map(item => {
                        const langNames: Record<string, string> = { sr: 'Srpski', en: 'Engleski', de: 'Nemački', unknown: 'Nepoznat' }
                        return (
                          <div key={item.language} className="flex items-center justify-between p-3 bg-slate-700/70 rounded-lg">
                            <span className="text-white font-medium">{langNames[item.language] || item.language}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-slate-200">{item.visits} poseta</span>
                              <span className="text-green-300 font-medium">{item.whatsappClicks} WA</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                item.conversionRate >= 10 ? 'bg-green-600/30 text-green-200' : 'bg-slate-600/50 text-slate-200'
                              }`}>
                                {item.conversionRate}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Po zemlji */}
                {syntheticReport.byCountry.length > 0 && (
                  <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-lg">
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-300" />
                      Pozivi po zemlji
                    </h3>
                    <div className="space-y-3">
                      {syntheticReport.byCountry.map(item => (
                        <div key={item.country} className="flex items-center justify-between p-3 bg-slate-700/70 rounded-lg">
                          <span className="text-white font-medium">{item.country}</span>
                          <div className="flex items-center gap-4">
                            {item.visits > 0 && <span className="text-slate-200">{item.visits} poseta</span>}
                            <span className="text-purple-300 font-bold">{item.pozivi} poziva</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pregled Tab */}
          {activeTab === 'pregled' && summary && (
            <div className="space-y-6">
              {/* Summary Cards - Modern Design */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
                  <Eye className="w-8 h-8 text-blue-400 mb-3" />
                  <div className="text-4xl font-bold text-white">{summary.totalPageViews.toLocaleString()}</div>
                  <div className="text-blue-300 text-sm mt-1">Pregledi stranica</div>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
                  <Users className="w-8 h-8 text-purple-400 mb-3" />
                  <div className="text-4xl font-bold text-white">{summary.uniqueSessions.toLocaleString()}</div>
                  <div className="text-purple-300 text-sm mt-1">Jedinstveni posetioci</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -mr-10 -mt-10" />
                  <Clock className="w-8 h-8 text-cyan-400 mb-3" />
                  <div className="text-4xl font-bold text-white">{formatDuration(summary.avgTimeSpent)}</div>
                  <div className="text-cyan-300 text-sm mt-1">Prosečno vreme</div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
                  <MessageCircle className="w-8 h-8 text-green-400 mb-3" />
                  <div className="text-4xl font-bold text-white">{summary.totalWhatsappClicks.toLocaleString()}</div>
                  <div className="text-green-300 text-sm mt-1">WhatsApp klikovi</div>
                </div>

                <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
                  <Image className="w-8 h-8 text-amber-400 mb-3" />
                  <div className="text-4xl font-bold text-white">{summary.totalPhotoClicks.toLocaleString()}</div>
                  <div className="text-amber-300 text-sm mt-1">Foto klikovi</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Distribution - Horizontal Bar Chart */}
                <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <BarChart3 className="w-5 h-5 text-amber-300" />
                    Distribucija događaja
                  </h3>
                  <div className="space-y-4">
                    {summary.eventDistribution.sort((a, b) => b.count - a.count).map((item, idx) => {
                      const maxCount = Math.max(...summary.eventDistribution.map(e => e.count))
                      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                      const colors = ['bg-amber-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-cyan-400', 'bg-red-400', 'bg-pink-400', 'bg-indigo-400']
                      return (
                        <div key={item.event_type}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-100">{getEventTypeLabel(item.event_type)}</span>
                            <span className="text-sm font-semibold text-white">{item.count}</span>
                          </div>
                          <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Language Distribution - Pie Chart Style */}
                <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <Globe className="w-5 h-5 text-cyan-300" />
                    Distribucija po jeziku
                  </h3>
                  {summary.languageDistribution.length > 0 ? (
                    <div className="flex items-center gap-8">
                      {/* Donut Chart */}
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {(() => {
                            const total = summary.languageDistribution.reduce((sum, l) => sum + l.count, 0)
                            let cumulative = 0
                            const colors = ['#60a5fa', '#34d399', '#fbbf24']
                            return summary.languageDistribution.map((item, idx) => {
                              const percentage = (item.count / total) * 100
                              const dashArray = `${percentage} ${100 - percentage}`
                              const dashOffset = -cumulative
                              cumulative += percentage
                              return (
                                <circle
                                  key={item.language}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="20"
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={dashOffset}
                                  className="transition-all duration-500"
                                />
                              )
                            })
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{summary.languageDistribution.reduce((sum, l) => sum + l.count, 0)}</div>
                            <div className="text-xs text-slate-200">Ukupno</div>
                          </div>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex-1 space-y-3">
                        {summary.languageDistribution.map((item, idx) => {
                          const total = summary.languageDistribution.reduce((sum, l) => sum + l.count, 0)
                          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                          const colors = ['bg-blue-400', 'bg-green-400', 'bg-amber-400']
                          const langNames: Record<string, string> = { sr: 'Srpski', en: 'Engleski', de: 'Nemački' }
                          return (
                            <div key={item.language} className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded ${colors[idx % colors.length]}`} />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-100">{langNames[item.language] || item.language.toUpperCase()}</span>
                                  <span className="font-semibold text-white">{percentage}%</span>
                                </div>
                                <div className="text-xs text-slate-300">{item.count} poseta</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-300">
                      Nema podataka o jezicima
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Views - Area Chart Style */}
              {summary.dailyViews.length > 0 && (
                <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5 text-amber-300" />
                    Dnevni pregledi (poslednjih 30 dana)
                  </h3>
                  <div className="relative h-64">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-200">
                      <span>{Math.max(...summary.dailyViews.map(d => d.count))}</span>
                      <span>{Math.round(Math.max(...summary.dailyViews.map(d => d.count)) / 2)}</span>
                      <span>0</span>
                    </div>
                    {/* Chart area */}
                    <div className="ml-14 h-full flex items-end gap-1 pb-8 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 bottom-8 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-slate-600/50" />
                        <div className="border-b border-slate-600/50" />
                        <div className="border-b border-slate-600/50" />
                      </div>
                      {/* Bars */}
                      {summary.dailyViews.slice(-30).map((day, idx) => {
                        const maxCount = Math.max(...summary.dailyViews.map(d => d.count))
                        const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                            <div 
                              className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t hover:from-amber-500 hover:to-amber-300 transition-all cursor-pointer"
                              style={{ height: `${Math.max(2, height)}%` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-500 px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                              <div className="font-semibold text-amber-300">{day.count} pregleda</div>
                              <div className="text-slate-200">{new Date(day.date).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}</div>
                            </div>
                            {/* X-axis label - show every 5th */}
                            {idx % 5 === 0 && (
                              <div className="absolute -bottom-6 text-xs text-slate-200 whitespace-nowrap">
                                {new Date(day.date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grafikoni Tab */}
          {activeTab === 'grafikoni' && (
            <div className="space-y-6">
              {/* Period Type Selector */}
              <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Period:</span>
                    <div className="flex bg-slate-700 rounded-lg p-1">
                      {[
                        { id: 'daily', label: 'Dnevno' },
                        { id: 'weekly', label: 'Nedeljno' },
                        { id: 'monthly', label: 'Mesečno' }
                      ].map(period => (
                        <button
                          key={period.id}
                          onClick={() => setSelectedPeriodType(period.id as PeriodType)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedPeriodType === period.id
                              ? 'bg-amber-400 text-black'
                              : 'text-slate-100 hover:text-white hover:bg-slate-600'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Metrika:</span>
                    <div className="flex bg-slate-700 rounded-lg p-1">
                      {[
                        { id: 'pageViews', label: 'Pregledi', color: 'amber' },
                        { id: 'uniqueVisitors', label: 'Posetioci', color: 'blue' },
                        { id: 'whatsappClicks', label: 'WhatsApp', color: 'green' }
                      ].map(metric => (
                        <button
                          key={metric.id}
                          onClick={() => setSelectedMetric(metric.id as typeof selectedMetric)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedMetric === metric.id
                              ? 'text-black'
                              : 'text-slate-100 hover:text-white hover:bg-slate-600'
                          }`}
                          style={selectedMetric === metric.id ? { backgroundColor: getMetricColor(metric.id) } : {}}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Cards */}
              {periodData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['pageViews', 'uniqueVisitors', 'whatsappClicks'] as const).map(metric => {
                    const trend = calculateTrend(periodData, metric)
                    const total = periodData.reduce((sum, d) => sum + d[metric], 0)
                    const colors = {
                      pageViews: { bg: 'bg-slate-800', border: 'border-amber-400/50', text: 'text-amber-300' },
                      uniqueVisitors: { bg: 'bg-slate-800', border: 'border-blue-400/50', text: 'text-blue-300' },
                      whatsappClicks: { bg: 'bg-slate-800', border: 'border-green-400/50', text: 'text-green-300' }
                    }
                    return (
                      <div key={metric} className={`${colors[metric].bg} border ${colors[metric].border} rounded-2xl p-5 shadow-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">{getMetricLabel(metric)}</span>
                          <div className={`flex items-center gap-1 text-sm font-bold ${
                            trend.direction === 'up' ? 'text-green-300' : 
                            trend.direction === 'down' ? 'text-red-300' : 'text-slate-300'
                          }`}>
                            {trend.direction === 'up' && <ArrowUp className="w-4 h-4" />}
                            {trend.direction === 'down' && <ArrowDown className="w-4 h-4" />}
                            {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
                            {trend.value}%
                          </div>
                        </div>
                        <div className={`text-3xl font-bold ${colors[metric].text}`}>{total.toLocaleString()}</div>
                        <div className="text-sm text-slate-200 mt-1">Ukupno u periodu</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Main Chart */}
              <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5" style={{ color: getMetricColor(selectedMetric) }} />
                  {getMetricLabel(selectedMetric)} po {selectedPeriodType === 'daily' ? 'danima' : selectedPeriodType === 'weekly' ? 'nedeljama' : 'mesecima'}
                </h3>
                
                {periodData.length > 0 ? (
                  <div className="relative h-80">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 bottom-12 w-16 flex flex-col justify-between text-xs text-slate-200 text-right pr-2">
                      <span>{Math.max(...periodData.map(d => d[selectedMetric])).toLocaleString()}</span>
                      <span>{Math.round(Math.max(...periodData.map(d => d[selectedMetric])) * 0.75).toLocaleString()}</span>
                      <span>{Math.round(Math.max(...periodData.map(d => d[selectedMetric])) * 0.5).toLocaleString()}</span>
                      <span>{Math.round(Math.max(...periodData.map(d => d[selectedMetric])) * 0.25).toLocaleString()}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart */}
                    <div className="ml-20 h-full pb-12 relative">
                      {/* Grid */}
                      <div className="absolute inset-0 bottom-0 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} className="border-b border-slate-600/50" />
                        ))}
                      </div>
                      
                      {/* Bars */}
                      <div className="h-full flex items-end gap-2">
                        {periodData.slice(-20).map((item, idx) => {
                          const maxValue = Math.max(...periodData.map(d => d[selectedMetric]))
                          const height = maxValue > 0 ? (item[selectedMetric] / maxValue) * 100 : 0
                          return (
                            <div key={item.period} className="flex-1 flex flex-col items-center group relative min-w-0">
                              <div 
                                className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                                style={{ 
                                  height: `${Math.max(2, height)}%`,
                                  background: `linear-gradient(to top, ${getMetricColor(selectedMetric)}99, ${getMetricColor(selectedMetric)})`
                                }}
                              />
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-500 px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                                <div className="font-semibold" style={{ color: getMetricColor(selectedMetric) }}>
                                  {item[selectedMetric].toLocaleString()} {getMetricLabel(selectedMetric).toLowerCase()}
                                </div>
                                <div className="text-slate-200 mt-1">{item.label}</div>
                              </div>
                              {/* X-axis label */}
                              <div className="absolute -bottom-10 text-xs text-slate-200 whitespace-nowrap transform -rotate-45 origin-top-left">
                                {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-300">
                    Nema podataka za izabrani period
                  </div>
                )}
              </div>

              {/* Data Table */}
              {periodData.length > 0 && (
                <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-slate-600 bg-slate-700/50">
                    <h3 className="font-semibold text-white">Detaljna tabela</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-white">Period</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Pregledi</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Posetioci</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">WhatsApp</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-white">Foto klikovi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {periodData.slice().reverse().map(item => (
                          <tr key={item.period} className="hover:bg-slate-700/50">
                            <td className="px-4 py-3 font-medium text-white">{item.label}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 bg-amber-600/30 text-amber-200 rounded text-sm font-medium">
                                {item.pageViews.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded text-sm font-medium">
                                {item.uniqueVisitors.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded text-sm font-medium">
                                {item.whatsappClicks.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-sm font-medium">
                                {item.photoClicks.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-700 font-semibold">
                        <tr>
                          <td className="px-4 py-3 text-white">Ukupno</td>
                          <td className="px-4 py-3 text-right text-amber-300">
                            {periodData.reduce((sum, d) => sum + d.pageViews, 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-300">
                            {periodData.reduce((sum, d) => sum + d.uniqueVisitors, 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-green-300">
                            {periodData.reduce((sum, d) => sum + d.whatsappClicks, 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-purple-300">
                            {periodData.reduce((sum, d) => sum + d.photoClicks, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ponude Tab */}
          {activeTab === 'ponude' && (
            <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ponuda</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white">Pregledi</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white">Posetioci</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white">Prosečno vreme</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white">WhatsApp</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white">Poslednja poseta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {ponudeAnalytics.map(item => (
                    <tr key={item.ponudaId} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.ponudaNaslov}</div>
                        <div className="text-sm text-slate-300">ID: {item.ponudaId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded font-medium">
                          {item.totalViews}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded font-medium">
                          {item.uniqueVisitors}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-100">
                        {formatDuration(item.avgTimeSpent)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded font-medium">
                          {item.whatsappClicks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-200">
                        {item.lastVisit ? formatDate(item.lastVisit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {ponudeAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-300">
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
            <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Datum</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ime kupca</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Kontakt</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Lokacija</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ponuda</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Kampanja</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Validacija</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {pozivi.map(poziv => (
                    <tr key={poziv.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {formatDate(poziv.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {poziv.imekupca || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {poziv.mobtel && (
                            <span className="flex items-center gap-1 text-sm text-slate-100">
                              <Phone className="w-3 h-3 text-green-300" />
                              {poziv.mobtel}
                            </span>
                          )}
                          {poziv.email && (
                            <span className="flex items-center gap-1 text-sm text-slate-200">
                              <Mail className="w-3 h-3 text-slate-300" />
                              {poziv.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {poziv.drzava && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            {poziv.drzava}
                            {poziv.regija && `, ${poziv.regija}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {poziv.ponuda_naslov || (poziv.ponudaid ? `#${poziv.ponudaid}` : '-')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {poziv.kodkampanje || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {poziv.validacija_ag ? (
                          <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded text-xs font-medium">
                            {poziv.validacija_ag}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-600/50 text-slate-300 rounded text-xs">
                            Nije validiran
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pozivi.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-300">
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
            <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Vreme</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Događaj</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ponuda</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Jezik</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Sesija</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Detalji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {recentLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(log.event_type)}`}>
                          {getEventTypeLabel(log.event_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-100">
                        {log.ponuda?.naslovoglasa || `#${log.ponuda_id}`}
                      </td>
                      <td className="px-4 py-3">
                        {log.language && (
                          <span className="px-2 py-1 bg-slate-600 rounded text-xs uppercase font-bold text-white">
                            {log.language}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-200 font-mono">
                        {log.session_id.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-200">
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
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-300">
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
    </div>
  )
}
