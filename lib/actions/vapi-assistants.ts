'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type {
  VapiAssistant,
  VapiAssistantInsert,
  VapiMedicinskaOprema,
  VapiSystemPrompt,
} from '@/lib/types/vapi'
import {
  getVapiPrivateKey,
  getVapiPublicKeyForCall,
  syncVapiAssistantConfig,
  validateVapiAssistant,
  createVapiWebCall,
  pushAssistantToVapi,
} from '@/lib/vapi/server'
import { getSimliIceServers, getSimliSessionToken } from '@/lib/simli/server'

const PENDING_VAPI_ID = 'pending-sync'

const vapiAssistantSchema = z.object({
  assistant_id: z.string().optional().nullable(),
  vapi_api_key: z.string().optional().nullable(),
  vapi_public_key: z.string().optional().nullable(),
  opis_servisa: z.string().optional().nullable(),
  System_Prompt: z.string().optional().nullable(),
  servisid: z.number().optional().nullable(),
  ima_video_pacijenta: z.boolean().optional(),
  simli_face_id: z.string().optional().nullable(),
  simli_api_key: z.string().optional().nullable(),
  simli_model: z.enum(['fasttalk', 'artalk']).optional(),
  simli_max_session_length: z.number().int().min(60).max(3600).optional(),
  simli_max_idle_time: z.number().int().min(30).max(3600).optional(),
  vitalni_znaci_default: z.record(z.string(), z.union([z.string(), z.number()])).optional().nullable(),
  medoprema_ids: z.array(z.number()).optional(),
  selected_system_prompt_id: z.number().optional().nullable(),
})

const defaultVitalniZnaci = {
  pritisak: '120/80',
  puls: 78,
  temperatura: 36.6,
  saturacija: 98,
  secer: 5.4,
}

async function requireAdminAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager')) {
    return { error: 'Nemate dozvolu za ovu akciju.' }
  }
  return { error: null }
}

async function requireReadAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager' && user.stsstatus !== 'vapi')) {
    return { error: 'Nemate dozvolu za ovu akciju.' }
  }
  return { error: null }
}

function parseAssistantFormData(formData: FormData) {
  const trim = (value: FormDataEntryValue | null) => {
    const text = (value as string) || ''
    return text.trim() || null
  }

  const servisidRaw = (formData.get('servisid') as string) || ''
  const servisid = servisidRaw.trim() ? Number(servisidRaw) : null
  const imaVideoPacijenta = formData.get('ima_video_pacijenta') === 'true'
  const simliModelRaw = ((formData.get('simli_model') as string) || '').trim().toLowerCase()
  const simliSessionRaw = ((formData.get('simli_max_session_length') as string) || '').trim()
  const simliIdleRaw = ((formData.get('simli_max_idle_time') as string) || '').trim()
  const vitalniRaw = ((formData.get('vitalni_znaci_default') as string) || '').trim()
  const medopremaRaw = ((formData.get('medoprema_ids') as string) || '').trim()
  const selectedSystemPromptRaw = ((formData.get('selected_system_prompt_id') as string) || '').trim()
  let parsedVitalni: Record<string, string | number> | null = null
  let parsedMedOpremaIds: number[] = []
  if (vitalniRaw) {
    try {
      const parsed = JSON.parse(vitalniRaw) as Record<string, unknown>
      parsedVitalni = Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === 'string' || typeof value === 'number')
      ) as Record<string, string | number>
    } catch {
      parsedVitalni = null
    }
  }

  if (medopremaRaw) {
    try {
      const parsed = JSON.parse(medopremaRaw) as unknown
      if (Array.isArray(parsed)) {
        parsedMedOpremaIds = parsed
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item > 0)
      }
    } catch {
      parsedMedOpremaIds = []
    }
  }

  const selectedSystemPromptId = selectedSystemPromptRaw ? Number(selectedSystemPromptRaw) : null

  return {
    assistant_id: ((formData.get('assistant_id') as string) || '').trim() || null,
    vapi_api_key: trim(formData.get('vapi_api_key')),
    vapi_public_key: trim(formData.get('vapi_public_key')),
    opis_servisa: trim(formData.get('opis_servisa')),
    System_Prompt: trim(formData.get('System_Prompt')),
    servisid: servisid !== null && !Number.isNaN(servisid) ? servisid : null,
    ima_video_pacijenta: imaVideoPacijenta,
    simli_face_id: trim(formData.get('simli_face_id')),
    simli_api_key: trim(formData.get('simli_api_key')),
    simli_model: simliModelRaw === 'artalk' ? 'artalk' : 'fasttalk',
    simli_max_session_length: simliSessionRaw ? Number(simliSessionRaw) : 600,
    simli_max_idle_time: simliIdleRaw ? Number(simliIdleRaw) : 600,
    vitalni_znaci_default: parsedVitalni,
    medoprema_ids: parsedMedOpremaIds,
    selected_system_prompt_id:
      selectedSystemPromptId !== null && !Number.isNaN(selectedSystemPromptId)
        ? selectedSystemPromptId
        : null,
  }
}

