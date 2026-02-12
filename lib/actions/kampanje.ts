'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Kampanja, KampanjaInsert } from '@/lib/types/kampanja'

// Zod schema za validaciju kampanje (Admin - sva polja)
const kampanjaSchema = z.object({
  analizaoglasa_ai: z.string().optional().nullable(),
  ciljnagrupa_ai: z.string().optional().nullable(),
  zakljucak_ai: z.string().optional().nullable(),
  budzet: z.number().optional().nullable(),
  kodkampanje: z.string().optional().nullable(),
  predlogkampanje_ai: z.string().optional().nullable(),
  stsaktivan: z.boolean().optional().nullable(),
  ciljaniregion_ai: z.string().optional().nullable(),
  kljucnereci_ai: z.string().optional().nullable(),
  psiholoskiprofil_ai: z.string().optional().nullable(),
  ponudaid: z.number().optional().nullable(),
  zakljucak_ag: z.string().optional().nullable(),
})

// Zod schema za validaciju kampanje (Agent - samo zakljucak_ag)
const kampanjaAgentSchema = z.object({
  zakljucak_ag: z.string().optional().nullable(),
})

// Dohvatanje svih kampanja za određenu ponudu
export async function getKampanjeByPonuda(ponudaId: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kampanja')
    .select('*')
    .eq('ponudaid', ponudaId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kampanje:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Kampanja[], error: null }
}

// Dohvatanje jedne kampanje po ID-u
export async function getKampanjaById(id: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kampanja')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching kampanja:', error)
    return { data: null, error: error.message }
  }

  return { data: data as Kampanja, error: null }
}

// Kreiranje nove kampanje (samo Admin)
export async function createKampanja(formData: FormData) {
  const data: KampanjaInsert = {
    analizaoglasa_ai: formData.get('analizaoglasa_ai') as string || null,
    ciljnagrupa_ai: formData.get('ciljnagrupa_ai') as string || null,
    zakljucak_ai: formData.get('zakljucak_ai') as string || null,
    budzet: formData.get('budzet') ? Number(formData.get('budzet')) : null,
    predlogkampanje_ai: formData.get('predlogkampanje_ai') as string || null,
    stsaktivan: formData.get('stsaktivan') !== 'false', // Default true
    ciljaniregion_ai: formData.get('ciljaniregion_ai') as string || null,
    kljucnereci_ai: formData.get('kljucnereci_ai') as string || null,
    psiholoskiprofil_ai: formData.get('psiholoskiprofil_ai') as string || null,
    ponudaid: formData.get('ponudaid') ? Number(formData.get('ponudaid')) : null,
    zakljucak_ag: formData.get('zakljucak_ag') as string || null,
  }

  // Validacija
  const result = kampanjaSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message, data: null }
  }

  const supabase = await createClient()

  const { data: insertedData, error } = await supabase
    .from('kampanja')
    .insert([data])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating kampanja:', error)
    return { error: error.message, data: null }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null, data: insertedData }
}

// Ažuriranje kampanje (Admin - sva polja)
export async function updateKampanja(id: number, formData: FormData) {
  const data: KampanjaInsert = {
    analizaoglasa_ai: formData.get('analizaoglasa_ai') as string || null,
    ciljnagrupa_ai: formData.get('ciljnagrupa_ai') as string || null,
    zakljucak_ai: formData.get('zakljucak_ai') as string || null,
    budzet: formData.get('budzet') ? Number(formData.get('budzet')) : null,
    predlogkampanje_ai: formData.get('predlogkampanje_ai') as string || null,
    stsaktivan: formData.get('stsaktivan') !== 'false',
    ciljaniregion_ai: formData.get('ciljaniregion_ai') as string || null,
    kljucnereci_ai: formData.get('kljucnereci_ai') as string || null,
    psiholoskiprofil_ai: formData.get('psiholoskiprofil_ai') as string || null,
    ponudaid: formData.get('ponudaid') ? Number(formData.get('ponudaid')) : null,
    zakljucak_ag: formData.get('zakljucak_ag') as string || null,
  }

  // Validacija
  const result = kampanjaSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('kampanja')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating kampanja:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Ažuriranje kampanje (Agent - samo zakljucak_ag)
export async function updateKampanjaAgent(id: number, zakljucak_ag: string | null) {
  // Validacija
  const result = kampanjaAgentSchema.safeParse({ zakljucak_ag })
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('kampanja')
    .update({ zakljucak_ag })
    .eq('id', id)

  if (error) {
    console.error('Error updating kampanja (agent):', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Brisanje kampanje (samo Admin)
export async function deleteKampanja(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('kampanja')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting kampanja:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Arhiviranje kampanje - postavlja stsaktivan na false (samo Admin)
export async function arhivirajKampanja(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('kampanja')
    .update({ stsaktivan: false })
    .eq('id', id)

  if (error) {
    console.error('Error archiving kampanja:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Aktiviranje kampanje - postavlja stsaktivan na true (samo Admin)
export async function aktivirajKampanja(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('kampanja')
    .update({ stsaktivan: true })
    .eq('id', id)

  if (error) {
    console.error('Error activating kampanja:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Toggle status aktivan/neaktivan (samo Admin)
export async function toggleKampanjaStatus(id: number, currentStatus: boolean | null) {
  const supabase = await createClient()
  const newStatus = !currentStatus

  const { error } = await supabase
    .from('kampanja')
    .update({ stsaktivan: newStatus })
    .eq('id', id)

  if (error) {
    console.error('Error toggling kampanja status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}
