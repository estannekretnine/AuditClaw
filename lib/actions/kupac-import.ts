'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Papa from 'papaparse'
import type { 
  KupacImport, 
  KupacImportInsert, 
  KupacKampanjaWithDetails, 
  ImportResult, 
  CSVRow 
} from '@/lib/types/kupac-import'

export async function importKupciFromCSV(formData: FormData): Promise<ImportResult> {
  const file = formData.get('file') as File
  
  if (!file) {
    return {
      total: 0,
      inserted: 0,
      updated: 0,
      errors: 1,
      errorMessages: ['Fajl nije pronađen']
    }
  }

  const text = await file.text()
  
  const parseResult = Papa.parse<CSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  })

  if (parseResult.errors.length > 0) {
    return {
      total: 0,
      inserted: 0,
      updated: 0,
      errors: parseResult.errors.length,
      errorMessages: parseResult.errors.map(e => e.message)
    }
  }

  const supabase = await createClient()
  let inserted = 0
  let updated = 0
  let errors = 0
  const errorMessages: string[] = []

  for (const row of parseResult.data) {
    const email = row.email?.trim() || null
    const mobprimarni = row.mobprimarni?.trim() || null

    if (!email && !mobprimarni) {
      errors++
      errorMessages.push(`Red preskočen - nema email ni mobprimarni`)
      continue
    }

    const kupacData: KupacImportInsert = {
      ime: row.ime?.trim() || null,
      prezime: row.prezime?.trim() || null,
      email: email,
      mobprimarni: mobprimarni,
      mobsek: row.mobsek?.trim() || null,
      linkedinurl: row.linkedinurl?.trim() || null,
      drzava: row.drzava?.trim() || null,
      grad: row.grad?.trim() || null,
      zanimanje: row.zanimanje?.trim() || null,
      godisnjaplata: row.godisnjaplata?.trim() || null,
      stsotvoren: false,
    }

    let existingKupac = null

    if (email) {
      const { data } = await supabase
        .from('kupacimport')
        .select('id')
        .eq('email', email)
        .single()
      existingKupac = data
    }

    if (!existingKupac && mobprimarni) {
      const { data } = await supabase
        .from('kupacimport')
        .select('id')
        .eq('mobprimarni', mobprimarni)
        .single()
      existingKupac = data
    }

    if (existingKupac) {
      const { error } = await supabase
        .from('kupacimport')
        .update(kupacData)
        .eq('id', existingKupac.id)

      if (error) {
        errors++
        errorMessages.push(`Greška pri ažuriranju: ${error.message}`)
      } else {
        updated++
      }
    } else {
      const { error } = await supabase
        .from('kupacimport')
        .insert([kupacData])

      if (error) {
        errors++
        errorMessages.push(`Greška pri unosu: ${error.message}`)
      } else {
        inserted++
      }
    }
  }

  revalidatePath('/dashboard/import-kupaca')

  return {
    total: parseResult.data.length,
    inserted,
    updated,
    errors,
    errorMessages: errorMessages.slice(0, 10)
  }
}

export async function getKupciImport(limit: number = 50, offset: number = 0) {
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('kupacimport')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching kupci import:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: data as KupacImport[], error: null, count: count || 0 }
}

export async function getKupciCountForImport() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('kupacimport')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error counting kupci:', error)
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}

export async function addRandomKupciToKampanja(kampanjaId: number, count: number) {
  const supabase = await createClient()

  const { data: existingKupci } = await supabase
    .from('kupackampanja')
    .select('kupacid')
    .eq('kampanjaid', kampanjaId)

  const existingIds = existingKupci?.map(k => k.kupacid) || []

  let query = supabase
    .from('kupacimport')
    .select('id')

  if (existingIds.length > 0) {
    query = query.not('id', 'in', `(${existingIds.join(',')})`)
  }

  const { data: availableKupci, error: fetchError } = await query

  if (fetchError) {
    console.error('Error fetching available kupci:', fetchError)
    return { added: 0, error: fetchError.message }
  }

  if (!availableKupci || availableKupci.length === 0) {
    return { added: 0, error: 'Nema dostupnih kupaca za dodavanje' }
  }

  const shuffled = availableKupci.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  const insertData = selected.map(kupac => ({
    kampanjaid: kampanjaId,
    kupacid: kupac.id,
    created_at: new Date().toISOString(),
  }))

  const { error: insertError } = await supabase
    .from('kupackampanja')
    .insert(insertData)

  if (insertError) {
    console.error('Error inserting kupackampanja:', insertError)
    return { added: 0, error: insertError.message }
  }

  revalidatePath('/dashboard/ponude')

  return { added: selected.length, error: null }
}

export async function getKupciForKampanja(kampanjaId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kupackampanja')
    .select(`
      *,
      kupac:kupacimport(*)
    `)
    .eq('kampanjaid', kampanjaId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kupci for kampanja:', error)
    return { data: null, error: error.message }
  }

  return { data: data as KupacKampanjaWithDetails[], error: null }
}

export async function removeKupacFromKampanja(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('kupackampanja')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing kupac from kampanja:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/ponude')

  return { error: null }
}

export async function getKupciKampanjaCount(kampanjaId: number) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('kupackampanja')
    .select('*', { count: 'exact', head: true })
    .eq('kampanjaid', kampanjaId)

  if (error) {
    console.error('Error counting kupci for kampanja:', error)
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}