async function listMedicinskaOpremaByAssistant(
  assistantId: number
): Promise<VapiMedicinskaOprema[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_assistanmedoprema')
    .select('vapi_medicinskaoprema(id, naziv, namena)')
    .eq('assistantid', assistantId)

  if (error || !data) return []

  const items: VapiMedicinskaOprema[] = []
  for (const row of data as Array<{ vapi_medicinskaoprema: unknown }>) {
    const linked = row.vapi_medicinskaoprema
    if (!linked) continue
    if (Array.isArray(linked)) {
      for (const item of linked) {
        if (!item || typeof item !== 'object') continue
        const rec = item as Record<string, unknown>
        if (typeof rec.id === 'number' && typeof rec.naziv === 'string') {
          items.push({ id: rec.id, naziv: rec.naziv, namena: (rec.namena as string | null) ?? null })
        }
      }
      continue
    }
    if (typeof linked === 'object') {
      const rec = linked as Record<string, unknown>
      if (typeof rec.id === 'number' && typeof rec.naziv === 'string') {
        items.push({ id: rec.id, naziv: rec.naziv, namena: (rec.namena as string | null) ?? null })
      }
    }
  }

  const byId = new Map<number, VapiMedicinskaOprema>()
  for (const item of items) byId.set(item.id, item)
  return Array.from(byId.values())
}

async function listSystemPromptsByAssistant(assistantId: number): Promise<VapiSystemPrompt[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_SystemPrompt')
    .select('*')
    .or(`assistantid.eq.${assistantId},assistantid.is.null`)
    .order('id', { ascending: false })

  if (error || !data) return []
  return data as VapiSystemPrompt[]
}

async function syncAssistantEquipmentLinks(assistantId: number, medOpremaIds: number[]) {
  const supabase = createAdminClient()
  const uniqueIds = Array.from(new Set(medOpremaIds.filter((id) => Number.isFinite(id) && id > 0)))

  const { error: deleteError } = await supabase
    .from('vapi_assistanmedoprema')
    .delete()
    .eq('assistantid', assistantId)
  if (deleteError) return deleteError.message

  if (uniqueIds.length === 0) return null

  const rows = uniqueIds.map((medopremaid) => ({ assistantid: assistantId, medopremaid }))
  const { error: insertError } = await supabase.from('vapi_assistanmedoprema').insert(rows)
  return insertError ? insertError.message : null
}

async function syncSystemPromptSelection(
  assistantId: number,
  selectedSystemPromptId: number | null,
  fallbackPrompt: string | null
) {
  const supabase = createAdminClient()

  if (selectedSystemPromptId) {
    const { data } = await supabase
      .from('vapi_SystemPrompt')
      .select('*')
      .eq('id', selectedSystemPromptId)
      .or(`assistantid.eq.${assistantId},assistantid.is.null`)
      .single()

    const selected = data as VapiSystemPrompt | null
    if (selected) {
      return { prompt: selected['SystemPrompt Vapi'], selectedPromptId: selected.id }
    }
  }

  const prompt = fallbackPrompt?.trim() || null
  if (!prompt) return { prompt: null, selectedPromptId: null }

  const { data: existing } = await supabase
    .from('vapi_SystemPrompt')
    .select('*')
    .eq('assistantid', assistantId)
    .eq('SystemPrompt Vapi', prompt)
    .limit(1)

  const existingPrompt = (existing?.[0] as VapiSystemPrompt | undefined) || null
  if (existingPrompt) {
    return { prompt: existingPrompt['SystemPrompt Vapi'], selectedPromptId: existingPrompt.id }
  }

  const { data: inserted } = await supabase
    .from('vapi_SystemPrompt')
    .insert([{ assistantid: assistantId, 'SystemPrompt Vapi': prompt }])
    .select('*')
    .single()

  const insertedPrompt = inserted as VapiSystemPrompt | null
  if (!insertedPrompt) return { prompt, selectedPromptId: null }
  return { prompt: insertedPrompt['SystemPrompt Vapi'], selectedPromptId: insertedPrompt.id }
}

