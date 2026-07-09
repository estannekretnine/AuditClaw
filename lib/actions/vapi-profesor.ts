'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getEffectiveStatus } from '@/lib/role-utils'
import type { Korisnik } from '@/lib/types/database'
import type {
  VapiProfesor,
  VapiProfesorInsert,
  VapiProfesorAssistant,
} from '@/lib/types/vapi'

const vapiProfesorSchema = z.object({
  ime: z.string().min(1, 'Ime je obavezno'),
  prezime: z.string().optional().nullable(),
  email: z.string().email('Neispravan email').optional().nullable().or(z.literal('').transform(() => null)),
  pasword: z.string().optional().nullable(),
  stsaktivan: z.boolean().optional().nullable(),
  predmet: z.string().optional().nullable(),
})

async function requireReadAccess() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Nemate dozvolu za ovu akciju.', user: null as Korisnik | null }
  }

  const effectiveStatus = getEffectiveStatus(user.stsstatus, user.adresa)
  if (effectiveStatus !== 'admin' && effectiveStatus !== 'manager' && effectiveStatus !== 'vapi') {
    return { error: 'Nemate dozvolu za ovu akciju.', user: null as Korisnik | null }
  }

  return { error: null, user: { ...user, stsstatus: effectiveStatus } }
}

function parseProfesorFormData(formData: FormData) {
  const trim = (value: FormDataEntryValue | null) => {
    const text = (value as string) || ''
    return text.trim() || null
  }

  return {
    ime: ((formData.get('ime') as string) || '').trim(),
    prezime: trim(formData.get('prezime')),
    email: trim(formData.get('email')),
    pasword: trim(formData.get('pasword')),
    stsaktivan: formData.get('stsaktivan') === 'true',
    predmet: trim(formData.get('predmet')),
  }
}

export async function getVapiProfesori(limit: number = 100, offset: number = 0) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error, count: 0 }

  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('vapi_profesor')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching vapi profesori:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as VapiProfesor[], error: null, count: count || 0 }
}

export async function getVapiProfesorById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_profesor')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vapi profesor:', error)
    return { data: null, error: error.message }
  }

  return { data: data as VapiProfesor, error: null }
}

export async function createVapiProfesor(formData: FormData) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseProfesorFormData(formData)
  const result = vapiProfesorSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const profesorData: VapiProfesorInsert = result.data

  const { data, error } = await supabase
    .from('vapi_profesor')
    .insert([profesorData])
    .select()
    .single()

  if (error) {
    console.error('Error creating vapi profesor:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/profesori')
  return { data: data as VapiProfesor, error: null }
}

export async function updateVapiProfesor(id: number, formData: FormData) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseProfesorFormData(formData)
  const result = vapiProfesorSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_profesor')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vapi profesor:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/profesori')
  return { data: data as VapiProfesor, error: null }
}

export async function deleteVapiProfesor(id: number) {
  const access = await requireReadAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()

  // Prvo obriši povezane servise (profesorassistant), pa profesora
  const { error: relError } = await supabase
    .from('vapi_profesorassistant')
    .delete()
    .eq('profesorid', id)

  if (relError) {
    console.error('Error deleting profesor servisi:', relError)
    return { error: relError.message }
  }

  const { error } = await supabase
    .from('vapi_profesor')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vapi profesor:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vapi/profesori')
  return { error: null, success: true }
}

export async function getProfesorAssistants(profesorId: number) {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_profesorassistant')
    .select('*')
    .eq('profesorid', profesorId)

  if (error) {
    console.error('Error fetching profesor servisi:', error)
    return { data: null, error: error.message }
  }

  return { data: data as VapiProfesorAssistant[], error: null }
}

export async function setProfesorAssistants(
  profesorId: number,
  assistantIds: number[]
) {
  const access = await requireReadAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('vapi_profesorassistant')
    .select('*')
    .eq('profesorid', profesorId)

  if (fetchError) {
    console.error('Error fetching existing profesor servisi:', fetchError)
    return { error: fetchError.message }
  }

  const existingRows = (existing as VapiProfesorAssistant[]) || []
  const existingIds = existingRows
    .map((row) => row.assistantid)
    .filter((val): val is number => val !== null)

  const selected = new Set(assistantIds)
  const current = new Set(existingIds)

  const toAdd = assistantIds.filter((id) => !current.has(id))
  const toRemoveRows = existingRows.filter(
    (row) => row.assistantid !== null && !selected.has(row.assistantid)
  )

  if (toRemoveRows.length > 0) {
    const removeIds = toRemoveRows.map((row) => row.id)
    const { error: deleteError } = await supabase
      .from('vapi_profesorassistant')
      .delete()
      .in('id', removeIds)

    if (deleteError) {
      console.error('Error removing profesor servisi:', deleteError)
      return { error: deleteError.message }
    }
  }

  if (toAdd.length > 0) {
    const insertRows = toAdd.map((assistantid) => ({
      profesorid: profesorId,
      assistantid,
    }))
    const { error: insertError } = await supabase
      .from('vapi_profesorassistant')
      .insert(insertRows)

    if (insertError) {
      console.error('Error adding profesor servisi:', insertError)
      return { error: insertError.message }
    }
  }

  revalidatePath('/dashboard/vapi/profesori')
  return { error: null, success: true }
}
