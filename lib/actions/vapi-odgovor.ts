'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { VapiOdgovor, VapiOdgovorInsert } from '@/lib/types/vapi'

const vapiOdgovorSchema = z.object({
  dijalog: z.string().min(1, 'Dijalog je obavezan'),
  obrazlozenjeocene_ai: z.string().optional().nullable(),
  ocena_ai: z.string().optional().nullable(),
  ocena_profesor: z.string().optional().nullable(),
  komentar_profesor: z.string().optional().nullable(),
  profesorid: z.number().optional().nullable(),
  assistant_id: z.number().optional().nullable(),
  ucenikid: z.number().optional().nullable(),
})

const ODGOVOR_SELECT =
  '*, vapi_assistants(assistant_id, opis_servisa), vapi_ucenik(ime, prezime, razred), vapi_profesor(ime, prezime)'

async function requireAdminAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager')) {
    return { error: 'Nemate dozvolu za ovu akciju.' }
  }
  return { error: null }
}

function parseOdgovorFormData(formData: FormData) {
  const assistantIdRaw = formData.get('assistant_id') as string
  const ucenikIdRaw = formData.get('ucenikid') as string
  const profesorIdRaw = formData.get('profesorid') as string
  return {
    dijalog: formData.get('dijalog') as string,
    obrazlozenjeocene_ai: (formData.get('obrazlozenjeocene_ai') as string) || null,
    ocena_ai: (formData.get('ocena_ai') as string) || null,
    ocena_profesor: (formData.get('ocena_profesor') as string) || null,
    komentar_profesor: (formData.get('komentar_profesor') as string) || null,
    profesorid: profesorIdRaw && profesorIdRaw !== '' ? Number(profesorIdRaw) : null,
    assistant_id: assistantIdRaw && assistantIdRaw !== '' ? Number(assistantIdRaw) : null,
    ucenikid: ucenikIdRaw && ucenikIdRaw !== '' ? Number(ucenikIdRaw) : null,
  }
}

export async function getVapiOdgovori(
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('vapi_odgovor')
    .select(ODGOVOR_SELECT, { count: 'exact' })
    .order('datumvreme', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching vapi odgovori:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as VapiOdgovor[], error: null, count: count || 0 }
}

export async function getVapiOdgovorById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_odgovor')
    .select(ODGOVOR_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vapi odgovor:', error)
    return { data: null, error: error.message }
  }

  return { data: data as VapiOdgovor, error: null }
}

export async function createVapiOdgovor(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseOdgovorFormData(formData)
  const result = vapiOdgovorSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const odgovorData: VapiOdgovorInsert = {
    ...result.data,
    datumvreme: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('vapi_odgovor')
    .insert([odgovorData])
    .select(ODGOVOR_SELECT)
    .single()

  if (error) {
    console.error('Error creating vapi odgovor:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/odgovor')
  return { data: data as VapiOdgovor, error: null }
}

export async function updateVapiOdgovor(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseOdgovorFormData(formData)
  const result = vapiOdgovorSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_odgovor')
    .update(result.data)
    .eq('id', id)
    .select(ODGOVOR_SELECT)
    .single()

  if (error) {
    console.error('Error updating vapi odgovor:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/odgovor')
  return { data: data as VapiOdgovor, error: null }
}

export async function deleteVapiOdgovor(id: number) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('vapi_odgovor')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vapi odgovor:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vapi/odgovor')
  return { error: null, success: true }
}
