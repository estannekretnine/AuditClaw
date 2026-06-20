export interface Klijent {
  id: number
  ime: string | null
  prezime: string | null
  firma: string | null
  email: string | null
  kontakt: string | null
  stsagencijazanekretnine: boolean
  stsinvestitor: boolean
  stsinvestitoraudit: boolean
  stskupac: boolean
  stsprijateljsajta: boolean
  stsprodavac: boolean
  datumupisa: string
  datumpromene: string | null
  opis: string | null
  stsarhiviran: boolean
  preporukacode: string | null
  preporukacodeodkoljenta: string | null
}

export interface KlijentInsert {
  ime?: string | null
  prezime?: string | null
  firma?: string | null
  email?: string | null
  kontakt?: string | null
  stsagencijazanekretnine?: boolean
  stsinvestitor?: boolean
  stsinvestitoraudit?: boolean
  stskupac?: boolean
  stsprijateljsajta?: boolean
  stsprodavac?: boolean
  opis?: string | null
  preporukacode?: string | null
  preporukacodeodkoljenta?: string | null
}

export interface KlijentUpdate extends KlijentInsert {
  datumpromene?: string
  stsarhiviran?: boolean
}

export type KlijentFilterStatus = 'active' | 'archived' | 'all'
