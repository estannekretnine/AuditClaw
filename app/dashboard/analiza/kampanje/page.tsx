'use client'

import { useState, useEffect } from 'react'
import { 
  Target, Users, Globe, MessageCircle, Phone, 
  RefreshCw, TrendingUp, ArrowUpRight
} from 'lucide-react'
import { getKampanjeAnalytics, type KampanjaAnalytics } from '@/lib/actions/analytics'

export default function KampanjePage() {
  const [loading, setLoading] = useState(true)
  const [kampanje, setKampanje] = useState<KampanjaAnalytics[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getKampanjeAnalytics()
      setKampanje(data)
    } finally {
      setLoading(false)
    }
  }

  const totals = kampanje.reduce((acc, k) => ({
    kupacaPoslato: acc.kupacaPoslato + k.kupacaPoslato,
    dosliNaSajt: acc.dosliNaSajt + k.dosliNaSajt,
    whatsappKlikovi: acc.whatsappKlikovi + k.whatsappKlikovi,
    kontaktPoslat: acc.kontaktPoslat + k.kontaktPoslat
  }), { kupacaPoslato: 0, dosliNaSajt: 0, whatsappKlikovi: 0, kontaktPoslat: 0 })

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Analiza Kampanja
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Statistika kupaca po kampanjama</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <Users className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-white">{totals.kupacaPoslato.toLocaleString()}</div>
              <div className="text-blue-300 text-sm">Kupaca poslato</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <Globe className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-3xl font-bold text-white">{totals.dosliNaSajt.toLocaleString()}</div>
              <div className="text-purple-300 text-sm">Došli na sajt</div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
              <MessageCircle className="w-6 h-6 text-green-400 mb-2" />
              <div className="text-3xl font-bold text-white">{totals.whatsappKlikovi.toLocaleString()}</div>
              <div className="text-green-300 text-sm">WhatsApp klikovi</div>
            </div>

            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl p-4">
              <Phone className="w-6 h-6 text-amber-400 mb-2" />
              <div className="text-3xl font-bold text-white">{totals.kontaktPoslat.toLocaleString()}</div>
              <div className="text-amber-300 text-sm">Kontakt poslat</div>
            </div>
          </div>

          {/* Kampanje Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Kupci po kampanji
              </h2>
            </div>
            
            {kampanje.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nema aktivnih kampanja</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Kampanja</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Ponuda</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="w-4 h-4" />
                            Poslato
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                          <div className="flex items-center justify-end gap-1">
                            <Globe className="w-4 h-4" />
                            Na sajt
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                          <div className="flex items-center justify-end gap-1">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">
                          <div className="flex items-center justify-end gap-1">
                            <Phone className="w-4 h-4" />
                            Kontakt
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Konverzija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {kampanje.map((k) => (
                        <tr key={k.kampanjaId} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3">
                            <span className="text-amber-400 font-mono font-medium">{k.kodKampanje}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 truncate max-w-[200px]">
                            {k.ponudaNaslov || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-sm font-medium">
                              {k.kupacaPoslato}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-medium">
                              {k.dosliNaSajt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-sm font-medium">
                              {k.whatsappKlikovi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 bg-amber-600/20 text-amber-300 rounded text-sm font-medium">
                              {k.kontaktPoslat}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-1 rounded text-sm font-bold ${
                              k.conversionRate >= 10 ? 'bg-green-600/30 text-green-300' :
                              k.conversionRate >= 5 ? 'bg-amber-600/30 text-amber-300' :
                              k.conversionRate > 0 ? 'bg-slate-600/50 text-slate-300' :
                              'text-slate-500'
                            }`}>
                              {k.conversionRate > 0 ? `${k.conversionRate}%` : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-700/50 font-semibold">
                      <tr>
                        <td className="px-4 py-3 text-white" colSpan={2}>Ukupno</td>
                        <td className="px-4 py-3 text-right text-blue-300">{totals.kupacaPoslato}</td>
                        <td className="px-4 py-3 text-right text-purple-300">{totals.dosliNaSajt}</td>
                        <td className="px-4 py-3 text-right text-green-300">{totals.whatsappKlikovi}</td>
                        <td className="px-4 py-3 text-right text-amber-300">{totals.kontaktPoslat}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {totals.kupacaPoslato > 0 
                            ? `${Math.round((totals.kontaktPoslat / totals.kupacaPoslato) * 10000) / 100}%` 
                            : '-'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-700">
                  {kampanje.map((k) => (
                    <div key={k.kampanjaId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-amber-400 font-mono font-bold">{k.kodKampanje}</span>
                        {k.conversionRate > 0 && (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            k.conversionRate >= 10 ? 'bg-green-600/30 text-green-300' :
                            k.conversionRate >= 5 ? 'bg-amber-600/30 text-amber-300' :
                            'bg-slate-600/50 text-slate-300'
                          }`}>
                            {k.conversionRate}%
                          </span>
                        )}
                      </div>
                      {k.ponudaNaslov && (
                        <p className="text-slate-400 text-sm mb-3 truncate">{k.ponudaNaslov}</p>
                      )}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-blue-600/10 rounded-lg p-2">
                          <div className="text-blue-300 font-bold">{k.kupacaPoslato}</div>
                          <div className="text-xs text-slate-500">Poslato</div>
                        </div>
                        <div className="bg-purple-600/10 rounded-lg p-2">
                          <div className="text-purple-300 font-bold">{k.dosliNaSajt}</div>
                          <div className="text-xs text-slate-500">Na sajt</div>
                        </div>
                        <div className="bg-green-600/10 rounded-lg p-2">
                          <div className="text-green-300 font-bold">{k.whatsappKlikovi}</div>
                          <div className="text-xs text-slate-500">WA</div>
                        </div>
                        <div className="bg-amber-600/10 rounded-lg p-2">
                          <div className="text-amber-300 font-bold">{k.kontaktPoslat}</div>
                          <div className="text-xs text-slate-500">Kontakt</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Funnel Visualization */}
          {totals.kupacaPoslato > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
                Funnel konverzije
              </h2>
              <div className="flex items-center justify-between gap-4">
                {[
                  { label: 'Poslato', value: totals.kupacaPoslato, color: 'blue', percent: 100 },
                  { label: 'Na sajt', value: totals.dosliNaSajt, color: 'purple', percent: Math.round((totals.dosliNaSajt / totals.kupacaPoslato) * 100) },
                  { label: 'WhatsApp', value: totals.whatsappKlikovi, color: 'green', percent: Math.round((totals.whatsappKlikovi / totals.kupacaPoslato) * 100) },
                  { label: 'Kontakt', value: totals.kontaktPoslat, color: 'amber', percent: Math.round((totals.kontaktPoslat / totals.kupacaPoslato) * 100) },
                ].map((step, idx) => (
                  <div key={step.label} className="flex-1 text-center">
                    <div 
                      className={`mx-auto mb-2 rounded-lg bg-${step.color}-500/20 border border-${step.color}-500/30 flex items-center justify-center transition-all`}
                      style={{ 
                        width: `${Math.max(60, step.percent)}%`,
                        height: '80px'
                      }}
                    >
                      <span className={`text-2xl font-bold text-${step.color}-300`}>{step.value}</span>
                    </div>
                    <div className="text-sm text-white font-medium">{step.label}</div>
                    <div className="text-xs text-slate-400">{step.percent}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
