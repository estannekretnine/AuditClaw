'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Pencil, MoreVertical, Archive, ArchiveRestore, Check, XCircle, Megaphone } from 'lucide-react'
import { getKampanjeByPonuda, arhivirajKampanja, aktivirajKampanja } from '@/lib/actions/kampanje'
import type { Kampanja } from '@/lib/types/kampanja'
import type { Ponuda } from '@/lib/types/ponuda'
import KampanjaForm from './kampanja-form'

interface KampanjaModalProps {
  ponuda: Ponuda
  userId: number | null
  userStatus: string | null // 'admin' | 'manager' | 'agent' | etc.
  onClose: () => void
}

export default function KampanjaModal({ ponuda, userId, userStatus, onClose }: KampanjaModalProps) {
  const [kampanje, setKampanje] = useState<Kampanja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingKampanja, setEditingKampanja] = useState<Kampanja | null>(null)
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const isAdmin = userStatus === 'admin' || userStatus === 'manager'

  // Učitaj kampanje za ponudu
  useEffect(() => {
    loadKampanje()
  }, [ponuda.id])

  const loadKampanje = async () => {
    setLoading(true)
    try {
      const result = await getKampanjeByPonuda(ponuda.id)
      if (result.error) {
        setError(result.error)
      } else {
        setKampanje(result.data || [])
      }
    } catch (err) {
      setError('Greška pri učitavanju kampanja')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (kampanja: Kampanja) => {
    setOpenActionMenu(null)
    setEditingKampanja(kampanja)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingKampanja(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingKampanja(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingKampanja(null)
    loadKampanje()
  }

  const handleArhiviraj = async (kampanja: Kampanja) => {
    setOpenActionMenu(null)
    setActionLoading(kampanja.id)
    try {
      if (kampanja.stsaktivan) {
        await arhivirajKampanja(kampanja.id)
      } else {
        await aktivirajKampanja(kampanja.id)
      }
      await loadKampanje()
    } catch (err) {
      console.error('Error toggling kampanja status:', err)
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

  // Format broj (budžet)
  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return new Intl.NumberFormat('sr-RS').format(num)
  }

  // Truncate text
  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Status badge
  const getStatusBadge = (aktivan: boolean | null) => {
    if (aktivan) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          <Check className="w-3 h-3" />
          Aktivna
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        <XCircle className="w-3 h-3" />
        Neaktivna
      </span>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Megaphone className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Kampanje</h2>
              <p className="text-sm text-gray-500">
                Ponuda #{ponuda.id} - {ponuda.lokacija_ag || ponuda.opstina_ag || 'Bez lokacije'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : kampanje.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nema kampanja za ovu ponudu</p>
              {isAdmin && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj prvu kampanju
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">RBR</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analiza AI</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budžet</th>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {kampanje.map((kampanja, index) => (
                    <tr 
                      key={kampanja.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700" title={kampanja.analizaoglasa_ai || undefined}>
                          {truncateText(kampanja.analizaoglasa_ai, 60)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(kampanja.stsaktivan)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {kampanja.budzet ? `${formatNumber(kampanja.budzet)} €` : '-'}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(kampanja.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === kampanja.id ? null : kampanja.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={actionLoading === kampanja.id}
                          >
                            {actionLoading === kampanja.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                            ) : (
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          
                          {/* Dropdown meni */}
                          {openActionMenu === kampanja.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenActionMenu(null)}
                              />
                              <div className={`absolute right-0 w-36 bg-white rounded-lg shadow-2xl border border-gray-100 py-1 z-50 ${
                                index >= kampanje.length - 2 
                                  ? 'bottom-full mb-1' 
                                  : 'top-full mt-1'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(kampanja)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Izmeni
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleArhiviraj(kampanja)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  >
                                    {kampanja.stsaktivan ? (
                                      <>
                                        <Archive className="w-3 h-3" />
                                        Arhiviraj
                                      </>
                                    ) : (
                                      <>
                                        <ArchiveRestore className="w-3 h-3" />
                                        Aktiviraj
                                      </>
                                    )}
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

        {/* Kampanja Form Modal */}
        {showForm && (
          <KampanjaForm
            kampanja={editingKampanja}
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