async function syncAssistantWithVapi(
  assistant: VapiAssistant,
  privateKey: string,
  systemPrompt: string | null = assistant.System_Prompt
): Promise<string | null> {
  if (assistant.assistant_id === PENDING_VAPI_ID) {
    return 'Asistent još nije povezan sa Vapi platformom.'
  }

  const sync = await syncVapiAssistantConfig({
    vapiAssistantId: assistant.assistant_id,
    privateApiKey: privateKey,
    assistantDbId: assistant.id,
    name: assistant.opis_servisa,
    systemPrompt,
    enableVitalniZnaciTool: assistant.ima_video_pacijenta,
  })

  if (!sync.ok) {
    return sync.error || 'Sinhronizacija sa Vapi platformom nije uspela.'
  }

  return null
}

export async function getVapiAssistants(
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('vapi_assistants')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching vapi assistants:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as VapiAssistant[], error: null, count: count || 0 }
}

export async function getSimliEnvStatus() {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const hasSimliApiKeyInEnv = Boolean(process.env.SIMLI_API_KEY?.trim())
  return { data: { hasSimliApiKeyInEnv }, error: null }
}

export async function getVapiAssistantById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_assistants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vapi assistant:', error)
    return { data: null, error: error.message }
  }

  return { data: data as VapiAssistant, error: null }
}

export async function getAssistantMedOpremaIds(assistantId: number) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_assistanmedoprema')
    .select('medopremaid')
    .eq('assistantid', assistantId)

  if (error) return { data: null, error: error.message }
  const ids = data
    .map((row) => Number(row.medopremaid))
    .filter((id) => Number.isFinite(id) && id > 0)
  return { data: ids, error: null }
}

export async function setAssistantMedOpremaIds(assistantId: number, medOpremaIds: number[]) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const syncError = await syncAssistantEquipmentLinks(assistantId, medOpremaIds)
  if (syncError) return { error: syncError }

  revalidatePath('/dashboard/vapi/assistants')
  return { error: null, success: true }
}

export async function getAssistantSystemPrompts(assistantId: number) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }
  const prompts = await listSystemPromptsByAssistant(assistantId)
  return { data: prompts, error: null }
}

export async function setAssistantActiveSystemPrompt(
  assistantId: number,
  systemPromptId: number | null
) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()
  const assistantResult = await getVapiAssistantById(assistantId)
  if (assistantResult.error || !assistantResult.data) {
    return { error: assistantResult.error || 'Asistent nije pronađen.' }
  }
  const assistant = assistantResult.data

  let selectedText: string | null = null
  if (systemPromptId) {
    const { data, error } = await supabase
      .from('vapi_SystemPrompt')
      .select('*')
      .eq('id', systemPromptId)
      .or(`assistantid.eq.${assistantId},assistantid.is.null`)
      .single()
    if (error || !data) return { error: 'Izabrani SystemPrompt nije pronađen.' }
    selectedText = (data as VapiSystemPrompt)['SystemPrompt Vapi']
  }

  const { error: updateError } = await supabase
    .from('vapi_assistants')
    .update({ System_Prompt: selectedText })
    .eq('id', assistantId)
  if (updateError) return { error: updateError.message }

  const privateKey = getVapiPrivateKey(assistant.vapi_api_key)
  if (privateKey && assistant.assistant_id && assistant.assistant_id !== PENDING_VAPI_ID) {
    const syncErr = await syncAssistantWithVapi(
      { ...assistant, System_Prompt: selectedText } as VapiAssistant,
      privateKey,
      selectedText
    )
    if (syncErr) return { error: syncErr }
  }

  revalidatePath('/dashboard/vapi/assistants')
  return { error: null, success: true }
}

