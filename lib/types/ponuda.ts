// Tipovi za Ponuda modul

export interface Ponuda {
  id: number
  created_at: string
  idkorisnik: number | null
  idkorisnik_agencija: number | null
  oglasid_agencija: string | null // Agencijski broj oglasa
  agencija_naziv?: string | null // JOIN podatak iz korisnici tabele
  glavna_foto_url?: string | null // JOIN podatak iz ponudafoto tabele
  vrstaobjekta_ag: string | null
  grad_ag: string | null
  opstina_ag: string | null
  lokacija_ag: string | null
  struktura_ag: number | null
  kvadratura_ag: number | null
  cena_ag: number | null
  opis_ag: string | null
  ciljnagrupa_ag: string | null
  ucestalostpoyiva_ag: string | null
  kupaczainteresovan_ag: string | null
  primedbekupca_ag: string | null
  drzava: string | null
  adresa: string | null
  sprat: string | null
  grejanje: string | null
  lift: string | null
  ari: string | null
  stsimagarazu: boolean | null
  stsparking: boolean | null
  stszainvestitor: boolean | null
  stszaIT: boolean | null
  stsaktivan: boolean | null
  '3dture': string | null
  videolink: string | null
  latitude: string | null
  longitude: string | null
  naslovoglasa: string | null
  stsrentaprodaja: string | null
  webstrana: string | null // JSON konfiguracija za javnu web stranicu
}

export interface PonudaInsert {
  idkorisnik?: number | null
  idkorisnik_agencija?: number | null
  oglasid_agencija?: string | null
  vrstaobjekta_ag?: string | null
  grad_ag?: string | null
  opstina_ag?: string | null
  lokacija_ag?: string | null
  struktura_ag?: number | null
  kvadratura_ag?: number | null
  cena_ag?: number | null
  opis_ag?: string | null
  ciljnagrupa_ag?: string | null
  ucestalostpoyiva_ag?: string | null
  kupaczainteresovan_ag?: string | null
  primedbekupca_ag?: string | null
  drzava?: string | null
  adresa?: string | null
  sprat?: string | null
  grejanje?: string | null
  lift?: string | null
  ari?: string | null
  stsimagarazu?: boolean | null
  stsparking?: boolean | null
  stszainvestitor?: boolean | null
  stszaIT?: boolean | null
  stsaktivan?: boolean | null
  '3dture'?: string | null
  videolink?: string | null
  latitude?: string | null
  longitude?: string | null
  naslovoglasa?: string | null
  stsrentaprodaja?: string | null
}

export interface PonudaUpdate extends PonudaInsert {
  id?: number
}

// Tipovi za PonudaFoto tabelu
export interface PonudaFoto {
  id: number
  datumpromene: string
  idponude: number | null
  url: string | null
  opis: string | null
  redosled: number | null
  glavna: boolean | null
  stsskica: boolean | null
  skica_segment: string | null
  skica_coords: string | null
  opisfoto: Record<string, unknown> | null
}

export interface PonudaFotoInsert {
  idponude?: number | null
  url?: string | null
  opis?: string | null
  redosled?: number | null
  glavna?: boolean | null
  stsskica?: boolean | null
  skica_segment?: string | null
  skica_coords?: string | null
  opisfoto?: Record<string, unknown> | null
}

// Tipovi za vrstu objekta
export type VrstaObjekta = 'stan' | 'kuća' | 'lokal' | 'poslovni prostor' | 'plac' | 'garaža' | 'vikendica'

// Tipovi za tip transakcije
export type TipTransakcije = 'prodaja' | 'renta'
