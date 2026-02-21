'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Phone, Mail, Linkedin, Globe, RefreshCw, 
  ChevronDown, ChevronRight, Calendar, Filter, BarChart3
} from 'lucide-react'
import { 
  getKorisniciZaKupciAnaliza, 
  getKupciAnaliza,
  type KorisnikOption,
  type KupacAnalizaRow
} from '@/lib/actions/analytics'

export default function KupciAnalizaPage() {
  const [loading, setLoading] = useState(false)
  const [loadingKorisnici, setLoadingKorisnici] = useState(true)
  const [korisniciOptions, setKorisniciOptions] = useState<KorisnikOption[]>([])
  const [kupci, setKupci] = useState<KupacAnalizaRow[]>([])
  const [expandedKupci, setExpandedKupci] = useState<Set<string>>(new Set())
  const [dataLoaded, setDataLoaded] = useState(false)

  const [selectedKorisnik, setSelectedKorisnik] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadKorisniciOptions()
  }, [])

  const loadKorisniciOptions = async () => {
    setLoadingKorisnici(true)
    try {
      const korisnici = await getKorisniciZaKupciAnaliza()
      setKorisniciOptions(korisnici)
    } finally {
      setLoadingKorisnici(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getKupciAnaliza({
        korisnikId: selectedKorisnik || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
      setKupci(data)
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const toggleKupac = (kupacKey: string) => {
    setExpandedKupci(prev => {
      const next = new Set(prev)
      if (next.has(kupacKey)) {
        next.delete(kupacKey)
      } else {
        next.add(kupacKey)
      }
      return next
    })
  }

  const totals = {
    ukupnoKupaca: kupci.length,
    ukupnoKontakata: kupci.reduce((sum, k) => sum + k.brojKontakata, 0),
    prosecnoKontakata: kupci.length > 0 
      ? (kupci.reduce((sum, k) => sum + k.brojKontakata, 0) / kupci.length).toFixed(1) 
      : '0'
  }

  const selectedKorisnikNaziv = selectedKorisnik 
    ? korisniciOptions.find(k => k.id === selectedKorisnik)?.naziv || '' 
    : 'Svi korisnici'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-400" />
            Kupci analiza
          </h1>
          <p className="text-slate-400 mt-1">
            Izaberite korisnika i period za prikaz statistike
          </p>
        </div>
        {dataLoaded && (
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Osveži
          </button>
        )}
      </div>

      {/* Filter forma */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-amber-400" />
          Filteri
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Korisnik
            </label>
            <select
              value={selectedKorisnik || ''}
              onChange={(e) => setSelectedKorisnik(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={loadingKorisnici}
            >
              <option value="">
                {loadingKorisnici ? 'Učitavanje...' : 'Svi korisnici'}
              </option>
              {korisniciOptions.map(k => (
                <option key={k.id} value={k.id}>{k.naziv}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Od datuma
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Do datuma
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Učitavanje...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Prikaži statistiku
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Prikaz podataka */}
      {!dataLoaded ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Kliknite &quot;Prikaži statistiku&quot;</h3>
          <p className="text-slate-500">
            Opciono izaberite korisnika i period, zatim kliknite dugme za prikaz podataka
          </p>
        </div>
      ) : loading ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-amber-400 animate-spin" />
          <p className="text-slate-400">Učitavanje podataka...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Naslov sa izabranim korisnikom */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white">
              {selectedKorisnikNaziv}
            </h2>
            <p className="text-slate-400 text-sm">Svi podaci</p>
          </div>

          {/* KPI kartice */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Ukupno kupaca</p>
                  <p className="text-2xl font-bold text-white">{totals.ukupnoKupaca}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Ukupno kontakata</p>
                  <p className="text-2xl font-bold text-white">{totals.ukupnoKontakata}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Prosečno kontakata</p>
                  <p className="text-2xl font-bold text-white">{totals.prosecnoKontakata}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela kupaca */}
          {kupci.length > 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Lista kupaca koji su kontaktirali
                  <span className="ml-2 text-sm font-normal text-slate-400">({kupci.length} kupaca)</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium w-8"></th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Ime i prezime</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Telefon</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">LinkedIn</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Lokacija</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Datum kontakta</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Kontakata</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Oglasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kupci.map((kupac) => {
                      const isExpanded = expandedKupci.has(kupac.kupacId.toString())
                      const uniqueOglasi = [...new Set(kupac.oglasi.map(o => o.ponudaId))].length
                      const imePrezime = [kupac.ime, kupac.prezime].filter(Boolean).join(' ')
                      const lokacija = [kupac.grad, kupac.drzava].filter(Boolean).join(', ')
                      const telefon = kupac.mobprimarni || kupac.mobsek
                      
                      return (
                        <>
                          <tr 
                            key={kupac.kupacId}
                            onClick={() => toggleKupac(kupac.kupacId.toString())}
                            className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">
                              #{kupac.kupacId}
                            </td>
                            <td className="py-3 px-4 text-white font-medium">
                              {imePrezime || <span className="text-slate-500 italic">-</span>}
                            </td>
                            <td className="py-3 px-4">
                              {telefon ? (
                                <a 
                                  href={`tel:${telefon}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  {telefon}
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {kupac.email ? (
                                <a 
                                  href={`mailto:${kupac.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3" />
                                  {kupac.email}
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {kupac.linkedinurl ? (
                                <a 
                                  href={kupac.linkedinurl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                >
                                  <Linkedin className="w-3 h-3" />
                                  Profil
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {lokacija ? (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-slate-500" />
                                  {lokacija}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-sm">
                              {kupac.poslednjiKontakt ? (
                                <span>
                                  {new Date(kupac.poslednjiKontakt).toLocaleDateString('sr-RS', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-bold ${kupac.brojKontakata > 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {kupac.brojKontakata}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-amber-400 font-medium">{uniqueOglasi}</span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${kupac.kupacId}-expanded`} className="bg-slate-900/50">
                              <td colSpan={10} className="py-4 px-8">
                                <div className="text-sm">
                                  <h4 className="text-slate-300 font-medium mb-3">Oglasi za koje je kontaktirao:</h4>
                                  <div className="space-y-2">
                                    {kupac.oglasi.map((oglas, idx) => (
                                      <div 
                                        key={`${oglas.ponudaId}-${idx}`}
                                        className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2"
                                      >
                                        <span className="text-white">{oglas.naslov}</span>
                                        <span className="text-slate-400 text-xs">
                                          {new Date(oglas.datum).toLocaleDateString('sr-RS', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Nema kontakata za izabranog korisnika u datom periodu</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
