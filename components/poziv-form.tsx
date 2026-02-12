'use client'

import { useState } from 'react'
import { X, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { createPoziv, updatePoziv, updatePozivAgent } from '@/lib/actions/pozivi'
import type { Poziv } from '@/lib/types/pozivi'

interface PozivFormProps {
  poziv: Poziv | null
  ponudaId: number
  userId: number | null
  userStatus: string | null // 'admin' | 'manager' | 'agent' | etc.
  onClose: () => void
  onSuccess: () => void
}

export default function PozivForm({ poziv, ponudaId, userId, userStatus, onClose, onSuccess }: PozivFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const isAdmin = userStatus === 'admin' || userStatus === 'manager'
  const isEditing = !!poziv

  // Form data
  const [formData, setFormData] = useState({
    imekupca: poziv?.imekupca || '',
    mobtel: poziv?.mobtel || '',
    email: poziv?.email || '',
    drzava: poziv?.drzava || '',
    regija: poziv?.regija || '',
    ipadresa: poziv?.ipadresa || '',
    kodkampanje: poziv?.kodkampanje || '',
    validacija_ag: poziv?.validacija_ag || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Agent može samo da menja validacija_ag
      if (!isAdmin && isEditing) {
        const result = await updatePozivAgent(poziv!.id, formData.validacija_ag || null)
        if (result.error) {
          setError(result.error)
          return
        }
      } else if (isAdmin) {
        // Admin može sve
        const formDataObj = new FormData()
        formDataObj.append('imekupca', formData.imekupca)
        formDataObj.append('mobtel', formData.mobtel)
        formDataObj.append('email', formData.email)
        formDataObj.append('drzava', formData.drzava)
        formDataObj.append('regija', formData.regija)
        formDataObj.append('ipadresa', formData.ipadresa)
        formDataObj.append('kodkampanje', formData.kodkampanje)
        formDataObj.append('validacija_ag', formData.validacija_ag)
        formDataObj.append('ponudaid', ponudaId.toString())

        let result
        if (isEditing) {
          result = await updatePoziv(poziv!.id, formDataObj)
        } else {
          result = await createPoziv(formDataObj)
        }

        if (result.error) {
          setError(result.error)
          return
        }
      }

      onSuccess()
    } catch (err) {
      setError('Greška pri čuvanju poziva')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Izmeni poziv' : 'Novi poziv'}
              </h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'Pun pristup' : 'Možete menjati samo validaciju agencije'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Podaci o kupcu */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <User className="w-4 h-4" />
              Podaci o kupcu
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ime kupca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ime kupca
                </label>
                <input
                  type="text"
                  name="imekupca"
                  value={formData.imekupca}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ime i prezime"
                />
              </div>

              {/* Mob/Tel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mob/Tel
                </label>
                <input
                  type="text"
                  name="mobtel"
                  value={formData.mobtel}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="+381 ..."
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Lokacija */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <MapPin className="w-4 h-4" />
              Lokacija
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Država */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Država
                </label>
                <input
                  type="text"
                  name="drzava"
                  value={formData.drzava}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Srbija"
                />
              </div>

              {/* Regija */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Regija
                </label>
                <input
                  type="text"
                  name="regija"
                  value={formData.regija}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Beograd"
                />
              </div>
            </div>
          </div>

          {/* Tehnički podaci */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <FileText className="w-4 h-4" />
              Dodatni podaci
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IP adresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  IP adresa
                </label>
                <input
                  type="text"
                  name="ipadresa"
                  value={formData.ipadresa}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="192.168.1.1"
                />
              </div>

              {/* Kod kampanje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kod kampanje
                </label>
                <input
                  type="text"
                  name="kodkampanje"
                  value={formData.kodkampanje}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Kod kampanje"
                />
              </div>
            </div>
          </div>

          {/* Validacija agencije */}
          <div className="space-y-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 font-semibold">
              <FileText className="w-4 h-4" />
              Validacija agencije
              {!isAdmin && (
                <span className="ml-2 text-xs font-normal">
                  (Jedino polje koje možete menjati)
                </span>
              )}
            </div>
            
            <div>
              <textarea
                name="validacija_ag"
                value={formData.validacija_ag}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none bg-white"
                placeholder="Unesite validaciju ili komentare agencije..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Čuvanje...
                </>
              ) : (
                'Sačuvaj'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
