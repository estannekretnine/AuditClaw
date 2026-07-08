'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Play,
  ChevronRight,
  ChevronDown,
  Settings,
  Video,
  Stethoscope,
  Search,
  MessageSquare,
} from 'lucide-react'
import {
  getVapiAssistants,
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  getVapiStartConfig,
  getSimliEnvStatus,
  getAssistantMedOpremaIds,
  setAssistantMedOpremaIds,
  setAssistantActiveSystemPrompt,
} from '@/lib/actions/vapi-assistants'
import { getVapiUcenici } from '@/lib/actions/vapi-ucenik'
import { getVapiMedicinskaOprema } from '@/lib/actions/vapi-medicinska-oprema'
import {
  createVapiSystemPrompt,
  deleteVapiSystemPrompt,
  getVapiSystemPromptByAssistant,
  updateVapiSystemPrompt,
} from '@/lib/actions/vapi-system-prompt'
import type {
  VapiAssistant,
  VapiMedicinskaOprema,
  VapiSystemPrompt,
  VapiUcenik,
} from '@/lib/types/vapi'
import { VapiCallModal, type VapiStartConfig } from '@/components/admin/vapi-call-modal'

function truncateText(text: string | null, maxLength: number = 60): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function assistantName(assistant: VapiAssistant): string {
  return assistant.opis_servisa?.trim() || assistant.assistant_id || `Asistent #${assistant.id}`
}

