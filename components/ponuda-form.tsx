'use client'

import { useState } from 'react'
import { X, Home, MapPin, DollarSign, Settings, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import { createPonuda, updatePonuda } from '@/lib/actions/ponude'
import type { Ponuda } from '@/lib/types/ponuda'

interface PonudaFormProps {
  ponuda: Ponuda | null
  userId: number | null
  onClose: () => void
  onSuccess: () => void
}

export default function PonudaForm({ ponuda, userId, onClose, onSuccess }: PonudaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Accordion sekcije
  const [openSections, setOpenSections] = useState({
    osnovne: true,
    lokacija: true,
    cena: true,
    tehnicke: false,
    dodatne: false,
    linkovi: false
  })

  const [formData, setFormData] = useState({
    vrstaobjekta_ag: ponuda?.vrstaobjekta_ag || '',
    stsrentaprodaja: ponuda?.stsrentaprodaja || 'prodaja',
    naslovoglasa: ponuda?.naslovoglasa || '',
    drzava: ponuda?.drzava || 'Srbija',
    grad_ag: ponuda?.grad_ag || '',
    opstina_ag: ponuda?.opstina_ag || '',
    lokacija_ag: ponuda?.lokacija_ag || '',
    adresa: ponuda?.adresa || '',
    latitude: ponuda?.latitude || '',
    longitude: ponuda?.longitude || '',
    cena_ag: ponuda?.cena_ag?.toString() || '',
    kvadratura_ag: ponuda?.kvadratura_ag?.toString() || '',
    struktura_ag: ponuda?.struktura_ag?.toString() || '',
    opis_ag: ponuda?.opis_ag || '',
    sprat: ponuda?.sprat || '',
    grejanje: ponuda?.grejanje || '',
    lift: ponuda?.lift || '',
    ari: ponuda?.ari || '',
    stsimagarazu: ponuda?.stsimagarazu || false,
    stsparking: ponuda?.stsparking || false,
    stszainvestitor: ponuda?.stszainvestitor || false,
    stszaIT: ponuda?.stszaIT || false,
    stsaktivan: ponuda?.stsaktivan !== false,
    '3dture': ponuda?.['3dture'] || '',
    videolink: ponuda?.videolink || '',
    ciljnagrupa_ag: ponuda?.ciljnagrupa_ag || '',
    ucestalostpoyiva_ag: ponuda?.ucestalostpoyiva_ag || '',
    kupaczainteresovan_ag: ponuda?.kupaczainteresovan_ag || '',
    primedbekupca_ag: ponuda?.primedbekupca_ag || ''
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataObj = new FormData()
      
      // Dodaj userId
      if (userId) {
        formDataObj.append('idkorisnik', userId.toString())
      }
      
      // Dodaj sva polja
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formDataObj.append(key, value.toString())
        } else if (value !== null && value !== undefined) {
          formDataObj.append(key, String(value))
        }
      })

      let result
      if (ponuda) {
        result = await updatePonuda(ponuda.id, formDataObj)
      } else {
        result = await createPonuda(formDataObj)
      }

      if (result.error) {
        setError(result.error)
        return
      }

      onSuccess()
    } catch {
      setError('Greška pri čuvanju ponude')
    } finally {
      setLoading(false)
    }
  }

  const vrsteObjekta = [
    'stan', 'kuća', 'lokal', 'poslovni prostor', 'plac', 'garaža', 'vikendica', 'soba'
  ]

  const grejanjaOptions = [
    'centralno', 'etažno', 'TA peć', 'gas', 'struja', 'klima', 'podno', 'bez grejanja'
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {ponuda ? 'Izmeni ponudu' : 'Nova ponuda'}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Osnovne informacije */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('osnovne')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Osnovne informacije</span>
              </div>
              {openSections.osnovne ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.osnovne && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vrsta objekta</label>
                  <select
                    value={formData.vrstaobjekta_ag}
                    onChange={(e) => setFormData({ ...formData, vrstaobjekta_ag: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="">Izaberite...</option>
                    {vrsteObjekta.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tip transakcije</label>
                  <select
                    value={formData.stsrentaprodaja}
                    onChange={(e) => setFormData({ ...formData, stsrentaprodaja: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="prodaja">Prodaja</option>
                    <option value="renta">Renta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.stsaktivan ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="true">Aktivan</option>
                    <option value="false">Neaktivan</option>
                  </select>
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Naslov oglasa</label>
                  <input
                    type="text"
                    value={formData.naslovoglasa}
                    onChange={(e) => setFormData({ ...formData, naslovoglasa: e.target.value })}
                    placeholder="Npr: Luksuzan stan u centru"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lokacija */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('lokacija')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Lokacija</span>
              </div>
              {openSections.lokacija ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.lokacija && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Država</label>
                  <input
                    type="text"
                    value={formData.drzava}
                    onChange={(e) => setFormData({ ...formData, drzava: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grad</label>
                  <input
                    type="text"
                    value={formData.grad_ag}
                    onChange={(e) => setFormData({ ...formData, grad_ag: e.target.value })}
                    placeholder="Beograd"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Opština</label>
                  <input
                    type="text"
                    value={formData.opstina_ag}
                    onChange={(e) => setFormData({ ...formData, opstina_ag: e.target.value })}
                    placeholder="Vračar"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokacija</label>
                  <input
                    type="text"
                    value={formData.lokacija_ag}
                    onChange={(e) => setFormData({ ...formData, lokacija_ag: e.target.value })}
                    placeholder="Crveni krst"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ulica / Adresa</label>
                  <input
                    type="text"
                    value={formData.adresa}
                    onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                    placeholder="Bulevar Kralja Aleksandra 50"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="44.8125"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="20.4612"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cena i površina */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('cena')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Cena i površina</span>
              </div>
              {openSections.cena ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.cena && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cena (€)</label>
                    <input
                      type="number"
                      value={formData.cena_ag}
                      onChange={(e) => setFormData({ ...formData, cena_ag: e.target.value })}
                      placeholder="100000"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kvadratura (m²)</label>
                    <input
                      type="number"
                      value={formData.kvadratura_ag}
                      onChange={(e) => setFormData({ ...formData, kvadratura_ag: e.target.value })}
                      placeholder="75"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Struktura (broj soba)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.struktura_ag}
                      onChange={(e) => setFormData({ ...formData, struktura_ag: e.target.value })}
                      placeholder="3"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Opis</label>
                  <textarea
                    value={formData.opis_ag}
                    onChange={(e) => setFormData({ ...formData, opis_ag: e.target.value })}
                    rows={4}
                    placeholder="Detaljan opis nekretnine..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tehničke karakteristike */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('tehnicke')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Tehničke karakteristike</span>
              </div>
              {openSections.tehnicke ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.tehnicke && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sprat</label>
                  <input
                    type="text"
                    value={formData.sprat}
                    onChange={(e) => setFormData({ ...formData, sprat: e.target.value })}
                    placeholder="3/5"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grejanje</label>
                  <select
                    value={formData.grejanje}
                    onChange={(e) => setFormData({ ...formData, grejanje: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="">Izaberite...</option>
                    {grejanjaOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lift</label>
                  <select
                    value={formData.lift}
                    onChange={(e) => setFormData({ ...formData, lift: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  >
                    <option value="">Izaberite...</option>
                    <option value="da">Da</option>
                    <option value="ne">Ne</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ari (za placeve)</label>
                  <input
                    type="text"
                    value={formData.ari}
                    onChange={(e) => setFormData({ ...formData, ari: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dodatne opcije */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('dodatne')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Dodatne opcije</span>
              </div>
              {openSections.dodatne ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.dodatne && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stsimagarazu}
                    onChange={(e) => setFormData({ ...formData, stsimagarazu: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Garaža</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stsparking}
                    onChange={(e) => setFormData({ ...formData, stsparking: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Parking</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stszainvestitor}
                    onChange={(e) => setFormData({ ...formData, stszainvestitor: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Za investitora</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stszaIT}
                    onChange={(e) => setFormData({ ...formData, stszaIT: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Za IT</span>
                </label>
              </div>
            )}
          </div>

          {/* Linkovi */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('linkovi')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900">Linkovi</span>
              </div>
              {openSections.linkovi ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {openSections.linkovi && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">3D Tura</label>
                  <input
                    type="url"
                    value={formData['3dture']}
                    onChange={(e) => setFormData({ ...formData, '3dture': e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Video link</label>
                  <input
                    type="url"
                    value={formData.videolink}
                    onChange={(e) => setFormData({ ...formData, videolink: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Čuvanje...' : (ponuda ? 'Sačuvaj izmene' : 'Kreiraj ponudu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
