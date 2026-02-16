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
    getFullReport: 'Preuzmi kompletan PDF Audit',
    showExactAddress: 'Prikaži tačnu adresu',
    contactAgent: 'Kontaktiraj agenta',
    
    // WhatsApp
    whatsappMessage: 'Zdravo, zanima me oglas',
    whatsappPdfRequest: 'Možete li mi poslati PDF?',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'Sva prava zadržana',
    
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
    getFullReport: 'Download Full PDF Audit',
    showExactAddress: 'Show Exact Address',
    contactAgent: 'Contact Agent',
    
    // WhatsApp
    whatsappMessage: 'Hello, I am interested in the listing',
    whatsappPdfRequest: 'Can you send me the PDF?',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'All rights reserved',
    
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
    getFullReport: 'Vollständiges PDF-Audit herunterladen',
    showExactAddress: 'Genaue Adresse anzeigen',
    contactAgent: 'Agent kontaktieren',
    
    // WhatsApp
    whatsappMessage: 'Hallo, ich interessiere mich für das Angebot',
    whatsappPdfRequest: 'Können Sie mir das PDF schicken?',
    
    // Footer
    poweredBy: 'Powered by AuditClaw',
    allRightsReserved: 'Alle Rechte vorbehalten',
    
    // Misc
    yes: 'Ja',
    no: 'Nein',
    notSpecified: 'Nicht angegeben',
    sqm: 'qm',
    price: 'Preis',
    id: 'ID',
  },
}

export function getTranslation(lang: Language) {
  return translations[lang] || translations.sr
}
