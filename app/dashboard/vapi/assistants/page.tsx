'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Plus, Edit, Trash2, Key, Play } from 'lucide-react'
import {
  getVapiAssistants,
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  getVapiStartConfig,
} from '@/lib/actions/vapi-assistants'
import type { VapiAssistant } from '@/lib/types/vapi'
import { VapiCallModal, type VapiStartConfig } from '@/components/admin/vapi-call-modal'

function maskApiKey(key: string | null): string {
  if (!key) return '-'
  if (key.length <= 4) return '••••'
  return `••••${key.slice(-4)}`
}

function truncateText(text: string | null, maxLength: number = 60): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export default function VapiAssistantsPage() {
  const [loading, setLoading] = useState(true)
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<VapiAssistant | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callConfig, setCallConfig] = useState<VapiStartConfig | null>(null)
  const [callLoading, setCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    assistant_id: '',
    vapi_api_key: '',
    vapi_public_key: '',
    opis_servisa: '',
    System_Prompt: '',
  })

  const loadAssistants = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVapiAssistants(50, 0)
      if (result.data) {
        setAssistants(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssistants()
  }, [loadAssistants])

  const resetForm = () => {
    setFormData({
      assistant_id: '',
      vapi_api_key: '',
      vapi_public_key: '',
      opis_servisa: '',
      System_Prompt: '',
    })
    setEditingAssistant(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (assistant: VapiAssistant) => {
    setEditingAssistant(assistant)
    setFormData({
      assistant_id: assistant.assistant_id || '',
      vapi_api_key: assistant.vapi_api_key || '',
      vapi_public_key: assistant.vapi_public_key || '',
      opis_servisa: assistant.opis_servisa || '',
      System_Prompt: assistant.System_Prompt || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('assistant_id', formData.assistant_id)
      fd.append('vapi_api_key', formData.vapi_api_key)
      fd.append('vapi_public_key', formData.vapi_public_key)
      fd.append('opis_servisa', formData.opis_servisa)
      fd.append('System_Prompt', formData.System_Prompt)

      let result
      if (editingAssistant) {
        result = await updateVapiAssistant(editingAssistant.id, fd)
      } else {
        result = await createVapiAssistant(fd)
      }

      if (!result.error) {
        setShowForm(false)
        resetForm()
        await loadAssistants()
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (assistant: VapiAssistant) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete asistenta "${assistant.assistant_id}"?`)) {
      return
    }
    const result = await deleteVapiAssistant(assistant.id)
    if (!result.error) {
      await loadAssistants()
    } else {
      alert('Greška: ' + result.error)
    }
  }

  const handleStart = async (assistant: VapiAssistant) => {
    setShowCallModal(true)
    setCallLoading(true)
    setCallConfig(null)
    setCallError(null)

    try {
      const result = await getVapiStartConfig(assistant.id)
      if (result.error || !result.data) {
        setCallError(result.error || 'Nije moguće pokrenuti poziv.')
        return
      }
      setCallConfig(result.data)
    } finally {
      setCallLoading(false)
    }
  }

  const handleCloseCallModal = () => {
    setShowCallModal(false)
    setCallConfig(null)
    setCallError(null)
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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Vapi Assistants</h2>
          <p className="text-gray-500 mt-1">Upravljanje Vapi asistentima ({totalCount})</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Vapi API ključevi se kopiraju iz dashboard.vapi.ai → API Keys (Private za server, Public za web poziv).
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novi asistent</span>
        </button>
      </div>

      {assistants.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema asistenata</p>
          <p className="text-gray-500 mb-6">Dodajte prvog Vapi asistenta</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj asistenta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Assistant ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Opis servisa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">System Prompt</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    <span className="block">Private Key</span>
                    <span className="block text-[10px] font-normal normal-case text-gray-400 mt-0.5">Server / webhook</span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    <span className="block">Public Key</span>
                    <span className="block text-[10px] font-normal normal-case text-gray-400 mt-0.5">Web poziv</span>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assistants.map((assistant) => (
                  <tr key={assistant.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{assistant.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">{assistant.assistant_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{truncateText(assistant.opis_servisa)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{truncateText(assistant.System_Prompt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500" title="Private API Key — za server (webhook, validacija)">
                        <Key className="w-4 h-4 shrink-0" />
                        {maskApiKey(assistant.vapi_api_key)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500" title="Public API Key — za pokretanje web poziva">
                        <Key className="w-4 h-4 shrink-0" />
                        {maskApiKey(assistant.vapi_public_key)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleStart(assistant)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md shadow-green-500/20"
                        >
                          <Play className="w-4 h-4" /><span className="hidden lg:inline">Započni</span>
                        </button>
                        <button
                          onClick={() => handleEdit(assistant)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDelete(assistant)}
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
            {assistants.map((assistant) => (
              <div key={assistant.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-1">ID: {assistant.id}</span>
                  <p className="text-sm font-medium text-gray-900">{assistant.assistant_id}</p>
                  <p className="text-xs text-gray-500 mt-1">{truncateText(assistant.opis_servisa, 80)}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    <span title="Private API Key">Private: {maskApiKey(assistant.vapi_api_key)}</span>
                    <span title="Public API Key">Public: {maskApiKey(assistant.vapi_public_key)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStart(assistant)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md shadow-green-500/20 text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />Započni
                  </button>
                  <button
                    onClick={() => handleEdit(assistant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(assistant)}
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

      <VapiCallModal
        open={showCallModal}
        onClose={handleCloseCallModal}
        config={callConfig}
        loading={callLoading}
        loadError={callError}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingAssistant ? 'Izmeni asistenta' : 'Novi asistent'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 space-y-2">
                <p className="font-semibold">Šta su Vapi API ključevi?</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  U Vapi dashboardu (API Keys) postoje <strong>dva različita</strong> ključa. Oba su obavezna:
                </p>
                <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                  <li><strong>Private Key</strong> — tajni server ključ za webhook i proveru asistenta (nikad u browseru).</li>
                  <li><strong>Public Key</strong> — javni ključ za pokretanje web glasovnog poziva (dugme Započni).</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assistant ID *</label>
                <input
                  type="text"
                  value={formData.assistant_id}
                  onChange={(e) => setFormData({ ...formData, assistant_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="UUID asistenta iz Vapi dashboarda"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vapi Dashboard → Assistants → izaberi asistenta → kopiraj ID.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vapi Private API Key
                  <span className="ml-2 text-xs font-normal text-gray-500">(server — webhook)</span>
                </label>
                <input
                  type="text"
                  value={formData.vapi_api_key}
                  onChange={(e) => setFormData({ ...formData, vapi_api_key: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Private key — API Keys → Private"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Koristi se na serveru za sinhronizaciju webhook-a. <strong>Ne</strong> unosi se Public key ovde.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vapi Public API Key
                  <span className="ml-2 text-xs font-normal text-gray-500">(browser — web poziv)</span>
                </label>
                <input
                  type="text"
                  value={formData.vapi_public_key}
                  onChange={(e) => setFormData({ ...formData, vapi_public_key: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Public key — API Keys → Public"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Koristi se za pokretanje glasovnog poziva (Započni). <strong>Ne</strong> unosi se Private key ovde.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Opis servisa</label>
                <textarea
                  value={formData.opis_servisa}
                  onChange={(e) => setFormData({ ...formData, opis_servisa: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="Opis servisa asistenta"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">System Prompt</label>
                <textarea
                  value={formData.System_Prompt}
                  onChange={(e) => setFormData({ ...formData, System_Prompt: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y font-mono text-sm"
                  placeholder="System prompt za asistenta"
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
                  {saving ? 'Čuvanje...' : (editingAssistant ? 'Sačuvaj izmene' : 'Kreiraj asistenta')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
