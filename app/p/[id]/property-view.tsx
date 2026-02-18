'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  Home, MapPin, Ruler, BedDouble, Building2, Flame, 
  Car, Warehouse, TrendingUp, Laptop, ChevronLeft, ChevronRight,
  FileText, Phone, MessageCircle, Check, X as XIcon, Play, Box,
  ThermometerSun, Wifi, TreePine, Sparkles, ZoomIn
} from 'lucide-react'
import { translations, translateHeating, translatePropertyType, translateDescription, type Language } from '@/lib/translations'
import type { Ponuda, PonudaFoto } from '@/lib/types/ponuda'
import type { Kampanja } from '@/lib/types/kampanja'
import { useWebstranaTracking } from '@/hooks/useWebstranaTracking'

interface PropertyViewProps {
  ponuda: Ponuda
  photos: PonudaFoto[]
  kampanja: Kampanja | null
}

// Struktura koja se čuva u ponuda.webstrana
interface WebStranaData {
  link: string
  config: WebStranaConfig
}

interface WebStranaConfig {
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
  primaryLanguage: 'sr' | 'en' | 'de'
  theme: 'dark' | 'light'
  accentColor: 'amber' | 'cyan' | 'violet' | 'emerald'
  whatsappNumber: string
  contactEmail: string
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

export default function PropertyView({ ponuda, photos, kampanja }: PropertyViewProps) {
  // Parsiraj sačuvanu konfiguraciju (novi format sa link i config)
  const config = useMemo<WebStranaConfig>(() => {
    if (ponuda.webstrana) {
      try {
        const parsed: WebStranaData = JSON.parse(ponuda.webstrana)
        // Novi format - ima config polje
        if (parsed.config) {
          return { ...defaultConfig, ...parsed.config }
        }
        // Backward compatibility - stari format (direktno config)
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
  }, [ponuda.webstrana, ponuda.stszainvestitor, ponuda.stszaIT])

  const [lang, setLang] = useState<Language>(config.primaryLanguage)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Tracking hook za logovanje aktivnosti
  const {
    trackPhotoClick,
    trackLanguageChange,
    trackWhatsAppClick,
    trackVideoClick,
    track3DTourClick,
    trackMapInteraction
  } = useWebstranaTracking({
    ponudaId: ponuda.id,
    kampanjaId: kampanja?.id,
    initialLanguage: config.primaryLanguage
  })

  const t = translations[lang]
  
  // Filtriraj fotografije - skice idu u posebnu sekciju
  const regularPhotos = photos.filter(p => !p.stsskica)
  const sketchPhotos = photos.filter(p => p.stsskica)
  
  // Glavna fotografija
  const mainPhoto = regularPhotos.find(p => p.glavna) || regularPhotos[0]
  const currentPhoto = regularPhotos[currentPhotoIndex] || mainPhoto

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('sr-RS')
  }

  // Generisanje WhatsApp URL-a za "Zatraži detalje"
  const getWhatsAppUrl = () => {
    const phone = config.whatsappNumber.replace(/[+\s-]/g, '')
    const title = ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`
    const message = `${t.whatsappMessage} "${title}" (ID: ${ponuda.id}).\n${t.requestDetails}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  // Određivanje teme
  const isDarkTheme = config.theme === 'dark'

  // Generisanje Audit Score-a (simulacija)
  const calculateAuditScore = () => {
    let score = 70
    if (ponuda.lift === 'Da' || ponuda.lift === 'da') score += 5
    if (ponuda.stsimagarazu) score += 5
    if (ponuda.stsparking) score += 5
    if (ponuda.grejanje) score += 5
    if (ponuda.latitude && ponuda.longitude) score += 5
    if (regularPhotos.length > 5) score += 5
    return Math.min(score, 100)
  }

  const auditScore = calculateAuditScore()

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const nextLightboxPhoto = useCallback(() => {
    setLightboxIndex(i => i < regularPhotos.length - 1 ? i + 1 : 0)
  }, [regularPhotos.length])

  const prevLightboxPhoto = useCallback(() => {
    setLightboxIndex(i => i > 0 ? i - 1 : regularPhotos.length - 1)
  }, [regularPhotos.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextLightboxPhoto()
      if (e.key === 'ArrowLeft') prevLightboxPhoto()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, closeLightbox, nextLightboxPhoto, prevLightboxPhoto])

  // Accent color classes
  const accentColorClasses = {
    amber: { bg: 'bg-amber-500', text: 'text-amber-500', textLight: 'text-amber-400' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', textLight: 'text-cyan-400' },
    violet: { bg: 'bg-violet-500', text: 'text-violet-500', textLight: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', textLight: 'text-emerald-400' }
  }
  const accent = accentColorClasses[config.accentColor] || accentColorClasses.amber

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* Language Toggle */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-1 ${isDarkTheme ? 'bg-black/80' : 'bg-white/90 shadow-lg'} backdrop-blur-sm rounded-full p-1`}>
        {(['sr', 'en', 'de'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              if (l !== lang) {
                trackLanguageChange(l, lang)
                setLang(l)
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
              lang === l 
                ? `${accent.bg} ${config.accentColor === 'amber' ? 'text-black' : 'text-white'}` 
                : isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          {currentPhoto?.url ? (
            <img 
              src={currentPhoto.url} 
              alt={ponuda.naslovoglasa || 'Property'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Home className="w-24 h-24 text-gray-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        </div>

        {/* Photo Navigation */}
        {regularPhotos.length > 1 && (
          <>
            <button
              onClick={() => setCurrentPhotoIndex(i => i > 0 ? i - 1 : regularPhotos.length - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentPhotoIndex(i => i < regularPhotos.length - 1 ? i + 1 : 0)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
              {regularPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentPhotoIndex ? 'bg-amber-500 w-6' : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                ponuda.stsrentaprodaja === 'R' || ponuda.stsrentaprodaja === 'renta'
                  ? 'bg-purple-500 text-white'
                  : 'bg-amber-500 text-black'
              }`}>
                {ponuda.stsrentaprodaja === 'R' || ponuda.stsrentaprodaja === 'renta' ? t.forRent : t.forSale}
              </span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-300">
                {t.id}: {ponuda.id}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {config.heroTitle || translateDescription(kampanja?.naslov_ai ?? null, lang) || ponuda.naslovoglasa || `${translatePropertyType(ponuda.vrstaobjekta_ag, lang)} - ${ponuda.lokacija_ag}`}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-300 mb-6">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>{ponuda.lokacija_ag}, {ponuda.opstina_ag}, {ponuda.grad_ag || 'Beograd'}</span>
            </div>

            {/* Price & Audit Score */}
            <div className="flex flex-wrap items-center gap-6">
              {config.showPrice && (
                <div className={`text-4xl md:text-5xl font-bold ${accent.textLight}`}>
                  {formatNumber(ponuda.cena_ag)} €
                </div>
              )}
              
              {/* Audit Score Badge */}
              {config.showAuditScore && (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <circle 
                        cx="28" cy="28" r="24" fill="none" 
                        stroke={auditScore >= 80 ? '#22c55e' : auditScore >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="4" 
                        strokeDasharray={`${auditScore * 1.51} 151`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {auditScore}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">AuditClaw</div>
                    <div className="font-semibold">Score</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs Grid */}
      {config.showTechSpecs && (
      <section className={`py-12 px-6 md:px-12 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Ruler className="w-6 h-6 text-amber-500" />
            {t.technicalSpecs}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Kvadratura */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <Ruler className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-2xl font-bold">{formatNumber(ponuda.kvadratura_ag)}</div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.sqm}</div>
            </div>

            {/* Sobe */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <BedDouble className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-2xl font-bold">{ponuda.struktura_ag || '-'}</div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.rooms}</div>
            </div>

            {/* Sprat */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <Building2 className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-2xl font-bold">{ponuda.sprat || '-'}</div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.floor}</div>
            </div>

            {/* Grejanje */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <Flame className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-lg font-bold truncate">{translateHeating(ponuda.grejanje, lang) || '-'}</div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.heating}</div>
            </div>

            {/* Lift */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <Building2 className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-2xl font-bold">
                {ponuda.lift === 'Da' || ponuda.lift === 'da' ? (
                  <Check className="w-6 h-6 text-green-500 mx-auto" />
                ) : (
                  <XIcon className="w-6 h-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.elevator}</div>
            </div>

            {/* Parking */}
            <div className={`${isDarkTheme ? 'bg-gray-800' : 'bg-white shadow'} rounded-2xl p-5 text-center`}>
              <Car className={`w-8 h-8 ${accent.text} mx-auto mb-3`} />
              <div className="text-2xl font-bold">
                {ponuda.stsparking ? (
                  <Check className="w-6 h-6 text-green-500 mx-auto" />
                ) : (
                  <XIcon className="w-6 h-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{t.parking}</div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Gallery Section */}
      {config.showGallery && regularPhotos.length > 0 && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">{t.gallery}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    trackPhotoClick(idx, photo.url || undefined)
                    openLightbox(idx)
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentPhotoIndex ? 'border-amber-500' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img 
                    src={photo.url || ''} 
                    alt={photo.opis || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Zoom overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Drawing (Skice) */}
      {config.showTechnicalDrawing && sketchPhotos.length > 0 && (
        <section className="py-12 px-6 md:px-12 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">{t.technicalDrawing}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sketchPhotos.map((sketch) => (
                <div key={sketch.id} className="bg-gray-800 rounded-2xl p-4">
                  <img 
                    src={sketch.url || ''} 
                    alt={sketch.opis || 'Skica'}
                    className="w-full rounded-xl"
                  />
                  {sketch.opis && (
                    <p className="mt-3 text-sm text-gray-400">{sketch.opis}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video & 3D Tour */}
      {((config.showVideo && ponuda.videolink) || (config.show3DTour && ponuda['3dture'])) && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.showVideo && ponuda.videolink && (
              <a 
                href={ponuda.videolink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackVideoClick(ponuda.videolink || undefined)}
                className="bg-gray-800 rounded-2xl p-6 flex items-center gap-4 hover:bg-gray-700 transition-colors"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Play className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <div className="font-bold text-lg">Video tura</div>
                  <div className="text-sm text-gray-400">Pogledajte video prezentaciju</div>
                </div>
              </a>
            )}
            {config.show3DTour && ponuda['3dture'] && (
              <a 
                href={ponuda['3dture']}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track3DTourClick(ponuda['3dture'] || undefined)}
                className="bg-gray-800 rounded-2xl p-6 flex items-center gap-4 hover:bg-gray-700 transition-colors"
              >
                <div className="w-16 h-16 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <Box className="w-8 h-8 text-violet-500" />
                </div>
                <div>
                  <div className="font-bold text-lg">3D Tura</div>
                  <div className="text-sm text-gray-400">Istražite prostor u 3D</div>
                </div>
              </a>
            )}
          </div>
        </section>
      )}

      {/* Investor Section */}
      {config.showInvestorSection && (
        <section className="py-12 px-6 md:px-12 bg-gradient-to-r from-violet-900/50 to-purple-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-violet-400" />
              {t.investorSection}
            </h2>
            <p className="text-gray-300 mb-6">{t.investorDescription}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-sm text-violet-300 mb-1">{t.estimatedRoi}</div>
                <div className="text-3xl font-bold text-violet-400">5-8%</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-sm text-violet-300 mb-1">{t.rentalPotential}</div>
                <div className="text-3xl font-bold text-violet-400">Visok</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* IT Section */}
      {config.showItSection && (
        <section className="py-12 px-6 md:px-12 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Laptop className="w-6 h-6 text-cyan-400" />
              {t.itSection}
            </h2>
            <p className="text-gray-300 mb-6">{t.itDescription}</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <Wifi className="w-5 h-5 text-cyan-400" />
                <span>{t.highSpeedInternet}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <TreePine className="w-5 h-5 text-cyan-400" />
                <span>{t.quietArea}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AuditClaw Analysis */}
      {config.showDescription && kampanja?.opis_ai && (
        <section className="py-12 px-6 md:px-12 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-500" />
              {t.auditAnalysis}
            </h2>
            
            {/* Opis iz kampanje */}
            <div className={`${isDarkTheme ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'} rounded-2xl p-6`}>
              <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                {translateDescription(kampanja.opis_ai, lang)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Map Section */}
      {config.showMap && ponuda.latitude && ponuda.longitude && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-amber-500" />
              {t.location}
            </h2>
            <div 
              className="aspect-video bg-gray-800 rounded-2xl overflow-hidden"
              onClick={() => trackMapInteraction('click')}
            >
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${ponuda.latitude},${ponuda.longitude}&zoom=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={`py-8 pb-28 px-6 ${isDarkTheme ? 'bg-gray-950 border-t border-gray-800' : 'bg-gray-100 border-t border-gray-200'}`}>
        <div className={`max-w-6xl mx-auto text-center text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
          <p>{t.poweredBy} © {new Date().getFullYear()}. {t.allRightsReserved}</p>
        </div>
      </footer>

      {/* Sticky CTA Button - Always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
        <div className="max-w-lg mx-auto">
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick()}
            className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-green-400/20 backdrop-blur-sm"
          >
            {/* Pulse animation ring */}
            <span className="absolute inset-0 rounded-2xl bg-green-400/20 animate-ping opacity-20"></span>
            
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all"></div>
              <MessageCircle className="relative w-6 h-6 drop-shadow-lg" />
            </div>
            
            {/* Text */}
            <span className="relative tracking-wide drop-shadow-md">
              {t.requestDetails}
            </span>
            
            {/* Arrow indicator */}
            <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          
          {/* Subtle glass effect bar behind */}
          <div className={`absolute inset-x-0 bottom-0 h-20 -z-10 ${isDarkTheme ? 'bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent' : 'bg-gradient-to-t from-white via-white/95 to-transparent'}`}></div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <XIcon className="w-6 h-6 text-white" />
          </button>

          {/* Photo counter */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 rounded-full text-white text-sm">
            {lightboxIndex + 1} / {regularPhotos.length}
          </div>

          {/* Previous button */}
          {regularPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevLightboxPhoto(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Main image */}
          <div 
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={regularPhotos[lightboxIndex]?.url || ''}
              alt={regularPhotos[lightboxIndex]?.opis || `Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Next button */}
          {regularPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextLightboxPhoto(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Thumbnail strip */}
          {regularPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full max-w-[90vw] overflow-x-auto">
              {regularPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex ? 'border-amber-500' : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <img
                    src={photo.url || ''}
                    alt={photo.opis || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
