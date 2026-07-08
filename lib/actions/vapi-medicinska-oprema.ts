'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  VapiMedicinskaOprema,
  VapiMedicinskaOpremaInsert,
} from '@/lib/types/vapi'

const schema = z.object({
  naziv: z.string().min(1, 'Naziv je obavezan'),
  namena: z.string().optional().nullable(),
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
  const trim = (value: FormDataEntryValue | null) => {
    const text = (value as string) || ''
    return text.trim() || null
  }

  return {
    naziv: ((formData.get('naziv') as string) || '').trim(),
    namena: trim(formData.get('namena')),
  }
}

export async function getVapiMedicinskaOprema(limit: number = 200, offset: number = 0) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error, count: 0 }

  const supabase = createAdminClient()
  const { data, error, count } = await supabase
    .from('vapi_medicinskaoprema')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as VapiMedicinskaOprema[], error: null, count: count || 0 }
}

export async function createVapiMedicinskaOprema(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = schema.safeParse(parseFormData(formData))
  if (!result.success) return { data: null, error: result.error.errors[0].message }

  const supabase = createAdminClient()
  const insertData: VapiMedicinskaOpremaInsert = result.data
  const { data, error } = await supabase
    .from('vapi_medicinskaoprema')
    .insert([insertData])
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/vapi/oprema')
  revalidatePath('/dashboard/vapi/assistants')
  return { data: data as VapiMedicinskaOprema, error: null }
}

export async function updateVapiMedicinskaOprema(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const result = schema.safeParse(parseFormData(formData))
  if (!result.success) return { data: null, error: result.error.errors[0].message }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_medicinskaoprema')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/vapi/oprema')
  revalidatePath('/dashboard/vapi/assistants')
  return { data: data as VapiMedicinskaOprema, error: null }
}

export async function deleteVapiMedicinskaOprema(id: number) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from('vapi_medicinskaoprema').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return { error: 'Ne možete obrisati opremu jer je povezana sa asistentom.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/vapi/oprema')
  revalidatePath('/dashboard/vapi/assistants')
  return { error: null, success: true }
}
