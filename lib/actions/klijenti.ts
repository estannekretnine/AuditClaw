'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Klijent, KlijentInsert, KlijentFilterStatus } from '@/lib/types/klijenti'

export async function getKlijenti(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  filterStatus: KlijentFilterStatus = 'active'
) {
  const supabase = createAdminClient()

  let query = supabase
    .from('klijenti')
    .select('*', { count: 'exact' })

  if (filterStatus === 'archived') {
    query = query.eq('stsarhiviran', true)
  } else if (filterStatus === 'active') {
    query = query.or('stsarhiviran.is.null,stsarhiviran.eq.false')
  }

  if (search && search.trim()) {
    const searchTerm = search.trim()
    query = query.or(
      `ime.ilike.%${searchTerm}%,prezime.ilike.%${searchTerm}%,firma.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,kontakt.ilike.%${searchTerm}%,opis.ilike.%${searchTerm}%`
    )
  }

  const { data, error, count } = await query
    .order('datumupisa', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching klijenti:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as Klijent[], error: null, count: count || 0 }
}

export async function createKlijent(formData: FormData) {
  const supabase = createAdminClient()

  const klijentData: KlijentInsert = {
    ime: formData.get('ime') as string || null,
    prezime: formData.get('prezime') as string || null,
    firma: formData.get('firma') as string || null,
    email: formData.get('email') as string || null,
    kontakt: formData.get('kontakt') as string || null,
    stsagencijazanekretnine: formData.get('stsagencijazanekretnine') === 'true',
    stsinvestitor: formData.get('stsinvestitor') === 'true',
    stskupac: formData.get('stskupac') === 'true',
    stsprijateljsajta: formData.get('stsprijateljsajta') === 'true',
    stsprodavac: formData.get('stsprodavac') === 'true',
    opis: formData.get('opis') as string || null,
  }

  const { data, error } = await supabase
    .from('klijenti')
    .insert([klijentData])
    .select()
    .single()

  if (error) {
    console.error('Error creating klijent:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/klijenti')
  return { data: data as Klijent, error: null }
}

export async function updateKlijent(id: number, formData: FormData) {
  const supabase = createAdminClient()

  const klijentData = {
    ime: formData.get('ime') as string || null,
    prezime: formData.get('prezime') as string || null,
    firma: formData.get('firma') as string || null,
    email: formData.get('email') as string || null,
    kontakt: formData.get('kontakt') as string || null,
    stsagencijazanekretnine: formData.get('stsagencijazanekretnine') === 'true',
    stsinvestitor: formData.get('stsinvestitor') === 'true',
    stskupac: formData.get('stskupac') === 'true',
    stsprijateljsajta: formData.get('stsprijateljsajta') === 'true',
    stsprodavac: formData.get('stsprodavac') === 'true',
    opis: formData.get('opis') as string || null,
    datumpromene: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('klijenti')
    .update(klijentData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating klijent:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/klijenti')
  return { data: data as Klijent, error: null }
}

export async function archiveKlijent(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('klijenti')
    .update({
      stsarhiviran: true,
      datumpromene: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error archiving klijent:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Klijent nije pronađen' }
  }

  revalidatePath('/dashboard/klijenti')
  return { error: null, success: true }
}

export async function restoreKlijent(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('klijenti')
    .update({
      stsarhiviran: false,
      datumpromene: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error restoring klijent:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Klijent nije pronađen' }
  }

  revalidatePath('/dashboard/klijenti')
  return { error: null, success: true }
}

export async function getKlijentById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('klijenti')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching klijent:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Klijent, error: null }
}
