'use client'

import { useState, useEffect } from 'react'
import { 
  X, Globe, Copy, ExternalLink, Check, 
  Eye, Settings, Save, Loader2, ChevronDown, ChevronUp,
  Home, MapPin, Ruler, BedDouble, Building2, Flame, Car,
  TrendingUp, Laptop, MessageCircle, FileText, Image,
  Type, Palette, Phone, Mail, LayoutTemplate, Megaphone, Sparkles
} from 'lucide-react'
import type { Ponuda } from '@/lib/types/ponuda'
import type { Kampanja } from '@/lib/types/kampanja'
import { updatePonudaWebstrana } from '@/lib/actions/ponude'
import { getKampanjeByPonuda } from '@/lib/actions/kampanje'

interface WebStranaModalProps {
  ponuda: Ponuda
  onClose: () => void
}

// Struktura koja se čuva u ponuda.webstrana
interface WebStranaData {
  link: string // Javni link: www.auditclaw.io/p/{id}
  config: WebStranaConfig
  kampanjaId?: number | null // ID izabrane kampanje
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

// Bazni URL za javne stranice
const BASE_URL = 'https://www.auditclaw.io'

export default function WebStranaModal({ ponuda, onClose }: WebStranaModalProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'sections' | 'design' | 'contact' | 'kampanja'>('kampanja')
  const [kampanje, setKampanje] = useState<Kampanja[]>([])
  const [loadingKampanje, setLoadingKampanje] = useState(true)
  const [selectedKampanjaId, setSelectedKampanjaId] = useState<number | null>(null)
  
  // Generisanje javnog linka
  const publicLink = `${BASE_URL}/p/${ponuda.id}`
  
  // Učitaj kampanje za ponudu
  useEffect(() => {
    loadKampanje()
  }, [ponuda.id])
  
  const loadKampanje = async () => {
    setLoadingKampanje(true)
    try {
      const result = await getKampanjeByPonuda(ponuda.id)
      if (!result.error && result.data) {
        setKampanje(result.data)
        
        // Učitaj prethodno izabranu kampanju ako postoji
        if (ponuda.webstrana) {
          try {
            const parsed: WebStranaData = JSON.parse(ponuda.webstrana)
            if (parsed.kampanjaId) {
              setSelectedKampanjaId(parsed.kampanjaId)
            } else {
              // Ako nema izabrane, automatski izaberi prvu aktivnu
              const aktivna = result.data.find(k => k.stsaktivan)
              if (aktivna) setSelectedKampanjaId(aktivna.id)
            }
          } catch {
            // Automatski izaberi prvu aktivnu kampanju
            const aktivna = result.data.find(k => k.stsaktivan)
            if (aktivna) setSelectedKampanjaId(aktivna.id)
          }
        } else {
          // Automatski izaberi prvu aktivnu kampanju
          const aktivna = result.data.find(k => k.stsaktivan)
          if (aktivna) setSelectedKampanjaId(aktivna.id)
        }
      }
    } catch (err) {
      console.error('Error loading kampanje:', err)
    } finally {
      setLoadingKampanje(false)
    }
  }
  
  // Dohvati izabranu kampanju
  const selectedKampanja = kampanje.find(k => k.id === selectedKampanjaId) || null
  
  // Učitaj postojeću konfiguraciju ili koristi default
  const [config, setConfig] = useState<WebStranaConfig>(() => {
    if (ponuda.webstrana) {
      try {
        const parsed: WebStranaData = JSON.parse(ponuda.webstrana)
        // Ako ima config polje, koristi ga
        if (parsed.config) {
          return { ...defaultConfig, ...parsed.config }
        }
        // Backward compatibility - ako je stari format (direktno config)
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
  
  // Izvuci sačuvani link ako postoji
  const savedLink = (() => {
    if (ponuda.webstrana) {
      try {
        const parsed: WebStranaData = JSON.parse(ponuda.webstrana)
        return parsed.link || null
      } catch {
        return null
      }
    }
    return null
  })()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenPreview = () => {
    // Za preview koristimo lokalni URL
    const previewUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/p/${ponuda.id}`
      : `/p/${ponuda.id}`
    window.open(previewUrl, '_blank')
  }

  // Sačuvaj konfiguraciju sa linkom i kampanjom
  const handleSave = async () => {
    setSaving(true)
    try {
      // Kreiraj strukturu sa linkom, konfiguracijom i kampanjom
      const webStranaData: WebStranaData = {
        link: publicLink,
        config: config,
        kampanjaId: selectedKampanjaId
      }
      const result = await updatePonudaWebstrana(ponuda.id, JSON.stringify(webStranaData))
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
                onClick={() => setActiveTab('kampanja')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'kampanja' 
                    ? 'text-violet-600 border-b-2 border-violet-500 bg-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                Kampanja
              </button>
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
              {activeTab === 'kampanja' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Izaberite kampanju koja će se koristiti za naslov i opis na web strani:
                  </p>
                  
                  {loadingKampanje ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                    </div>
                  ) : kampanje.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Nema kampanja za ovu ponudu</p>
                      <p className="text-sm text-gray-400">
                        Kreirajte kampanju da biste mogli da koristite AI generisani naslov i opis
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {kampanje.map((kampanja) => (
                        <button
                          key={kampanja.id}
                          onClick={() => setSelectedKampanjaId(kampanja.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedKampanjaId === kampanja.id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {selectedKampanjaId === kampanja.id && (
                                <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <span className="font-semibold text-gray-900">
                                Kampanja #{kampanja.id}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              kampanja.stsaktivan
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {kampanja.stsaktivan ? 'Aktivna' : 'Neaktivna'}
                            </span>
                          </div>
                          
                          {/* Naslov AI */}
                          {kampanja.naslov_ai && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span className="text-xs font-medium text-gray-500">Naslov:</span>
                              </div>
                              <p className="text-sm text-gray-900 font-medium">
                                {kampanja.naslov_ai}
                              </p>
                            </div>
                          )}
                          
                          {/* Opis AI */}
                          {kampanja.opis_ai && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span className="text-xs font-medium text-gray-500">Opis:</span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {kampanja.opis_ai}
                              </p>
                            </div>
                          )}
                          
                          {/* Ako nema naslova/opisa */}
                          {!kampanja.naslov_ai && !kampanja.opis_ai && (
                            <p className="text-xs text-gray-400 italic">
                              Nema AI generisanog naslova i opisa
                            </p>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-400">
                            Kreirana: {new Date(kampanja.created_at).toLocaleDateString('sr-RS')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Info box */}
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-violet-900 mb-1">
                          Kako funkcioniše?
                        </h4>
                        <p className="text-sm text-violet-700">
                          Izabrana kampanja će se koristiti za prikaz naslova i opisa na javnoj 
                          web strani ponude. Naslov i opis su AI generisani u "AuditClaw" stilu - 
                          inženjerski precizni, fokusirani na tehničku superiornost i investicionu vrednost.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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

                  </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Podesite WhatsApp broj za kontakt:</p>
                  
                  {/* WhatsApp */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp broj
                    </h4>
                    <input
                      type="text"
                      value={config.whatsappNumber}
                      onChange={(e) => setConfig({...config, whatsappNumber: e.target.value})}
                      placeholder="+381 60 123 4567"
                      className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-green-700 mt-2">
                      Kupci će kliknuti "Zatraži detalje" i poslati vam poruku na ovaj broj
                    </p>
                  </div>

                  {/* Whapi info */}
                  <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                    <h4 className="font-semibold text-cyan-900 mb-2">Automatsko beleženje poziva</h4>
                    <p className="text-sm text-amber-800">
                      Kada kupac pošalje poruku, automatski se beleži u sistem:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-cyan-700">
                      <li>• Broj telefona kupca</li>
                      <li>• ID ponude</li>
                      <li>• Tekst poruke</li>
                      <li>• Vreme kontakta</li>
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
                      {config.heroTitle || selectedKampanja?.naslov_ai || ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`}
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
                  <button className="w-full py-2 rounded-lg text-sm font-bold bg-green-600 text-white flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Zatraži detalje
                  </button>
                </div>
              </div>

              {/* Kampanja info */}
              {selectedKampanja && (
                <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-900">
                      Koristi se Kampanja #{selectedKampanja.id}
                    </span>
                  </div>
                  {selectedKampanja.naslov_ai && (
                    <p className="text-xs text-violet-700 truncate">
                      {selectedKampanja.naslov_ai}
                    </p>
                  )}
                </div>
              )}

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
                Stranica je aktivna: <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">{savedLink || publicLink}</code>
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
