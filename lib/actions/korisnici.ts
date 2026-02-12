'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const korisnikSchema = z.object({
  naziv: z.string().min(1, 'Naziv je obavezan'),
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().optional(),
  brojmob: z.string().optional().nullable(),
  adresa: z.string().optional().nullable(),
  stsstatus: z.enum(['admin', 'agent', 'user']).default('admin'),
  stsaktivan: z.enum(['da', 'ne']).default('da'),
})

export async function getKorisnici() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('korisnici')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching korisnici:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createKorisnik(formData: FormData) {
  const naziv = formData.get('naziv') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const brojmob = formData.get('brojmob') as string
  const adresa = formData.get('adresa') as string
  const stsstatus = formData.get('stsstatus') as string
  const stsaktivan = formData.get('stsaktivan') as string

  // Validacija
  const result = korisnikSchema.safeParse({
    naziv,
    email,
    password,
    brojmob: brojmob || null,
    adresa: adresa || null,
    stsstatus,
    stsaktivan,
  })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  if (!password) {
    return { error: 'Password je obavezan za novog korisnika' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('korisnici')
    .insert([{
      naziv,
      email,
      password,
      brojmob: brojmob || null,
      adresa: adresa || null,
      stsstatus,
      stsaktivan,
    }])

  if (error) {
    console.error('Error creating korisnik:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/korisnici')
  return { error: null }
}

export async function updateKorisnik(id: number, formData: FormData) {
  const naziv = formData.get('naziv') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const brojmob = formData.get('brojmob') as string
  const adresa = formData.get('adresa') as string
  const stsstatus = formData.get('stsstatus') as string
  const stsaktivan = formData.get('stsaktivan') as string

  // Validacija
  const result = korisnikSchema.safeParse({
    naziv,
    email,
    brojmob: brojmob || null,
    adresa: adresa || null,
    stsstatus,
    stsaktivan,
  })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    naziv,
    email,
    brojmob: brojmob || null,
    adresa: adresa || null,
    stsstatus,
    stsaktivan,
    datumpt: new Date().toISOString(),
  }

  // Samo ažuriraj password ako je unet
  if (password) {
    updateData.password = password
  }

  const { error } = await supabase
    .from('korisnici')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating korisnik:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/korisnici')
  return { error: null }
}

export async function deleteKorisnik(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('korisnici')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting korisnik:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/korisnici')
  return { error: null }
}

export async function toggleKorisnikStatus(id: number, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'da' ? 'ne' : 'da'

  const { error } = await supabase
    .from('korisnici')
    .update({ stsaktivan: newStatus })
    .eq('id', id)

  if (error) {
    console.error('Error toggling status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/korisnici')
  return { error: null }
}
