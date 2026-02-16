'use client'

import { useState, useEffect } from 'react'
import { 
  X, Globe, Copy, ExternalLink, Check, 
  Eye, EyeOff, Share2, QrCode, Settings,
  Smartphone, Monitor, RefreshCw, Save, Loader2
} from 'lucide-react'
import type { Ponuda } from '@/lib/types/ponuda'
import { updatePonudaWebstrana } from '@/lib/actions/ponude'

interface WebStranaModalProps {
  ponuda: Ponuda
  onClose: () => void
}

interface WebStranaConfig {
  showPrice: boolean
  showAddress: boolean
  showMap: boolean
  showAuditScore: boolean
  showInvestorSection: boolean
  showItSection: boolean
  primaryLanguage: 'sr' | 'en' | 'de'
  theme: 'dark' | 'light'
  whatsappNumber: string
  contactEmail: string
}

const defaultConfig: WebStranaConfig = {
  showPrice: true,
  showAddress: false,
  showMap: true,
  showAuditScore: true,
  showInvestorSection: false,
  showItSection: false,
  primaryLanguage: 'sr',
  theme: 'dark',
  whatsappNumber: '+381601234567',
  contactEmail: 'info@auditclaw.com'
}

export default function WebStranaModal({ ponuda, onClose }: WebStranaModalProps) {
  const [copied, setCopied] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Konfiguracija web strane - učitaj iz ponuda.webstrana ako postoji
  const [config, setConfig] = useState<WebStranaConfig>(() => {
    if (ponuda.webstrana) {
      try {
        const parsed = JSON.parse(ponuda.webstrana)
        return { ...defaultConfig, ...parsed }
      } catch {
        return {
          ...defaultConfig,
          showInvestorSection: ponuda.stszainvestitor || false,
          showItSection: ponuda.stszaIT || false,
        }
      }
    }
    return {
      ...defaultConfig,
      showInvestorSection: ponuda.stszainvestitor || false,
      showItSection: ponuda.stszaIT || false,
    }
  })

  // Prati promene
  const handleConfigChange = (newConfig: WebStranaConfig) => {
    setConfig(newConfig)
    setHasChanges(true)
    setSaved(false)
  }

  // Sačuvaj konfiguraciju
  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updatePonudaWebstrana(ponuda.id, JSON.stringify(config))
      if (result.error) {
        alert('Greška pri čuvanju: ' + result.error)
      } else {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Error saving webstrana config:', err)
      alert('Greška pri čuvanju konfiguracije')
    } finally {
      setSaving(false)
    }
  }

  // Generisanje URL-a za javnu stranicu
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/p/${ponuda.id}`
    : `/p/${ponuda.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenPreview = () => {
    window.open(publicUrl, '_blank')
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('sr-RS')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-cyan-600 to-cyan-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">WebStrana za Kupca</h3>
              <p className="text-cyan-100 text-sm">Ponuda #{ponuda.id} - {ponuda.naslovoglasa || ponuda.lokacija_ag || 'Bez naslova'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* URL Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-600" />
                Link za deljenje
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded-lg transition-colors ${previewDevice === 'desktop' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded-lg transition-colors ${previewDevice === 'mobile' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 truncate">
                {publicUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopirano!' : 'Kopiraj'}
              </button>
              <button
                onClick={handleOpenPreview}
                className="px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Otvori
              </button>
            </div>
          </div>

          {/* Preview Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Podaci koji će biti prikazani */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                Vidljivi podaci
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Naslov oglasa</span>
                  <span className="font-medium text-gray-900">{ponuda.naslovoglasa || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lokacija</span>
                  <span className="font-medium text-gray-900">{ponuda.lokacija_ag}, {ponuda.opstina_ag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cena</span>
                  <span className="font-medium text-gray-900">{formatNumber(ponuda.cena_ag)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kvadratura</span>
                  <span className="font-medium text-gray-900">{formatNumber(ponuda.kvadratura_ag)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Struktura</span>
                  <span className="font-medium text-gray-900">{ponuda.struktura_ag || '-'} soba</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sprat</span>
                  <span className="font-medium text-gray-900">{ponuda.sprat || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grejanje</span>
                  <span className="font-medium text-gray-900">{ponuda.grejanje || '-'}</span>
                </div>
              </div>
            </div>

            {/* Podaci koji zahtevaju kontakt */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-amber-600" />
                Zahteva kontakt (Lead)
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tačna adresa</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">WhatsApp</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">PDF Audit izveštaj</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">WhatsApp</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kontakt agenta</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">WhatsApp</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                <p className="text-xs text-amber-800">
                  <strong>Lead Generation:</strong> Ovi podaci su skriveni dok kupac ne kontaktira putem WhatsApp-a. 
                  Poruka je predefinisana sa ID-om oglasa.
                </p>
              </div>
            </div>
          </div>

          {/* Konfiguracija */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                Podešavanja prikaza
              </h4>
              <RefreshCw className={`w-4 h-4 text-gray-400 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>
            
            {showSettings && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jezik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primarni jezik</label>
                  <select
                    value={config.primaryLanguage}
                    onChange={(e) => handleConfigChange({...config, primaryLanguage: e.target.value as 'sr' | 'en' | 'de'})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="sr">Srpski</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Tema */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                  <select
                    value={config.theme}
                    onChange={(e) => handleConfigChange({...config, theme: e.target.value as 'dark' | 'light'})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="dark">Corporate Dark</option>
                    <option value="light">Clean White</option>
                  </select>
                </div>

                {/* WhatsApp broj */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp broj</label>
                  <input
                    type="text"
                    value={config.whatsappNumber}
                    onChange={(e) => handleConfigChange({...config, whatsappNumber: e.target.value})}
                    placeholder="+381..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt email</label>
                  <input
                    type="email"
                    value={config.contactEmail}
                    onChange={(e) => handleConfigChange({...config, contactEmail: e.target.value})}
                    placeholder="info@..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Toggle opcije */}
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showPrice}
                      onChange={(e) => handleConfigChange({...config, showPrice: e.target.checked})}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Prikaži cenu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showMap}
                      onChange={(e) => handleConfigChange({...config, showMap: e.target.checked})}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Prikaži mapu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showAuditScore}
                      onChange={(e) => handleConfigChange({...config, showAuditScore: e.target.checked})}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Audit Score</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showInvestorSection}
                      onChange={(e) => handleConfigChange({...config, showInvestorSection: e.target.checked})}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Investitor sekcija</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showItSection}
                      onChange={(e) => handleConfigChange({...config, showItSection: e.target.checked})}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">IT sekcija</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Specijalne sekcije */}
          {(ponuda.stszainvestitor || ponuda.stszaIT) && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
              <h4 className="font-semibold text-violet-900 mb-3">Specijalne sekcije</h4>
              <div className="flex flex-wrap gap-2">
                {ponuda.stszainvestitor && (
                  <span className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
                    ROI Analysis (Investitori)
                  </span>
                )}
                {ponuda.stszaIT && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    IT Friendly (Remote Work)
                  </span>
                )}
              </div>
              <p className="text-xs text-violet-600 mt-2">
                Ove sekcije će biti automatski prikazane na javnoj stranici.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">• Nesačuvane promene</span>
            )}
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Sačuvano
              </span>
            )}
            {!hasChanges && !saved && ponuda.webstrana && (
              <span className="text-sm text-gray-500">Konfiguracija je sačuvana</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Zatvori
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`px-5 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                hasChanges 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Čuvanje...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sačuvaj
                </>
              )}
            </button>
            <button
              onClick={handleOpenPreview}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl hover:from-cyan-700 hover:to-cyan-800 transition-all font-medium flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Pogledaj
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