export async function getVapiStartConfig(assistantDbId: number) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = await getVapiAssistantById(assistantDbId)
  if (result.error || !result.data) {
    return { data: null, error: result.error || 'Asistent nije pronađen.' }
  }

  const assistant = result.data
  if (!assistant.assistant_id || assistant.assistant_id === PENDING_VAPI_ID) {
    return { data: null, error: 'Asistent još nije povezan sa Vapi platformom. Sačuvajte ga ponovo iz forme.' }
  }

  const privateKey = getVapiPrivateKey(assistant.vapi_api_key)
  if (!privateKey) {
    return {
      data: null,
      error: 'Vapi Private key nije podešen. Dodajte ga u formi ili VAPI_API_KEY u Vercel env.',
    }
  }

  const validation = await validateVapiAssistant(assistant.assistant_id, privateKey)
  if (!validation.ok) {
    return { data: null, error: validation.error }
  }

  const publicKey = getVapiPublicKeyForCall(assistant.vapi_public_key)
  if (!publicKey) {
    return {
      data: null,
      error:
        'Vapi Public key nije podešen. Dodajte ga u formi ili NEXT_PUBLIC_VAPI_PUBLIC_KEY u Vercel env.',
    }
  }

  const linkedOprema = await listMedicinskaOpremaByAssistant(assistant.id)
  const systemPrompts = await listSystemPromptsByAssistant(assistant.id)
  const selectedPrompt =
    systemPrompts.find((prompt) => prompt['SystemPrompt Vapi'] === (assistant.System_Prompt || '')) ||
    null

  // Pri pokretanju poziva sinhronizujemo webhook i literalni System_Prompt
  // iz baze na Vapi asistenta. Za jednog asistenta je isti prompt svaki put
  // (idempotentno), pa nema problema sa istovremenim pozivima.
  const sync = await syncVapiAssistantConfig({
    vapiAssistantId: assistant.assistant_id,
    privateApiKey: privateKey,
    assistantDbId: assistant.id,
    name: assistant.opis_servisa,
    systemPrompt: assistant.System_Prompt,
    enableVitalniZnaciTool: assistant.ima_video_pacijenta,
  })
  if (!sync.ok) {
    console.warn('Vapi sync warning:', sync.error)
  }

  let simliSessionToken: string | null = null
  let simliIceServers: RTCIceServer[] = []
  if (assistant.ima_video_pacijenta) {
    if (!assistant.simli_face_id?.trim()) {
      return { data: null, error: 'Video pacijent je uključen, ali Simli face ID nije podešen.' }
    }
    try {
      simliSessionToken = await getSimliSessionToken(assistant.simli_face_id, {
        apiKey: assistant.simli_api_key,
        model: assistant.simli_model === 'artalk' ? 'artalk' : 'fasttalk',
        maxSessionLength: assistant.simli_max_session_length || 600,
        maxIdleTime: assistant.simli_max_idle_time || 600,
      })
      simliIceServers = await getSimliIceServers(assistant.simli_api_key)
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Neuspelo generisanje Simli tokena za video pacijenta.',
      }
    }
  }

  return {
    data: {
      assistantDbId: assistant.id,
      assistantId: assistant.assistant_id,
      publicKey,
      opisServisa: assistant.opis_servisa,
      imaVideoPacijenta: assistant.ima_video_pacijenta,
      simliFaceId: assistant.simli_face_id,
      simliModel: assistant.simli_model || 'fasttalk',
      simliMaxSessionLength: assistant.simli_max_session_length || 600,
      simliMaxIdleTime: assistant.simli_max_idle_time || 600,
      vitalniZnaciDefault:
        (assistant.vitalni_znaci_default as Record<string, string | number> | null) || defaultVitalniZnaci,
      simliSessionToken,
      simliIceServers,
      webhookSynced: sync.ok,
      webhookWarning: sync.ok
        ? null
        : sync.error ||
          'Webhook nije sinhronizovan. Proverite VAPI_WEBHOOK_SECRET u Vercel env.',
      medicinskaOprema: linkedOprema,
      systemPrompts,
      selectedSystemPromptId: selectedPrompt?.id ?? null,
    },
    error: null,
  }
}

export async function startVapiWebCall(assistantDbId: number) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = await getVapiAssistantById(assistantDbId)
  if (result.error || !result.data) {
    return { data: null, error: result.error || 'Asistent nije pronađen.' }
  }

  const assistant = result.data
  if (!assistant.assistant_id) {
    return { data: null, error: 'Assistant ID nije podešen.' }
  }

  const privateKey = getVapiPrivateKey(assistant.vapi_api_key)
  if (!privateKey) {
    return {
      data: null,
      error: 'vapi_api_key (private key) nije podešen za ovog asistenta.',
    }
  }

  const publicKey = getVapiPublicKeyForCall(assistant.vapi_public_key)
  if (!publicKey) {
    return {
      data: null,
      error:
        'Vapi Public key nije podešen. Dodajte Public key u formi asistenta (Vapi Dashboard → API Keys → Public).',
    }
  }

  const webCall = await createVapiWebCall(
    assistant.assistant_id,
    publicKey,
    assistant.id
  )

  if (!webCall.ok || !webCall.data) {
    return { data: null, error: webCall.error || 'Neuspelo pokretanje poziva.' }
  }

  return { data: webCall.data, error: null }
}

