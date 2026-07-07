'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Edit, Trash2 } from 'lucide-react'
import {
  getVapiUcenici,
  createVapiUcenik,
  updateVapiUcenik,
  deleteVapiUcenik,
} from '@/lib/actions/vapi-ucenik'
import type { VapiUcenik } from '@/lib/types/vapi'

export default function VapiUcenikPage() {
  const [loading, setLoading] = useState(true)
  const [ucenici, setUcenici] = useState<VapiUcenik[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingUcenik, setEditingUcenik] = useState<VapiUcenik | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    razred: '',
    razrednistaresina: '',
    napoemna: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVapiUcenici(200, 0)
      if (result.data) {
        setUcenici(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormData({ ime: '', prezime: '', razred: '', razrednistaresina: '', napoemna: '' })
    setEditingUcenik(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (ucenik: VapiUcenik) => {
    setEditingUcenik(ucenik)
    setFormData({
      ime: ucenik.ime || '',
      prezime: ucenik.prezime || '',
      razred: ucenik.razred || '',
      razrednistaresina: ucenik.razrednistaresina || '',
      napoemna: ucenik.napoemna || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('ime', formData.ime)
      fd.append('prezime', formData.prezime)
      fd.append('razred', formData.razred)
      fd.append('razrednistaresina', formData.razrednistaresina)
      fd.append('napoemna', formData.napoemna)

      const result = editingUcenik
        ? await updateVapiUcenik(editingUcenik.id, fd)
        : await createVapiUcenik(fd)

      if (!result.error) {
        setShowForm(false)
        resetForm()
        await loadData()
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ucenik: VapiUcenik) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete učenika "${ucenik.ime} ${ucenik.prezime || ''}"?`)) {
      return
    }
    const result = await deleteVapiUcenik(ucenik.id)
    if (!result.error) {
      await loadData()
    } else {
      alert('Greška: ' + result.error)
    }
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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Učenici</h2>
          <p className="text-gray-500 mt-1">Upravljanje učenicima ({totalCount})</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novi učenik</span>
        </button>
      </div>

      {ucenici.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema učenika</p>
          <p className="text-gray-500 mb-6">Dodajte prvog učenika</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj učenika
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Ime i prezime</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Razred</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Razredni starešina</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Napomena</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ucenici.map((ucenik) => (
                  <tr key={ucenik.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{ucenik.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">{ucenik.ime} {ucenik.prezime || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{ucenik.razred || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{ucenik.razrednistaresina || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{ucenik.napoemna || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(ucenik)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDelete(ucenik)}
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

          <div className="md:hidden divide-y divide-gray-100">
            {ucenici.map((ucenik) => (
              <div key={ucenik.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-1">ID: {ucenik.id}</span>
                  <p className="text-sm font-medium text-gray-900">{ucenik.ime} {ucenik.prezime || ''}</p>
                  <p className="text-xs text-gray-500 mt-1">Razred: {ucenik.razred || '-'}</p>
                  {ucenik.razrednistaresina && (
                    <p className="text-xs text-gray-500 mt-1">Starešina: {ucenik.razrednistaresina}</p>
                  )}
                  {ucenik.napoemna && (
                    <p className="text-xs text-gray-500 mt-1">{ucenik.napoemna}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ucenik)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(ucenik)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingUcenik ? 'Izmeni učenika' : 'Novi učenik'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ime *</label>
                  <input
                    type="text"
                    value={formData.ime}
                    onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Ime"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prezime</label>
                  <input
                    type="text"
                    value={formData.prezime}
                    onChange={(e) => setFormData({ ...formData, prezime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Prezime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Razred</label>
                  <input
                    type="text"
                    value={formData.razred}
                    onChange={(e) => setFormData({ ...formData, razred: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Npr. III-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Razredni starešina</label>
                  <input
                    type="text"
                    value={formData.razrednistaresina}
                    onChange={(e) => setFormData({ ...formData, razrednistaresina: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Ime starešine"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Napomena</label>
                <textarea
                  value={formData.napoemna}
                  onChange={(e) => setFormData({ ...formData, napoemna: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="Napomena o učeniku"
                />
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
                  {saving ? 'Čuvanje...' : (editingUcenik ? 'Sačuvaj izmene' : 'Kreiraj učenika')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
