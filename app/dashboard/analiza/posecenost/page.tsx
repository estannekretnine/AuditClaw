'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, Eye, Users, Phone, MessageCircle, 
  RefreshCw, TrendingUp, Globe, MapPin, Image, 
  Video, Map, Clock, MousePointer, Languages
} from 'lucide-react'
import { getWebLogReport, type WebLogReport } from '@/lib/actions/analytics'

export default function PosecenostPage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<WebLogReport | null>(null)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getWebLogReport({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setReport(data)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    loadData()
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

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
    '3d_tour_click': <MousePointer className="w-4 h-4" />,
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Analiza Web Log
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Kompletna analiza webstrana_log tabele</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Osveži
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Od datuma</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Do datuma</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Primeni
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setTimeout(loadData, 0)
              }}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : report && (
        <div className="space-y-6">
          {/* KPI Cards - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <Eye className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.totalPageViews.toLocaleString()}</div>
              <div className="text-blue-300 text-sm">Pregledi stranica</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <Users className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.uniqueSessions.toLocaleString()}</div>
              <div className="text-purple-300 text-sm">Jedinstvene sesije</div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
              <MessageCircle className="w-6 h-6 text-green-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.whatsappClicks.toLocaleString()}</div>
              <div className="text-green-300 text-sm">WhatsApp klikovi</div>
            </div>

            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl p-4">
              <Clock className="w-6 h-6 text-amber-400 mb-2" />
              <div className="text-3xl font-bold text-white">{formatDuration(report.avgTimeOnPage)}</div>
              <div className="text-amber-300 text-sm">Prosečno vreme</div>
            </div>
          </div>

          {/* KPI Cards - Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <Image className="w-5 h-5 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{report.photoClicks.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Foto klikovi</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <Video className="w-5 h-5 text-red-400 mb-2" />
              <div className="text-2xl font-bold text-white">{report.videoClicks.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Video klikovi</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <MousePointer className="w-5 h-5 text-violet-400 mb-2" />
              <div className="text-2xl font-bold text-white">{report.tourClicks.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">3D tura klikovi</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <Map className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{report.mapInteractions.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Mapa interakcije</div>
            </div>
          </div>

          {/* Event Types Distribution + Vertical Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Događaji po tipu
              </h2>
              <div className="space-y-3">
                {report.eventDistribution.map(event => {
                  const maxCount = Math.max(...report.eventDistribution.map(e => e.count))
                  const percent = maxCount > 0 ? (event.count / maxCount) * 100 : 0
                  return (
                    <div key={event.eventType} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${eventColors[event.eventType] || 'bg-slate-600/20 text-slate-300 border-slate-600/30'}`}>
                        {eventIcons[event.eventType] || <Eye className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-200 truncate">{eventLabels[event.eventType] || event.eventType}</span>
                          <span className="text-sm font-bold text-white ml-2">{event.count}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vertical Bar Chart - Period Comparison */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Poređenje (30 dana)
              </h2>
              <div className="flex items-end justify-center gap-6 h-48">
                {[
                  { label: 'Posete', curr: report.periodComparison.currentPeriod.pageViews, prev: report.periodComparison.previousPeriod.pageViews, change: report.periodComparison.changePercent.pageViews, color: 'blue' },
                  { label: 'WhatsApp', curr: report.periodComparison.currentPeriod.whatsapp, prev: report.periodComparison.previousPeriod.whatsapp, change: report.periodComparison.changePercent.whatsapp, color: 'green' },
                  { label: 'Foto', curr: report.periodComparison.currentPeriod.photo, prev: report.periodComparison.previousPeriod.photo, change: report.periodComparison.changePercent.photo, color: 'purple' },
                ].map(item => {
                  const max = Math.max(item.curr, item.prev, 1)
                  return (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                      <div className="flex items-end gap-1 h-32">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-slate-500 mb-1">{item.prev}</span>
                          <div 
                            className="w-8 bg-slate-600 rounded-t"
                            style={{ height: `${Math.max(16, (item.prev / max) * 120)}px` }}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-xs text-${item.color}-300 mb-1`}>{item.curr}</span>
                          <div 
                            className={`w-8 bg-${item.color}-500 rounded-t`}
                            style={{ height: `${Math.max(16, (item.curr / max) * 120)}px` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-white">{item.label}</div>
                        <div className={`text-xs font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Geography: Countries + Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Country */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Po zemlji
              </h2>
              {report.byCountry.length > 0 ? (
                <div className="space-y-2">
                  {report.byCountry.slice(0, 8).map((item, idx) => (
                    <div key={item.country} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold text-sm w-5">{idx + 1}</span>
                        <span className="text-white text-sm">{item.country || 'Nepoznato'}</span>
                      </div>
                      <span className="text-cyan-300 font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Nema podataka o zemljama</p>
              )}
            </div>

            {/* By City */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-400" />
                Po gradu
              </h2>
              {report.byCity.length > 0 ? (
                <div className="space-y-2">
                  {report.byCity.slice(0, 8).map((item, idx) => (
                    <div key={item.city} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold text-sm w-5">{idx + 1}</span>
                        <span className="text-white text-sm">{item.city || 'Nepoznato'}</span>
                      </div>
                      <span className="text-pink-300 font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Nema podataka o gradovima</p>
              )}
            </div>
          </div>

          {/* Language + Referrer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Language */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-violet-400" />
                Po jeziku
              </h2>
              {report.byLanguage.length > 0 ? (
                <div className="flex gap-4">
                  {report.byLanguage.map(item => {
                    const langNames: Record<string, string> = { sr: 'Srpski', en: 'Engleski', de: 'Nemački' }
                    const langColors: Record<string, string> = { sr: 'bg-blue-500', en: 'bg-green-500', de: 'bg-amber-500' }
                    const total = report.byLanguage.reduce((sum, l) => sum + l.count, 0)
                    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0
                    return (
                      <div key={item.language} className="flex-1 text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full ${langColors[item.language] || 'bg-slate-500'} flex items-center justify-center mb-2`}>
                          <span className="text-white font-bold text-lg">{percent}%</span>
                        </div>
                        <div className="text-white font-medium">{langNames[item.language] || item.language.toUpperCase()}</div>
                        <div className="text-slate-400 text-sm">{item.count} poseta</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Nema podataka o jezicima</p>
              )}
            </div>

            {/* Top Referrers */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Top referreri
              </h2>
              {report.topReferrers.length > 0 ? (
                <div className="space-y-2">
                  {report.topReferrers.slice(0, 6).map((item, idx) => (
                    <div key={item.referrer} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-amber-400 font-bold text-sm w-5">{idx + 1}</span>
                        <span className="text-white text-sm truncate">{item.referrer || 'Direktno'}</span>
                      </div>
                      <span className="text-green-300 font-bold ml-2">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Nema podataka o referrerima</p>
              )}
            </div>
          </div>

          {/* Top Ponude */}
          {report.topPonude.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Top ponude po posećenosti</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Ponuda</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Poslato</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Posete</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Sesije</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">WhatsApp</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Foto</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Kontakt</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Vreme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {report.topPonude.slice(0, 10).map((ponuda, idx) => (
                      <tr key={ponuda.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-amber-400 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium truncate max-w-[250px]">{ponuda.naslov}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-sm font-medium">
                            {ponuda.poslato}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200">{ponuda.pageViews}</td>
                        <td className="px-4 py-3 text-right text-blue-300">{ponuda.uniqueSessions}</td>
                        <td className="px-4 py-3 text-right text-green-300">{ponuda.whatsappClicks}</td>
                        <td className="px-4 py-3 text-right text-purple-300">{ponuda.photoClicks}</td>
                        <td className={`px-4 py-3 text-right font-bold ${ponuda.kontakt > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{ponuda.kontakt}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatDuration(ponuda.avgTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Chart */}
          {report.dailyStats.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Dnevna statistika (poslednjih 14 dana)</h2>
              <div className="flex items-end gap-1 h-40">
                {report.dailyStats.slice(-14).map(day => {
                  const maxViews = Math.max(...report.dailyStats.slice(-14).map(d => d.pageViews), 1)
                  const height = (day.pageViews / maxViews) * 100
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-amber-500/80 rounded-t hover:bg-amber-400 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(4, height)}px` }}
                        />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-600 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="text-amber-300 font-bold">{day.pageViews} poseta</div>
                          <div className="text-slate-400">{new Date(day.date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })}</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 mt-1 hidden md:block">
                        {new Date(day.date).toLocaleDateString('sr-RS', { day: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
