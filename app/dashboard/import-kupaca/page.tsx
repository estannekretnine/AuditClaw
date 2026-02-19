'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Upload, Users, CheckCircle, AlertCircle, RefreshCw,
  Mail, Phone, MapPin, Briefcase, Download, FileText
} from 'lucide-react'
import { importKupciFromCSV, getKupciImport } from '@/lib/actions/kupac-import'
import type { KupacImport, ImportResult } from '@/lib/types/kupac-import'

export default function ImportKupacaPage() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [kupci, setKupci] = useState<KupacImport[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadKupci()
  }, [])

  const loadKupci = async () => {
    setLoading(true)
    try {
      const result = await getKupciImport(50, 0)
      if (result.data) {
        setKupci(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const result = await importKupciFromCSV(formData)
      setImportResult(result)
      
      if (result.inserted > 0 || result.updated > 0) {
        await loadKupci()
      }
    } finally {
      setImporting(false)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadSampleCSV = () => {
    const headers = 'ime,prezime,email,mobprimarni,mobsek,linkedinurl,drzava,grad,zanimanje,godisnjaplata'
    const sample1 = 'Marko,Petrović,marko@email.com,+381641234567,+381651234567,https://linkedin.com/in/marko,Srbija,Beograd,IT Menadžer,50000'
    const sample2 = 'Ana,Jovanović,ana@email.com,+381642345678,,https://linkedin.com/in/ana,Srbija,Novi Sad,Direktor,75000'
    const csvContent = `${headers}\n${sample1}\n${sample2}`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kupci_primer.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
            Import kupaca
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Učitajte CSV fajl sa podacima o kupcima
          </p>
        </div>
        <button
          onClick={loadKupci}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Osveži</span>
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-500" />
          Učitaj CSV fajl
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* File Input */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Izaberite fajl</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-gray-400 mt-2">
                <FileText className="w-4 h-4 inline mr-1" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end gap-2">
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importujem...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importuj
                </>
              )}
            </button>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Preuzmi primer CSV
            </button>
          </div>
        </div>

        {/* CSV Format Info */}
        <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
          <p className="text-gray-300 font-medium mb-1">Očekivane kolone u CSV fajlu:</p>
          <code className="text-amber-400 text-xs">
            ime, prezime, email, mobprimarni, mobsek, linkedinurl, drzava, grad, zanimanje, godisnjaplata
          </code>
          <p className="text-gray-400 mt-2 text-xs">
            * Kupac se identifikuje po email ili mobprimarni. Ako već postoji - ažurira se, ako ne - dodaje se novi.
          </p>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-xl p-4 md:p-6 mb-6 border ${
          importResult.errors > 0 
            ? 'bg-red-900/20 border-red-700' 
            : 'bg-green-900/20 border-green-700'
        }`}>
          <div className="flex items-start gap-3">
            {importResult.errors > 0 ? (
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Rezultat importa</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{importResult.total}</p>
                  <p className="text-xs text-gray-400">Ukupno redova</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{importResult.inserted}</p>
                  <p className="text-xs text-gray-400">Novih kupaca</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{importResult.updated}</p>
                  <p className="text-xs text-gray-400">Ažuriranih</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{importResult.errors}</p>
                  <p className="text-xs text-gray-400">Grešaka</p>
                </div>
              </div>
              {importResult.errorMessages.length > 0 && (
                <div className="mt-3 bg-red-900/30 rounded-lg p-3">
                  <p className="text-sm text-red-300 font-medium mb-1">Greške:</p>
                  <ul className="text-xs text-red-400 space-y-1">
                    {importResult.errorMessages.map((msg, i) => (
                      <li key={i}>• {msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-gray-400">Ukupno kupaca</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {kupci.filter(k => k.email).length}
              </p>
              <p className="text-xs text-gray-400">Sa emailom</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {kupci.filter(k => k.mobprimarni).length}
              </p>
              <p className="text-xs text-gray-400">Sa telefonom</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {new Set(kupci.map(k => k.grad).filter(Boolean)).size}
              </p>
              <p className="text-xs text-gray-400">Gradova</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kupci Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            Poslednji importovani kupci
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Učitavam...</p>
          </div>
        ) : kupci.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Nema importovanih kupaca</p>
            <p className="text-gray-500 text-sm">Učitajte CSV fajl da biste dodali kupce</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ime i prezime</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Telefon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Lokacija</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Zanimanje</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {kupci.map((kupac) => (
                    <tr key={kupac.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <span className="text-amber-500 font-semibold text-sm">
                              {(kupac.ime?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white text-sm">
                            {kupac.ime || '-'} {kupac.prezime || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.mobprimarni || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {kupac.grad ? `${kupac.grad}${kupac.drzava ? `, ${kupac.drzava}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.zanimanje || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(kupac.created_at).toLocaleDateString('sr-RS')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700">
              {kupci.map((kupac) => (
                <div key={kupac.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <span className="text-amber-500 font-semibold">
                        {(kupac.ime?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {kupac.ime || '-'} {kupac.prezime || ''}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(kupac.created_at).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {kupac.email && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span className="truncate">{kupac.email}</span>
                      </div>
                    )}
                    {kupac.mobprimarni && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Phone className="w-3 h-3 text-green-400" />
                        <span>{kupac.mobprimarni}</span>
                      </div>
                    )}
                    {kupac.grad && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span>{kupac.grad}</span>
                      </div>
                    )}
                    {kupac.zanimanje && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <Briefcase className="w-3 h-3 text-amber-400" />
                        <span>{kupac.zanimanje}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
