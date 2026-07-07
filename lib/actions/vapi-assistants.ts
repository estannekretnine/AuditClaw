'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { VapiAssistant, VapiAssistantInsert } from '@/lib/types/vapi'
import {
  getVapiPrivateKey,
  getVapiPublicKey,
  syncVapiAssistantWebhook,
  validateVapiAssistant,
} from '@/lib/vapi/server'

const vapiAssistantSchema = z.object({
  assistant_id: z.string().min(1, 'Assistant ID je obavezan'),
  vapi_api_key: z.string().optional().nullable(),
  opis_servisa: z.string().optional().nullable(),
  System_Prompt: z.string().optional().nullable(),
})

async function requireAdminAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager')) {
    return { error: 'Nemate dozvolu za ovu akciju.' }
  }
  return { error: null }
}

function parseAssistantFormData(formData: FormData) {
  return {
    assistant_id: formData.get('assistant_id') as string,
    vapi_api_key: (formData.get('vapi_api_key') as string) || null,
    opis_servisa: (formData.get('opis_servisa') as string) || null,
    System_Prompt: (formData.get('System_Prompt') as string) || null,
  }
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

  const publicKey = getVapiPublicKey()
  if (!publicKey) {
    return {
      data: null,
      error: 'NEXT_PUBLIC_VAPI_PUBLIC_KEY nije konfigurisan. Dodajte Public Key iz Vapi dashboarda u env varijable.',
    }
  }

  const result = await getVapiAssistantById(assistantDbId)
  if (result.error || !result.data) {
    return { data: null, error: result.error || 'Asistent nije pronađen.' }
  }

  const assistant = result.data
  if (!assistant.assistant_id) {
    return { data: null, error: 'Assistant ID nije podešen.' }
  }

  const privateKey = getVapiPrivateKey(assistant.vapi_api_key)
  if (privateKey) {
    const validation = await validateVapiAssistant(assistant.assistant_id, privateKey)
    if (!validation.ok) {
      return { data: null, error: validation.error }
    }

    const sync = await syncVapiAssistantWebhook(
      assistant.assistant_id,
      privateKey,
      assistant.id
    )
    if (!sync.ok) {
      console.warn('Vapi webhook sync warning:', sync.error)
    }
  } else {
    return {
      data: null,
      error: 'vapi_api_key (private key) nije podešen za ovog asistenta. Dodajte ga u formi za izmenu.',
    }
  }

  return {
    data: {
      assistantDbId: assistant.id,
      assistantId: assistant.assistant_id,
      publicKey,
      systemPrompt: assistant.System_Prompt,
      opisServisa: assistant.opis_servisa,
    },
    error: null,
  }
}

export async function createVapiAssistant(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseAssistantFormData(formData)
  const result = vapiAssistantSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const assistantData: VapiAssistantInsert = result.data

  const { data, error } = await supabase
    .from('vapi_assistants')
    .insert([assistantData])
    .select()
    .single()

  if (error) {
    console.error('Error creating vapi assistant:', error)
    return { data: null, error: error.message }
  }

  const created = data as VapiAssistant
  const privateKey = getVapiPrivateKey(created.vapi_api_key)
  if (privateKey && created.assistant_id) {
    const sync = await syncVapiAssistantWebhook(
      created.assistant_id,
      privateKey,
      created.id
    )
    if (!sync.ok) {
      console.warn('Vapi webhook sync after create:', sync.error)
    }
  }

  revalidatePath('/dashboard/vapi/assistants')
  return { data: data as VapiAssistant, error: null }
}

export async function updateVapiAssistant(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseAssistantFormData(formData)
  const result = vapiAssistantSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_assistants')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vapi assistant:', error)
    return { data: null, error: error.message }
  }

  const updated = data as VapiAssistant
  const privateKey = getVapiPrivateKey(updated.vapi_api_key)
  if (privateKey && updated.assistant_id) {
    const sync = await syncVapiAssistantWebhook(
      updated.assistant_id,
      privateKey,
      updated.id
    )
    if (!sync.ok) {
      console.warn('Vapi webhook sync after update:', sync.error)
    }
  }

  revalidatePath('/dashboard/vapi/assistants')
  revalidatePath('/dashboard/vapi/odgovor')
  return { data: data as VapiAssistant, error: null }
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
