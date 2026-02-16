'use client'

import { useState } from 'react'
import { 
  X, Globe, Copy, ExternalLink, Check, 
  Eye, Settings, Save, Loader2, ChevronDown, ChevronUp,
  Home, MapPin, Ruler, BedDouble, Building2, Flame, Car,
  TrendingUp, Laptop, MessageCircle, FileText, Image,
  Type, Palette, Phone, Mail, LayoutTemplate
} from 'lucide-react'
import type { Ponuda } from '@/lib/types/ponuda'
import { updatePonudaWebstrana } from '@/lib/actions/ponude'

interface WebStranaModalProps {
  ponuda: Ponuda
  onClose: () => void
}

interface WebStranaConfig {
  // Osnovne opcije
  showPrice: boolean
  showAddress: boolean
  showMap: boolean
  showAuditScore: boolean
  showInvestorSection: boolean
  showItSection: boolean
  showGallery: boolean
  showTechnicalDrawing: boolean
  showVideo: boolean
  show3DTour: boolean
  showDescription: boolean
  showTechSpecs: boolean
  // Dizajn
  primaryLanguage: 'sr' | 'en' | 'de'
  theme: 'dark' | 'light'
  accentColor: 'amber' | 'cyan' | 'violet' | 'emerald'
  // Kontakt
  whatsappNumber: string
  contactEmail: string
  // Custom tekstovi
  heroTitle: string
  ctaButtonText: string
}

const defaultConfig: WebStranaConfig = {
  showPrice: true,
  showAddress: false,
  showMap: true,
  showAuditScore: true,
  showInvestorSection: false,
  showItSection: false,
  showGallery: true,
  showTechnicalDrawing: true,
  showVideo: true,
  show3DTour: true,
  showDescription: true,
  showTechSpecs: true,
  primaryLanguage: 'sr',
  theme: 'dark',
  accentColor: 'amber',
  whatsappNumber: '+381601234567',
  contactEmail: 'info@auditclaw.com',
  heroTitle: '',
  ctaButtonText: 'Kontaktirajte nas'
}

