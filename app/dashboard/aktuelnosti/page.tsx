'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Newspaper, RefreshCw, Plus, Edit2, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon
} from 'lucide-react'
import { getAktuelnosti, createAktuelnost, updateAktuelnost, toggleAktuelnostStatus, deleteAktuelnost } from '@/lib/actions/aktuelnosti'
import type { Aktuelnost } from '@/lib/types/aktuelnosti'

export default function AktuelnostiPage() {
  const [loading, setLoading] = useState(false)
  const [aktuelnosti, setAktuelnosti] = useState<Aktuelnost[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingAktuelnost, setEditingAktuelnost] = useState<Aktuelnost | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAktuelnost, setSelectedAktuelnost] = useState<Aktuelnost | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      const result = await getAktuelnosti(50, 0, showOnlyActive)
      if (result.data) {
        setAktuelnosti(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [showOnlyActive])

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

  const openCreateModal = () => {
    resetForm()
    setFormModalOpen(true)
  }

  const openEditModal = (aktuelnost: Aktuelnost) => {
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
    setFormModalOpen(true)
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
        setFormModalOpen(false)
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

  const openDeleteModal = (aktuelnost: Aktuelnost) => {
    setSelectedAktuelnost(aktuelnost)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedAktuelnost) return
    setDeleting(true)
    try {
      const result = await deleteAktuelnost(selectedAktuelnost.id)
      if (!result.error) {
        setDeleteModalOpen(false)
        setSelectedAktuelnost(null)
        await loadAktuelnosti()
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Newspaper className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Aktuelnosti</h1>
            <p className="text-sm text-gray-400">Upravljanje člancima i vestima</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAktuelnosti()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Osveži"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novi članak</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="w-4 h-4 rounded border-slate-500 text-purple-500 focus:ring-purple-500"
          />
          Samo aktivni
        </label>
        <span className="text-sm text-gray-400">
          Ukupno: {totalCount} {totalCount === 1 ? 'članak' : 'članaka'}
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slika</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Naslov (SR)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Naslov (EN)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {aktuelnosti.map((aktuelnost) => (
                <tr key={aktuelnost.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{aktuelnost.id}</td>
                  <td className="px-4 py-3">
                    {aktuelnost.slika_url ? (
                      <img 
                        src={aktuelnost.slika_url} 
                        alt="" 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium truncate max-w-[200px]">{aktuelnost.naslov_sr}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300 truncate max-w-[200px]">{aktuelnost.naslov_en || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(aktuelnost.datum_objave)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      aktuelnost.stsaktivan 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {aktuelnost.stsaktivan ? 'Aktivan' : 'Neaktivan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(aktuelnost)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                        title={aktuelnost.stsaktivan ? 'Deaktiviraj' : 'Aktiviraj'}
                      >
                        {aktuelnost.stsaktivan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(aktuelnost)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-slate-600 rounded transition-colors"
                        title="Izmeni"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(aktuelnost)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                        title="Obriši"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {aktuelnosti.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Nema članaka
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {editingAktuelnost ? 'Izmeni članak' : 'Novi članak'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Naslov (SR) *</label>
                  <input
                    type="text"
                    value={formData.naslov_sr}
                    onChange={(e) => setFormData({ ...formData, naslov_sr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 caret-white"
                    style={{ color: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Naslov (EN)</label>
                  <input
                    type="text"
                    value={formData.naslov_en}
                    onChange={(e) => setFormData({ ...formData, naslov_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 caret-white"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tekst (SR) *</label>
                <textarea
                  value={formData.tekst_sr}
                  onChange={(e) => setFormData({ ...formData, tekst_sr: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 caret-white"
                  style={{ color: 'white' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tekst (EN)</label>
                <textarea
                  value={formData.tekst_en}
                  onChange={(e) => setFormData({ ...formData, tekst_en: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 caret-white"
                  style={{ color: 'white' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">URL slike</label>
                  <input
                    type="url"
                    value={formData.slika_url}
                    onChange={(e) => setFormData({ ...formData, slika_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 caret-white"
                    style={{ color: 'white' }}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Datum objave</label>
                  <input
                    type="date"
                    value={formData.datum_objave}
                    onChange={(e) => setFormData({ ...formData, datum_objave: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stsaktivan}
                    onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-500 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Aktivan (vidljiv na sajtu)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Čuvanje...' : (editingAktuelnost ? 'Sačuvaj izmene' : 'Kreiraj')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedAktuelnost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Potvrda brisanja</h2>
              <p className="text-gray-400">
                Da li ste sigurni da želite da obrišete članak &quot;{selectedAktuelnost.naslov_sr}&quot;?
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Brisanje...' : 'Obriši'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
