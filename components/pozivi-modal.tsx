'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Pencil, MoreVertical, Phone, Trash2 } from 'lucide-react'
import { getPozivByPonuda, deletePoziv } from '@/lib/actions/pozivi'
import type { Poziv } from '@/lib/types/pozivi'
import type { Ponuda } from '@/lib/types/ponuda'
import PozivForm from './poziv-form'

interface PoziviModalProps {
  ponuda: Ponuda
  userId: number | null
  userStatus: string | null // 'admin' | 'manager' | 'agent' | etc.
  onClose: () => void
}

export default function PoziviModal({ ponuda, userId, userStatus, onClose }: PoziviModalProps) {
  const [pozivi, setPozivi] = useState<Poziv[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPoziv, setEditingPoziv] = useState<Poziv | null>(null)
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const isAdmin = userStatus === 'admin' || userStatus === 'manager'

  // Učitaj pozive za ponudu
  useEffect(() => {
    loadPozivi()
  }, [ponuda.id])

  const loadPozivi = async () => {
    setLoading(true)
    try {
      const result = await getPozivByPonuda(ponuda.id)
      if (result.error) {
        setError(result.error)
      } else {
        setPozivi(result.data || [])
      }
    } catch (err) {
      setError('Greška pri učitavanju poziva')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (poziv: Poziv) => {
    setOpenActionMenu(null)
    setEditingPoziv(poziv)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingPoziv(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPoziv(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPoziv(null)
    loadPozivi()
  }

  const handleDelete = async (poziv: Poziv) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj poziv?')) {
      return
    }
    setOpenActionMenu(null)
    setActionLoading(poziv.id)
    try {
      await deletePoziv(poziv.id)
      await loadPozivi()
    } catch (err) {
      console.error('Error deleting poziv:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Format datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sr-Latn-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Truncate text
  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pozivi</h2>
              <p className="text-sm text-gray-500">
                Ponuda #{ponuda.id} - {ponuda.lokacija_ag || ponuda.opstina_ag || 'Bez lokacije'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : pozivi.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nema poziva za ovu ponudu</p>
              {isAdmin && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj prvi poziv
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">RBR</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ime kupca</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mob/Tel</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Država</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validacija AG</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {pozivi.map((poziv, index) => (
                    <tr 
                      key={poziv.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {poziv.imekupca || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {poziv.mobtel || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700" title={poziv.email || undefined}>
                          {truncateText(poziv.email, 25)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {poziv.drzava || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700" title={poziv.validacija_ag || undefined}>
                          {truncateText(poziv.validacija_ag, 30)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(poziv.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === poziv.id ? null : poziv.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={actionLoading === poziv.id}
                          >
                            {actionLoading === poziv.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          
                          {/* Dropdown meni */}
                          {openActionMenu === poziv.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenActionMenu(null)}
                              />
                              <div className={`absolute right-0 w-36 bg-white rounded-lg shadow-2xl border border-gray-100 py-1 z-50 ${
                                index >= pozivi.length - 2 
                                  ? 'bottom-full mb-1' 
                                  : 'top-full mt-1'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(poziv)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Izmeni
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(poziv)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Obriši
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Poziv Form Modal */}
        {showForm && (
          <PozivForm
            poziv={editingPoziv}
            ponudaId={ponuda.id}
            userId={userId}
            userStatus={userStatus}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  )
}
