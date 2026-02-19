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
}
