'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Aktuelnost, AktuelnostInsert } from '@/lib/types/aktuelnosti'

export async function getAktuelnosti(
  limit: number = 50,
  offset: number = 0,
  onlyActive: boolean = false
) {
  const supabase = createAdminClient()

  let query = supabase
    .from('aktuelnosti')
    .select('*', { count: 'exact' })

  if (onlyActive) {
    query = query.eq('stsaktivan', true)
  }

  const { data, error, count } = await query
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching aktuelnosti:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as Aktuelnost[], error: null, count: count || 0 }
}

export async function getAktuelnostById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aktuelnosti')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching aktuelnost:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Aktuelnost, error: null }
}

export async function getActiveAktuelnostById(id: number) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aktuelnosti')
    .select('*')
    .eq('id', id)
    .eq('stsaktivan', true)
    .single()

  if (error) {
    console.error('Error fetching aktuelnost:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Aktuelnost, error: null }
}

export async function createAktuelnost(formData: FormData) {
  const supabase = createAdminClient()

  const aktuelnostData: AktuelnostInsert = {
    naslov_sr: formData.get('naslov_sr') as string,
    naslov_en: (formData.get('naslov_en') as string) || null,
    tekst_sr: formData.get('tekst_sr') as string,
    tekst_en: (formData.get('tekst_en') as string) || null,
    slika_url: (formData.get('slika_url') as string) || null,
    datum_objave: (formData.get('datum_objave') as string) || new Date().toISOString(),
    stsaktivan: formData.get('stsaktivan') === 'true',
  }

  const { data, error } = await supabase
    .from('aktuelnosti')
    .insert([aktuelnostData])
    .select()
    .single()

  if (error) {
    console.error('Error creating aktuelnost:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/aktuelnosti')
  revalidatePath('/aktuelnosti')
  revalidatePath('/en/news')
  return { data: data as Aktuelnost, error: null }
}

export async function updateAktuelnost(id: number, formData: FormData) {
  const supabase = createAdminClient()

  const aktuelnostData = {
    naslov_sr: formData.get('naslov_sr') as string,
    naslov_en: (formData.get('naslov_en') as string) || null,
    tekst_sr: formData.get('tekst_sr') as string,
    tekst_en: (formData.get('tekst_en') as string) || null,
    slika_url: (formData.get('slika_url') as string) || null,
    datum_objave: formData.get('datum_objave') as string,
    stsaktivan: formData.get('stsaktivan') === 'true',
    datumpromene: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('aktuelnosti')
    .update(aktuelnostData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating aktuelnost:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/aktuelnosti')
  revalidatePath('/aktuelnosti')
  revalidatePath('/en/news')
  revalidatePath(`/aktuelnosti/${id}`)
  revalidatePath(`/en/news/${id}`)
  return { data: data as Aktuelnost, error: null }
}

export async function toggleAktuelnostStatus(id: number, stsaktivan: boolean) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('aktuelnosti')
    .update({
      stsaktivan,
      datumpromene: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error toggling aktuelnost status:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Aktuelnost nije pronađena' }
  }

  revalidatePath('/dashboard/aktuelnosti')
  revalidatePath('/aktuelnosti')
  revalidatePath('/en/news')
  return { error: null, success: true }
}

export async function deleteAktuelnost(id: number) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('aktuelnosti')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting aktuelnost:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/aktuelnosti')
  revalidatePath('/aktuelnosti')
  revalidatePath('/en/news')
  return { error: null, success: true }
}
