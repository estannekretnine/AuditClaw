'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, RefreshCw, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Image, MessageCircle, Video, Map, Clock, Globe, MapPin,
  Monitor, Languages, X, ExternalLink
} from 'lucide-react'
import {
  getWebLogs,
  getWebLogFiltersData,
  type WebLogEntry,
  type WebLogFilter
} from '@/lib/actions/analytics'

const eventLabels: Record<string, string> = {
  'page_view': 'Pregled stranice',
  'photo_click': 'Klik na foto',
  'language_change': 'Promena jezika',
  'whatsapp_click': 'WhatsApp klik',
  'video_click': 'Video klik',
  '3d_tour_click': '3D tura klik',
  'map_interaction': 'Interakcija sa mapom',
  'page_leave': 'Napuštanje stranice'
}

const eventIcons: Record<string, React.ReactNode> = {
  'page_view': <Eye className="w-4 h-4" />,
  'photo_click': <Image className="w-4 h-4" />,
  'language_change': <Languages className="w-4 h-4" />,
  'whatsapp_click': <MessageCircle className="w-4 h-4" />,
  'video_click': <Video className="w-4 h-4" />,
  '3d_tour_click': <Monitor className="w-4 h-4" />,
  'map_interaction': <Map className="w-4 h-4" />,
  'page_leave': <Clock className="w-4 h-4" />
}

const eventColors: Record<string, string> = {
  'page_view': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'photo_click': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'language_change': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'whatsapp_click': 'bg-green-500/20 text-green-300 border-green-500/30',
  'video_click': 'bg-red-500/20 text-red-300 border-red-500/30',
  '3d_tour_click': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'map_interaction': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'page_leave': 'bg-slate-500/20 text-slate-300 border-slate-500/30'
}

interface FiltersData {
  ponude: Array<{ id: number; naslovoglasa: string | null }>
  kampanje: Array<{ id: number; kodkampanje: string | null }>
  countries: string[]
  cities: string[]
  eventTypes: string[]
  languages: string[]
}

export default function LogStranePage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<WebLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(50)
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<WebLogEntry | null>(null)

  const [filters, setFilters] = useState<WebLogFilter>({})
  const [searchTerm, setSearchTerm] = useState('')

  const loadFiltersData = useCallback(async () => {
    const data = await getWebLogFiltersData()
    setFiltersData(data)
  }, [])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getWebLogs(filters, page, pageSize)
      setLogs(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    loadFiltersData()
  }, [loadFiltersData])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    setPage(1)
  }

  const handleFilterChange = (key: keyof WebLogFilter, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return '-'
    if (ua.includes('Mobile')) return 'Mobile'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Desktop'
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Log Strane
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Detaljan pregled svih logova web stranice</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              showFilters || hasActiveFilters
                ? 'bg-amber-500 text-black'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filteri
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                {Object.values(filters).filter(v => v !== undefined).length}
              </span>
            )}
          </button>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Osveži
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Filteri</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Očisti sve
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Pretraga</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Session ID, IP, Referrer..."
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-3 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Od datuma</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Do datuma</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Ponuda */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ponuda</label>
              <select
                value={filters.ponudaId || ''}
                onChange={(e) => handleFilterChange('ponudaId', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Sve ponude</option>
                {filtersData?.ponude.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.naslovoglasa || `Ponuda #${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Kampanja */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Kampanja</label>
              <select
                value={filters.kampanjaId || ''}
                onChange={(e) => handleFilterChange('kampanjaId', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Sve kampanje</option>
                {filtersData?.kampanje.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.kodkampanje || `#${k.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tip događaja</label>
              <select
                value={filters.eventType || ''}
                onChange={(e) => handleFilterChange('eventType', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Svi tipovi</option>
                {filtersData?.eventTypes.map(et => (
                  <option key={et} value={et}>{eventLabels[et] || et}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Jezik</label>
              <select
                value={filters.language || ''}
                onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Svi jezici</option>
                {filtersData?.languages.map(l => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Država</label>
              <select
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Sve države</option>
                {filtersData?.countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Grad</label>
              <select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Svi gradovi</option>
                {filtersData?.cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-slate-300">
            Ukupno: <span className="text-white font-bold">{total.toLocaleString()}</span> zapisa
          </div>
          <div className="text-slate-400 text-sm">
            Stranica {page} od {totalPages}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nema logova za prikaz</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Vreme</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Događaj</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Ponuda</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Lokacija</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Jezik</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Uređaj</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Vreme (s)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Detalji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${eventColors[log.event_type] || 'bg-slate-500/20 text-slate-300'}`}>
                          {eventIcons[log.event_type]}
                          {eventLabels[log.event_type] || log.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">
                        {log.ponuda?.naslovoglasa || `#${log.ponuda_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          {log.country && <Globe className="w-3 h-3 text-slate-500" />}
                          <span>{log.city || log.country || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.language ? (
                          <span className="px-2 py-0.5 bg-slate-600 rounded text-xs font-medium text-white uppercase">
                            {log.language}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatUserAgent(log.user_agent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-center">
                        {log.time_spent_seconds || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-600 rounded transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-700">
              {logs.map((log) => (
                <div key={log.id} className="p-4" onClick={() => setSelectedLog(log)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${eventColors[log.event_type] || 'bg-slate-500/20 text-slate-300'}`}>
                      {eventIcons[log.event_type]}
                      {eventLabels[log.event_type] || log.event_type}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-sm text-white truncate mb-2">
                    {log.ponuda?.naslovoglasa || `Ponuda #${log.ponuda_id}`}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {log.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {log.city}
                      </span>
                    )}
                    {log.language && (
                      <span className="uppercase">{log.language}</span>
                    )}
                    {log.time_spent_seconds && (
                      <span>{log.time_spent_seconds}s</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-700/30">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prethodna
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-600 text-white hover:bg-slate-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sledeća
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setSelectedLog(null)}>
          <div 
            className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Detalji loga #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Vreme</label>
                  <p className="text-white">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Tip događaja</label>
                  <p>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${eventColors[selectedLog.event_type] || 'bg-slate-500/20 text-slate-300'}`}>
                      {eventIcons[selectedLog.event_type]}
                      {eventLabels[selectedLog.event_type] || selectedLog.event_type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Session ID</label>
                  <p className="text-white font-mono text-sm break-all">{selectedLog.session_id}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Ponuda</label>
                  <p className="text-white">{selectedLog.ponuda?.naslovoglasa || `#${selectedLog.ponuda_id}`}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Kampanja</label>
                  <p className="text-white">{selectedLog.kampanja?.kodkampanje || (selectedLog.kampanja_id ? `#${selectedLog.kampanja_id}` : '-')}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Jezik</label>
                  <p className="text-white">{selectedLog.language?.toUpperCase() || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Država</label>
                  <p className="text-white">{selectedLog.country || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Grad</label>
                  <p className="text-white">{selectedLog.city || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">IP Adresa</label>
                  <p className="text-white font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Vreme na stranici</label>
                  <p className="text-white">{selectedLog.time_spent_seconds ? `${selectedLog.time_spent_seconds}s` : '-'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase">User Agent</label>
                <p className="text-white text-sm break-all bg-slate-700/50 p-2 rounded mt-1">
                  {selectedLog.user_agent || '-'}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase">Referrer</label>
                <p className="text-white text-sm break-all bg-slate-700/50 p-2 rounded mt-1">
                  {selectedLog.referrer || 'Direktan pristup'}
                </p>
              </div>

              {selectedLog.event_data && Object.keys(selectedLog.event_data).length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Event Data (JSON)</label>
                  <pre className="text-white text-xs bg-slate-700/50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.event_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
