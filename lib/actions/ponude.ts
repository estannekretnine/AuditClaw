'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Ponuda, PonudaInsert } from '@/lib/types/ponuda'

// Zod schema za validaciju ponude
const ponudaSchema = z.object({
  idkorisnik: z.number().optional().nullable(),
  vrstaobjekta_ag: z.string().optional().nullable(),
  grad_ag: z.string().optional().nullable(),
  opstina_ag: z.string().optional().nullable(),
  lokacija_ag: z.string().optional().nullable(),
  struktura_ag: z.number().optional().nullable(),
  kvadratura_ag: z.number().optional().nullable(),
  cena_ag: z.number().optional().nullable(),
  opis_ag: z.string().optional().nullable(),
  ciljnagrupa_ag: z.string().optional().nullable(),
  ucestalostpoyiva_ag: z.string().optional().nullable(),
  kupaczainteresovan_ag: z.string().optional().nullable(),
  primedbekupca_ag: z.string().optional().nullable(),
  drzava: z.string().optional().nullable(),
  adresa: z.string().optional().nullable(),
  sprat: z.string().optional().nullable(),
  grejanje: z.string().optional().nullable(),
  lift: z.string().optional().nullable(),
  ari: z.string().optional().nullable(),
  stsimagarazu: z.boolean().optional().nullable(),
  stsparking: z.boolean().optional().nullable(),
  stszainvestitor: z.boolean().optional().nullable(),
  stszaIT: z.boolean().optional().nullable(),
  stsaktivan: z.boolean().optional().nullable(),
  '3dture': z.string().optional().nullable(),
  videolink: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  naslovoglasa: z.string().optional().nullable(),
  stsrentaprodaja: z.string().optional().nullable(),
})

// Dohvatanje svih ponuda
export async function getPonude(userId?: number, isAdmin?: boolean) {
  const supabase = await createClient()
  
  let query = supabase
    .from('ponuda')
    .select('*')
    .order('id', { ascending: false })

  // Ako nije admin, filtriraj po korisniku
  if (!isAdmin && userId) {
    query = query.eq('idkorisnik', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ponude:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Ponuda[], error: null }
}

// Dohvatanje jedne ponude po ID-u
export async function getPonudaById(id: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ponuda')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ponuda:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Ponuda, error: null }
}

// Kreiranje nove ponude
export async function createPonuda(formData: FormData) {
  const data: PonudaInsert = {
    idkorisnik: formData.get('idkorisnik') ? Number(formData.get('idkorisnik')) : null,
    vrstaobjekta_ag: formData.get('vrstaobjekta_ag') as string || null,
    grad_ag: formData.get('grad_ag') as string || null,
    opstina_ag: formData.get('opstina_ag') as string || null,
    lokacija_ag: formData.get('lokacija_ag') as string || null,
    struktura_ag: formData.get('struktura_ag') ? Number(formData.get('struktura_ag')) : null,
    kvadratura_ag: formData.get('kvadratura_ag') ? Number(formData.get('kvadratura_ag')) : null,
    cena_ag: formData.get('cena_ag') ? Number(formData.get('cena_ag')) : null,
    opis_ag: formData.get('opis_ag') as string || null,
    ciljnagrupa_ag: formData.get('ciljnagrupa_ag') as string || null,
    ucestalostpoyiva_ag: formData.get('ucestalostpoyiva_ag') as string || null,
    kupaczainteresovan_ag: formData.get('kupaczainteresovan_ag') as string || null,
    primedbekupca_ag: formData.get('primedbekupca_ag') as string || null,
    drzava: formData.get('drzava') as string || null,
    adresa: formData.get('adresa') as string || null,
    sprat: formData.get('sprat') as string || null,
    grejanje: formData.get('grejanje') as string || null,
    lift: formData.get('lift') as string || null,
    ari: formData.get('ari') as string || null,
    stsimagarazu: formData.get('stsimagarazu') === 'true',
    stsparking: formData.get('stsparking') === 'true',
    stszainvestitor: formData.get('stszainvestitor') === 'true',
    stszaIT: formData.get('stszaIT') === 'true',
    stsaktivan: formData.get('stsaktivan') !== 'false', // Default true
    '3dture': formData.get('3dture') as string || null,
    videolink: formData.get('videolink') as string || null,
    latitude: formData.get('latitude') as string || null,
    longitude: formData.get('longitude') as string || null,
    naslovoglasa: formData.get('naslovoglasa') as string || null,
    stsrentaprodaja: formData.get('stsrentaprodaja') as string || null,
  }

  // Validacija
  const result = ponudaSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('ponuda')
    .insert([data])

  if (error) {
    console.error('Error creating ponuda:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Ažuriranje ponude
export async function updatePonuda(id: number, formData: FormData) {
  const data: PonudaInsert = {
    idkorisnik: formData.get('idkorisnik') ? Number(formData.get('idkorisnik')) : null,
    vrstaobjekta_ag: formData.get('vrstaobjekta_ag') as string || null,
    grad_ag: formData.get('grad_ag') as string || null,
    opstina_ag: formData.get('opstina_ag') as string || null,
    lokacija_ag: formData.get('lokacija_ag') as string || null,
    struktura_ag: formData.get('struktura_ag') ? Number(formData.get('struktura_ag')) : null,
    kvadratura_ag: formData.get('kvadratura_ag') ? Number(formData.get('kvadratura_ag')) : null,
    cena_ag: formData.get('cena_ag') ? Number(formData.get('cena_ag')) : null,
    opis_ag: formData.get('opis_ag') as string || null,
    ciljnagrupa_ag: formData.get('ciljnagrupa_ag') as string || null,
    ucestalostpoyiva_ag: formData.get('ucestalostpoyiva_ag') as string || null,
    kupaczainteresovan_ag: formData.get('kupaczainteresovan_ag') as string || null,
    primedbekupca_ag: formData.get('primedbekupca_ag') as string || null,
    drzava: formData.get('drzava') as string || null,
    adresa: formData.get('adresa') as string || null,
    sprat: formData.get('sprat') as string || null,
    grejanje: formData.get('grejanje') as string || null,
    lift: formData.get('lift') as string || null,
    ari: formData.get('ari') as string || null,
    stsimagarazu: formData.get('stsimagarazu') === 'true',
    stsparking: formData.get('stsparking') === 'true',
    stszainvestitor: formData.get('stszainvestitor') === 'true',
    stszaIT: formData.get('stszaIT') === 'true',
    stsaktivan: formData.get('stsaktivan') !== 'false',
    '3dture': formData.get('3dture') as string || null,
    videolink: formData.get('videolink') as string || null,
    latitude: formData.get('latitude') as string || null,
    longitude: formData.get('longitude') as string || null,
    naslovoglasa: formData.get('naslovoglasa') as string || null,
    stsrentaprodaja: formData.get('stsrentaprodaja') as string || null,
  }

  // Validacija
  const result = ponudaSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('ponuda')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating ponuda:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Brisanje ponude
export async function deletePonuda(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ponuda')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ponuda:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Toggle status aktivan/neaktivan
export async function togglePonudaStatus(id: number, currentStatus: boolean | null) {
  const supabase = await createClient()
  const newStatus = !currentStatus

  const { error } = await supabase
    .from('ponuda')
    .update({ stsaktivan: newStatus })
    .eq('id', id)

  if (error) {
    console.error('Error toggling ponuda status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}
