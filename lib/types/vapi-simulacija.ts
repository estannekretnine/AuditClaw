export type VapiSobaStatus = 'kreirana' | 'aktivna' | 'zavrsena'
export type VapiSimulacijaUloga = 'trijaza' | 'zapisnik' | 'posmatrac'

export interface VitalniParametri {
  puls: number
  pritisak: string
  saturacija: number
  [key: string]: string | number
}

export interface VapiSoba {
  id: string
  naziv: string
  status: VapiSobaStatus
  profesor_id: number
  assistant_id: number | null
  created_at: string
}

export interface VapiSobaInsert {
  naziv: string
  status?: VapiSobaStatus
  profesor_id: number
  assistant_id?: number | null
}

export interface VapiUcesnikSimulacije {
  id: number
  soba_id: string
  ucenik_id: number | null
  uloga: VapiSimulacijaUloga
  online_status: boolean
  joined_at: string | null
  vapi_ucenik?: {
    ime: string
    prezime: string | null
    razred: string | null
  } | null
}

export interface VapiKartonPacijenta {
  id: number
  soba_id: string
  vitalni_parametri: VitalniParametri
  trenutno_stanje: string
  istorija_bolesti: string | null
  anamneza: string | null
  terapija: string | null
  lekovi: string | null
  beleske_posmatrac: string | null
  updated_at: string
}

export interface VapiSobaDetalji extends VapiSoba {
  ucesnici: VapiUcesnikSimulacije[]
  karton: VapiKartonPacijenta | null
  vapi_profesor?: {
    ime: string
    prezime: string | null
  } | null
  vapi_assistants?: {
    id: number
    assistant_id: string
    opis_servisa: string | null
    ima_video_pacijenta: boolean
    simli_face_id: string | null
  } | null
}

export interface SobaJoinLinkovi {
  trijaza: string
  zapisnik: string
  posmatrac: string
}

/** Pusher event payload tipovi */
export interface StudentPristupioPayload {
  sobaId: string
  uloga: VapiSimulacijaUloga
  ucenikId: number
  ucenikIme: string
  online: boolean
}

export interface UpdateStatePayload {
  sobaId: string
  vitalniParametri: VitalniParametri
  trenutnoStanje: string
  istorijaBolesti?: string | null
  hitanAlarm?: boolean
  poruka?: string | null
}

export interface HitanAlarmPayload {
  sobaId: string
  poruka: string
  vitalniParametri?: VitalniParametri
  trenutnoStanje?: string
}

export const ULOGA_LABELI: Record<VapiSimulacijaUloga, string> = {
  trijaza: 'Trijaža',
  zapisnik: 'Zapisnik',
  posmatrac: 'Posmatrač',
}

export const DEFAULT_VITALNI: VitalniParametri = {
  puls: 80,
  pritisak: '120/80',
  saturacija: 98,
}

export function presenceChannelName(sobaId: string): string {
  return `presence-soba-${sobaId}`
}
