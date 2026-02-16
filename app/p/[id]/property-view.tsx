'use client'

import { useState, useMemo } from 'react'
import { 
  Home, MapPin, Ruler, BedDouble, Building2, Flame, 
  Car, Warehouse, TrendingUp, Laptop, ChevronLeft, ChevronRight,
  FileText, Phone, MessageCircle, Check, X, Play, Box,
  ThermometerSun, Wifi, TreePine
} from 'lucide-react'
import { translations, type Language } from '@/lib/translations'
import type { Ponuda, PonudaFoto } from '@/lib/types/ponuda'

interface PropertyViewProps {
  ponuda: Ponuda
  photos: PonudaFoto[]
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

export default function PropertyView({ ponuda, photos }: PropertyViewProps) {
  // Parsiraj sačuvanu konfiguraciju
  const config = useMemo<WebStranaConfig>(() => {
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
  }, [ponuda.webstrana, ponuda.stszainvestitor, ponuda.stszaIT])

  const [lang, setLang] = useState<Language>(config.primaryLanguage)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppAction, setWhatsAppAction] = useState<'pdf' | 'address' | 'contact'>('contact')

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

  const handleWhatsAppClick = (action: 'pdf' | 'address' | 'contact') => {
    setWhatsAppAction(action)
    setShowWhatsAppModal(true)
  }

  const getWhatsAppUrl = () => {
    // Koristi broj iz konfiguracije, ukloni + i razmake
    const phone = config.whatsappNumber.replace(/[+\s-]/g, '')
    const title = ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`
    let message = `${t.whatsappMessage} "${title}" (ID: ${ponuda.id}).`
    
    if (whatsAppAction === 'pdf') {
      message += ` ${t.whatsappPdfRequest}`
    } else if (whatsAppAction === 'address') {
      message += ` Molim vas za tačnu adresu.`
    }
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  // Određivanje teme
  const isDarkTheme = config.theme === 'dark'

  // Parsiranje opisa za AI analizu (prednosti i napomene)
  const parseDescription = (desc: string | null) => {
    if (!desc) return { advantages: [], notes: [] }
    
    const lines = desc.split('\n').filter(l => l.trim())
    const advantages: string[] = []
    const notes: string[] = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('+') || trimmed.startsWith('•') || trimmed.toLowerCase().includes('prednost')) {
        advantages.push(trimmed.replace(/^[+•]\s*/, ''))
      } else if (trimmed.startsWith('-') || trimmed.startsWith('!') || trimmed.toLowerCase().includes('napomena')) {
        notes.push(trimmed.replace(/^[-!]\s*/, ''))
      } else if (advantages.length === 0 && notes.length === 0) {
        // Ako nema formatiranja, stavi u prednosti
        advantages.push(trimmed)
      }
    })
    
    return { advantages, notes }
  }

  const { advantages, notes } = parseDescription(ponuda.opis_ag)

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full p-1">
        {(['sr', 'en', 'de'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
              lang === l 
                ? 'bg-amber-500 text-black' 
                : 'text-gray-400 hover:text-white'
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
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2">
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
              {ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-300 mb-6">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>{ponuda.lokacija_ag}, {ponuda.opstina_ag}, {ponuda.grad_ag || 'Beograd'}</span>
            </div>

            {/* Price & Audit Score */}
            <div className="flex flex-wrap items-center gap-6">
              {config.showPrice && (
                <div className="text-4xl md:text-5xl font-bold text-amber-500">
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
      <section className="py-12 px-6 md:px-12 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Ruler className="w-6 h-6 text-amber-500" />
            {t.technicalSpecs}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Kvadratura */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <Ruler className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-2xl font-bold">{formatNumber(ponuda.kvadratura_ag)}</div>
              <div className="text-sm text-gray-400">{t.sqm}</div>
            </div>

            {/* Sobe */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <BedDouble className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-2xl font-bold">{ponuda.struktura_ag || '-'}</div>
              <div className="text-sm text-gray-400">{t.rooms}</div>
            </div>

            {/* Sprat */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <Building2 className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-2xl font-bold">{ponuda.sprat || '-'}</div>
              <div className="text-sm text-gray-400">{t.floor}</div>
            </div>

            {/* Grejanje */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <Flame className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-lg font-bold truncate">{ponuda.grejanje || '-'}</div>
              <div className="text-sm text-gray-400">{t.heating}</div>
            </div>

            {/* Lift */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <Building2 className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {ponuda.lift === 'Da' || ponuda.lift === 'da' ? (
                  <Check className="w-6 h-6 text-green-500 mx-auto" />
                ) : (
                  <X className="w-6 h-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-sm text-gray-400">{t.elevator}</div>
            </div>

            {/* Parking */}
            <div className="bg-gray-800 rounded-2xl p-5 text-center">
              <Car className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {ponuda.stsparking ? (
                  <Check className="w-6 h-6 text-green-500 mx-auto" />
                ) : (
                  <X className="w-6 h-6 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-sm text-gray-400">{t.parking}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {regularPhotos.length > 0 && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">{t.gallery}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentPhotoIndex ? 'border-amber-500' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img 
                    src={photo.url || ''} 
                    alt={photo.opis || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Drawing (Skice) */}
      {sketchPhotos.length > 0 && (
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
      {(ponuda.videolink || ponuda['3dture']) && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {ponuda.videolink && (
              <a 
                href={ponuda.videolink}
                target="_blank"
                rel="noopener noreferrer"
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
            {ponuda['3dture'] && (
              <a 
                href={ponuda['3dture']}
                target="_blank"
                rel="noopener noreferrer"
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
      {ponuda.opis_ag && (
        <section className="py-12 px-6 md:px-12 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-500" />
              {t.auditAnalysis}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prednosti */}
              {advantages.length > 0 && (
                <div className="bg-green-900/30 border border-green-800 rounded-2xl p-6">
                  <h3 className="font-bold text-green-400 mb-4">{t.advantages}</h3>
                  <ul className="space-y-2">
                    {advantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Napomene */}
              {notes.length > 0 && (
                <div className="bg-amber-900/30 border border-amber-800 rounded-2xl p-6">
                  <h3 className="font-bold text-amber-400 mb-4">{t.technicalNotes}</h3>
                  <ul className="space-y-2">
                    {notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ThermometerSun className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Full description if no parsing */}
            {advantages.length === 0 && notes.length === 0 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <p className="text-gray-300 whitespace-pre-wrap">{ponuda.opis_ag}</p>
              </div>
            )}
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
            <div className="aspect-video bg-gray-800 rounded-2xl overflow-hidden">
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

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-amber-600 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Zainteresovani ste?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleWhatsAppClick('pdf')}
              className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              {t.getFullReport}
            </button>
            <button
              onClick={() => handleWhatsAppClick('address')}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              {t.showExactAddress}
            </button>
            <button
              onClick={() => handleWhatsAppClick('contact')}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t.contactAgent}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>{t.poweredBy} © {new Date().getFullYear()}. {t.allRightsReserved}</p>
        </div>
      </footer>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Kontaktirajte nas</h3>
            <p className="text-gray-400 mb-6">
              {whatsAppAction === 'pdf' && 'Zatražite kompletan PDF Audit izveštaj putem WhatsApp-a.'}
              {whatsAppAction === 'address' && 'Zatražite tačnu adresu nekretnine putem WhatsApp-a.'}
              {whatsAppAction === 'contact' && 'Kontaktirajte našeg agenta putem WhatsApp-a.'}
            </p>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Otvori WhatsApp
            </a>
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="block w-full mt-4 text-gray-500 hover:text-white transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
