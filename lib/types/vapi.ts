export interface VapiAssistant {
  id: number
  assistant_id: string
  vapi_api_key: string | null
  vapi_public_key: string | null
  opis_servisa: string | null
  System_Prompt: string | null
  servisid: number | null
  ima_video_pacijenta: boolean
  simli_face_id: string | null
  simli_api_key: string | null
  simli_model: string
  simli_max_session_length: number
  simli_max_idle_time: number
  vitalni_znaci_default: Record<string, unknown> | null
}

export interface VapiAssistantInsert {
  assistant_id: string
  vapi_api_key?: string | null
  vapi_public_key?: string | null
  opis_servisa?: string | null
  System_Prompt?: string | null
  servisid?: number | null
  ima_video_pacijenta?: boolean
  simli_face_id?: string | null
  simli_api_key?: string | null
  simli_model?: string
  simli_max_session_length?: number
  simli_max_idle_time?: number
  vitalni_znaci_default?: Record<string, unknown> | null
}

export interface VapiAssistantUpdate extends Partial<VapiAssistantInsert> {}

export interface VapiMedicinskaOprema {
  id: number
  naziv: string
  namena: string | null
}

export interface VapiMedicinskaOpremaInsert {
  naziv: string
  namena?: string | null
}

export interface VapiMedicinskaOpremaUpdate extends Partial<VapiMedicinskaOpremaInsert> {}

export interface VapiAssistantMedOprema {
  id: number
  assistantid: number
  medopremaid: number | null
}

export interface VapiSystemPrompt {
  id: number
  'SystemPrompt Vapi': string
  assistantid: number | null
}

export interface VapiSystemPromptInsert {
  'SystemPrompt Vapi': string
  assistantid?: number | null
}

export interface VapiSystemPromptUpdate extends Partial<VapiSystemPromptInsert> {}

export interface VapiOdgovor {
  id: number
  dijalog: string
  obrazlozenjeocene_ai: string | null
  ocena_ai: string | null
  assistant_id: number | null
  datumvreme: string | null
  ucenikid: number | null
  vapi_assistants?: {
    assistant_id: string
    opis_servisa: string | null
  } | null
  vapi_ucenik?: {
    ime: string
    prezime: string | null
    razred: string | null
  } | null
}

export interface VapiOdgovorInsert {
  dijalog: string
  obrazlozenjeocene_ai?: string | null
  ocena_ai?: string | null
  assistant_id?: number | null
  datumvreme?: string | null
  ucenikid?: number | null
}

export interface VapiOdgovorUpdate extends Partial<VapiOdgovorInsert> {}

export interface VapiProfesor {
  id: number
  ime: string
  prezime: string | null
  email: string | null
  pasword: string | null
  stsaktivan: boolean | null
}

export interface VapiProfesorInsert {
  ime: string
  prezime?: string | null
  email?: string | null
  pasword?: string | null
  stsaktivan?: boolean | null
}

export interface VapiProfesorUpdate extends Partial<VapiProfesorInsert> {}

export interface VapiProfesorAssistant {
  id: number
  profesorid: number
  assistantid: number | null
}

export interface VapiUcenik {
  id: number
  ime: string
  prezime: string | null
  razred: string | null
  razrednistaresina: string | null
  napoemna: string | null
}

export interface VapiUcenikInsert {
  ime: string
  prezime?: string | null
  razred?: string | null
  razrednistaresina?: string | null
  napoemna?: string | null
}

export interface VapiUserLog {
  id: number
  korisnikid: number | null
  naziv: string | null
  email: string | null
  event_type: string
  route: string | null
  details: string | null
  created_at: string | null
}