export async function createVapiAssistant(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error, vapiSyncWarning: null }

  const rawData = parseAssistantFormData(formData)
  const result = vapiAssistantSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message, vapiSyncWarning: null }
  }

  const privateKey = getVapiPrivateKey(result.data.vapi_api_key)
  const {
    medoprema_ids: _medopremaIds,
    selected_system_prompt_id: _selectedSystemPromptId,
    ...assistantInput
  } = result.data

  const supabase = createAdminClient()
  const vapiIdFromForm = assistantInput.assistant_id?.trim() || null
  const assistantData: VapiAssistantInsert = {
    ...assistantInput,
    assistant_id: vapiIdFromForm || PENDING_VAPI_ID,
    simli_face_id: assistantInput.ima_video_pacijenta ? assistantInput.simli_face_id : null,
    simli_api_key: assistantInput.ima_video_pacijenta ? assistantInput.simli_api_key : null,
    simli_model: assistantInput.ima_video_pacijenta ? assistantInput.simli_model || 'fasttalk' : 'fasttalk',
    simli_max_session_length: assistantInput.ima_video_pacijenta ? assistantInput.simli_max_session_length || 600 : 600,
    simli_max_idle_time: assistantInput.ima_video_pacijenta ? assistantInput.simli_max_idle_time || 600 : 600,
    vitalni_znaci_default: assistantInput.ima_video_pacijenta
      ? (assistantInput.vitalni_znaci_default ?? defaultVitalniZnaci)
      : null,
  }

  const { data, error } = await supabase
    .from('vapi_assistants')
    .insert([assistantData])
    .select()
    .single()

  if (error) {
    console.error('Error creating vapi assistant:', error)
    return { data: null, error: error.message, vapiSyncWarning: null }
  }

  const created = data as VapiAssistant
  let vapiSyncWarning: string | null = null

  const promptSync = await syncSystemPromptSelection(
    created.id,
    result.data.selected_system_prompt_id ?? null,
    result.data.System_Prompt ?? null
  )

  // Oprema se povezuje isključivo preko dugmeta „Oprema“ (setAssistantMedOpremaIds),
  // da izmena asistenta ne obriše postojeće veze.

  if (promptSync.prompt !== created.System_Prompt) {
    const { error: updatePromptError } = await supabase
      .from('vapi_assistants')
      .update({ System_Prompt: promptSync.prompt })
      .eq('id', created.id)
    if (!updatePromptError) {
      created.System_Prompt = promptSync.prompt
    }
  }

  // Sinhronizacija sa Vapi platformom je opciona — asistent je već sačuvan u bazi.
  if (!privateKey) {
    vapiSyncWarning =
      'Asistent je sačuvan, ali nije sinhronizovan sa Vapi platformom jer Private key nije podešen (dodajte VAPI_API_KEY u Vercel env ili ključ u formi → Napredno).'
  } else {
    const push = await pushAssistantToVapi({
      vapiAssistantId: vapiIdFromForm,
      privateApiKey: privateKey,
      assistantDbId: created.id,
      name: created.opis_servisa,
      systemPrompt: created.System_Prompt,
      enableVitalniZnaciTool: created.ima_video_pacijenta,
    })

    if (!push.ok) {
      vapiSyncWarning = push.error || 'Sinhronizacija sa Vapi platformom nije uspela.'
    } else if (!vapiIdFromForm && push.assistantId) {
      const { error: updateError } = await supabase
        .from('vapi_assistants')
        .update({ assistant_id: push.assistantId })
        .eq('id', created.id)

      if (updateError) {
        vapiSyncWarning = `Asistent je kreiran na Vapi (${push.assistantId}), ali ID nije sačuvan u bazi.`
      } else {
        created.assistant_id = push.assistantId
      }
    } else if (vapiIdFromForm) {
      vapiSyncWarning = await syncAssistantWithVapi(created, privateKey, created.System_Prompt)
    }
  }

  revalidatePath('/dashboard/vapi/assistants')
  return { data: created, error: null, vapiSyncWarning }
}

