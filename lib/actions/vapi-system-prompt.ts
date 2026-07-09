'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VapiSystemPrompt, VapiSystemPromptInsert } from '@/lib/types/vapi'

const schema = z.object({
  assistantid: z.number().optional().nullable(),
  SystemPromptVapi: z.string().min(1, 'SystemPrompt je obavezan'),
})

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

function parseFormData(formData: FormData) {
  const prompt = ((formData.get('SystemPromptVapi') as string) || '').trim()
  const assistantRaw = ((formData.get('assistantid') as string) || '').trim()
  const assistantid = assistantRaw ? Number(assistantRaw) : null

  return {
    assistantid: assistantid !== null && !Number.isNaN(assistantid) ? assistantid : null,
    SystemPromptVapi: prompt,
  }
}

export async function getVapiSystemPromptByAssistant(assistantid: number) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_SystemPrompt')
    .select('*')
    .eq('assistantid', assistantid)
    .order('id', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as VapiSystemPrompt[], error: null }
}

export async function createVapiSystemPrompt(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = schema.safeParse(parseFormData(formData))
  if (!result.success) return { data: null, error: result.error.errors[0].message }

  const supabase = createAdminClient()
  const insertData: VapiSystemPromptInsert = {
    assistantid: result.data.assistantid,
    'SystemPrompt Vapi': result.data.SystemPromptVapi,
  }

  const { data, error } = await supabase
    .from('vapi_SystemPrompt')
    .insert([insertData])
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/vapi/assistants')
  return { data: data as VapiSystemPrompt, error: null }
}

export async function updateVapiSystemPrompt(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = schema.safeParse(parseFormData(formData))
  if (!result.success) return { data: null, error: result.error.errors[0].message }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_SystemPrompt')
    .update({
      assistantid: result.data.assistantid,
      'SystemPrompt Vapi': result.data.SystemPromptVapi,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/vapi/assistants')
  return { data: data as VapiSystemPrompt, error: null }
}

export async function deleteVapiSystemPrompt(id: number) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('vapi_SystemPrompt').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/vapi/assistants')
  return { error: null, success: true }
}
