'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Plus, Edit, Trash2, Play, ChevronRight, ChevronDown, Settings } from 'lucide-react'
import {
  getVapiAssistants,
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  getVapiStartConfig,
} from '@/lib/actions/vapi-assistants'
import { getVapiUcenici } from '@/lib/actions/vapi-ucenik'
import type { VapiAssistant, VapiUcenik } from '@/lib/types/vapi'
import { VapiCallModal, type VapiStartConfig } from '@/components/admin/vapi-call-modal'

function truncateText(text: string | null, maxLength: number = 60): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function assistantName(assistant: VapiAssistant): string {
  return assistant.opis_servisa?.trim() || assistant.assistant_id || `Asistent #${assistant.id}`
}

export default function VapiAssistantsPage() {
  const [loading, setLoading] = useState(true)
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<VapiAssistant | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [showCallModal, setShowCallModal] = useState(false)
  const [callConfig, setCallConfig] = useState<VapiStartConfig | null>(null)
  const [callLoading, setCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [ucenici, setUcenici] = useState<VapiUcenik[]>([])

  const [formData, setFormData] = useState({
    assistant_id: '',
    vapi_api_key: '',
    vapi_public_key: '',
    opis_servisa: '',
    System_Prompt: '',
    servisid: '',
  })

  const loadAssistants = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVapiAssistants(200, 0)
      if (result.data) {
        setAssistants(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUcenici = useCallback(async () => {
    const result = await getVapiUcenici(200, 0)
    if (result.data) {
      setUcenici(result.data)
    }
  }, [])

  useEffect(() => {
    loadAssistants()
    loadUcenici()
  }, [loadAssistants, loadUcenici])

  const topLevel = assistants.filter((a) => a.servisid === null)
  const childrenByParent = assistants.reduce<Record<number, VapiAssistant[]>>((acc, a) => {
    if (a.servisid !== null) {
      if (!acc[a.servisid]) acc[a.servisid] = []
      acc[a.servisid].push(a)
    }
    return acc
  }, {})

  const resetForm = () => {
    setFormData({
      assistant_id: '',
      vapi_api_key: '',
      vapi_public_key: '',
      opis_servisa: '',
      System_Prompt: '',
      servisid: '',
    })
    setEditingAssistant(null)
    setShowAdvanced(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (assistant: VapiAssistant) => {
    setEditingAssistant(assistant)
    setFormData({
      assistant_id: assistant.assistant_id && assistant.assistant_id !== 'pending-sync' ? assistant.assistant_id : '',
      vapi_api_key: assistant.vapi_api_key || '',
      vapi_public_key: assistant.vapi_public_key || '',
      opis_servisa: assistant.opis_servisa || '',
      System_Prompt: assistant.System_Prompt || '',
      servisid: assistant.servisid !== null ? String(assistant.servisid) : '',
    })
    setShowAdvanced(false)
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
      fd.append('servisid', formData.servisid)

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
        if (result.vapiSyncWarning) {
          alert('Asistent je sačuvan, ali Vapi sinhronizacija nije uspela:\n\n' + result.vapiSyncWarning)
        }
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (assistant: VapiAssistant) => {
    const kids = childrenByParent[assistant.id] || []
    if (kids.length > 0) {
      alert('Ne možete obrisati servis koji ima podređene asistente. Prvo obrišite ili premestite njih.')
      return
    }
    if (!window.confirm(`Da li ste sigurni da želite da obrišete "${assistantName(assistant)}"?`)) {
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

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderActions = (assistant: VapiAssistant, compact = false, canStart = false) => (
    <div className={`flex ${compact ? 'flex-wrap' : 'justify-end'} gap-2`}>
      {canStart && (
        <button
          onClick={() => handleStart(assistant)}
          className={`${compact ? 'flex-1 min-w-[110px]' : ''} flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md shadow-green-500/20`}
        >
          <Play className="w-4 h-4" /><span className={compact ? '' : 'hidden lg:inline'}>Započni</span>
        </button>
      )}
      <button
        onClick={() => handleEdit(assistant)}
        className={`${compact ? 'flex-1' : ''} flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20`}
      >
        <Edit className="w-4 h-4" /><span className={compact ? '' : 'hidden lg:inline'}>Izmeni</span>
      </button>
      <button
        onClick={() => handleDelete(assistant)}
        className={`${compact ? 'flex-1' : ''} flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20`}
      >
        <Trash2 className="w-4 h-4" /><span className={compact ? '' : 'hidden lg:inline'}>Obriši</span>
      </button>
    </div>
  )

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
          <p className="text-gray-500 mt-1">Servisi i podređeni asistenti ({totalCount})</p>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Prikazani su glavni servisi (vrh). Kliknite na strelicu da vidite podređene asistente.
            Pri unosu izaberite kom servisu asistent pripada — ako ne izaberete, on je novi vrh.
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

      {topLevel.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema servisa</p>
          <p className="text-gray-500 mb-6">Dodajte prvi servis (vrh)</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj asistenta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((parent) => {
            const kids = childrenByParent[parent.id] || []
            const isExpanded = expanded[parent.id]
            return (
              <div key={parent.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-4 p-4 hover:bg-amber-50 transition-all duration-200">
                  <button
                    onClick={() => kids.length > 0 && toggleExpand(parent.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      kids.length > 0 ? 'bg-gray-100 hover:bg-amber-100 text-gray-700' : 'bg-transparent text-transparent cursor-default'
                    }`}
                    aria-label="Prikaži podređene"
                    type="button"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{assistantName(parent)}</p>
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-md uppercase tracking-wide">Vrh</span>
                      {kids.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-md">{kids.length} podređenih</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{truncateText(parent.System_Prompt, 90)}</p>
                  </div>
                  <div className="hidden sm:block">{renderActions(parent, false, false)}</div>
                </div>
                <div className="sm:hidden px-4 pb-4">{renderActions(parent, true, false)}</div>

                {isExpanded && kids.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                    {kids.map((child) => (
                      <div key={child.id} className="flex items-center gap-4 p-4 pl-14 hover:bg-amber-50 transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{assistantName(child)}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{truncateText(child.System_Prompt, 90)}</p>
                        </div>
                        <div className="hidden sm:block">{renderActions(child, false, true)}</div>
                        <div className="sm:hidden w-full">{renderActions(child, true, true)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <VapiCallModal
        open={showCallModal}
        onClose={handleCloseCallModal}
        config={callConfig}
        loading={callLoading}
        loadError={callError}
        ucenici={ucenici}
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
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-900">
                <p className="text-xs text-green-800 leading-relaxed">
                  Dovoljno je da unesete <strong>opis servisa</strong>. AuditClaw automatski kreira/ažurira asistenta na Vapi
                  platformi. Publish u Vapi dashboardu nije potreban.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Opis servisa *</label>
                <textarea
                  value={formData.opis_servisa}
                  onChange={(e) => setFormData({ ...formData, opis_servisa: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="Npr. Prijem pacijenta u bolnicu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pripada servisu
                  <span className="ml-2 text-xs font-normal text-gray-500">(prazno = novi vrh)</span>
                </label>
                <select
                  value={formData.servisid}
                  onChange={(e) => setFormData({ ...formData, servisid: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Vrh (glavni servis) --</option>
                  {topLevel
                    .filter((a) => !editingAssistant || a.id !== editingAssistant.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {assistantName(a)}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Možete izabrati samo glavne servise (vrh). Podređeni asistenti ne mogu imati svoje podređene.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">System Prompt</label>
                <textarea
                  value={formData.System_Prompt}
                  onChange={(e) => setFormData({ ...formData, System_Prompt: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y font-mono text-sm"
                  placeholder="Uputstvo za asistenta (opciono)"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Settings className="w-4 h-4" />
                    Napredno (Assistant ID, API ključevi)
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Ostavite prazno ako su ključevi već u Vercel env varijablama.
                    </p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Vapi Assistant ID
                        <span className="ml-2 text-xs font-normal text-gray-500">(opciono)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.assistant_id}
                        onChange={(e) => setFormData({ ...formData, assistant_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Ostavite prazno — kreira se automatski"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Vapi Private API Key</label>
                      <input
                        type="text"
                        value={formData.vapi_api_key}
                        onChange={(e) => setFormData({ ...formData, vapi_api_key: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Private key (server)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Vapi Public API Key</label>
                      <input
                        type="text"
                        value={formData.vapi_public_key}
                        onChange={(e) => setFormData({ ...formData, vapi_public_key: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Public key (web poziv)"
                      />
                    </div>
                  </div>
                )}
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
