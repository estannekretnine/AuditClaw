'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Upload, Users, CheckCircle, AlertCircle, RefreshCw,
  Mail, Phone, MapPin, Briefcase, Download, FileText, Home, Search, X,
  Archive, RotateCcw, MoreVertical
} from 'lucide-react'
import { importKupciFromCSV, getKupciImport, archiveKupac, restoreKupac } from '@/lib/actions/kupac-import'
import type { KupacImport, ImportResult, KupacFilterStatus } from '@/lib/types/kupac-import'

export default function ImportKupacaPage() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [kupci, setKupci] = useState<KupacImport[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [nekretnine, setNekretnine] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<KupacFilterStatus>('active')
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [selectedKupac, setSelectedKupac] = useState<KupacImport | null>(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiving, setArchiving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadKupci = useCallback(async (search?: string, status?: KupacFilterStatus) => {
    setLoading(true)
    try {
      const result = await getKupciImport(50, 0, search, status ?? filterStatus)
      if (result.data) {
        setKupci(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadKupci(debouncedSearch, filterStatus)
  }, [debouncedSearch, filterStatus, loadKupci])

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const openArchiveModal = (kupac: KupacImport) => {
    setSelectedKupac(kupac)
    setArchiveReason('')
    setArchiveModalOpen(true)
    setOpenMenuId(null)
  }

  const handleArchive = async () => {
    if (!selectedKupac || !archiveReason.trim()) return
    
    setArchiving(true)
    try {
      const result = await archiveKupac(selectedKupac.id, archiveReason.trim())
      if (!result.error) {
        setArchiveModalOpen(false)
        setSelectedKupac(null)
        setArchiveReason('')
        await loadKupci(debouncedSearch, filterStatus)
      }
    } finally {
      setArchiving(false)
    }
  }

  const openRestoreModal = (kupac: KupacImport) => {
    setSelectedKupac(kupac)
    setRestoreModalOpen(true)
    setOpenMenuId(null)
  }

  const handleRestore = async () => {
    if (!selectedKupac) {
      console.log('No selectedKupac')
      return
    }
    
    console.log('handleRestore called for kupac:', selectedKupac.id)
    setRestoring(true)
    try {
      const result = await restoreKupac(selectedKupac.id)
      console.log('restoreKupac result:', result)
      if (!result.error) {
        setRestoreModalOpen(false)
        setSelectedKupac(null)
        await loadKupci(debouncedSearch, filterStatus)
      } else {
        console.error('Restore error:', result.error)
        alert('Greška: ' + result.error)
      }
    } catch (err) {
      console.error('Exception in handleRestore:', err)
      alert('Došlo je do greške prilikom vraćanja kupca')
    } finally {
      setRestoring(false)
    }
  }

  const isArchived = (kupac: KupacImport) => kupac.stsarhiva === true

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
      formData.append('nekretnine', nekretnine)
      
      const result = await importKupciFromCSV(formData)
      setImportResult(result)
      
      if (result.inserted > 0 || result.updated > 0) {
        await loadKupci(debouncedSearch)
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

  const downloadLinkedInSampleCSV = () => {
    const headers = 'First Name\tLast Name\tEmail\tLinkedin URL Public\tLocation\tCurrent Job\tCompany Name\tCompany Industry'
    const sample1 = 'Marko\tPetrović\tmarko@email.com\thttps://linkedin.com/in/marko\tBeograd, Srbija\tIT Menadžer\tTech Company\tInformation Technology'
    const sample2 = 'Ana\tJovanović\tana@email.com\thttps://linkedin.com/in/ana\tNovi Sad, Srbija\tDirektor\tFinance Corp\tFinancial Services'
    const csvContent = `${headers}\n${sample1}\n${sample2}`
    
    const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kupci_linkedin_primer.csv'
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
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'active'
                  ? 'bg-amber-500 text-black font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Aktivni</span>
              <Users className="w-4 h-4 md:hidden" />
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'archived'
                  ? 'bg-orange-500 text-black font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Arhivirani</span>
              <Archive className="w-4 h-4 md:hidden" />
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Svi</span>
              <span className="md:hidden text-xs">Svi</span>
            </button>
          </div>
          <button
            onClick={() => loadKupci(debouncedSearch, filterStatus)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Osveži</span>
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-500" />
          Učitaj CSV fajl
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

          {/* Nekretnine Input */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              <Home className="w-4 h-4 inline mr-1" />
              Nekretnina
            </label>
            <input
              type="text"
              value={nekretnine}
              onChange={(e) => setNekretnine(e.target.value)}
              placeholder="Npr. Stan Dedinje, Kuća Senjak..."
              className="w-full px-3 py-2 bg-black border-2 border-amber-500 rounded-lg text-white font-bold text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 caret-white"
              style={{ color: 'white' }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ova vrednost će biti upisana svim importovanim kupcima
            </p>
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
            <div className="flex gap-2">
              <button
                onClick={downloadSampleCSV}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs"
                title="Standardni CSV format"
              >
                <Download className="w-4 h-4" />
                Primer CSV
              </button>
              <button
                onClick={downloadLinkedInSampleCSV}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs"
                title="LinkedIn Sales Navigator format"
              >
                <Download className="w-4 h-4" />
                LinkedIn CSV
              </button>
            </div>
          </div>
        </div>

        {/* CSV Format Info */}
        <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
          <p className="text-gray-300 font-medium mb-2">Podržani formati CSV fajla:</p>
          
          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">LinkedIn Sales Navigator format (tab-separated):</p>
            <code className="text-amber-400 text-xs block">
              First Name, Last Name, Email, Linkedin URL Public, Location, Current Job, Company Name...
            </code>
          </div>
          
          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">Standardni format (comma-separated):</p>
            <code className="text-amber-400 text-xs block">
              ime, prezime, email, mobprimarni, mobsek, linkedinurl, drzava, grad, zanimanje, godisnjaplata
            </code>
          </div>
          
          <p className="text-gray-400 text-xs">
            * Kupac se identifikuje po email, mobprimarni ili linkedinurl. Ako već postoji - ažurira se, ako ne - dodaje se novi.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            * Dodatni podaci iz LinkedIn formata (Company, Profile Summary, itd.) čuvaju se u metapodacima.
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {filterStatus === 'archived' && <Archive className="w-5 h-5 text-orange-500" />}
              {filterStatus === 'all' && <Users className="w-5 h-5 text-blue-500" />}
              {debouncedSearch 
                ? `Rezultati pretrage (${totalCount})` 
                : filterStatus === 'archived' 
                  ? `Arhivirani kupci (${totalCount})`
                  : filterStatus === 'all'
                    ? `Svi kupci (${totalCount})`
                    : 'Aktivni kupci'}
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži po ID, imenu, emailu, telefonu..."
                className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ime i prezime</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Telefon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Lokacija</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Zanimanje</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Nekretnine</th>
                    {(filterStatus === 'archived' || filterStatus === 'all') && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum arhive</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Razlog arhive</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Kreiran</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Akcije</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {kupci.map((kupac) => (
                    <tr key={kupac.id} className={`hover:bg-slate-700/30 ${isArchived(kupac) ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-sm font-mono">{kupac.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isArchived(kupac) ? 'bg-orange-500/20' : 'bg-amber-500/20'
                          }`}>
                            <span className={`font-semibold text-sm ${
                              isArchived(kupac) ? 'text-orange-500' : 'text-amber-500'
                            }`}>
                              {(kupac.ime?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm">
                              {kupac.ime || '-'} {kupac.prezime || ''}
                            </span>
                            {isArchived(kupac) && filterStatus === 'all' && (
                              <span className="text-orange-400 text-xs">Arhiviran</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.mobprimarni || '-'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {kupac.grad ? `${kupac.grad}${kupac.drzava ? `, ${kupac.drzava}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{kupac.zanimanje || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {kupac.nekretnina ? (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md text-xs">
                            {kupac.nekretnina}
                          </span>
                        ) : '-'}
                      </td>
                      {(filterStatus === 'archived' || filterStatus === 'all') && (
                        <>
                          <td className="px-4 py-3 text-sm text-orange-400">
                            {kupac.datumarhiviranja 
                              ? new Date(kupac.datumarhiviranja).toLocaleDateString('sr-RS')
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {kupac.razlogarhiva ? (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs max-w-[200px] truncate block" title={kupac.razlogarhiva}>
                                {kupac.razlogarhiva}
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(kupac.created_at).toLocaleDateString('sr-RS')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === kupac.id ? null : kupac.id)}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          {openMenuId === kupac.id && (
                            <div className="absolute right-0 top-8 z-10 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                              {isArchived(kupac) ? (
                                <button
                                  onClick={() => openRestoreModal(kupac)}
                                  className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-slate-600 flex items-center gap-2"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Vrati
                                </button>
                              ) : (
                                <button
                                  onClick={() => openArchiveModal(kupac)}
                                  className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-slate-600 flex items-center gap-2"
                                >
                                  <Archive className="w-4 h-4" />
                                  Arhiviraj
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700">
              {kupci.map((kupac) => (
                <div key={kupac.id} className={`p-4 ${isArchived(kupac) ? 'opacity-75' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isArchived(kupac) ? 'bg-orange-500/20' : 'bg-amber-500/20'
                    }`}>
                      <span className={`font-semibold ${isArchived(kupac) ? 'text-orange-500' : 'text-amber-500'}`}>
                        {(kupac.ime?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {kupac.ime || '-'} {kupac.prezime || ''}
                        </p>
                        {isArchived(kupac) && filterStatus === 'all' && (
                          <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">Arhiviran</span>
                        )}
                        <span className="text-gray-500 text-xs font-mono">#{kupac.id}</span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {new Date(kupac.created_at).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === kupac.id ? null : kupac.id)}
                        className="p-2 hover:bg-slate-600 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {openMenuId === kupac.id && (
                        <div className="absolute right-0 top-10 z-10 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                          {isArchived(kupac) ? (
                            <button
                              onClick={() => openRestoreModal(kupac)}
                              className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-slate-600 flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Vrati
                            </button>
                          ) : (
                            <button
                              onClick={() => openArchiveModal(kupac)}
                              className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-slate-600 flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" />
                              Arhiviraj
                            </button>
                          )}
                        </div>
                      )}
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
                    {kupac.nekretnina && (
                      <div className="flex items-center gap-1 text-gray-300 col-span-2">
                        <Home className="w-3 h-3 text-amber-400" />
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                          {kupac.nekretnina}
                        </span>
                      </div>
                    )}
                    {(filterStatus === 'archived' || filterStatus === 'all') && isArchived(kupac) && (
                      <>
                        {kupac.datumarhiviranja && (
                          <div className="flex items-center gap-1 text-orange-400 col-span-2 mt-2">
                            <Archive className="w-3 h-3" />
                            <span className="text-xs">
                              Arhivirano: {new Date(kupac.datumarhiviranja).toLocaleDateString('sr-RS')}
                            </span>
                          </div>
                        )}
                        {kupac.razlogarhiva && (
                          <div className="col-span-2">
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                              {kupac.razlogarhiva}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Archive Modal */}
      {archiveModalOpen && selectedKupac && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-500" />
                Arhiviraj kupca
              </h3>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedKupac.ime || '-'} {selectedKupac.prezime || ''}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedKupac.email || selectedKupac.mobprimarni || `ID: ${selectedKupac.id}`}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Razlog arhiviranja <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="Unesite razlog arhiviranja..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setArchiveModalOpen(false)
                    setSelectedKupac(null)
                    setArchiveReason('')
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleArchive}
                  disabled={!archiveReason.trim() || archiving}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {archiving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Arhiviram...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      Arhiviraj
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreModalOpen && selectedKupac && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-green-500" />
                Vraćanje u aktivne?
              </h3>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedKupac.ime || '-'} {selectedKupac.prezime || ''}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedKupac.email || selectedKupac.mobprimarni || `ID: ${selectedKupac.id}`}
                </p>
                {selectedKupac.razlogarhiva && (
                  <div className="mt-2 pt-2 border-t border-slate-600">
                    <p className="text-orange-400 text-xs">Razlog arhiviranja:</p>
                    <p className="text-gray-300 text-sm">{selectedKupac.razlogarhiva}</p>
                  </div>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Da li ste sigurni da želite da vratite ovog kupca u aktivne?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRestoreModalOpen(false)
                    setSelectedKupac(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Ne
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Vraćam...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Da
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId !== null && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  )
}
