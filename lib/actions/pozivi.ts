'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Poziv, PozivInsert } from '@/lib/types/pozivi'

// Zod schema za validaciju poziva (Admin - sva polja)
const pozivSchema = z.object({
  ipadresa: z.string().optional().nullable(),
  mobtel: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  imekupca: z.string().optional().nullable(),
  drzava: z.string().optional().nullable(),
  regija: z.string().optional().nullable(),
  validacija_ag: z.string().optional().nullable(),
  kodkampanje: z.string().optional().nullable(),
  ponudaid: z.number().optional().nullable(),
  idkampanjakupac: z.number().optional().nullable(),
})

// Zod schema za validaciju poziva (Agent - samo validacija_ag)
const pozivAgentSchema = z.object({
  validacija_ag: z.string().optional().nullable(),
})

// Dohvatanje svih poziva za određenu ponudu
export async function getPozivByPonuda(ponudaId: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pozivi')
    .select('*')
    .eq('ponudaid', ponudaId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pozivi:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Poziv[], error: null }
}

// Dohvatanje jednog poziva po ID-u
export async function getPozivById(id: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pozivi')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching poziv:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Poziv, error: null }
}

// Kreiranje novog poziva (samo Admin)
export async function createPoziv(formData: FormData) {
  const data: PozivInsert = {
    ipadresa: formData.get('ipadresa') as string || null,
    mobtel: formData.get('mobtel') as string || null,
    email: formData.get('email') as string || null,
    imekupca: formData.get('imekupca') as string || null,
    drzava: formData.get('drzava') as string || null,
    regija: formData.get('regija') as string || null,
    validacija_ag: formData.get('validacija_ag') as string || null,
    kodkampanje: formData.get('kodkampanje') as string || null,
    ponudaid: formData.get('ponudaid') ? Number(formData.get('ponudaid')) : null,
    idkampanjakupac: formData.get('idkampanjakupac') ? Number(formData.get('idkampanjakupac')) : null,
  }

  // Validacija
  const result = pozivSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message, data: null }
  }

  const supabase = await createClient()

  const { data: insertedData, error } = await supabase
    .from('pozivi')
    .insert([{ ...data, created_at: new Date().toISOString() }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating poziv:', error)
    return { error: error.message, data: null }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null, data: insertedData }
}

// Ažuriranje poziva (Admin - sva polja)
export async function updatePoziv(id: number, formData: FormData) {
  const data: PozivInsert = {
    ipadresa: formData.get('ipadresa') as string || null,
    mobtel: formData.get('mobtel') as string || null,
    email: formData.get('email') as string || null,
    imekupca: formData.get('imekupca') as string || null,
    drzava: formData.get('drzava') as string || null,
    regija: formData.get('regija') as string || null,
    validacija_ag: formData.get('validacija_ag') as string || null,
    kodkampanje: formData.get('kodkampanje') as string || null,
    ponudaid: formData.get('ponudaid') ? Number(formData.get('ponudaid')) : null,
    idkampanjakupac: formData.get('idkampanjakupac') ? Number(formData.get('idkampanjakupac')) : null,
  }

  // Validacija
  const result = pozivSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('pozivi')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating poziv:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Ažuriranje poziva (Agent - samo validacija_ag)
export async function updatePozivAgent(id: number, validacija_ag: string | null) {
  // Validacija
  const result = pozivAgentSchema.safeParse({ validacija_ag })
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('pozivi')
    .update({ validacija_ag })
    .eq('id', id)

  if (error) {
    console.error('Error updating poziv (agent):', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Brisanje poziva (samo Admin)
export async function deletePoziv(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pozivi')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting poziv:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}