export default function WebStranaModal({ ponuda, onClose }: WebStranaModalProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'sections' | 'design' | 'contact'>('sections')
  
  // Učitaj postojeću konfiguraciju ili koristi default
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

  // Da li postoji sačuvana konfiguracija
  const hasSavedConfig = !!ponuda.webstrana

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

  // Sačuvaj konfiguraciju
  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updatePonudaWebstrana(ponuda.id, JSON.stringify(config))
      if (result.error) {
        alert('Greška pri čuvanju: ' + result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Error saving webstrana config:', err)
      alert('Greška pri čuvanju konfiguracije')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('sr-RS')
  }

  // Accent color classes
  const accentColors = {
    amber: 'bg-amber-500 text-black',
    cyan: 'bg-cyan-500 text-white',
    violet: 'bg-violet-500 text-white',
    emerald: 'bg-emerald-500 text-white'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-black flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">WebStrana Editor</h3>
              <p className="text-gray-400 text-sm">Ponuda #{ponuda.id} - {ponuda.naslovoglasa || ponuda.lokacija_ag || 'Bez naslova'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasSavedConfig && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Stranica aktivna
              </span>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('sections')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sections' 
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                Sekcije
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'design' 
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Palette className="w-4 h-4" />
                Dizajn
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'contact' 
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-4 h-4" />
                Kontakt
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'sections' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Izaberite koje sekcije želite da prikažete na stranici:</p>
                  
                  {/* Hero sekcija */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4 text-amber-500" />
                      Hero Sekcija
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži cenu</span>
                        <input
                          type="checkbox"
                          checked={config.showPrice}
                          onChange={(e) => setConfig({...config, showPrice: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži Audit Score</span>
                        <input
                          type="checkbox"
                          checked={config.showAuditScore}
                          onChange={(e) => setConfig({...config, showAuditScore: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Tehničke specifikacije */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-amber-500" />
                      Tehničke Specifikacije
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži tehničke podatke</span>
                        <input
                          type="checkbox"
                          checked={config.showTechSpecs}
                          onChange={(e) => setConfig({...config, showTechSpecs: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Galerija */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4 text-amber-500" />
                      Mediji
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Galerija fotografija</span>
                        <input
                          type="checkbox"
                          checked={config.showGallery}
                          onChange={(e) => setConfig({...config, showGallery: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Tehnički crtež (skica)</span>
                        <input
                          type="checkbox"
                          checked={config.showTechnicalDrawing}
                          onChange={(e) => setConfig({...config, showTechnicalDrawing: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Video tura</span>
                        <input
                          type="checkbox"
                          checked={config.showVideo}
                          onChange={(e) => setConfig({...config, showVideo: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">3D Tura</span>
                        <input
                          type="checkbox"
                          checked={config.show3DTour}
                          onChange={(e) => setConfig({...config, show3DTour: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Lokacija */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      Lokacija
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži mapu</span>
                        <input
                          type="checkbox"
                          checked={config.showMap}
                          onChange={(e) => setConfig({...config, showMap: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži tačnu adresu</span>
                        <input
                          type="checkbox"
                          checked={config.showAddress}
                          onChange={(e) => setConfig({...config, showAddress: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                      {!config.showAddress && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                          Adresa će biti dostupna samo nakon WhatsApp kontakta (lead generation)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Opis */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Opis & Analiza
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">Prikaži opis</span>
                        <input
                          type="checkbox"
                          checked={config.showDescription}
                          onChange={(e) => setConfig({...config, showDescription: e.target.checked})}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Specijalne sekcije */}
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                    <h4 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                      Specijalne Sekcije
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm text-gray-700">ROI Analiza (Investitori)</span>
                          <p className="text-xs text-gray-500">Za investicione nekretnine</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.showInvestorSection}
                          onChange={(e) => setConfig({...config, showInvestorSection: e.target.checked})}
                          className="w-5 h-5 text-violet-500 rounded focus:ring-violet-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm text-gray-700">IT Friendly</span>
                          <p className="text-xs text-gray-500">Za remote radnike</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.showItSection}
                          onChange={(e) => setConfig({...config, showItSection: e.target.checked})}
                          className="w-5 h-5 text-violet-500 rounded focus:ring-violet-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Prilagodite izgled stranice:</p>
                  
                  {/* Jezik */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4 text-amber-500" />
                      Jezik
                    </h4>
                    <select
                      value={config.primaryLanguage}
                      onChange={(e) => setConfig({...config, primaryLanguage: e.target.value as 'sr' | 'en' | 'de'})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="sr">🇷🇸 Srpski</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="de">🇩🇪 Deutsch</option>
                    </select>
                  </div>

                  {/* Tema */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-500" />
                      Tema
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig({...config, theme: 'dark'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          config.theme === 'dark' 
                            ? 'border-amber-500 bg-gray-900' 
                            : 'border-gray-200 bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-white text-sm font-medium">Corporate Dark</div>
                        <div className="text-gray-400 text-xs mt-1">Tamna profesionalna</div>
                      </button>
                      <button
                        onClick={() => setConfig({...config, theme: 'light'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          config.theme === 'light' 
                            ? 'border-amber-500 bg-white' 
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-gray-900 text-sm font-medium">Clean White</div>
                        <div className="text-gray-500 text-xs mt-1">Svetla minimalistička</div>
                      </button>
                    </div>
                  </div>

                  {/* Accent boja */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Akcentna boja</h4>
                    <div className="flex gap-3">
                      {(['amber', 'cyan', 'violet', 'emerald'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setConfig({...config, accentColor: color})}
                          className={`w-12 h-12 rounded-xl transition-all ${
                            color === 'amber' ? 'bg-amber-500' :
                            color === 'cyan' ? 'bg-cyan-500' :
                            color === 'violet' ? 'bg-violet-500' :
                            'bg-emerald-500'
                          } ${config.accentColor === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom naslov */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Custom naslov (opciono)</h4>
                    <input
                      type="text"
                      value={config.heroTitle}
                      onChange={(e) => setConfig({...config, heroTitle: e.target.value})}
                      placeholder={ponuda.naslovoglasa || 'Ostavite prazno za automatski naslov'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* CTA dugme tekst */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Tekst na CTA dugmetu</h4>
                    <input
                      type="text"
                      value={config.ctaButtonText}
                      onChange={(e) => setConfig({...config, ctaButtonText: e.target.value})}
                      placeholder="Kontaktirajte nas"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Podesite kontakt informacije za lead generation:</p>
                  
                  {/* WhatsApp */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </h4>
                    <input
                      type="text"
                      value={config.whatsappNumber}
                      onChange={(e) => setConfig({...config, whatsappNumber: e.target.value})}
                      placeholder="+381 60 123 4567"
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-green-700 mt-2">
                      Kupci će vas kontaktirati na ovaj broj sa predefinisanom porukom
                    </p>
                  </div>

                  {/* Email */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      Email
                    </h4>
                    <input
                      type="email"
                      value={config.contactEmail}
                      onChange={(e) => setConfig({...config, contactEmail: e.target.value})}
                      placeholder="info@auditclaw.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* Lead info */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2">Lead Generation</h4>
                    <p className="text-sm text-amber-800">
                      Sledeći podaci su skriveni i zahtevaju WhatsApp kontakt:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-700">
                      <li>• Tačna adresa nekretnine</li>
                      <li>• PDF Audit izveštaj</li>
                      <li>• Direktan kontakt agenta</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 bg-gray-100 flex flex-col">
            <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Kopirano' : 'Kopiraj link'}
                </button>
                <button
                  onClick={handleOpenPreview}
                  disabled={!hasSavedConfig}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                    hasSavedConfig 
                      ? 'bg-gray-900 text-white hover:bg-black' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-3 h-3" />
                  Otvori
                </button>
              </div>
            </div>
            
            {/* Mini Preview */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className={`rounded-xl overflow-hidden shadow-lg ${config.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Mini Hero */}
                <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-800">
                  {ponuda.glavna_foto_url ? (
                    <img src={ponuda.glavna_foto_url} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block mb-1 ${accentColors[config.accentColor]}`}>
                      {ponuda.stsrentaprodaja === 'R' ? 'IZDAVANJE' : 'PRODAJA'}
                    </div>
                    <h3 className="text-white text-sm font-bold truncate">
                      {config.heroTitle || ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {config.showPrice && (
                        <span className={`text-lg font-bold ${
                          config.accentColor === 'amber' ? 'text-amber-400' :
                          config.accentColor === 'cyan' ? 'text-cyan-400' :
                          config.accentColor === 'violet' ? 'text-violet-400' :
                          'text-emerald-400'
                        }`}>
                          {formatNumber(ponuda.cena_ag)} €
                        </span>
                      )}
                      {config.showAuditScore && (
                        <span className="text-xs text-gray-300 bg-white/20 px-2 py-0.5 rounded">
                          Score: 85
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Content */}
                <div className={`p-3 space-y-3 ${config.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {/* Tech specs */}
                  {config.showTechSpecs && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`text-center p-2 rounded-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-500">m²</div>
                        <div className="font-bold text-sm">{ponuda.kvadratura_ag || '-'}</div>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-500">Sobe</div>
                        <div className="font-bold text-sm">{ponuda.struktura_ag || '-'}</div>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-500">Sprat</div>
                        <div className="font-bold text-sm">{ponuda.sprat || '-'}</div>
                      </div>
                    </div>
                  )}

                  {/* Sections indicators */}
                  <div className="space-y-1">
                    {config.showGallery && (
                      <div className={`text-xs px-2 py-1 rounded ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        📷 Galerija fotografija
                      </div>
                    )}
                    {config.showTechnicalDrawing && (
                      <div className={`text-xs px-2 py-1 rounded ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        📐 Tehnički crtež
                      </div>
                    )}
                    {config.showMap && (
                      <div className={`text-xs px-2 py-1 rounded ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        🗺️ Mapa lokacije
                      </div>
                    )}
                    {config.showDescription && (
                      <div className={`text-xs px-2 py-1 rounded ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        📝 AuditClaw Analiza
                      </div>
                    )}
                    {config.showInvestorSection && (
                      <div className="text-xs px-2 py-1 rounded bg-violet-500/20 text-violet-400">
                        📊 ROI Analiza
                      </div>
                    )}
                    {config.showItSection && (
                      <div className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        💻 IT Friendly
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button className={`w-full py-2 rounded-lg text-sm font-bold ${accentColors[config.accentColor]}`}>
                    {config.ctaButtonText || 'Kontaktirajte nas'}
                  </button>
                </div>
              </div>

              {!hasSavedConfig && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 text-center">
                    <strong>Stranica još nije aktivna.</strong><br />
                    Kliknite "Sačuvaj i aktiviraj" da objavite stranicu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            {hasSavedConfig ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Stranica je aktivna: <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">{publicUrl}</code>
              </span>
            ) : (
              <span className="text-amber-600">Stranica još nije objavljena</span>
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
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Čuvanje...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Sačuvano!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {hasSavedConfig ? 'Sačuvaj izmene' : 'Sačuvaj i aktiviraj'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
