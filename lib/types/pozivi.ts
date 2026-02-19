// Tipovi za Pozivi modul

export interface Poziv {
  id: number
  created_at: string
  ipadresa: string | null
  mobtel: string | null
  email: string | null
  imekupca: string | null
  drzava: string | null
  regija: string | null
  validacija_ag: string | null
  kodkampanje: string | null
  ponudaid: number | null
  idkampanjakupac: number | null
}

export interface PozivInsert {
  ipadresa?: string | null
  mobtel?: string | null
  email?: string | null
  imekupca?: string | null
  drzava?: string | null
  regija?: string | null
  validacija_ag?: string | null
  kodkampanje?: string | null
  ponudaid?: number | null
  idkampanjakupac?: number | null
}

export interface PozivUpdate extends PozivInsert {
  id?: number
}
