'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { VapiAssistant, VapiAssistantInsert } from '@/lib/types/vapi'
import {
  getVapiPrivateKey,
  getVapiPublicKeyForCall,
  syncVapiAssistantConfig,
  validateVapiAssistant,
  createVapiWebCall,
  pushAssistantToVapi,
} from '@/lib/vapi/server'

const PENDING_VAPI_ID = 'pending-sync'

const vapiAssistantSchema = z.object({
  assistant_id: z.string().optional().nullable(),
  vapi_api_key: z.string().optional().nullable(),
  vapi_public_key: z.string().optional().nullable(),
  opis_servisa: z.string().optional().nullable(),
  System_Prompt: z.string().optional().nullable(),
  servisid: z.number().optional().nullable(),
})

async function requireAdminAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager')) {
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

  return {
    assistant_id: ((formData.get('assistant_id') as string) || '').trim() || null,
    vapi_api_key: trim(formData.get('vapi_api_key')),
    vapi_public_key: trim(formData.get('vapi_public_key')),
    opis_servisa: trim(formData.get('opis_servisa')),
    System_Prompt: trim(formData.get('System_Prompt')),
    servisid: servisid !== null && !Number.isNaN(servisid) ? servisid : null,
  }
}

async function syncAssistantWithVapi(
  assistant: VapiAssistant,
  privateKey: string
): Promise<string | null> {
  if (assistant.assistant_id === PENDING_VAPI_ID) {
    return 'Asistent još nije povezan sa Vapi platformom.'
  }

  const sync = await syncVapiAssistantConfig({
    vapiAssistantId: assistant.assistant_id,
    privateApiKey: privateKey,
    assistantDbId: assistant.id,
    name: assistant.opis_servisa,
    systemPrompt: assistant.System_Prompt,
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

  const sync = await syncVapiAssistantConfig({
    vapiAssistantId: assistant.assistant_id,
    privateApiKey: privateKey,
    assistantDbId: assistant.id,
    name: assistant.opis_servisa,
    systemPrompt: assistant.System_Prompt,
  })
  if (!sync.ok) {
    console.warn('Vapi webhook sync warning:', sync.error)
  }

  return {
    data: {
      assistantDbId: assistant.id,
      assistantId: assistant.assistant_id,
      publicKey,
      opisServisa: assistant.opis_servisa,
      webhookSynced: sync.ok,
      webhookWarning: sync.ok
        ? null
        : sync.error ||
          'Webhook nije sinhronizovan. Proverite VAPI_WEBHOOK_SECRET u Vercel env.',
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
  if (!privateKey) {
    return {
      data: null,
      error: 'Vapi Private key nije podešen. Dodajte ga u formi ili VAPI_API_KEY u Vercel env.',
      vapiSyncWarning: null,
    }
  }

  const supabase = createAdminClient()
  const vapiIdFromForm = result.data.assistant_id?.trim() || null
  const assistantData: VapiAssistantInsert = {
    ...result.data,
    assistant_id: vapiIdFromForm || PENDING_VAPI_ID,
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

  const push = await pushAssistantToVapi({
    vapiAssistantId: vapiIdFromForm,
    privateApiKey: privateKey,
    assistantDbId: created.id,
    name: created.opis_servisa,
    systemPrompt: created.System_Prompt,
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
    vapiSyncWarning = await syncAssistantWithVapi(created, privateKey)
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
  if (!privateKey) {
    return {
      data: null,
      error: 'Vapi Private key nije podešen. Dodajte ga u formi ili VAPI_API_KEY u Vercel env.',
      vapiSyncWarning: null,
    }
  }

  const supabase = createAdminClient()
  const updatePayload: VapiAssistantInsert = {
    ...result.data,
    assistant_id: result.data.assistant_id?.trim() || PENDING_VAPI_ID,
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

  const vapiId = updated.assistant_id === PENDING_VAPI_ID ? null : updated.assistant_id
  const push = await pushAssistantToVapi({
    vapiAssistantId: vapiId,
    privateApiKey: privateKey,
    assistantDbId: updated.id,
    name: updated.opis_servisa,
    systemPrompt: updated.System_Prompt,
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
