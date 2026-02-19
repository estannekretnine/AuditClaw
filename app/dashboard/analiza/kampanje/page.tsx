'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Target, Users, Globe, MessageCircle, Phone, 
  RefreshCw, TrendingUp, ArrowUpRight, BarChart3, ChevronDown, ChevronRight,
  Calendar, Search, Filter
} from 'lucide-react'
import { 
  getKampanjeAnalytics, 
  getPonudeForKampanje,
  type KampanjaAnalytics,
  type PonudaOption
} from '@/lib/actions/analytics'

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
  const [loading, setLoading] = useState(false)
  const [loadingPonude, setLoadingPonude] = useState(true)
  const [ponudeOptions, setPonudeOptions] = useState<PonudaOption[]>([])
  const [kampanje, setKampanje] = useState<KampanjaAnalytics[]>([])
  const [expandedPonude, setExpandedPonude] = useState<Set<number>>(new Set())
  const [dataLoaded, setDataLoaded] = useState(false)

  const [selectedPonuda, setSelectedPonuda] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadPonudeOptions()
  }, [])

  const loadPonudeOptions = async () => {
    setLoadingPonude(true)
    try {
      const ponude = await getPonudeForKampanje()
      setPonudeOptions(ponude)
    } finally {
      setLoadingPonude(false)
    }
  }

  const loadData = async () => {
    if (!selectedPonuda) return
    
    setLoading(true)
    try {
      const data = await getKampanjeAnalytics({
        ponudaId: selectedPonuda,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setKampanje(data)
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
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

  const selectedPonudaNaslov = ponudeOptions.find(p => p.id === selectedPonuda)?.naslovoglasa

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            Analiza Kampanja
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Izaberite ponudu i period za prikaz statistike</p>
        </div>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Filteri</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-2">Ponuda *</label>
            {loadingPonude ? (
              <div className="flex items-center gap-2 text-slate-400 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Učitavanje ponuda...
              </div>
            ) : (
              <select
                value={selectedPonuda || ''}
                onChange={(e) => setSelectedPonuda(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                required
              >
                <option value="">-- Izaberite ponudu --</option>
                {ponudeOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.naslovoglasa}</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Od datuma
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Do datuma
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!selectedPonuda || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Prikaži statistiku
          </button>
        </div>
      </form>

      {/* Initial State - No Data */}
      {!dataLoaded && !loading && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Izaberite ponudu</h3>
          <p className="text-slate-500">Izaberite ponudu iz liste iznad da biste videli statistiku kampanja i totale.</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Data Display */}
      {dataLoaded && !loading && (
        <div className="space-y-6">
          {/* Selected Ponuda Header */}
          <div className="bg-gradient-to-r from-amber-600/20 to-amber-800/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPonudaNaslov}</h2>
                <p className="text-amber-300/70 text-sm mt-1">
                  {dateFrom && dateTo ? `Period: ${dateFrom} - ${dateTo}` : 
                   dateFrom ? `Od: ${dateFrom}` :
                   dateTo ? `Do: ${dateTo}` :
                   'Svi podaci'}
                </p>
              </div>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Osveži
              </button>
            </div>
          </div>

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
          {kampanje.length > 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Kampanje ({kampanje.length})
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 text-xs">
                      <th className="text-left py-3 px-4">Kampanja</th>
                      <th className="text-right py-3 px-4">Poslato</th>
                      <th className="text-right py-3 px-4">Na sajt</th>
                      <th className="text-right py-3 px-4">WhatsApp</th>
                      <th className="text-right py-3 px-4">Kontakt</th>
                      <th className="text-right py-3 px-4">Konverzija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {kampanje.map((k) => (
                      <tr key={k.kampanjaId} className="hover:bg-slate-700/20">
                        <td className="py-3 px-4 text-amber-400 font-mono">{k.kodKampanje}</td>
                        <td className="py-3 px-4 text-right text-blue-300">{k.kupacaPoslato}</td>
                        <td className="py-3 px-4 text-right text-purple-300">{k.dosliNaSajt}</td>
                        <td className="py-3 px-4 text-right text-green-300">{k.whatsappKlikovi}</td>
                        <td className={`py-3 px-4 text-right font-bold ${k.kontaktPoslat > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {k.kontaktPoslat}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {k.conversionRate > 0 ? `${k.conversionRate}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900/70 font-semibold">
                      <td className="py-3 px-4 text-white">UKUPNO</td>
                      <td className="py-3 px-4 text-right text-blue-300">{totals.kupacaPoslato}</td>
                      <td className="py-3 px-4 text-right text-purple-300">{totals.dosliNaSajt}</td>
                      <td className="py-3 px-4 text-right text-green-300">{totals.whatsappKlikovi}</td>
                      <td className={`py-3 px-4 text-right font-bold ${totals.kontaktPoslat > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {totals.kontaktPoslat}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {totals.kupacaPoslato > 0 ? `${Math.round((totals.kontaktPoslat / totals.kupacaPoslato) * 100)}%` : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Nema kampanja za izabranu ponudu</p>
            </div>
          )}

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
