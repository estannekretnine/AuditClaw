export interface KupacImport {
  id: number
  created_at: string
  mobprimarni: string | null
  mobsek: string | null
  email: string | null
  stsotvoren: boolean | null
  linkedinurl: string | null
  drzava: string | null
  grad: string | null
  zanimanje: string | null
  godisnjaplata: string | null
  specificnosti: Record<string, unknown> | null
  ime: string | null
  prezime: string | null
  metapodaci: Record<string, unknown> | null
  nekretnine: string | null
}

export interface KupacImportInsert {
  mobprimarni?: string | null
  mobsek?: string | null
  email?: string | null
  stsotvoren?: boolean | null
  linkedinurl?: string | null
  drzava?: string | null
  grad?: string | null
  zanimanje?: string | null
  godisnjaplata?: string | null
  specificnosti?: Record<string, unknown> | null
  ime?: string | null
  prezime?: string | null
  metapodaci?: Record<string, unknown> | null
  nekretnine?: string | null
}

export interface KupacKampanja {
  id: number
  created_at: string
  kampanjaid: number | null
  kupacid: number | null
  url: string | null
}

export interface KupacKampanjaWithDetails extends KupacKampanja {
  kupac?: KupacImport
}

export interface ImportResult {
  total: number
  inserted: number
  updated: number
  errors: number
  errorMessages: string[]
}

export interface CSVRow {
  // Standardni format (srpski nazivi kolona)
  ime?: string
  prezime?: string
  email?: string
  mobprimarni?: string
  mobsek?: string
  linkedinurl?: string
  drzava?: string
  grad?: string
  zanimanje?: string
  godisnjaplata?: string
  
  // LinkedIn Sales Navigator format (engleski nazivi kolona)
  'first name'?: string
  'last name'?: string
  'linkedin url public'?: string
  'linkedin url unique id'?: string
  location?: string
  'current job'?: string
  'company location'?: string
  'company name'?: string
  'company domain'?: string
  'company industry'?: string
  'company description'?: string
  'company employee range'?: string
  'company employee exact count'?: string
  'company revenue min (millions usd)'?: string
  'company revenue max (millions usd)'?: string
  'company type'?: string
  'company year founded'?: string
  'profile headline'?: string
  'profile summary'?: string
  'profile industry'?: string
  'job description'?: string
  connections?: string
  'follower count'?: string
  'is open to work'?: string
  'is premium'?: string
  'years in position'?: string
  'months in position'?: string
  'years in company'?: string
  'months in company'?: string
  education?: string
  'top skills (with endorsements)'?: string
  languages?: string
  'full name'?: string
  'matches filters'?: string
  'no match reasons'?: string
  'email status'?: string
  [key: string]: string | undefined
}
