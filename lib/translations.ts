// Trojezični prevodi za javnu stranicu nekretnine

export type Language = 'sr' | 'en' | 'de'

// Prevodi za tipove grejanja
export const heatingTranslations: Record<string, Record<Language, string>> = {
  'centralno': { sr: 'Centralno grejanje', en: 'Central heating', de: 'Zentralheizung' },
  'etažno': { sr: 'Etažno grejanje', en: 'Floor heating', de: 'Etagenheizung' },
  'gas': { sr: 'Gas', en: 'Gas', de: 'Gas' },
  'struja': { sr: 'Električno', en: 'Electric', de: 'Elektrisch' },
  'ta peć': { sr: 'TA peć', en: 'Storage heater', de: 'Nachtspeicherheizung' },
  'klima': { sr: 'Klima uređaj', en: 'Air conditioning', de: 'Klimaanlage' },
  'podno': { sr: 'Podno grejanje', en: 'Underfloor heating', de: 'Fußbodenheizung' },
  'toplotna pumpa': { sr: 'Toplotna pumpa', en: 'Heat pump', de: 'Wärmepumpe' },
  'drva': { sr: 'Drva', en: 'Wood', de: 'Holz' },
  'pelet': { sr: 'Pelet', en: 'Pellet', de: 'Pellet' },
  'norveski radijatori': { sr: 'Norveski radijatori', en: 'Norwegian radiators', de: 'Norwegische Heizkörper' },
}

// Prevodi za tipove objekata
export const propertyTypeTranslations: Record<string, Record<Language, string>> = {
  'stan': { sr: 'Stan', en: 'Apartment', de: 'Wohnung' },
  'kuća': { sr: 'Kuća', en: 'House', de: 'Haus' },
  'lokal': { sr: 'Lokal', en: 'Commercial space', de: 'Geschäftsraum' },
  'poslovni prostor': { sr: 'Poslovni prostor', en: 'Office space', de: 'Bürofläche' },
  'plac': { sr: 'Plac', en: 'Land', de: 'Grundstück' },
  'garaža': { sr: 'Garaža', en: 'Garage', de: 'Garage' },
  'vikendica': { sr: 'Vikendica', en: 'Cottage', de: 'Ferienhaus' },
}

// Funkcija za prevod grejanja
export function translateHeating(heating: string | null, lang: Language): string {
  if (!heating) return ''
  const lowerHeating = heating.toLowerCase()
  for (const [key, translations] of Object.entries(heatingTranslations)) {
    if (lowerHeating.includes(key)) {
      return translations[lang]
    }
  }
  return heating // Vrati original ako nema prevoda
}

// Funkcija za prevod tipa objekta
export function translatePropertyType(type: string | null, lang: Language): string {
  if (!type) return ''
  const lowerType = type.toLowerCase()
  return propertyTypeTranslations[lowerType]?.[lang] || type
}

