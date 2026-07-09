'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Plus, Edit, Trash2, Bot, User, Search, GraduationCap } from 'lucide-react'
import {
  getVapiOdgovori,
  createVapiOdgovor,
  updateVapiOdgovor,
  deleteVapiOdgovor,
} from '@/lib/actions/vapi-odgovor'
import { getVapiAssistants } from '@/lib/actions/vapi-assistants'
import { getVapiUcenici } from '@/lib/actions/vapi-ucenik'
import { getVapiProfesori } from '@/lib/actions/vapi-profesor'
import type { VapiOdgovor, VapiAssistant, VapiUcenik, VapiProfesor } from '@/lib/types/vapi'
import { getEffectiveStatus } from '@/lib/role-utils'

function formatDatumVreme(value: string | null, compact = false): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  if (compact) {
    return date.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return date.toLocaleString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAssistantLabel(odgovor: VapiOdgovor): string {
  if (odgovor.vapi_assistants?.assistant_id) {
    const opis = odgovor.vapi_assistants.opis_servisa
    return opis ? `${odgovor.vapi_assistants.assistant_id} (${opis})` : odgovor.vapi_assistants.assistant_id
  }
  return '-'
}

function getUcenikLabel(odgovor: VapiOdgovor): string {
  const ucenik = odgovor.vapi_ucenik
  if (!ucenik) return '-'
  const puno = `${ucenik.ime} ${ucenik.prezime || ''}`.trim()
  return ucenik.razred ? `${puno} (${ucenik.razred})` : puno
}

function getProfesorLabel(odgovor: VapiOdgovor): string {
  const profesor = odgovor.vapi_profesor
  if (!profesor) return '-'
  return `${profesor.ime}${profesor.prezime ? ` ${profesor.prezime}` : ''}`.trim()
}

export default function VapiOdgovorPage() {
  const [loading, setLoading] = useState(true)
  const [odgovori, setOdgovori] = useState<VapiOdgovor[]>([])
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [ucenici, setUcenici] = useState<VapiUcenik[]>([])
  const [profesori, setProfesori] = useState<VapiProfesor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingOdgovor, setEditingOdgovor] = useState<VapiOdgovor | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isVapiUser, setIsVapiUser] = useState(false)

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
    } catch {
      setIsVapiUser(false)
    }
  }, [])

  const [formData, setFormData] = useState({
    dijalog: '',
    obrazlozenjeocene_ai: '',
    ocena_ai: '',
    ocena_profesor: '',
    komentar_profesor: '',
    profesorid: '',
    assistant_id: '',
    ucenikid: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [odgovoriResult, assistantsResult, uceniciResult, profesoriResult] = await Promise.all([
        getVapiOdgovori(50, 0),
        getVapiAssistants(100, 0),
        getVapiUcenici(200, 0),
        getVapiProfesori(200, 0),
      ])
      if (odgovoriResult.data) {
        setOdgovori(odgovoriResult.data)
        setTotalCount(odgovoriResult.count)
      }
      if (assistantsResult.data) {
        setAssistants(assistantsResult.data)
      }
      if (uceniciResult.data) {
        setUcenici(uceniciResult.data)
      }
      if (profesoriResult.data) {
        setProfesori(profesoriResult.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormData({
      dijalog: '',
      obrazlozenjeocene_ai: '',
      ocena_ai: '',
      ocena_profesor: '',
      komentar_profesor: '',
      profesorid: '',
      assistant_id: '',
      ucenikid: '',
    })
    setEditingOdgovor(null)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (odgovor: VapiOdgovor) => {
    setEditingOdgovor(odgovor)
    setFormData({
      dijalog: odgovor.dijalog || '',
      obrazlozenjeocene_ai: odgovor.obrazlozenjeocene_ai || '',
      ocena_ai: odgovor.ocena_ai || '',
      ocena_profesor: odgovor.ocena_profesor || '',
      komentar_profesor: odgovor.komentar_profesor || '',
      profesorid: odgovor.profesorid ? String(odgovor.profesorid) : '',
      assistant_id: odgovor.assistant_id ? String(odgovor.assistant_id) : '',
      ucenikid: odgovor.ucenikid ? String(odgovor.ucenikid) : '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('dijalog', formData.dijalog)
      fd.append('obrazlozenjeocene_ai', formData.obrazlozenjeocene_ai)
      fd.append('ocena_ai', formData.ocena_ai)
      fd.append('ocena_profesor', formData.ocena_profesor)
      fd.append('komentar_profesor', formData.komentar_profesor)
      fd.append('profesorid', formData.profesorid)
      fd.append('assistant_id', formData.assistant_id)
      fd.append('ucenikid', formData.ucenikid)

      let result
      if (editingOdgovor) {
        result = await updateVapiOdgovor(editingOdgovor.id, fd)
      } else {
        result = await createVapiOdgovor(fd)
      }

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

  const handleDelete = async (odgovor: VapiOdgovor) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete odgovor #${odgovor.id}?`)) {
      return
    }
    const result = await deleteVapiOdgovor(odgovor.id)
    if (!result.error) {
      await loadData()
    } else {
      alert('Greška: ' + result.error)
    }
  }

  const filteredOdgovori = (() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return odgovori
    return odgovori.filter(
      (odgovor) =>
        getUcenikLabel(odgovor).toLowerCase().includes(q) ||
        getProfesorLabel(odgovor).toLowerCase().includes(q)
    )
  })()

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Vapi Odgovor</h2>
          <p className="text-gray-500 mt-1">Upravljanje Vapi odgovorima ({totalCount})</p>
        </div>
        {!isVapiUser && (
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novi odgovor</span>
        </button>
        )}
      </div>

      {odgovori.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraga po učeniku ili profesoru..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
      )}

      {odgovori.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema odgovora</p>
          <p className="text-gray-500 mb-6">Dodajte prvi Vapi odgovor</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj odgovor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-14">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-36">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Učenik</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-40">Profesor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-20">Ocena AI</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-24">Ocena prof.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider w-36 sticky right-0 bg-gray-900 z-10">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOdgovori.map((odgovor) => (
                  <tr key={odgovor.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200 group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{odgovor.id}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{formatDatumVreme(odgovor.datumvreme, true)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 min-w-0">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={getUcenikLabel(odgovor)}>{getUcenikLabel(odgovor)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 min-w-0">
                        <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[150px]" title={getProfesorLabel(odgovor)}>{getProfesorLabel(odgovor)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{odgovor.ocena_ai || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{odgovor.ocena_profesor || '-'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap sticky right-0 z-10 bg-white group-hover:bg-amber-50 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.2)]">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(odgovor)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                        </button>
                        {!isVapiUser && (
                          <button
                            onClick={() => handleDelete(odgovor)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md shadow-red-500/20"
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
            {filteredOdgovori.map((odgovor) => (
              <div key={odgovor.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-1">ID: {odgovor.id}</span>
                  <p className="text-xs text-gray-500">{formatDatumVreme(odgovor.datumvreme)}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-700 mt-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {getUcenikLabel(odgovor)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {getProfesorLabel(odgovor)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ocena AI: {odgovor.ocena_ai || '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ocena profesor: {odgovor.ocena_profesor || '-'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                    {getAssistantLabel(odgovor)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(odgovor)}
                    className={`${isVapiUser ? 'w-full' : 'flex-1'} flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium`}
                  >
                    <Edit className="w-4 h-4" />Izmeni
                  </button>
                  {!isVapiUser && (
                  <button
                    onClick={() => handleDelete(odgovor)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />Obriši
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredOdgovori.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">Nema rezultata za „{searchQuery}“</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingOdgovor ? 'Izmeni odgovor' : 'Novi odgovor'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {editingOdgovor && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Datum i vreme upisa</label>
                  <input
                    type="text"
                    value={formatDatumVreme(editingOdgovor.datumvreme)}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dijalog *</label>
                <textarea
                  value={formData.dijalog}
                  onChange={(e) => setFormData({ ...formData, dijalog: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="Tekst dijaloga"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ocena AI</label>
                  <input
                    type="text"
                    value={formData.ocena_ai}
                    onChange={(e) => setFormData({ ...formData, ocena_ai: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Ocena AI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assistant</label>
                  <select
                    value={formData.assistant_id}
                    onChange={(e) => setFormData({ ...formData, assistant_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  >
                    <option value="">-- Bez asistenta --</option>
                    {assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.assistant_id}{assistant.opis_servisa ? ` (${assistant.opis_servisa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Učenik</label>
                <select
                  value={formData.ucenikid}
                  onChange={(e) => setFormData({ ...formData, ucenikid: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Bez učenika --</option>
                  {ucenici.map((ucenik) => (
                    <option key={ucenik.id} value={ucenik.id}>
                      {ucenik.ime} {ucenik.prezime || ''}{ucenik.razred ? ` — ${ucenik.razred}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profesor</label>
                <select
                  value={formData.profesorid}
                  onChange={(e) => setFormData({ ...formData, profesorid: e.target.value })}
                  className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Bez profesora --</option>
                  {profesori.map((profesor) => (
                    <option key={profesor.id} value={profesor.id}>
                      {profesor.ime}{profesor.prezime ? ` ${profesor.prezime}` : ''}
                      {profesor.email ? ` — ${profesor.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Obrazloženje ocene AI</label>
                <textarea
                  value={formData.obrazlozenjeocene_ai}
                  onChange={(e) => setFormData({ ...formData, obrazlozenjeocene_ai: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="Obrazloženje ocene"
                />
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
                <p className="text-sm font-semibold text-indigo-900">Ocena profesora</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ocena profesor</label>
                  <input
                    type="text"
                    value={formData.ocena_profesor}
                    onChange={(e) => setFormData({ ...formData, ocena_profesor: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Ocena koju unosi profesor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Komentar profesor</label>
                  <textarea
                    value={formData.komentar_profesor}
                    onChange={(e) => setFormData({ ...formData, komentar_profesor: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
                    placeholder="Komentar profesora"
                  />
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
                  {saving ? 'Čuvanje...' : (editingOdgovor ? 'Sačuvaj izmene' : 'Kreiraj odgovor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