function simliProfileLabel(assistant: VapiAssistant): string {
  return `${assistant.simli_model} • ${assistant.simli_max_session_length}s / ${assistant.simli_max_idle_time}s`
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
  const [hasSimliApiKeyInEnv, setHasSimliApiKeyInEnv] = useState<boolean>(true)
  const [opremaOptions, setOpremaOptions] = useState<VapiMedicinskaOprema[]>([])
  const [selectedOpremaIds, setSelectedOpremaIds] = useState<number[]>([])
  const [showOpremaModal, setShowOpremaModal] = useState(false)
  const [opremaAssistant, setOpremaAssistant] = useState<VapiAssistant | null>(null)
  const [savingOprema, setSavingOprema] = useState(false)
  const [opremaSearch, setOpremaSearch] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [showSysPromptModal, setShowSysPromptModal] = useState(false)
  const [sysPromptAssistant, setSysPromptAssistant] = useState<VapiAssistant | null>(null)
  const [savingSysPrompt, setSavingSysPrompt] = useState(false)
  const [sysPromptSearch, setSysPromptSearch] = useState('')
  const [sysPromptOptions, setSysPromptOptions] = useState<VapiSystemPrompt[]>([])
  const [selectedSysPromptId, setSelectedSysPromptId] = useState('')
  const [newSysPromptText, setNewSysPromptText] = useState('')
  const [savingSysPromptCrud, setSavingSysPromptCrud] = useState(false)
  const [editingSysPromptId, setEditingSysPromptId] = useState<number | null>(null)
  const [editingSysPromptText, setEditingSysPromptText] = useState('')

  const [formData, setFormData] = useState({
    assistant_id: '',
    vapi_api_key: '',
    vapi_public_key: '',
    opis_servisa: '',
    System_Prompt: '',
    servisid: '',
    ima_video_pacijenta: false,
    simli_face_id: '',
    simli_api_key: '',
    simli_model: 'fasttalk',
    simli_max_session_length: '600',
    simli_max_idle_time: '600',
    pritisak: '120/80',
    puls: '78',
    temperatura: '36.6',
    saturacija: '98',
    secer: '5.4',
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

  const loadOprema = useCallback(async () => {
    const result = await getVapiMedicinskaOprema(500, 0)
    if (!result.error && result.data) {
      setOpremaOptions(result.data)
    }
  }, [])

  useEffect(() => {
    loadAssistants()
    loadUcenici()
    loadOprema()
  }, [loadAssistants, loadUcenici, loadOprema])

  useEffect(() => {
    const loadSimliEnvStatus = async () => {
      const result = await getSimliEnvStatus()
      if (!result.error && result.data) {
        setHasSimliApiKeyInEnv(result.data.hasSimliApiKeyInEnv)
      }
    }
    loadSimliEnvStatus()
  }, [])

  const topLevel = assistants.filter((a) => a.servisid === null)
  const knownSimliFaceIds = Array.from(
    new Set(
      assistants
        .map((assistant) => assistant.simli_face_id?.trim() || '')
        .filter((faceId) => faceId.length > 0)
    )
  )
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
      ima_video_pacijenta: false,
      simli_face_id: '',
      simli_api_key: '',
      simli_model: 'fasttalk',
      simli_max_session_length: '600',
      simli_max_idle_time: '600',
      pritisak: '120/80',
      puls: '78',
      temperatura: '36.6',
      saturacija: '98',
      secer: '5.4',
    })
    setEditingAssistant(null)
    setShowAdvanced(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = async (assistant: VapiAssistant) => {
    setEditingAssistant(assistant)
    setFormData({
      assistant_id: assistant.assistant_id && assistant.assistant_id !== 'pending-sync' ? assistant.assistant_id : '',
      vapi_api_key: assistant.vapi_api_key || '',
      vapi_public_key: assistant.vapi_public_key || '',
      opis_servisa: assistant.opis_servisa || '',
      System_Prompt: assistant.System_Prompt || '',
      servisid: assistant.servisid !== null ? String(assistant.servisid) : '',
      ima_video_pacijenta: assistant.ima_video_pacijenta || false,
      simli_face_id: assistant.simli_face_id || '',
      simli_api_key: assistant.simli_api_key || '',
      simli_model: assistant.simli_model || 'fasttalk',
      simli_max_session_length: String(assistant.simli_max_session_length || 600),
      simli_max_idle_time: String(assistant.simli_max_idle_time || 600),
      pritisak:
        typeof assistant.vitalni_znaci_default?.pritisak === 'string'
          ? assistant.vitalni_znaci_default.pritisak
          : '120/80',
      puls:
        typeof assistant.vitalni_znaci_default?.puls === 'number'
          ? String(assistant.vitalni_znaci_default.puls)
          : '78',
      temperatura:
        typeof assistant.vitalni_znaci_default?.temperatura === 'number'
          ? String(assistant.vitalni_znaci_default.temperatura)
          : '36.6',
      saturacija:
        typeof assistant.vitalni_znaci_default?.saturacija === 'number'
          ? String(assistant.vitalni_znaci_default.saturacija)
          : '98',
      secer:
        typeof assistant.vitalni_znaci_default?.secer === 'number'
          ? String(assistant.vitalni_znaci_default.secer)
          : '5.4',
    })
    setShowAdvanced(false)
    setShowForm(true)
  }

  const sortedOpremaOptions = [...opremaOptions].sort((a, b) =>
    a.naziv.localeCompare(b.naziv, 'sr', { sensitivity: 'base' })
  )
  const filteredOpremaOptions = sortedOpremaOptions.filter((item) => {
    if (showSelectedOnly && !selectedOpremaIds.includes(item.id)) return false
    const q = opremaSearch.trim().toLowerCase()
    if (!q) return true
    return item.naziv.toLowerCase().includes(q)
  })

  const sortedSysPromptOptions = [...sysPromptOptions].sort((a, b) =>
    a['SystemPrompt Vapi'].localeCompare(b['SystemPrompt Vapi'], 'sr', { sensitivity: 'base' })
  )
  const filteredSysPromptOptions = sortedSysPromptOptions.filter((item) => {
    const q = sysPromptSearch.trim().toLowerCase()
    if (!q) return true
    return item['SystemPrompt Vapi'].toLowerCase().includes(q)
  })

  const reloadAssistantPrompts = async (assistant: VapiAssistant) => {
    const result = await getVapiSystemPromptByAssistant(assistant.id)
    if (result.error) {
      alert('Greška pri učitavanju promptova: ' + result.error)
      return
    }
    const prompts = result.data || []
    setSysPromptOptions(prompts)
    const freshAssistant = assistants.find((item) => item.id === assistant.id) || assistant
    const active = prompts.find(
      (prompt) => prompt['SystemPrompt Vapi'] === (freshAssistant.System_Prompt || '')
    )
    setSelectedSysPromptId(active ? String(active.id) : '')
    setSysPromptAssistant(freshAssistant)
  }

  const handleManageOprema = async (assistant: VapiAssistant) => {
    setOpremaAssistant(assistant)
    setSelectedOpremaIds([])
    setOpremaSearch('')
    setShowSelectedOnly(false)
    setShowOpremaModal(true)
    const result = await getAssistantMedOpremaIds(assistant.id)
    if (result.error) {
      alert('Greška pri učitavanju opreme: ' + result.error)
      return
    }
    setSelectedOpremaIds(result.data || [])
  }

  const handleCloseOpremaModal = () => {
    setShowOpremaModal(false)
    setOpremaAssistant(null)
    setSelectedOpremaIds([])
    setOpremaSearch('')
    setShowSelectedOnly(false)
    setSavingOprema(false)
  }

  const handleSaveOprema = async () => {
    if (!opremaAssistant) return
    setSavingOprema(true)
    try {
      const result = await setAssistantMedOpremaIds(opremaAssistant.id, selectedOpremaIds)
      if (result.error) {
        alert('Greška: ' + result.error)
        return
      }
      handleCloseOpremaModal()
    } finally {
      setSavingOprema(false)
    }
  }

  const handleManageSysPrompt = async (assistant: VapiAssistant) => {
    setSysPromptAssistant(assistant)
    setSysPromptSearch('')
    setSelectedSysPromptId('')
    setSysPromptOptions([])
    setNewSysPromptText('')
    setEditingSysPromptId(null)
    setEditingSysPromptText('')
    setShowSysPromptModal(true)
    await reloadAssistantPrompts(assistant)
  }

  const handleCloseSysPromptModal = () => {
    setShowSysPromptModal(false)
    setSysPromptAssistant(null)
    setSysPromptSearch('')
    setSelectedSysPromptId('')
    setSysPromptOptions([])
    setNewSysPromptText('')
    setEditingSysPromptId(null)
    setEditingSysPromptText('')
    setSavingSysPrompt(false)
    setSavingSysPromptCrud(false)
  }

  const handleAddAssistantPrompt = async () => {
    if (!sysPromptAssistant || !newSysPromptText.trim()) return
    setSavingSysPromptCrud(true)
    try {
      const form = new FormData()
      form.append('SystemPromptVapi', newSysPromptText.trim())
      form.append('assistantid', String(sysPromptAssistant.id))
      const result = await createVapiSystemPrompt(form)
      if (result.error) {
        alert('Greška: ' + result.error)
        return
      }
      setNewSysPromptText('')
      await reloadAssistantPrompts(sysPromptAssistant)
    } finally {
      setSavingSysPromptCrud(false)
    }
  }

  const handleStartEditSysPrompt = (prompt: VapiSystemPrompt) => {
    setEditingSysPromptId(prompt.id)
    setEditingSysPromptText(prompt['SystemPrompt Vapi'])
  }

  const handleCancelEditSysPrompt = () => {
    setEditingSysPromptId(null)
    setEditingSysPromptText('')
  }

  const handleSaveEditSysPrompt = async () => {
    if (!sysPromptAssistant || editingSysPromptId === null || !editingSysPromptText.trim()) return
    setSavingSysPromptCrud(true)
    try {
      const form = new FormData()
      form.append('SystemPromptVapi', editingSysPromptText.trim())
      form.append('assistantid', String(sysPromptAssistant.id))
      const result = await updateVapiSystemPrompt(editingSysPromptId, form)
      if (result.error) {
        alert('Greška: ' + result.error)
        return
      }
      handleCancelEditSysPrompt()
      await reloadAssistantPrompts(sysPromptAssistant)
    } finally {
      setSavingSysPromptCrud(false)
    }
  }

  const handleDeleteAssistantPrompt = async (prompt: VapiSystemPrompt) => {
    if (!sysPromptAssistant) return
    if (!window.confirm('Obrisati ovaj SystemPrompt iz tabele?')) return
    setSavingSysPromptCrud(true)
    try {
      const result = await deleteVapiSystemPrompt(prompt.id)
      if (result.error) {
        alert('Greška: ' + result.error)
        return
      }
      if (selectedSysPromptId === String(prompt.id)) {
        setSelectedSysPromptId('')
      }
      if (editingSysPromptId === prompt.id) {
        handleCancelEditSysPrompt()
      }
      await reloadAssistantPrompts(sysPromptAssistant)
    } finally {
      setSavingSysPromptCrud(false)
    }
  }

  const handleSaveSysPrompt = async () => {
    if (!sysPromptAssistant) return
    setSavingSysPrompt(true)
    try {
      const promptId = selectedSysPromptId ? Number(selectedSysPromptId) : null
      const result = await setAssistantActiveSystemPrompt(sysPromptAssistant.id, promptId)
      if (result.error) {
        alert('Greška: ' + result.error)
        return
      }
      handleCloseSysPromptModal()
      await loadAssistants()
    } finally {
      setSavingSysPrompt(false)
    }
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
      fd.append('ima_video_pacijenta', String(formData.ima_video_pacijenta))
      fd.append('simli_face_id', formData.ima_video_pacijenta ? formData.simli_face_id : '')
      fd.append('simli_api_key', formData.ima_video_pacijenta ? formData.simli_api_key : '')
      fd.append('simli_model', formData.ima_video_pacijenta ? formData.simli_model : 'fasttalk')
      fd.append(
        'simli_max_session_length',
        formData.ima_video_pacijenta ? formData.simli_max_session_length : '600'
      )
      fd.append(
        'simli_max_idle_time',
        formData.ima_video_pacijenta ? formData.simli_max_idle_time : '600'
      )
      fd.append(
        'vitalni_znaci_default',
        formData.ima_video_pacijenta
          ? JSON.stringify({
              pritisak: formData.pritisak,
              puls: Number(formData.puls),
              temperatura: Number(formData.temperatura),
              saturacija: Number(formData.saturacija),
              secer: Number(formData.secer),
            })
          : ''
      )

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

  const renderActions = (assistant: VapiAssistant, compact = false, canStart = false) => {
    if (compact) {
      // Dugmad su sirine svog sadrzaja (ne razvucena) - flex-wrap sprecava izlazak van ekrana
      return (
        <div className="flex flex-wrap gap-1.5">
          {canStart && (
            <button
              onClick={() => handleStart(assistant)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm shadow-green-500/20"
            >
              <Play className="w-3.5 h-3.5 shrink-0" />Započni
            </button>
          )}
          <button
            onClick={() => handleEdit(assistant)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm shadow-amber-500/20"
          >
            <Edit className="w-3.5 h-3.5 shrink-0" />Izmeni
          </button>
          {canStart && (
            <button
              onClick={() => handleManageOprema(assistant)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-sm shadow-indigo-500/20"
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />Oprema
            </button>
          )}
          {canStart && (
            <button
              onClick={() => handleManageSysPrompt(assistant)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-sm shadow-violet-500/20"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />SysPrompt
            </button>
          )}
          <button
            onClick={() => handleDelete(assistant)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm shadow-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />Obriši
          </button>
        </div>
      )
    }

    return (
      <div className="flex justify-end gap-2">
        {canStart && (
          <button
            onClick={() => handleStart(assistant)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md shadow-green-500/20"
          >
            <Play className="w-4 h-4" /><span className="hidden lg:inline">Započni</span>
          </button>
        )}
        <button
          onClick={() => handleEdit(assistant)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
        >
          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
        </button>
        {canStart && (
          <button
            onClick={() => handleManageOprema(assistant)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-indigo-500/20"
          >
            <Stethoscope className="w-4 h-4" /><span className="hidden lg:inline">Oprema</span>
          </button>
        )}
        {canStart && (
          <button
            onClick={() => handleManageSysPrompt(assistant)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-md shadow-violet-500/20"
          >
            <MessageSquare className="w-4 h-4" /><span className="hidden lg:inline">SysPrompt</span>
          </button>
        )}
        <button
          onClick={() => handleDelete(assistant)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
        >
          <Trash2 className="w-4 h-4" /><span className="hidden lg:inline">Obriši</span>
        </button>
      </div>
    )
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Vapi Assistants</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Servisi i podređeni asistenti ({totalCount})</p>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Prikazani su glavni servisi (vrh). Kliknite na strelicu da vidite podređene asistente.
            Pri unosu izaberite kom servisu asistent pripada — ako ne izaberete, on je novi vrh.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl sm:rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium shrink-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>Novi asistent</span>
        </button>
      </div>

      {topLevel.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-16 text-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Bot className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-lg sm:text-xl font-semibold mb-2">Nema servisa</p>
          <p className="text-gray-500 mb-6">Dodajte prvi servis (vrh)</p>
          <button
            onClick={handleAdd}
            className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
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
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-amber-50 transition-all duration-200">
                  <button
                    onClick={() => kids.length > 0 && toggleExpand(parent.id)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      kids.length > 0 ? 'bg-gray-100 hover:bg-amber-100 text-gray-700' : 'bg-transparent text-transparent cursor-default'
                    }`}
                    aria-label="Prikaži podređene"
                    type="button"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {parent.ima_video_pacijenta && <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        <p className="text-sm font-semibold text-gray-900 truncate">{assistantName(parent)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-md uppercase tracking-wide">Vrh</span>
                        {parent.ima_video_pacijenta && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-100 rounded-md">
                            Simli: {simliProfileLabel(parent)}
                          </span>
                        )}
                        {kids.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-md">{kids.length} podređenih</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{truncateText(parent.System_Prompt, 90)}</p>
                  </div>
                  <div className="hidden sm:block">{renderActions(parent, false, false)}</div>
                </div>
                <div className="sm:hidden px-3 pb-2.5">{renderActions(parent, true, false)}</div>

                {isExpanded && kids.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                    {kids.map((child) => (
                      <div key={child.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 p-3 sm:p-4 pl-6 sm:pl-14 hover:bg-amber-50 transition-all duration-200">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {child.ima_video_pacijenta && <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            <p className="text-sm font-medium text-gray-900 truncate">{assistantName(child)}</p>
                          </div>
                          {child.ima_video_pacijenta && (
                            <p className="text-[11px] text-indigo-700 mt-0.5 truncate">
                              Simli: {simliProfileLabel(child)}
                            </p>
                          )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">{editingAssistant ? 'Izmeni asistenta' : 'Novi asistent'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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
                <p className="text-xs text-gray-500 mt-1">
                  Za podređene asistente koristite dugme <strong>SysPrompt</strong> u listi za izbor iz tabele.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.ima_video_pacijenta}
                    onChange={(e) => setFormData({ ...formData, ima_video_pacijenta: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Video pacijent (Simli avatar)
                </label>

                {formData.ima_video_pacijenta && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!hasSimliApiKeyInEnv && !formData.simli_api_key.trim() && (
                      <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        SIMLI_API_KEY nije podešen u env varijablama, niti je unet u formu asistenta.
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Simli API Key
                        <span className="ml-2 text-xs font-normal text-gray-500">(opciono ako je u env)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.simli_api_key}
                        onChange={(e) => setFormData({ ...formData, simli_api_key: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Unesite Simli API key (ako nije u env)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Simli lice</label>
                      <input
                        type="text"
                        value={formData.simli_face_id}
                        onChange={(e) => setFormData({ ...formData, simli_face_id: e.target.value })}
                        list="simli-face-id-options"
                        required={formData.ima_video_pacijenta}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Unesite face ID iz Simli naloga"
                      />
                      <datalist id="simli-face-id-options">
                        {knownSimliFaceIds.map((faceId) => (
                          <option key={faceId} value={faceId} />
                        ))}
                      </datalist>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Face ID se čuva u tabeli i predlaže iz postojećih unosa.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Simli model</label>
                      <select
                        value={formData.simli_model}
                        onChange={(e) => setFormData({ ...formData, simli_model: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <option value="fasttalk">fasttalk</option>
                        <option value="artalk">artalk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max session (s)</label>
                      <input
                        type="number"
                        min={60}
                        max={3600}
                        value={formData.simli_max_session_length}
                        onChange={(e) =>
                          setFormData({ ...formData, simli_max_session_length: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max idle (s)</label>
                      <input
                        type="number"
                        min={30}
                        max={3600}
                        value={formData.simli_max_idle_time}
                        onChange={(e) => setFormData({ ...formData, simli_max_idle_time: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pritisak</label>
                      <input
                        type="text"
                        value={formData.pritisak}
                        onChange={(e) => setFormData({ ...formData, pritisak: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Puls</label>
                      <input
                        type="number"
                        value={formData.puls}
                        onChange={(e) => setFormData({ ...formData, puls: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperatura}
                        onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Saturacija</label>
                      <input
                        type="number"
                        value={formData.saturacija}
                        onChange={(e) => setFormData({ ...formData, saturacija: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Šećer</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.secer}
                        onChange={(e) => setFormData({ ...formData, secer: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
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

      {showOpremaModal && opremaAssistant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Medicinska oprema</h3>
                  <p className="text-sm text-indigo-100 truncate">{assistantName(opremaAssistant)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Izaberite opremu koja će biti dostupna učeniku pri pokretanju ove vežbe.
              </p>

              {opremaOptions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Nema unosa opreme. Prvo dodajte opremu u modulu „Medicinska oprema“.
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={opremaSearch}
                        onChange={(e) => setOpremaSearch(e.target.value)}
                        placeholder="Pretraži po nazivu..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSelectedOnly}
                        onChange={(e) => setShowSelectedOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Samo selektovano
                    </label>
                  </div>

                  {filteredOpremaOptions.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      Nema rezultata za aktivne filtere.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                      {filteredOpremaOptions.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOpremaIds.includes(item.id)}
                            onChange={(e) => {
                              setSelectedOpremaIds((prev) =>
                                e.target.checked
                                  ? Array.from(new Set([...prev, item.id]))
                                  : prev.filter((id) => id !== item.id)
                              )
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            <strong>{item.naziv}</strong>
                            {item.namena ? (
                              <span className="block text-xs text-gray-500">{item.namena}</span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Izabrano: {selectedOpremaIds.length} / {opremaOptions.length}
                  {opremaSearch.trim()
                    ? ` · Prikazano: ${filteredOpremaOptions.length}`
                    : ''}
                </p>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                  <button
                    type="button"
                    onClick={handleCloseOpremaModal}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Otkaži
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOprema}
                    disabled={savingOprema || opremaOptions.length === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 font-medium disabled:opacity-50"
                  >
                    {savingOprema ? 'Čuvanje...' : 'Sačuvaj opremu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSysPromptModal && sysPromptAssistant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-violet-600 to-violet-800 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white">System Prompt</h3>
                  <p className="text-sm text-violet-100 truncate">{assistantName(sysPromptAssistant)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Dodajte više promptova u tabelu za ovog asistenta i označite koji je aktivan.
              </p>

              <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50">
                <label className="block text-sm font-semibold text-gray-700">Novi prompt u tabelu</label>
                <textarea
                  value={newSysPromptText}
                  onChange={(e) => setNewSysPromptText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-y font-mono text-sm"
                  placeholder="Unesite tekst SystemPrompt-a..."
                />
                <button
                  type="button"
                  onClick={handleAddAssistantPrompt}
                  disabled={savingSysPromptCrud || !newSysPromptText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-md shadow-violet-500/20 font-medium disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {savingSysPromptCrud ? 'Dodavanje...' : 'Dodaj u tabelu'}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={sysPromptSearch}
                  onChange={(e) => setSysPromptSearch(e.target.value)}
                  placeholder="Pretraži promptove..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {sysPromptOptions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Još nema promptova za ovog asistenta. Dodajte prvi prompt iznad.
                </div>
              ) : filteredSysPromptOptions.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  Nema rezultata za aktivne filtere.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aktivan</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prompt</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Akcije</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredSysPromptOptions.map((item) => (
                        <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                          <td className="px-3 py-3 align-top">
                            <input
                              type="radio"
                              name="sys-prompt-active"
                              checked={selectedSysPromptId === String(item.id)}
                              onChange={() => setSelectedSysPromptId(String(item.id))}
                              className="mt-1 h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 align-top whitespace-nowrap">{item.id}</td>
                          <td className="px-3 py-3 text-sm text-gray-800 align-top min-w-[240px]">
                            {editingSysPromptId === item.id ? (
                              <textarea
                                value={editingSysPromptText}
                                onChange={(e) => setEditingSysPromptText(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-xs"
                              />
                            ) : (
                              <span className="whitespace-pre-wrap">{item['SystemPrompt Vapi']}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right align-top whitespace-nowrap">
                            {editingSysPromptId === item.id ? (
                              <div className="inline-flex flex-col sm:flex-row gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleSaveEditSysPrompt}
                                  disabled={savingSysPromptCrud}
                                  className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                                >
                                  Sačuvaj
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditSysPrompt}
                                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                  Otkaži
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSysPrompt(item)}
                                  disabled={savingSysPromptCrud}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Izmeni
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssistantPrompt(item)}
                                  disabled={savingSysPromptCrud}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Obriši
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Ukupno: {sysPromptOptions.length}
                  {sysPromptSearch.trim() ? ` · Prikazano: ${filteredSysPromptOptions.length}` : ''}
                  {selectedSysPromptId ? ` · Aktivan ID: ${selectedSysPromptId}` : ' · Nije izabran aktivni prompt'}
                </p>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                  <button
                    type="button"
                    onClick={handleCloseSysPromptModal}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Otkaži
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSysPrompt}
                    disabled={savingSysPrompt || savingSysPromptCrud || !selectedSysPromptId}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25 font-medium disabled:opacity-50"
                  >
                    {savingSysPrompt ? 'Čuvanje...' : 'Sačuvaj aktivni prompt'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
