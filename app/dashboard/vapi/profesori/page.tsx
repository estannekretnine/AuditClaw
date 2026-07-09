'use client'

import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Plus, Edit, Trash2, Bot, Check, X } from 'lucide-react'
import {
  getVapiProfesori,
  createVapiProfesor,
  updateVapiProfesor,
  deleteVapiProfesor,
  getProfesorAssistants,
  setProfesorAssistants,
} from '@/lib/actions/vapi-profesor'
import { getVapiAssistants } from '@/lib/actions/vapi-assistants'
import type { VapiProfesor, VapiAssistant } from '@/lib/types/vapi'
import { getEffectiveStatus } from '@/lib/role-utils'

function assistantLabel(assistant: VapiAssistant): string {
  if (assistant.opis_servisa) return assistant.opis_servisa
  return assistant.assistant_id || `Asistent #${assistant.id}`
}

export default function VapiProfesoriPage() {
  const [loading, setLoading] = useState(true)
  const [profesori, setProfesori] = useState<VapiProfesor[]>([])
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editingProfesor, setEditingProfesor] = useState<VapiProfesor | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    pasword: '',
    predmet: '',
    stsaktivan: true,
  })

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [serviceProfesor, setServiceProfesor] = useState<VapiProfesor | null>(null)
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<number[]>([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [serviceSaving, setServiceSaving] = useState(false)
  const [isVapiUser, setIsVapiUser] = useState(false)
  const [linkedProfesorId, setLinkedProfesorId] = useState<number | null>(null)

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const userCookie = getCookie('user')
    if (!userCookie) return

    try {
      const userData = JSON.parse(decodeURIComponent(userCookie))
      setIsVapiUser(getEffectiveStatus(userData.stsstatus, userData.adresa) === 'vapi')
      setLinkedProfesorId(userData.profesorid ? Number(userData.profesorid) : null)
    } catch {
      setIsVapiUser(false)
      setLinkedProfesorId(null)
    }
  }, [])

  const canEditProfesor = (profesor: VapiProfesor) =>
    !isVapiUser || (linkedProfesorId !== null && profesor.id === linkedProfesorId)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profesoriResult, assistantsResult] = await Promise.all([
        getVapiProfesori(100, 0),
        getVapiAssistants(100, 0),
      ])
      if (profesoriResult.data) {
        setProfesori(profesoriResult.data)
        setTotalCount(profesoriResult.count)
      }
      if (assistantsResult.data) {
        setAssistants(assistantsResult.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormData({ ime: '', prezime: '', email: '', pasword: '', predmet: '', stsaktivan: true })
    setEditingProfesor(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (profesor: VapiProfesor) => {
    setEditingProfesor(profesor)
    setFormData({
      ime: profesor.ime || '',
      prezime: profesor.prezime || '',
      email: profesor.email || '',
      pasword: profesor.pasword || '',
      predmet: profesor.predmet || '',
      stsaktivan: profesor.stsaktivan ?? true,
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
      fd.append('email', formData.email)
      fd.append('pasword', formData.pasword)
      fd.append('predmet', formData.predmet)
      fd.append('stsaktivan', String(formData.stsaktivan))

      const result = editingProfesor
        ? await updateVapiProfesor(editingProfesor.id, fd)
        : await createVapiProfesor(fd)

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

  const handleDelete = async (profesor: VapiProfesor) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete profesora "${profesor.ime} ${profesor.prezime || ''}"?`)) {
      return
    }
    const result = await deleteVapiProfesor(profesor.id)
    if (!result.error) {
      await loadData()
    } else {
      alert('Greška: ' + result.error)
    }
  }

  const handleOpenServices = async (profesor: VapiProfesor) => {
    setServiceProfesor(profesor)
    setShowServiceModal(true)
    setServiceLoading(true)
    setSelectedAssistantIds([])

    try {
      const result = await getProfesorAssistants(profesor.id)
      if (result.data) {
        setSelectedAssistantIds(
          result.data
            .map((row) => row.assistantid)
            .filter((val): val is number => val !== null)
        )
      }
    } finally {
      setServiceLoading(false)
    }
  }

  const toggleAssistant = (assistantId: number) => {
    setSelectedAssistantIds((prev) =>
      prev.includes(assistantId)
        ? prev.filter((id) => id !== assistantId)
        : [...prev, assistantId]
    )
  }

  const handleSaveServices = async () => {
    if (!serviceProfesor) return
    setServiceSaving(true)
    try {
      const result = await setProfesorAssistants(serviceProfesor.id, selectedAssistantIds)
      if (!result.error) {
        setShowServiceModal(false)
        setServiceProfesor(null)
      } else {
        alert('Greška: ' + result.error)
      }
    } finally {
      setServiceSaving(false)
    }
  }

  const handleCloseServices = () => {
    setShowServiceModal(false)
    setServiceProfesor(null)
    setSelectedAssistantIds([])
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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Profesori</h2>
          <p className="text-gray-500 mt-1">Upravljanje profesorima ({totalCount})</p>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Za svakog profesora izaberite servise (asistente) koje sme da koristi klikom na dugme „Servisi“.
          </p>
        </div>
        {!isVapiUser && (
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novi profesor</span>
        </button>
        )}
      </div>

      {profesori.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema profesora</p>
          <p className="text-gray-500 mb-6">Dodajte prvog profesora</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj profesora
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Predmet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profesori.map((profesor) => (
                  <tr key={profesor.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{profesor.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">{profesor.ime} {profesor.prezime || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{profesor.predmet || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{profesor.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {profesor.stsaktivan ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg">
                          <Check className="w-3 h-3" /> Aktivan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">
                          <X className="w-3 h-3" /> Neaktivan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {!isVapiUser && (
                        <button
                          onClick={() => handleOpenServices(profesor)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md shadow-blue-500/20"
                        >
                          <Bot className="w-4 h-4" /><span className="hidden lg:inline">Servisi</span>
                        </button>
                        )}
                        {canEditProfesor(profesor) && (
                        <button
                          onClick={() => handleEdit(profesor)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        )}
                        {!isVapiUser && (
                        <button
                          onClick={() => handleDelete(profesor)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" /><span className="hidden lg:inline">Obriši</span>
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {profesori.map((profesor) => (
              <div key={profesor.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-1">ID: {profesor.id}</span>
                  <p className="text-sm font-medium text-gray-900">{profesor.ime} {profesor.prezime || ''}</p>
                  <p className="text-xs text-gray-600 mt-1">{profesor.predmet ? `Predmet: ${profesor.predmet}` : 'Predmet: —'}</p>
                  <p className="text-xs text-gray-500 mt-1">{profesor.email || '-'}</p>
                  <p className="text-xs mt-1">
                    {profesor.stsaktivan ? (
                      <span className="text-green-600 font-medium">Aktivan</span>
                    ) : (
                      <span className="text-gray-500 font-medium">Neaktivan</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isVapiUser && (
                  <button
                    onClick={() => handleOpenServices(profesor)}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md shadow-blue-500/20 text-sm font-medium"
                  >
                    <Bot className="w-4 h-4" />Servisi
                  </button>
                  )}
                  {canEditProfesor(profesor) && (
                  <button
                    onClick={() => handleEdit(profesor)}
                    className={`${isVapiUser ? 'w-full' : 'flex-1'} flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium`}
                  >
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  )}
                  {!isVapiUser && (
                  <button
                    onClick={() => handleDelete(profesor)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />Obriši
                  </button>
                  )}
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
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingProfesor ? 'Izmeni profesora' : 'Novi profesor'}</h3>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Predmet</label>
                <input
                  type="text"
                  value={formData.predmet}
                  onChange={(e) => setFormData({ ...formData, predmet: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Npr. Medicinska sestra"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="email@primer.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lozinka</label>
                <input
                  type="text"
                  value={formData.pasword}
                  onChange={(e) => setFormData({ ...formData, pasword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Lozinka za pristup"
                />
              </div>

              {!isVapiUser && (
              <div className="flex items-center gap-3">
                <input
                  id="stsaktivan"
                  type="checkbox"
                  checked={formData.stsaktivan}
                  onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="stsaktivan" className="text-sm font-medium text-gray-700">Aktivan</label>
              </div>
              )}

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
                  {saving ? 'Čuvanje...' : (editingProfesor ? 'Sačuvaj izmene' : 'Kreiraj profesora')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showServiceModal && serviceProfesor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Servisi profesora</h3>
                  <p className="text-sm text-gray-300">{serviceProfesor.ime} {serviceProfesor.prezime || ''}</p>
                  {serviceProfesor.predmet && (
                    <p className="text-xs text-gray-400 mt-0.5">{serviceProfesor.predmet}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseServices}
                className="p-2 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Zatvori"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500">
                Izaberite servise (asistente) koje ovaj profesor sme da koristi.
              </p>

              {serviceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
                </div>
              ) : assistants.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  Nema definisanih asistenata. Prvo dodajte asistente u Vapi Assistants.
                </div>
              ) : (
                <div className="space-y-2">
                  {assistants.map((assistant) => {
                    const checked = selectedAssistantIds.includes(assistant.id)
                    return (
                      <label
                        key={assistant.id}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          checked
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-gray-50 border-gray-200 hover:border-amber-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAssistant(assistant.id)}
                          className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{assistantLabel(assistant)}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseServices}
                className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={handleSaveServices}
                disabled={serviceSaving || serviceLoading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50"
              >
                {serviceSaving ? 'Čuvanje...' : 'Sačuvaj servise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
