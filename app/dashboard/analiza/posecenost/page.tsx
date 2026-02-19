'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, Eye, Users, Phone, MessageCircle, 
  RefreshCw, TrendingUp, Download
} from 'lucide-react'
import { getSyntheticReport, type SyntheticReport } from '@/lib/actions/analytics'

export default function PosecenostPage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<SyntheticReport | null>(null)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getSyntheticReport({
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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Analiza Posećenosti
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Pregled aktivnosti korisnika</p>
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <Eye className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.totalVisits.toLocaleString()}</div>
              <div className="text-blue-300 text-sm">Ukupno poseta</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <Users className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.uniqueVisitors.toLocaleString()}</div>
              <div className="text-purple-300 text-sm">Jedinstveni</div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
              <MessageCircle className="w-6 h-6 text-green-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.totalWhatsappClicks.toLocaleString()}</div>
              <div className="text-green-300 text-sm">WhatsApp ({report.whatsappConversionRate}%)</div>
            </div>

            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl p-4">
              <Phone className="w-6 h-6 text-amber-400 mb-2" />
              <div className="text-3xl font-bold text-white">{report.totalPozivi.toLocaleString()}</div>
              <div className="text-amber-300 text-sm">Pozivi ({report.poziviConversionRate}%)</div>
            </div>
          </div>

          {/* Vertical Bar Chart - Period Comparison */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Poređenje perioda (30 dana)
            </h2>
            
            <div className="flex items-end justify-center gap-8 h-64">
              {/* Posete */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-2 h-48">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-1">{report.periodComparison.previousPeriod.visits}</span>
                    <div 
                      className="w-12 bg-slate-600 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.previousPeriod.visits / Math.max(report.periodComparison.currentPeriod.visits, report.periodComparison.previousPeriod.visits, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-slate-500 mt-1">Pre</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-blue-300 mb-1">{report.periodComparison.currentPeriod.visits}</span>
                    <div 
                      className="w-12 bg-blue-500 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.currentPeriod.visits / Math.max(report.periodComparison.currentPeriod.visits, report.periodComparison.previousPeriod.visits, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-blue-400 mt-1">Sad</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">Posete</div>
                  <div className={`text-xs font-bold ${report.periodComparison.changePercent.visits >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.periodComparison.changePercent.visits >= 0 ? '+' : ''}{report.periodComparison.changePercent.visits}%
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-2 h-48">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-1">{report.periodComparison.previousPeriod.whatsapp}</span>
                    <div 
                      className="w-12 bg-slate-600 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.previousPeriod.whatsapp / Math.max(report.periodComparison.currentPeriod.whatsapp, report.periodComparison.previousPeriod.whatsapp, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-slate-500 mt-1">Pre</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-green-300 mb-1">{report.periodComparison.currentPeriod.whatsapp}</span>
                    <div 
                      className="w-12 bg-green-500 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.currentPeriod.whatsapp / Math.max(report.periodComparison.currentPeriod.whatsapp, report.periodComparison.previousPeriod.whatsapp, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-green-400 mt-1">Sad</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className={`text-xs font-bold ${report.periodComparison.changePercent.whatsapp >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.periodComparison.changePercent.whatsapp >= 0 ? '+' : ''}{report.periodComparison.changePercent.whatsapp}%
                  </div>
                </div>
              </div>

              {/* Pozivi */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-2 h-48">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-1">{report.periodComparison.previousPeriod.pozivi}</span>
                    <div 
                      className="w-12 bg-slate-600 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.previousPeriod.pozivi / Math.max(report.periodComparison.currentPeriod.pozivi, report.periodComparison.previousPeriod.pozivi, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-slate-500 mt-1">Pre</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-amber-300 mb-1">{report.periodComparison.currentPeriod.pozivi}</span>
                    <div 
                      className="w-12 bg-amber-500 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max(20, (report.periodComparison.currentPeriod.pozivi / Math.max(report.periodComparison.currentPeriod.pozivi, report.periodComparison.previousPeriod.pozivi, 1)) * 180)}px` 
                      }}
                    />
                    <span className="text-xs text-amber-400 mt-1">Sad</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">Pozivi</div>
                  <div className={`text-xs font-bold ${report.periodComparison.changePercent.pozivi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.periodComparison.changePercent.pozivi >= 0 ? '+' : ''}{report.periodComparison.changePercent.pozivi}%
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded" />
                <span className="text-xs text-slate-400">Prethodnih 30 dana</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-slate-400">Trenutnih 30 dana</span>
              </div>
            </div>
          </div>

          {/* Top 5 Ponuda */}
          {report.topPonude.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Top 5 Ponuda</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Ponuda</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Posete</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Jedinstveni</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">WhatsApp</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Pozivi</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Konverzija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {report.topPonude.slice(0, 5).map((ponuda, idx) => (
                      <tr key={ponuda.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-amber-400 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium truncate max-w-[200px]">{ponuda.naslov}</td>
                        <td className="px-4 py-3 text-right text-slate-200">{ponuda.visits}</td>
                        <td className="px-4 py-3 text-right text-blue-300">{ponuda.uniqueVisitors}</td>
                        <td className="px-4 py-3 text-right text-green-300">{ponuda.whatsappClicks}</td>
                        <td className="px-4 py-3 text-right text-amber-300">{ponuda.pozivi}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            ponuda.conversionRate >= 10 ? 'bg-green-600/30 text-green-300' :
                            ponuda.conversionRate >= 5 ? 'bg-amber-600/30 text-amber-300' :
                            'bg-slate-600/50 text-slate-300'
                          }`}>
                            {ponuda.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-300">{report.returningVisitors}</div>
              <div className="text-sm text-slate-400">Povratni posetioci</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-pink-300">{report.avgVisitsPerUser}</div>
              <div className="text-sm text-slate-400">Prosek poseta/korisnik</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-300">{formatDuration(report.avgTimeOnPage)}</div>
              <div className="text-sm text-slate-400">Prosečno vreme</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
