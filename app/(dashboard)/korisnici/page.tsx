'use client'

import { useState, useEffect, useMemo } from 'react'
import { Edit, Trash2, Plus, User, Phone, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Search, X, MapPin, Mail } from 'lucide-react'
import { getKorisnici, createKorisnik, updateKorisnik, deleteKorisnik, toggleKorisnikStatus } from '@/lib/actions/korisnici'
import type { Korisnik } from '@/lib/types/database'

export default function KorisniciPage() {
  const [korisnici, setKorisnici] = useState<Korisnik[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingKorisnik, setEditingKorisnik] = useState<Korisnik | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterValue, setFilterValue] = useState('')
  const [formData, setFormData] = useState({
    naziv: '',
    email: '',
    password: '',
    brojmob: '',
    adresa: '',
    stsstatus: 'admin',
    stsaktivan: 'da'
  })

  useEffect(() => {
    loadKorisnici()
  }, [])

  const loadKorisnici = async () => {
    try {
      setLoading(true)
      const { data, error } = await getKorisnici()

      if (error) {
        alert('Greška pri učitavanju korisnika: ' + error)
        return
      }

      setKorisnici(data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return
    }

    const { error } = await deleteKorisnik(id)
    if (error) {
      alert('Greška pri brisanju korisnika: ' + error)
      return
    }
    loadKorisnici()
  }

  const handleToggleStatus = async (korisnik: Korisnik) => {
    const { error } = await toggleKorisnikStatus(korisnik.id, korisnik.stsaktivan || 'ne')
    if (error) {
      alert('Greška pri promeni statusa: ' + error)
      return
    }
    loadKorisnici()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('sr-RS', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Belgrade'
      })
    } catch {
      return dateString
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setFilterValue('')
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1" />
    )
  }

  const getColumnLabel = (column: string) => {
    const labels: Record<string, string> = {
      'id': 'ID',
      'naziv': 'Nazivu',
      'email': 'Emailu',
      'brojmob': 'Telefonu',
      'adresa': 'Adresi',
      'stsstatus': 'Statusu',
      'stsaktivan': 'Aktivnom statusu',
      'datumk': 'Datumu kreiranja',
      'datumpt': 'Datumu ažuriranja'
    }
    return labels[column] || column
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...korisnici]

    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value: string | null = item[sortColumn as keyof Korisnik] as string | null
        if (sortColumn === 'datumk' || sortColumn === 'datumpt') {
          value = formatDate(value)
        }
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(filterLower)
      })
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: string = String(a[sortColumn as keyof Korisnik] || '').toLowerCase()
        let bVal: string = String(b[sortColumn as keyof Korisnik] || '').toLowerCase()

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
      })
    }

    return data
  }, [korisnici, sortColumn, sortDirection, filterValue])

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'kupac': 'bg-blue-100 text-blue-700 border-blue-200',
      'prodavac': 'bg-green-100 text-green-700 border-green-200',
      'agent': 'bg-purple-100 text-purple-700 border-purple-200',
      'admin': 'bg-red-100 text-red-700 border-red-200',
      'manager': 'bg-amber-100 text-amber-700 border-amber-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const handleEdit = (korisnik: Korisnik) => {
    setEditingKorisnik(korisnik)
    setFormData({
      naziv: korisnik.naziv || '',
      email: korisnik.email || '',
      password: '',
      brojmob: korisnik.brojmob || '',
      adresa: korisnik.adresa || '',
      stsstatus: korisnik.stsstatus || 'admin',
      stsaktivan: korisnik.stsaktivan || 'da'
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingKorisnik(null)
    setFormData({
      naziv: '',
      email: '',
      password: '',
      brojmob: '',
      adresa: '',
      stsstatus: 'admin',
      stsaktivan: 'da'
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formDataObj = new FormData()
    formDataObj.append('naziv', formData.naziv)
    formDataObj.append('email', formData.email)
    formDataObj.append('password', formData.password)
    formDataObj.append('brojmob', formData.brojmob)
    formDataObj.append('adresa', formData.adresa)
    formDataObj.append('stsstatus', formData.stsstatus)
    formDataObj.append('stsaktivan', formData.stsaktivan)

    let result
    if (editingKorisnik) {
      result = await updateKorisnik(editingKorisnik.id, formDataObj)
    } else {
      result = await createKorisnik(formDataObj)
    }

    if (result.error) {
      alert('Greška pri čuvanju korisnika: ' + result.error)
      return
    }

    setShowForm(false)
    loadKorisnici()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Korisnici</h2>
          <p className="text-gray-500 mt-1">Upravljanje korisnicima sistema</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj korisnika</span>
        </button>
      </div>

      {korisnici.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema korisnika</p>
          <p className="text-gray-500 mb-6">Dodajte prvog korisnika</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj korisnika
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {sortColumn && (
            <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${getColumnLabel(sortColumn)}...`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                {filterValue && (
                  <button onClick={() => setFilterValue('')} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" type="button">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID{getSortIcon('id')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('naziv')}>
                    <div className="flex items-center">Naziv{getSortIcon('naziv')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('email')}>
                    <div className="flex items-center">Email{getSortIcon('email')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('brojmob')}>
                    <div className="flex items-center">Telefon{getSortIcon('brojmob')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('stsstatus')}>
                    <div className="flex items-center">Status{getSortIcon('stsstatus')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('stsaktivan')}>
                    <div className="flex items-center">Aktivan{getSortIcon('stsaktivan')}</div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedData.map((korisnik) => (
                  <tr key={korisnik.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{korisnik.id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{korisnik.naziv}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{korisnik.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {korisnik.brojmob ? (
                        <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{korisnik.brojmob}</div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {korisnik.stsstatus ? (
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeColor(korisnik.stsstatus)}`}>{korisnik.stsstatus}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(korisnik)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                        title={`Kliknite da ${korisnik.stsaktivan === 'da' ? 'deaktivirate' : 'aktivirate'} korisnika`}
                      >
                        {korisnik.stsaktivan === 'da' ? (
                          <span className="flex items-center gap-1.5 text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-xl">
                            <ToggleRight className="w-5 h-5" /><span className="text-xs font-semibold">Da</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl">
                            <ToggleLeft className="w-5 h-5" /><span className="text-xs font-semibold">Ne</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(korisnik)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20">
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button onClick={() => handleDelete(korisnik.id)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20">
                          <Trash2 className="w-4 h-4" /><span className="hidden lg:inline">Obriši</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredAndSortedData.map((korisnik) => (
              <div key={korisnik.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="space-y-2 mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">ID: {korisnik.id}</span>
                  <div className="text-sm font-medium text-gray-900">{korisnik.naziv}</div>
                  {korisnik.email && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Mail className="w-3.5 h-3.5" />{korisnik.email}</div>}
                  {korisnik.brojmob && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Phone className="w-3.5 h-3.5" />{korisnik.brojmob}</div>}
                  {korisnik.adresa && <div className="flex items-center gap-1.5 text-xs text-gray-600"><MapPin className="w-3.5 h-3.5" />{korisnik.adresa}</div>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {korisnik.stsstatus && (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeColor(korisnik.stsstatus)}`}>{korisnik.stsstatus}</span>
                    )}
                    <button onClick={() => handleToggleStatus(korisnik)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${korisnik.stsaktivan === 'da' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      {korisnik.stsaktivan === 'da' ? (<><ToggleRight className="w-3.5 h-3.5" />Aktivan</>) : (<><ToggleLeft className="w-3.5 h-3.5" />Neaktivan</>)}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleEdit(korisnik)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium">
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  <button onClick={() => handleDelete(korisnik.id)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium">
                    <Trash2 className="w-4 h-4" />Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal forma */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingKorisnik ? 'Izmeni korisnika' : 'Dodaj novog korisnika'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Naziv *</label>
                <input type="text" value={formData.naziv} onChange={(e) => setFormData({ ...formData, naziv: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" placeholder="Ime i prezime" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Broj telefona</label>
                <input type="tel" value={formData.brojmob} onChange={(e) => setFormData({ ...formData, brojmob: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" placeholder="+381 60 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adresa</label>
                <textarea value={formData.adresa} onChange={(e) => setFormData({ ...formData, adresa: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none" placeholder="Unesite adresu korisnika" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                <select value={formData.stsstatus} onChange={(e) => setFormData({ ...formData, stsstatus: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                  <option value="prodavac">Prodavac</option>
                  <option value="kupac">Kupac</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aktivan *</label>
                <select value={formData.stsaktivan} onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all">
                  <option value="da">Da</option>
                  <option value="ne">Ne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password {editingKorisnik ? '(ostavite prazno da zadržite postojeći)' : '*'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingKorisnik} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" placeholder={editingKorisnik ? 'Nova lozinka (opciono)' : 'Lozinka'} />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">Otkaži</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium">{editingKorisnik ? 'Sačuvaj izmene' : 'Kreiraj korisnika'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
