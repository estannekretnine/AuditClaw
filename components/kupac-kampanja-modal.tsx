'use client'

import { useState, useEffect } from 'react'
import { X, Users, Shuffle, Trash2, RefreshCw, Mail, Phone, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react'
import { 
  getKupciCountForImport, 
  addRandomKupciToKampanja, 
  getKupciForKampanja,
  removeKupacFromKampanja 
} from '@/lib/actions/kupac-import'
import type { Kampanja } from '@/lib/types/kampanja'
import type { KupacKampanjaWithDetails } from '@/lib/types/kupac-import'

interface KupacKampanjaModalProps {
  isOpen: boolean
  onClose: () => void
  kampanja: Kampanja
}

export default function KupacKampanjaModal({ isOpen, onClose, kampanja }: KupacKampanjaModalProps) {
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [totalKupci, setTotalKupci] = useState(0)
  const [kupciKampanja, setKupciKampanja] = useState<KupacKampanjaWithDetails[]>([])
  const [randomCount, setRandomCount] = useState(100)
  const [result, setResult] = useState<{ added: number; error: string | null } | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, kampanja.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [countResult, kupciResult] = await Promise.all([
        getKupciCountForImport(),
        getKupciForKampanja(kampanja.id)
      ])
      setTotalKupci(countResult.count)
      if (kupciResult.data) {
        setKupciKampanja(kupciResult.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddRandom = async () => {
    if (randomCount <= 0) return

    setAdding(true)
    setResult(null)

    try {
      const res = await addRandomKupciToKampanja(kampanja.id, randomCount)
      setResult(res)
      if (res.added > 0) {
        await loadData()
      }
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: number) => {
    setRemovingId(id)
    try {
      const res = await removeKupacFromKampanja(id)
      if (!res.error) {
        setKupciKampanja(prev => prev.filter(k => k.id !== id))
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (!isOpen) return null

  const availableKupci = totalKupci - kupciKampanja.length

  // Generiši WhatsApp URL za kupca
  const getWhatsAppUrl = (kk: KupacKampanjaWithDetails) => {
    const phone = kk.kupac?.mobprimarni?.replace(/[+\s-]/g, '') || ''
    if (!phone) return null

    const kodkampanje = kampanja.kodkampanje || ''
    const header = `Kod:${kodkampanje}:${kk.id}`
    const separator = '====================='
    const tekst = kampanja.tekst_whatsapp || ''
    const url = kk.url || ''

    const message = `${header}\n${separator}\n\n${tekst}\n\n${url}`
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Import kupaca u kampanju
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Kampanja #{kampanja.id} - {kampanja.kodkampanje || 'Bez koda'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Učitavam...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-xl md:text-2xl font-bold text-white">{totalKupci}</p>
                  <p className="text-xs text-gray-400">Ukupno kupaca</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-xl md:text-2xl font-bold text-amber-400">{kupciKampanja.length}</p>
                  <p className="text-xs text-gray-400">U kampanju</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-xl md:text-2xl font-bold text-green-400">{availableKupci}</p>
                  <p className="text-xs text-gray-400">Dostupno</p>
                </div>
              </div>

              {/* Add Random Section */}
              <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-amber-500" />
                  Dodaj random kupce
                </h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Broj kupaca</label>
                    <input
                      type="number"
                      min={1}
                      max={availableKupci}
                      value={randomCount}
                      onChange={(e) => setRandomCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {availableKupci} dostupnih
                    </p>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddRandom}
                      disabled={adding || availableKupci === 0}
                      className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {adding ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Dodajem...
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-4 h-4" />
                          Dodaj {randomCount} kupaca
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Result */}
                {result && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                    result.error 
                      ? 'bg-red-900/30 border border-red-700' 
                      : 'bg-green-900/30 border border-green-700'
                  }`}>
                    {result.error ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-300 text-sm">{result.error}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 text-sm">
                          Uspešno dodato {result.added} kupaca u kampanju
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Kupci List */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    Kupci u kampanju ({kupciKampanja.length})
                  </span>
                  {kupciKampanja.length > 0 && (
                    <button
                      onClick={loadData}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </h3>

                {kupciKampanja.length === 0 ? (
                  <div className="text-center py-6 bg-slate-700/20 rounded-xl">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Nema kupaca u ovoj kampanji</p>
                    <p className="text-gray-500 text-xs">Dodajte kupce koristeći formu iznad</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {kupciKampanja.slice(0, 50).map((kk) => (
                      <div
                        key={kk.id}
                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-500 font-semibold text-sm">
                              {(kk.kupac?.ime?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {kk.kupac?.ime || '-'} {kk.kupac?.prezime || ''}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              {kk.kupac?.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3" />
                                  {kk.kupac.email}
                                </span>
                              )}
                              {kk.kupac?.mobprimarni && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {kk.kupac.mobprimarni}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* WhatsApp dugme */}
                          {getWhatsAppUrl(kk) && (
                            <a
                              href={getWhatsAppUrl(kk)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Pošalji WhatsApp poruku"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {/* Ukloni dugme */}
                          <button
                            onClick={() => handleRemove(kk.id)}
                            disabled={removingId === kk.id}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Ukloni iz kampanje"
                          >
                            {removingId === kk.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {kupciKampanja.length > 50 && (
                      <p className="text-center text-gray-500 text-sm py-2">
                        ... i još {kupciKampanja.length - 50} kupaca
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  )
}
