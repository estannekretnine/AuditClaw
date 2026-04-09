export interface Aktuelnost {
  id: number
  naslov_sr: string
  naslov_en: string | null
  tekst_sr: string
  tekst_en: string | null
  slika_url: string | null
  datum_objave: string
  stsaktivan: boolean
  datumupisa: string
  datumpromene: string | null
}

export interface AktuelnostInsert {
  naslov_sr: string
  naslov_en?: string | null
  tekst_sr: string
  tekst_en?: string | null
  slika_url?: string | null
  datum_objave?: string
  stsaktivan?: boolean
}

export interface AktuelnostUpdate {
  naslov_sr?: string
  naslov_en?: string | null
  tekst_sr?: string
  tekst_en?: string | null
  slika_url?: string | null
  datum_objave?: string
  stsaktivan?: boolean
  datumpromene?: string
}
