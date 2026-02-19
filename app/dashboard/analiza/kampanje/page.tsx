'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Target, Users, Globe, MessageCircle, Phone, 
  RefreshCw, TrendingUp, ArrowUpRight, BarChart3, ChevronDown, ChevronRight
} from 'lucide-react'
import { getKampanjeAnalytics, type KampanjaAnalytics } from '@/lib/actions/analytics'

interface PonudaSummary {
  ponudaId: number
  ponudaNaslov: string
  kampanje: KampanjaAnalytics[]
  totals: {
    kupacaPoslato: number
    dosliNaSajt: number
    whatsappKlikovi: number
    kontaktPoslat: number
  }
}

export default function KampanjePage() {
  const [loading, setLoading] = useState(true)
  const [kampanje, setKampanje] = useState<KampanjaAnalytics[]>([])
  const [expandedPonude, setExpandedPonude] = useState<Set<number>>(new Set())

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

  const poPonudi = useMemo(() => {
    const map = new Map<number, PonudaSummary>()
    kampanje.forEach(k => {
      if (!map.has(k.ponudaId)) {
        map.set(k.ponudaId, {
          ponudaId: k.ponudaId,
          ponudaNaslov: k.ponudaNaslov,
          kampanje: [],
          totals: { kupacaPoslato: 0, dosliNaSajt: 0, whatsappKlikovi: 0, kontaktPoslat: 0 }
        })
      }
      const entry = map.get(k.ponudaId)!
      entry.kampanje.push(k)
      entry.totals.kupacaPoslato += k.kupacaPoslato
      entry.totals.dosliNaSajt += k.dosliNaSajt
      entry.totals.whatsappKlikovi += k.whatsappKlikovi
      entry.totals.kontaktPoslat += k.kontaktPoslat
    })
    return Array.from(map.values()).sort((a, b) => b.totals.kupacaPoslato - a.totals.kupacaPoslato)
  }, [kampanje])

  const togglePonuda = (ponudaId: number) => {
    setExpandedPonude(prev => {
      const next = new Set(prev)
      if (next.has(ponudaId)) {
        next.delete(ponudaId)
      } else {
        next.add(ponudaId)
      }
      return next
    })
  }

  const maxPoslato = Math.max(...poPonudi.map(p => p.totals.kupacaPoslato), 1)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Analiza Kampanja
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Statistika kupaca po kampanjama i ponudama</p>
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

          {/* Po ponudi - Grafikon */}
          {poPonudi.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Statistika po ponudi
              </h2>
              <div className="space-y-3">
                {poPonudi.slice(0, 10).map((p) => (
                  <div key={p.ponudaId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 truncate max-w-[200px]">{p.ponudaNaslov}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-blue-300">{p.totals.kupacaPoslato} poslato</span>
                        <span className="text-purple-300">{p.totals.dosliNaSajt} sajt</span>
                        <span className="text-green-300">{p.totals.whatsappKlikovi} WA</span>
                        <span className={p.totals.kontaktPoslat > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{p.totals.kontaktPoslat} kontakt</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div 
                        className="bg-blue-500/60 rounded-l"
                        style={{ width: `${(p.totals.kupacaPoslato / maxPoslato) * 100}%` }}
                        title={`Poslato: ${p.totals.kupacaPoslato}`}
                      />
                      <div 
                        className="bg-purple-500/60"
                        style={{ width: `${(p.totals.dosliNaSajt / maxPoslato) * 100}%` }}
                        title={`Na sajt: ${p.totals.dosliNaSajt}`}
                      />
                      <div 
                        className="bg-green-500/60"
                        style={{ width: `${(p.totals.whatsappKlikovi / maxPoslato) * 100}%` }}
                        title={`WhatsApp: ${p.totals.whatsappKlikovi}`}
                      />
                      <div 
                        className={`rounded-r ${p.totals.kontaktPoslat > 0 ? 'bg-emerald-500/80' : 'bg-slate-600/40'}`}
                        style={{ width: `${Math.max((p.totals.kontaktPoslat / maxPoslato) * 100, p.totals.kontaktPoslat > 0 ? 2 : 0)}%` }}
                        title={`Kontakt: ${p.totals.kontaktPoslat}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500/60 rounded" /> Poslato</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500/60 rounded" /> Na sajt</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/60 rounded" /> WhatsApp</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500/80 rounded" /> Kontakt</span>
              </div>
            </div>
          )}

          {/* Po ponudi - Expandable List */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Po ponudi (detalji)
              </h2>
            </div>
            
            {poPonudi.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nema kampanja sa ponudom</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {poPonudi.map((p) => (
                  <div key={p.ponudaId}>
                    <button
                      onClick={() => togglePonuda(p.ponudaId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedPonude.has(p.ponudaId) ? (
                          <ChevronDown className="w-5 h-5 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                        <span className="text-white font-medium truncate max-w-[300px]">{p.ponudaNaslov}</span>
                        <span className="text-slate-500 text-sm">({p.kampanje.length} kampanja)</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">{p.totals.kupacaPoslato}</span>
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded">{p.totals.dosliNaSajt}</span>
                        <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded">{p.totals.whatsappKlikovi}</span>
                        <span className={`px-2 py-1 rounded font-bold ${p.totals.kontaktPoslat > 0 ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-600/20 text-slate-500'}`}>
                          {p.totals.kontaktPoslat}
                        </span>
                      </div>
                    </button>
                    {expandedPonude.has(p.ponudaId) && (
                      <div className="bg-slate-900/50 px-4 py-2">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-400 text-xs">
                              <th className="text-left py-2 pl-8">Kampanja</th>
                              <th className="text-right py-2">Poslato</th>
                              <th className="text-right py-2">Na sajt</th>
                              <th className="text-right py-2">WhatsApp</th>
                              <th className="text-right py-2">Kontakt</th>
                              <th className="text-right py-2 pr-2">Konverzija</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.kampanje.map((k) => (
                              <tr key={k.kampanjaId} className="border-t border-slate-700/50">
                                <td className="py-2 pl-8 text-amber-400 font-mono">{k.kodKampanje}</td>
                                <td className="py-2 text-right text-blue-300">{k.kupacaPoslato}</td>
                                <td className="py-2 text-right text-purple-300">{k.dosliNaSajt}</td>
                                <td className="py-2 text-right text-green-300">{k.whatsappKlikovi}</td>
                                <td className={`py-2 text-right font-bold ${k.kontaktPoslat > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  {k.kontaktPoslat}
                                </td>
                                <td className="py-2 text-right pr-2 text-slate-300">
                                  {k.conversionRate > 0 ? `${k.conversionRate}%` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                  { label: 'Kontakt', value: totals.kontaktPoslat, color: 'emerald', percent: Math.round((totals.kontaktPoslat / totals.kupacaPoslato) * 100) },
                ].map((step) => (
                  <div key={step.label} className="flex-1 text-center">
                    <div 
                      className={`mx-auto mb-2 rounded-lg flex items-center justify-center transition-all ${
                        step.color === 'blue' ? 'bg-blue-500/20 border border-blue-500/30' :
                        step.color === 'purple' ? 'bg-purple-500/20 border border-purple-500/30' :
                        step.color === 'green' ? 'bg-green-500/20 border border-green-500/30' :
                        'bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                      style={{ 
                        width: `${Math.max(60, step.percent)}%`,
                        height: '80px'
                      }}
                    >
                      <span className={`text-2xl font-bold ${
                        step.color === 'blue' ? 'text-blue-300' :
                        step.color === 'purple' ? 'text-purple-300' :
                        step.color === 'green' ? 'text-green-300' :
                        'text-emerald-300'
                      }`}>{step.value}</span>
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
