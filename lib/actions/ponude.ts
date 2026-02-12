'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Ponuda, PonudaInsert } from '@/lib/types/ponuda'

// Zod schema za validaciju ponude
const ponudaSchema = z.object({
  idkorisnik: z.number().optional().nullable(),
  idkorisnik_agencija: z.number().optional().nullable(),
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

// Dohvatanje svih ponuda sa JOIN na korisnici za ime agencije i glavnu fotografiju
export async function getPonude(userId?: number, isAdmin?: boolean) {
  const supabase = await createClient()
  
  // Koristimo LEFT JOIN da dobijemo naziv agencije i glavnu fotografiju
  let query = supabase
    .from('ponuda')
    .select(`
      *,
      agencija:korisnici!ponuda_idkorisnik_agencija_fkey(naziv),
      fotografije:ponudafoto(id, url, glavna, redosled)
    `)
    .order('id', { ascending: false })

  // Ako nije admin, filtriraj po korisniku (agencija vidi samo svoje ponude)
  if (!isAdmin && userId) {
    query = query.eq('idkorisnik_agencija', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ponude:', error)
    return { data: null, error: error.message }
  }

  // Transformiši podatke da dodamo agencija_naziv i glavna_foto_url
  const transformedData = data?.map(item => {
    // Pronađi glavnu fotografiju ili prvu po redosledu
    const fotografije = item.fotografije || []
    let glavnaFoto = fotografije.find((f: { glavna: boolean }) => f.glavna)
    if (!glavnaFoto && fotografije.length > 0) {
      // Ako nema glavne, uzmi prvu po redosledu
      glavnaFoto = fotografije.sort((a: { redosled: number }, b: { redosled: number }) => 
        (a.redosled || 999) - (b.redosled || 999)
      )[0]
    }
    
    return {
      ...item,
      agencija_naziv: item.agencija?.naziv || null,
      glavna_foto_url: glavnaFoto?.url || null,
      agencija: undefined,
      fotografije: undefined
    }
  }) as Ponuda[]

  return { data: transformedData, error: null }
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
    idkorisnik_agencija: formData.get('idkorisnik_agencija') ? Number(formData.get('idkorisnik_agencija')) : null,
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

  const { data: insertedData, error } = await supabase
    .from('ponuda')
    .insert([data])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating ponuda:', error)
    return { error: error.message, data: null }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null, data: insertedData }
}

// Ažuriranje ponude
export async function updatePonuda(id: number, formData: FormData) {
  const data: PonudaInsert = {
    idkorisnik: formData.get('idkorisnik') ? Number(formData.get('idkorisnik')) : null,
    idkorisnik_agencija: formData.get('idkorisnik_agencija') ? Number(formData.get('idkorisnik_agencija')) : null,
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

// Arhiviranje ponude (postavlja stsaktivan na false)
export async function arhivirajPonuda(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ponuda')
    .update({ stsaktivan: false })
    .eq('id', id)

  if (error) {
    console.error('Error archiving ponuda:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}

// Dearhiviranje ponude (postavlja stsaktivan na true)
export async function dearhivirajPonuda(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ponuda')
    .update({ stsaktivan: true })
    .eq('id', id)

  if (error) {
    console.error('Error unarchiving ponuda:', error)
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

// Dohvatanje liste agencija (korisnici sa statusom agent ili manager)
export async function getAgencije() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('korisnici')
    .select('id, naziv, email, stsstatus')
    .in('stsstatus', ['agent', 'manager'])
    .eq('stsaktivan', 'da')
    .order('naziv', { ascending: true })

  if (error) {
    console.error('Error fetching agencije:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// Dohvatanje fotografija za ponudu
export async function getPonudaFotografije(ponudaId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ponudafoto')
    .select('*')
    .eq('idponude', ponudaId)
    .order('redosled', { ascending: true })

  if (error) {
    console.error('Error fetching ponuda photos:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// Interface za foto item koji dolazi iz komponente
interface PhotoItemInput {
  id: number
  file?: File
  url: string
  opis: string | null
  redosled: number | null
  glavna: boolean | null
  stsskica: boolean | null
  skica_coords?: string | null
  idponude?: number | null
  datumpromene?: string
  opisfoto?: Record<string, unknown> | null
  skica_segment?: string | null
  isNew?: boolean
  isDeleted?: boolean
}

// Čuvanje fotografija za ponudu
export async function savePonudaFotografije(ponudaId: number, photos: PhotoItemInput[]) {
  const supabase = await createClient()

  // 1. Obriši fotografije koje su označene za brisanje
  const photosToDelete = photos.filter(p => p.isDeleted && !p.isNew)
  for (const photo of photosToDelete) {
    // Obriši iz storage ako je URL iz Supabase
    if (photo.url && photo.url.includes('supabase')) {
      const urlParts = photo.url.split('/ponudafoto/')
      if (urlParts[1]) {
        await supabase.storage.from('ponudafoto').remove([urlParts[1]])
      }
    }
    
    // Obriši iz baze
    await supabase.from('ponudafoto').delete().eq('id', photo.id)
  }

  // 2. Upload novih fotografija i ažuriraj postojeće
  const photosToSave = photos.filter(p => !p.isDeleted)
  
  for (const photo of photosToSave) {
    let photoUrl = photo.url

    // Ako ima novi file, upload-uj ga
    if (photo.file && photo.isNew) {
      const fileExt = photo.file.name.split('.').pop()
      const fileName = `${ponudaId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ponudafoto')
        .upload(fileName, photo.file)

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        continue
      }

      // Dobij public URL
      const { data: urlData } = supabase.storage
        .from('ponudafoto')
        .getPublicUrl(fileName)
      
      photoUrl = urlData.publicUrl
    }

    // Pripremi podatke za čuvanje
    const photoData = {
      idponude: ponudaId,
      url: photoUrl,
      opis: photo.opis,
      redosled: photo.redosled,
      glavna: photo.glavna,
      stsskica: photo.stsskica,
      skica_coords: photo.skica_coords || null,
      skica_segment: photo.skica_segment || null,
      opisfoto: photo.opisfoto || null,
      datumpromene: new Date().toISOString()
    }

    if (photo.isNew) {
      // Insert nova fotografija
      const { error: insertError } = await supabase
        .from('ponudafoto')
        .insert([photoData])

      if (insertError) {
        console.error('Error inserting photo:', insertError)
      }
    } else {
      // Update postojeća fotografija
      const { error: updateError } = await supabase
        .from('ponudafoto')
        .update(photoData)
        .eq('id', photo.id)

      if (updateError) {
        console.error('Error updating photo:', updateError)
      }
    }
  }

  revalidatePath('/dashboard/ponude')
  return { error: null }
}
