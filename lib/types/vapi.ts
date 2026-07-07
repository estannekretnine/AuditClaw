export interface VapiAssistant {
  id: number
  assistant_id: string
  vapi_api_key: string | null
  vapi_public_key: string | null
  opis_servisa: string | null
  System_Prompt: string | null
  servisid: number | null
}

export interface VapiAssistantInsert {
  assistant_id: string
  vapi_api_key?: string | null
  vapi_public_key?: string | null
  opis_servisa?: string | null
  System_Prompt?: string | null
  servisid?: number | null
}

export interface VapiAssistantUpdate extends Partial<VapiAssistantInsert> {}

export interface VapiOdgovor {
  id: number
  dijalog: string
  obrazlozenjeocene_ai: string | null
  ocena_ai: string | null
  assistant_id: number | null
  datumvreme: string | null
  vapi_assistants?: {
    assistant_id: string
    opis_servisa: string | null
  } | null
}

export interface VapiOdgovorInsert {
  dijalog: string
  obrazlozenjeocene_ai?: string | null
  ocena_ai?: string | null
  assistant_id?: number | null
  datumvreme?: string | null
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