export const translations = {
  sr: {
    // Hero
    forSale: 'Na prodaju',
    forRent: 'Izdavanje',
    
    // Tehničke specifikacije
    technicalSpecs: 'Tehničke specifikacije',
    area: 'Kvadratura',
    rooms: 'Sobe',
    floor: 'Sprat',
    heating: 'Grejanje',
    elevator: 'Lift',
    parking: 'Parking',
    garage: 'Garaža',
    
    // Sekcije
    gallery: 'Galerija',
    technicalDrawing: 'Tehnički crtež',
    location: 'Lokacija',
    description: 'Opis',
    auditAnalysis: 'AuditClaw Analiza',
    advantages: 'Prednosti',
    technicalNotes: 'Tehničke napomene',
    
    // Investitor sekcija
    investorSection: 'ROI Analiza',
    investorDescription: 'Ova nekretnina je pogodna za investicione svrhe.',
    estimatedRoi: 'Procenjeni ROI',
    rentalPotential: 'Potencijal za izdavanje',
    
    // IT sekcija
    itSection: 'IT Friendly',
    itDescription: 'Idealno za remote rad i IT profesionalce.',
    highSpeedInternet: 'Brzi internet',
    quietArea: 'Mirno okruženje',
    
    // Lead generation
    requestDetails: 'Zatraži detalje',
    
    // WhatsApp
    whatsappMessage: 'Zdravo, zanima me oglas',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'Sva prava zadržana',
    
    // CTA
    ctaTitle: 'Zainteresovani ste?',
    
    // Misc
    yes: 'Da',
    no: 'Ne',
    notSpecified: 'Nije navedeno',
    sqm: 'm²',
    price: 'Cena',
    id: 'ID',
  },
  
  en: {
    // Hero
    forSale: 'For Sale',
    forRent: 'For Rent',
    
    // Technical specs
    technicalSpecs: 'Technical Specifications',
    area: 'Area',
    rooms: 'Rooms',
    floor: 'Floor',
    heating: 'Heating',
    elevator: 'Elevator',
    parking: 'Parking',
    garage: 'Garage',
    
    // Sections
    gallery: 'Gallery',
    technicalDrawing: 'Technical Drawing',
    location: 'Location',
    description: 'Description',
    auditAnalysis: 'AuditClaw Analysis',
    advantages: 'Advantages',
    technicalNotes: 'Technical Notes',
    
    // Investor section
    investorSection: 'ROI Analysis',
    investorDescription: 'This property is suitable for investment purposes.',
    estimatedRoi: 'Estimated ROI',
    rentalPotential: 'Rental Potential',
    
    // IT section
    itSection: 'IT Friendly',
    itDescription: 'Ideal for remote work and IT professionals.',
    highSpeedInternet: 'High-speed Internet',
    quietArea: 'Quiet Environment',
    
    // Lead generation
    requestDetails: 'Request Details',
    
    // WhatsApp
    whatsappMessage: 'Hello, I am interested in the listing',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'All rights reserved',
    
    // CTA
    ctaTitle: 'Interested?',
    
    // Misc
    yes: 'Yes',
    no: 'No',
    notSpecified: 'Not specified',
    sqm: 'sqm',
    price: 'Price',
    id: 'ID',
  },
  
  de: {
    // Hero
    forSale: 'Zu verkaufen',
    forRent: 'Zu vermieten',
    
    // Technical specs
    technicalSpecs: 'Technische Daten',
    area: 'Fläche',
    rooms: 'Zimmer',
    floor: 'Etage',
    heating: 'Heizung',
    elevator: 'Aufzug',
    parking: 'Parkplatz',
    garage: 'Garage',
    
    // Sections
    gallery: 'Galerie',
    technicalDrawing: 'Technische Zeichnung',
    location: 'Standort',
    description: 'Beschreibung',
    auditAnalysis: 'AuditClaw Analyse',
    advantages: 'Vorteile',
    technicalNotes: 'Technische Hinweise',
    
    // Investor section
    investorSection: 'ROI-Analyse',
    investorDescription: 'Diese Immobilie eignet sich für Investitionszwecke.',
    estimatedRoi: 'Geschätzte Rendite',
    rentalPotential: 'Mietpotenzial',
    
    // IT section
    itSection: 'IT-freundlich',
    itDescription: 'Ideal für Remote-Arbeit und IT-Fachleute.',
    highSpeedInternet: 'Schnelles Internet',
    quietArea: 'Ruhige Umgebung',
    
    // Lead generation
    requestDetails: 'Details anfordern',
    
    // WhatsApp
    whatsappMessage: 'Hallo, ich interessiere mich für das Angebot',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'Alle Rechte vorbehalten',
    
    // CTA
    ctaTitle: 'Interessiert?',
    
    // Misc
    yes: 'Ja',
    no: 'Nein',
    notSpecified: 'Nicht angegeben',
    sqm: 'qm',
    price: 'Preis',
    id: 'ID',
  },
}

