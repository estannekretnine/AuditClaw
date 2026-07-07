'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { VapiUcenik, VapiUcenikInsert } from '@/lib/types/vapi'

const vapiUcenikSchema = z.object({
  ime: z.string().min(1, 'Ime je obavezno'),
  prezime: z.string().optional().nullable(),
  razred: z.string().optional().nullable(),
  razrednistaresina: z.string().optional().nullable(),
  napoemna: z.string().optional().nullable(),
})

async function requireAdminAccess() {
  const user = await getCurrentUser()
  if (!user || (user.stsstatus !== 'admin' && user.stsstatus !== 'manager')) {
    return { error: 'Nemate dozvolu za ovu akciju.' }
  }
  return { error: null }
}

function parseUcenikFormData(formData: FormData) {
  const trim = (value: FormDataEntryValue | null) => {
    const text = (value as string) || ''
    return text.trim() || null
  }

  return {
    ime: ((formData.get('ime') as string) || '').trim(),
    prezime: trim(formData.get('prezime')),
    razred: trim(formData.get('razred')),
    razrednistaresina: trim(formData.get('razrednistaresina')),
    napoemna: trim(formData.get('napoemna')),
  }
}

export async function getVapiUcenici(limit: number = 200, offset: number = 0) {
  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('vapi_ucenik')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching vapi ucenici:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as VapiUcenik[], error: null, count: count || 0 }
}

export async function createVapiUcenik(formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseUcenikFormData(formData)
  const result = vapiUcenikSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const ucenikData: VapiUcenikInsert = result.data

  const { data, error } = await supabase
    .from('vapi_ucenik')
    .insert([ucenikData])
    .select()
    .single()

  if (error) {
    console.error('Error creating vapi ucenik:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/ucenik')
  return { data: data as VapiUcenik, error: null }
}

export async function updateVapiUcenik(id: number, formData: FormData) {
  const access = await requireAdminAccess()
  if (access.error) return { data: null, error: access.error }

  const rawData = parseUcenikFormData(formData)
  const result = vapiUcenikSchema.safeParse(rawData)
  if (!result.success) {
    return { data: null, error: result.error.errors[0].message }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vapi_ucenik')
    .update(result.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vapi ucenik:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/vapi/ucenik')
  return { data: data as VapiUcenik, error: null }
}

export async function deleteVapiUcenik(id: number) {
  const access = await requireAdminAccess()
  if (access.error) return { error: access.error }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('vapi_ucenik')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vapi ucenik:', error)
    if (error.code === '23503') {
      return { error: 'Ne možete obrisati učenika jer postoje povezani odgovori.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/vapi/ucenik')
  return { error: null, success: true }
}
