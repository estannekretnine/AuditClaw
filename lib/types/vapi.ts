export interface VapiAssistant {
  id: number
  assistant_id: string
  vapi_api_key: string | null
  vapi_public_key: string | null
  opis_servisa: string | null
  System_Prompt: string | null
}

export interface VapiAssistantInsert {
  assistant_id: string
  vapi_api_key?: string | null
  vapi_public_key?: string | null
  opis_servisa?: string | null
  System_Prompt?: string | null
}

export interface VapiAssistantUpdate extends Partial<VapiAssistantInsert> {}

export interface VapiOdgovor {
  id: number
  dijalog: string
  obrazlozenjeocene_ai: string | null
  ocena_ai: string | null
  assistant_id: number | null
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
}

export interface VapiOdgovorUpdate extends Partial<VapiOdgovorInsert> {}
