'use client'

import { useState } from 'react'
import { X, Brain, MessageSquare, Settings, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { createKampanja, updateKampanja, updateKampanjaAgent } from '@/lib/actions/kampanje'
import type { Kampanja } from '@/lib/types/kampanja'

interface KampanjaFormProps {
  kampanja: Kampanja | null
  ponudaId: number
  userId: number | null
  userStatus: string | null // 'admin' | 'manager' | 'agent' | etc.
  onClose: () => void
  onSuccess: () => void
}

// Accordion Section Component - definisan izvan glavne komponente
interface AccordionSectionProps {
  title: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  iconColor?: string
  bgColor?: string
}

function AccordionSection({ 
  title, 
  icon: Icon, 
  isOpen,
  onToggle,
  children,
  iconColor = 'text-violet-600',
  bgColor = 'bg-violet-100'
}: AccordionSectionProps) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${bgColor} rounded-xl`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

export default function KampanjaForm({ kampanja, ponudaId, userId, userStatus, onClose, onSuccess }: KampanjaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const isAdmin = userStatus === 'admin' || userStatus === 'manager'
  const isEditing = !!kampanja
  
  // Accordion sekcije
  const [openSections, setOpenSections] = useState({
    aiAnaliza: true,
    zakljucakAg: true,
    podesavanja: isAdmin
  })

  // Form data
  const [formData, setFormData] = useState({
    analizaoglasa_ai: kampanja?.analizaoglasa_ai || '',
    ciljnagrupa_ai: kampanja?.ciljnagrupa_ai || '',
    ciljaniregion_ai: kampanja?.ciljaniregion_ai || '',
    kljucnereci_ai: kampanja?.kljucnereci_ai || '',
    psiholoskiprofil_ai: kampanja?.psiholoskiprofil_ai || '',
    predlogkampanje_ai: kampanja?.predlogkampanje_ai || '',
    zakljucak_ai: kampanja?.zakljucak_ai || '',
    zakljucak_ag: kampanja?.zakljucak_ag || '',
    budzet: kampanja?.budzet?.toString() || '',
    stsaktivan: kampanja?.stsaktivan !== false, // Default true
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Agent može samo da menja zakljucak_ag
      if (!isAdmin && isEditing) {
        const result = await updateKampanjaAgent(kampanja!.id, formData.zakljucak_ag || null)
        if (result.error) {
          setError(result.error)
          return
        }
      } else if (isAdmin) {
        // Admin može sve
        const formDataObj = new FormData()
        formDataObj.append('analizaoglasa_ai', formData.analizaoglasa_ai)
        formDataObj.append('ciljnagrupa_ai', formData.ciljnagrupa_ai)
        formDataObj.append('ciljaniregion_ai', formData.ciljaniregion_ai)
        formDataObj.append('kljucnereci_ai', formData.kljucnereci_ai)
        formDataObj.append('psiholoskiprofil_ai', formData.psiholoskiprofil_ai)
        formDataObj.append('predlogkampanje_ai', formData.predlogkampanje_ai)
        formDataObj.append('zakljucak_ai', formData.zakljucak_ai)
        formDataObj.append('zakljucak_ag', formData.zakljucak_ag)
        formDataObj.append('budzet', formData.budzet)
        formDataObj.append('stsaktivan', formData.stsaktivan.toString())
        formDataObj.append('ponudaid', ponudaId.toString())

        let result
        if (isEditing) {
          result = await updateKampanja(kampanja!.id, formDataObj)
        } else {
          result = await createKampanja(formDataObj)
        }

        if (result.error) {
          setError(result.error)
          return
        }
      }

      onSuccess()
    } catch (err) {
      setError('Greška pri čuvanju kampanje')
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Izmeni kampanju' : 'Nova kampanja'}
              </h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'Pun pristup' : 'Možete menjati samo zaključak agencije'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* AI Analiza sekcija */}
          <AccordionSection 
            title="AI Analiza" 
            icon={Brain} 
            isOpen={openSections.aiAnaliza}
            onToggle={() => toggleSection('aiAnaliza')}
          >
            <div className="space-y-4">
              {/* Analiza oglasa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Analiza oglasa (AI)
                </label>
                <textarea
                  name="analizaoglasa_ai"
                  value={formData.analizaoglasa_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="AI analiza oglasa..."
                />
              </div>

              {/* Ciljna grupa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ciljna grupa (AI)
                </label>
                <textarea
                  name="ciljnagrupa_ai"
                  value={formData.ciljnagrupa_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ciljna grupa za kampanju..."
                />
              </div>

              {/* Ciljani region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ciljani region (AI)
                </label>
                <textarea
                  name="ciljaniregion_ai"
                  value={formData.ciljaniregion_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ciljani geografski region..."
                />
              </div>

              {/* Ključne reči */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ključne reči (AI)
                </label>
                <textarea
                  name="kljucnereci_ai"
                  value={formData.kljucnereci_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ključne reči za targetiranje..."
                />
              </div>

              {/* Psihološki profil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Psihološki profil (AI)
                </label>
                <textarea
                  name="psiholoskiprofil_ai"
                  value={formData.psiholoskiprofil_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Psihološki profil ciljne grupe..."
                />
              </div>

              {/* Predlog kampanje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Predlog kampanje (AI)
                </label>
                <textarea
                  name="predlogkampanje_ai"
                  value={formData.predlogkampanje_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="AI predlog za kampanju..."
                />
              </div>

              {/* Zaključak AI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Zaključak (AI)
                </label>
                <textarea
                  name="zakljucak_ai"
                  value={formData.zakljucak_ai}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="AI zaključak..."
                />
              </div>
            </div>
          </AccordionSection>

          {/* Zaključak agencije sekcija */}
          <AccordionSection 
            title="Zaključak agencije" 
            icon={MessageSquare} 
            isOpen={openSections.zakljucakAg}
            onToggle={() => toggleSection('zakljucakAg')}
            iconColor="text-amber-600"
            bgColor="bg-amber-100"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Zaključak agencije
                {!isAdmin && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (Jedino polje koje možete menjati)
                  </span>
                )}
              </label>
              <textarea
                name="zakljucak_ag"
                value={formData.zakljucak_ag}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                placeholder="Unesite zaključak ili komentare agencije..."
              />
            </div>
          </AccordionSection>

          {/* Podešavanja sekcija (samo admin) */}
          {isAdmin && (
            <AccordionSection 
              title="Podešavanja" 
              icon={Settings} 
              isOpen={openSections.podesavanja}
              onToggle={() => toggleSection('podesavanja')}
              iconColor="text-gray-600"
              bgColor="bg-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Budžet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Budžet (€)
                  </label>
                  <input
                    type="number"
                    name="budzet"
                    value={formData.budzet}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Status aktivan */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="stsaktivan"
                      checked={formData.stsaktivan}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Kampanja je aktivna
                    </span>
                  </label>
                </div>

                {/* Kod kampanje (readonly) */}
                {kampanja?.kodkampanje && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kod kampanje
                    </label>
                    <input
                      type="text"
                      value={kampanja.kodkampanje}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </AccordionSection>
          )}

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
              className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
