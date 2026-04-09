'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Newspaper, Plus, Edit, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon, ToggleRight, ToggleLeft
} from 'lucide-react'
import { getAktuelnosti, createAktuelnost, updateAktuelnost, toggleAktuelnostStatus, deleteAktuelnost } from '@/lib/actions/aktuelnosti'
import type { Aktuelnost } from '@/lib/types/aktuelnosti'
import { ImageUpload } from '@/components/ui/image-upload'

const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor').then(mod => ({ default: mod.RichTextEditor })), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />,
})

export default function AktuelnostiPage() {
  const [loading, setLoading] = useState(true)
  const [aktuelnosti, setAktuelnosti] = useState<Aktuelnost[]>([])
  const [totalCount, setTotalCount] = useState(0)
  
  const [showForm, setShowForm] = useState(false)
  const [editingAktuelnost, setEditingAktuelnost] = useState<Aktuelnost | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    naslov_sr: '',
    naslov_en: '',
    tekst_sr: '',
    tekst_en: '',
    slika_url: '',
    datum_objave: new Date().toISOString().split('T')[0],
    stsaktivan: true,
  })

  const loadAktuelnosti = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAktuelnosti(50, 0, false)
      if (result.data) {
        setAktuelnosti(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAktuelnosti()
  }, [loadAktuelnosti])

  const resetForm = () => {
    setFormData({
      naslov_sr: '',
      naslov_en: '',
      tekst_sr: '',
      tekst_en: '',
      slika_url: '',
      datum_objave: new Date().toISOString().split('T')[0],
      stsaktivan: true,
    })
    setEditingAktuelnost(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (aktuelnost: Aktuelnost) => {
    setEditingAktuelnost(aktuelnost)
    setFormData({
      naslov_sr: aktuelnost.naslov_sr || '',
      naslov_en: aktuelnost.naslov_en || '',
      tekst_sr: aktuelnost.tekst_sr || '',
      tekst_en: aktuelnost.tekst_en || '',
      slika_url: aktuelnost.slika_url || '',
      datum_objave: aktuelnost.datum_objave ? aktuelnost.datum_objave.split('T')[0] : new Date().toISOString().split('T')[0],
      stsaktivan: aktuelnost.stsaktivan,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('naslov_sr', formData.naslov_sr)
      fd.append('naslov_en', formData.naslov_en)
      fd.append('tekst_sr', formData.tekst_sr)
      fd.append('tekst_en', formData.tekst_en)
      fd.append('slika_url', formData.slika_url)
      fd.append('datum_objave', formData.datum_objave)
      fd.append('stsaktivan', String(formData.stsaktivan))

      let result
      if (editingAktuelnost) {
        result = await updateAktuelnost(editingAktuelnost.id, fd)
      } else {
        result = await createAktuelnost(fd)
      }

      if (!result.error) {
        setShowForm(false)
        resetForm()
        await loadAktuelnosti()
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (aktuelnost: Aktuelnost) => {
    const result = await toggleAktuelnostStatus(aktuelnost.id, !aktuelnost.stsaktivan)
    if (!result.error) {
      await loadAktuelnosti()
    } else {
      alert('Greška: ' + result.error)
    }
  }

  const handleDelete = async (aktuelnost: Aktuelnost) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete članak "${aktuelnost.naslov_sr}"?`)) {
      return
    }
    const result = await deleteAktuelnost(aktuelnost.id)
    if (!result.error) {
      await loadAktuelnosti()
    } else {
      alert('Greška: ' + result.error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Aktuelnosti</h2>
          <p className="text-gray-500 mt-1">Upravljanje člancima i vestima ({totalCount})</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novi članak</span>
        </button>
      </div>

      {aktuelnosti.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Newspaper className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema članaka</p>
          <p className="text-gray-500 mb-6">Dodajte prvi članak</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj članak
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Slika</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Naslov (SR)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Naslov (EN)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Aktivan</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aktuelnosti.map((aktuelnost) => (
                  <tr key={aktuelnost.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{aktuelnost.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      {aktuelnost.slika_url ? (
                        <img 
                          src={aktuelnost.slika_url} 
                          alt="" 
                          className="w-16 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium truncate max-w-[200px]">{aktuelnost.naslov_sr}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{aktuelnost.naslov_en || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(aktuelnost.datum_objave)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(aktuelnost)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                        title={`Kliknite da ${aktuelnost.stsaktivan ? 'deaktivirate' : 'aktivirate'} članak`}
                      >
                        {aktuelnost.stsaktivan ? (
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
                        <button 
                          onClick={() => handleEdit(aktuelnost)} 
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(aktuelnost)} 
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" /><span className="hidden lg:inline">Obriši</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {aktuelnosti.map((aktuelnost) => (
              <div key={aktuelnost.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="flex gap-4 mb-3">
                  {aktuelnost.slika_url ? (
                    <img 
                      src={aktuelnost.slika_url} 
                      alt="" 
                      className="w-20 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-1">ID: {aktuelnost.id}</span>
                    <p className="text-sm font-medium text-gray-900 truncate">{aktuelnost.naslov_sr}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(aktuelnost.datum_objave)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    onClick={() => handleToggleStatus(aktuelnost)} 
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${aktuelnost.stsaktivan ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {aktuelnost.stsaktivan ? (<><ToggleRight className="w-3.5 h-3.5" />Aktivan</>) : (<><ToggleLeft className="w-3.5 h-3.5" />Neaktivan</>)}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(aktuelnost)} 
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  <button 
                    onClick={() => handleDelete(aktuelnost)} 
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingAktuelnost ? 'Izmeni članak' : 'Novi članak'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Naslov (SR) *</label>
                  <input
                    type="text"
                    value={formData.naslov_sr}
                    onChange={(e) => setFormData({ ...formData, naslov_sr: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Naslov članka na srpskom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Naslov (EN)</label>
                  <input
                    type="text"
                    value={formData.naslov_en}
                    onChange={(e) => setFormData({ ...formData, naslov_en: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Article title in English"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tekst (SR) *</label>
                <RichTextEditor
                  content={formData.tekst_sr}
                  onChange={(html) => setFormData({ ...formData, tekst_sr: html })}
                  placeholder="Unesite tekst članka..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tekst (EN)</label>
                <RichTextEditor
                  content={formData.tekst_en}
                  onChange={(html) => setFormData({ ...formData, tekst_en: html })}
                  placeholder="Enter article text..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Slika</label>
                  <ImageUpload
                    value={formData.slika_url}
                    onChange={(url) => setFormData({ ...formData, slika_url: url })}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Datum objave</label>
                    <input
                      type="date"
                      value={formData.datum_objave}
                      onChange={(e) => setFormData({ ...formData, datum_objave: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.stsaktivan ? 'da' : 'ne'}
                      onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.value === 'da' })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    >
                      <option value="da">Aktivan (vidljiv na sajtu)</option>
                      <option value="ne">Neaktivan (skriven)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Otkaži
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50"
                >
                  {saving ? 'Čuvanje...' : (editingAktuelnost ? 'Sačuvaj izmene' : 'Kreiraj članak')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
