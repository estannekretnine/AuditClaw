'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react'
import {
  createVapiSystemPrompt,
  deleteVapiSystemPrompt,
  getVapiSystemPrompts,
  updateVapiSystemPrompt,
} from '@/lib/actions/vapi-system-prompt'
import type { VapiSystemPrompt } from '@/lib/types/vapi'

function truncateText(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export default function VapiSysPromptPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<VapiSystemPrompt[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VapiSystemPrompt | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ SystemPromptVapi: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVapiSystemPrompts(500, 0)
      if (!result.error && result.data) setItems(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormData({ SystemPromptVapi: '' })
    setEditing(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (item: VapiSystemPrompt) => {
    setEditing(item)
    setFormData({ SystemPromptVapi: item['SystemPrompt Vapi'] })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData()
      form.append('SystemPromptVapi', formData.SystemPromptVapi)
      form.append('assistantid', '')

      const result = editing
        ? await updateVapiSystemPrompt(editing.id, form)
        : await createVapiSystemPrompt(form)

      if (result.error) {
        alert(`Greška: ${result.error}`)
        return
      }
      setShowForm(false)
      resetForm()
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: VapiSystemPrompt) => {
    if (!window.confirm('Obrisati ovaj SystemPrompt?')) return
    const result = await deleteVapiSystemPrompt(item.id)
    if (result.error) {
      alert(`Greška: ${result.error}`)
      return
    }
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">System Prompt</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Globalni promptovi koji se mogu dodeliti Vapi asistentima.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novi prompt</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema promptova</p>
          <p className="text-gray-500 mb-6">Dodajte prvi globalni SystemPrompt.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Tip</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50 transition-all duration-200">
                    <td className="px-6 py-4 text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-2xl">
                      {truncateText(item['SystemPrompt Vapi'])}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.assistantid ? `Asistent #${item.assistantid}` : 'Globalni'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" />
                          Izmeni
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-amber-50 transition-all duration-200">
                <div className="space-y-2 mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                    ID: {item.id}
                  </span>
                  <p className="text-xs text-gray-500">
                    {item.assistantid ? `Asistent #${item.assistantid}` : 'Globalni'}
                  </p>
                  <p className="text-sm text-gray-800 break-words">
                    {truncateText(item['SystemPrompt Vapi'], 220)}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl sm:rounded-t-3xl">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {editing ? 'Izmeni SystemPrompt' : 'Novi globalni SystemPrompt'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SystemPrompt Vapi *</label>
                <textarea
                  value={formData.SystemPromptVapi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, SystemPromptVapi: e.target.value }))}
                  required
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y font-mono text-sm"
                  placeholder="Uputstvo za asistenta..."
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
                  {saving ? 'Čuvanje...' : editing ? 'Sačuvaj izmene' : 'Kreiraj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