export async function updateVapiAssistant(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error, vapiSyncWarning: null }

  const rawData = parseAssistantFormData(formData)
  const result = vapiAssistantSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message, vapiSyncWarning: null }
  }

  const privateKey = getVapiPrivateKey(result.data.vapi_api_key)
  const {
    medoprema_ids: _medopremaIds,
    selected_system_prompt_id: _selectedSystemPromptId,
    ...assistantInput
  } = result.data

  const supabase = createAdminClient()
  const updatePayload: VapiAssistantInsert = {
    ...assistantInput,
    assistant_id: assistantInput.assistant_id?.trim() || PENDING_VAPI_ID,
    simli_face_id: assistantInput.ima_video_pacijenta ? assistantInput.simli_face_id : null,
    simli_api_key: assistantInput.ima_video_pacijenta ? assistantInput.simli_api_key : null,
    simli_model: assistantInput.ima_video_pacijenta ? assistantInput.simli_model || 'fasttalk' : 'fasttalk',
    simli_max_session_length: assistantInput.ima_video_pacijenta ? assistantInput.simli_max_session_length || 600 : 600,
    simli_max_idle_time: assistantInput.ima_video_pacijenta ? assistantInput.simli_max_idle_time || 600 : 600,
    vitalni_znaci_default: assistantInput.ima_video_pacijenta
      ? (assistantInput.vitalni_znaci_default ?? defaultVitalniZnaci)
      : null,
  }

  const { data, error } = await supabase
    .from('vapi_assistants')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vapi assistant:', error)
    return { data: null, error: error.message, vapiSyncWarning: null }
  }

  const updated = data as VapiAssistant
  let vapiSyncWarning: string | null = null

  const promptSync = await syncSystemPromptSelection(
    updated.id,
    result.data.selected_system_prompt_id ?? null,
    result.data.System_Prompt ?? null
  )

  // Oprema se povezuje isključivo preko dugmeta „Oprema“ (setAssistantMedOpremaIds),
  // da izmena asistenta ne obriše postojeće veze.

  if (promptSync.prompt !== updated.System_Prompt) {
    const { error: updatePromptError } = await supabase
      .from('vapi_assistants')
      .update({ System_Prompt: promptSync.prompt })
      .eq('id', updated.id)
    if (!updatePromptError) {
      updated.System_Prompt = promptSync.prompt
    }
  }

  // Sinhronizacija sa Vapi platformom je opciona — izmene su već sačuvane u bazi.
  if (!privateKey) {
    vapiSyncWarning =
      'Izmene su sačuvane, ali nisu sinhronizovane sa Vapi platformom jer Private key nije podešen (dodajte VAPI_API_KEY u Vercel env ili ključ u formi → Napredno).'
  } else {
    const vapiId = updated.assistant_id === PENDING_VAPI_ID ? null : updated.assistant_id
    const push = await pushAssistantToVapi({
      vapiAssistantId: vapiId,
      privateApiKey: privateKey,
      assistantDbId: updated.id,
      name: updated.opis_servisa,
      systemPrompt: updated.System_Prompt,
      enableVitalniZnaciTool: updated.ima_video_pacijenta,
    })

    if (!push.ok) {
      vapiSyncWarning = push.error || 'Sinhronizacija sa Vapi platformom nije uspela.'
    } else if (!vapiId && push.assistantId) {
      const { error: updateError } = await supabase
        .from('vapi_assistants')
        .update({ assistant_id: push.assistantId })
        .eq('id', updated.id)

      if (updateError) {
        vapiSyncWarning = `Asistent je sinhronizovan na Vapi (${push.assistantId}), ali ID nije sačuvan u bazi.`
      } else {
        updated.assistant_id = push.assistantId
      }
    }
  }

  revalidatePath('/dashboard/vapi/assistants')
  revalidatePath('/dashboard/vapi/odgovor')
  return { data: updated, error: null, vapiSyncWarning }
}

export async function deleteVapiAssistant(id: number) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('vapi_assistants')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vapi assistant:', error)
    if (error.code === '23503') {
      return { error: 'Ne možete obrisati asistenta jer postoje povezani odgovori.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/vapi/assistants')
  revalidatePath('/dashboard/vapi/odgovor')
  return { error: null, success: true }
}