// Mapa za prevod uobičajenih reči/fraza u opisima nekretnina
const descriptionTranslations: Record<string, Record<Language, string>> = {
  // Prostorije
  'dnevna soba': { sr: 'dnevna soba', en: 'living room', de: 'Wohnzimmer' },
  'spavaća soba': { sr: 'spavaća soba', en: 'bedroom', de: 'Schlafzimmer' },
  'kupatilo': { sr: 'kupatilo', en: 'bathroom', de: 'Badezimmer' },
  'kuhinja': { sr: 'kuhinja', en: 'kitchen', de: 'Küche' },
  'trpezarija': { sr: 'trpezarija', en: 'dining room', de: 'Esszimmer' },
  'hodnik': { sr: 'hodnik', en: 'hallway', de: 'Flur' },
  'predsoblje': { sr: 'predsoblje', en: 'entrance hall', de: 'Eingangsbereich' },
  'terasa': { sr: 'terasa', en: 'terrace', de: 'Terrasse' },
  'balkon': { sr: 'balkon', en: 'balcony', de: 'Balkon' },
  'garaža': { sr: 'garaža', en: 'garage', de: 'Garage' },
  'podrum': { sr: 'podrum', en: 'basement', de: 'Keller' },
  'tavan': { sr: 'tavan', en: 'attic', de: 'Dachboden' },
  'ostava': { sr: 'ostava', en: 'storage room', de: 'Abstellraum' },
  
  // Karakteristike
  'centralno grejanje': { sr: 'centralno grejanje', en: 'central heating', de: 'Zentralheizung' },
  'klima': { sr: 'klima', en: 'air conditioning', de: 'Klimaanlage' },
  'lift': { sr: 'lift', en: 'elevator', de: 'Aufzug' },
  'parking': { sr: 'parking', en: 'parking', de: 'Parkplatz' },
  'internet': { sr: 'internet', en: 'internet', de: 'Internet' },
  'kablovska': { sr: 'kablovska', en: 'cable TV', de: 'Kabelfernsehen' },
  'interfon': { sr: 'interfon', en: 'intercom', de: 'Gegensprechanlage' },
  'video nadzor': { sr: 'video nadzor', en: 'video surveillance', de: 'Videoüberwachung' },
  'alarm': { sr: 'alarm', en: 'alarm system', de: 'Alarmanlage' },
  
  // Stanje
  'renoviran': { sr: 'renoviran', en: 'renovated', de: 'renoviert' },
  'novogradnja': { sr: 'novogradnja', en: 'new construction', de: 'Neubau' },
  'useljiv': { sr: 'useljiv', en: 'move-in ready', de: 'bezugsfertig' },
  'namešten': { sr: 'namešten', en: 'furnished', de: 'möbliert' },
  'polunamešten': { sr: 'polunamešten', en: 'partially furnished', de: 'teilmöbliert' },
  'prazan': { sr: 'prazan', en: 'unfurnished', de: 'unmöbliert' },
  
  // Lokacija
  'centar': { sr: 'centar', en: 'city center', de: 'Stadtzentrum' },
  'mirna ulica': { sr: 'mirna ulica', en: 'quiet street', de: 'ruhige Straße' },
  'blizu': { sr: 'blizu', en: 'near', de: 'in der Nähe von' },
  'u blizini': { sr: 'u blizini', en: 'nearby', de: 'in der Nähe' },
  
  // Opšte
  'na prodaju': { sr: 'na prodaju', en: 'for sale', de: 'zu verkaufen' },
  'izdavanje': { sr: 'izdavanje', en: 'for rent', de: 'zu vermieten' },
  'kvadrata': { sr: 'kvadrata', en: 'square meters', de: 'Quadratmeter' },
  'sprat': { sr: 'sprat', en: 'floor', de: 'Etage' },
  'prizemlje': { sr: 'prizemlje', en: 'ground floor', de: 'Erdgeschoss' },
  'potkrovlje': { sr: 'potkrovlje', en: 'attic apartment', de: 'Dachgeschoss' },
  'dupleks': { sr: 'dupleks', en: 'duplex', de: 'Maisonette' },
  'stan': { sr: 'stan', en: 'apartment', de: 'Wohnung' },
  'kuća': { sr: 'kuća', en: 'house', de: 'Haus' },
  
  // Dodatno
  'odlična lokacija': { sr: 'odlična lokacija', en: 'excellent location', de: 'ausgezeichnete Lage' },
  'pogodan za': { sr: 'pogodan za', en: 'suitable for', de: 'geeignet für' },
  'idealan za': { sr: 'idealan za', en: 'ideal for', de: 'ideal für' },
  'svetao': { sr: 'svetao', en: 'bright', de: 'hell' },
  'prostran': { sr: 'prostran', en: 'spacious', de: 'geräumig' },
  'moderan': { sr: 'moderan', en: 'modern', de: 'modern' },
  'luksuzno': { sr: 'luksuzno', en: 'luxurious', de: 'luxuriös' },
  
  // Površina
  'stvarna površina': { sr: 'Stvarna površina', en: 'Actual area', de: 'Tatsächliche Fläche' },
  'ugovorna površina': { sr: 'ugovorna površina', en: 'contractual area', de: 'Vertragsfläche' },
  
  // Grejanje detaljno
  'etažno': { sr: 'etažno', en: 'floor heating', de: 'Etagenheizung' },
  'inverter klime': { sr: 'inverter klime', en: 'inverter air conditioners', de: 'Inverter-Klimaanlagen' },
  'radijatori': { sr: 'radijatori', en: 'radiators', de: 'Heizkörper' },
  
  // Prozori/vrata
  'prozor': { sr: 'prozor', en: 'window', de: 'Fenster' },
  'komarnici': { sr: 'komarnici', en: 'mosquito nets', de: 'Fliegengitter' },
  'roletne': { sr: 'roletne', en: 'blinds', de: 'Rollläden' },
  'vrata': { sr: 'vrata', en: 'door', de: 'Tür' },
  
  // Stepenice
  'stepenice': { sr: 'stepenice', en: 'stairs', de: 'Treppe' },
  'spiralne stepenice': { sr: 'spiralne stepenice', en: 'spiral staircase', de: 'Wendeltreppe' },
  
  // Nameštaj
  'garnitura': { sr: 'garnitura', en: 'furniture set', de: 'Möbelgarnitur' },
  'ugaona garnitura': { sr: 'ugaona garnitura', en: 'corner sofa', de: 'Ecksofa' },
  'američki plakar': { sr: 'američki plakar', en: 'walk-in closet', de: 'begehbarer Kleiderschrank' },
  
  // Osvetljenje
  'osvetljenje': { sr: 'osvetljenje', en: 'lighting', de: 'Beleuchtung' },
  'ambijentalno': { sr: 'ambijentalno', en: 'ambient', de: 'Ambiente' },
  'dnevne svetlosti': { sr: 'dnevne svetlosti', en: 'natural light', de: 'Tageslicht' },
  'prirodne svetlosti': { sr: 'prirodne svetlosti', en: 'natural light', de: 'natürliches Licht' },
  
  // Izolacija
  'izolacija': { sr: 'izolacija', en: 'insulation', de: 'Isolierung' },
  'kamena vuna': { sr: 'kamena vuna', en: 'rock wool', de: 'Steinwolle' },
  
  // Zidovi
  'zidovi': { sr: 'zidovi', en: 'walls', de: 'Wände' },
  'dupli zidovi': { sr: 'dupli zidovi', en: 'double walls', de: 'Doppelwände' },
  
  // Provizija
  'provizija': { sr: 'provizija', en: 'commission', de: 'Provision' },
  'agencijska provizija': { sr: 'agencijska provizija', en: 'agency commission', de: 'Maklerprovision' },
  
  // Mapa
  'mapa': { sr: 'mapa', en: 'map', de: 'Karte' },
  'lokaciju': { sr: 'lokaciju', en: 'location', de: 'Standort' },
  'adresu': { sr: 'adresu', en: 'address', de: 'Adresse' },
  'tačnu adresu': { sr: 'tačnu adresu', en: 'exact address', de: 'genaue Adresse' },
}

// Funkcija za prevod opisa nekretnine
export function translateDescription(description: string | null, lang: Language): string {
  if (!description || lang === 'sr') return description || ''
  
  let translated = description
  
  // Sortiraj ključeve po dužini (duži prvo) da bi se izbeglo delimično zamenjivanje
  const sortedKeys = Object.keys(descriptionTranslations).sort((a, b) => b.length - a.length)
  
  for (const key of sortedKeys) {
    const translations = descriptionTranslations[key]
    if (translations[lang]) {
      // Case-insensitive zamena
      const regex = new RegExp(key, 'gi')
      translated = translated.replace(regex, (match) => {
        // Zadrži kapitalizaciju prvog slova ako je original bio kapitalizovan
        if (match[0] === match[0].toUpperCase()) {
          return translations[lang].charAt(0).toUpperCase() + translations[lang].slice(1)
        }
        return translations[lang]
      })
    }
  }
  
  return translated
}

export function getTranslation(lang: Language) {
  return translations[lang] || translations.sr
}
