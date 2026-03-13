'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import Papa from 'papaparse'
import type { 
  KupacImport, 
  KupacImportInsert, 
  KupacKampanjaWithDetails, 
  ImportResult, 
  CSVRow 
} from '@/lib/types/kupac-import'

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || ''
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  return tabCount > commaCount ? '\t' : ','
}

function extractCountryFromLocation(location: string | undefined): string | null {
  if (!location) return null
  const parts = location.split(',').map(p => p.trim())
  return parts.length > 0 ? parts[parts.length - 1] : null
}

function isLinkedInFormat(row: CSVRow): boolean {
  return !!(row['first name'] || row['last name'] || row['linkedin url public'])
}

function buildMetapodaci(row: CSVRow): Record<string, unknown> | null {
  const metapodaci: Record<string, unknown> = {}
  
  if (row['company name']) metapodaci.companyName = row['company name']
  if (row['company domain']) metapodaci.companyDomain = row['company domain']
  if (row['company industry']) metapodaci.companyIndustry = row['company industry']
  if (row['company description']) metapodaci.companyDescription = row['company description']
  if (row['company employee range']) metapodaci.companyEmployeeRange = row['company employee range']
  if (row['company employee exact count']) metapodaci.companyEmployeeCount = row['company employee exact count']
  if (row['company revenue min (millions usd)']) metapodaci.companyRevenueMin = row['company revenue min (millions usd)']
  if (row['company revenue max (millions usd)']) metapodaci.companyRevenueMax = row['company revenue max (millions usd)']
  if (row['company type']) metapodaci.companyType = row['company type']
  if (row['company year founded']) metapodaci.companyYearFounded = row['company year founded']
  if (row['profile headline']) metapodaci.profileHeadline = row['profile headline']
  if (row['profile summary']) metapodaci.profileSummary = row['profile summary']
  if (row['profile industry']) metapodaci.profileIndustry = row['profile industry']
  if (row['job description']) metapodaci.jobDescription = row['job description']
  if (row.connections) metapodaci.connections = row.connections
  if (row['follower count']) metapodaci.followerCount = row['follower count']
  if (row['is open to work']) metapodaci.isOpenToWork = row['is open to work']
  if (row['is premium']) metapodaci.isPremium = row['is premium']
  if (row['years in position']) metapodaci.yearsInPosition = row['years in position']
  if (row['months in position']) metapodaci.monthsInPosition = row['months in position']
  if (row['years in company']) metapodaci.yearsInCompany = row['years in company']
  if (row['months in company']) metapodaci.monthsInCompany = row['months in company']
  if (row.education) metapodaci.education = row.education
  if (row['top skills (with endorsements)']) metapodaci.topSkills = row['top skills (with endorsements)']
  if (row.languages) metapodaci.languages = row.languages
  if (row['matches filters']) metapodaci.matchesFilters = row['matches filters']
  if (row['no match reasons']) metapodaci.noMatchReasons = row['no match reasons']
  if (row['email status']) metapodaci.emailStatus = row['email status']
  
  return Object.keys(metapodaci).length > 0 ? metapodaci : null
}

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
  const delimiter = detectDelimiter(text)
  
  const parseResult = Papa.parse<CSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: delimiter,
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

  const supabase = createAdminClient()
  let inserted = 0
  let updated = 0
  let errors = 0
  const errorMessages: string[] = []

  for (const row of parseResult.data) {
    const isLinkedIn = isLinkedInFormat(row)
    
    const ime = isLinkedIn 
      ? (row['first name']?.trim() || null)
      : (row.ime?.trim() || null)
    
    const prezime = isLinkedIn
      ? (row['last name']?.trim() || null)
      : (row.prezime?.trim() || null)
    
    const email = row.email?.trim() || null
    
    const linkedinurl = isLinkedIn
      ? (row['linkedin url public']?.trim() || null)
      : (row.linkedinurl?.trim() || null)
    
    const mobprimarni = row.mobprimarni?.trim() || null
    
    const grad = isLinkedIn
      ? (row.location?.trim() || null)
      : (row.grad?.trim() || null)
    
    const drzava = isLinkedIn
      ? extractCountryFromLocation(row['company location'] || row.location)
      : (row.drzava?.trim() || null)
    
    const zanimanje = isLinkedIn
      ? (row['current job']?.trim() || null)
      : (row.zanimanje?.trim() || null)
    
    const godisnjaplata = isLinkedIn
      ? (row['company revenue max (millions usd)']?.trim() || null)
      : (row.godisnjaplata?.trim() || null)

    if (!email && !mobprimarni && !linkedinurl) {
      errors++
      errorMessages.push(`Red preskočen - nema email, mobprimarni ni linkedinurl`)
      continue
    }

    const metapodaci = isLinkedIn ? buildMetapodaci(row) : null

    const kupacData: KupacImportInsert = {
      ime,
      prezime,
      email,
      mobprimarni,
      mobsek: row.mobsek?.trim() || null,
      linkedinurl,
      drzava,
      grad,
      zanimanje,
      godisnjaplata,
      stsotvoren: false,
      metapodaci,
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

    if (!existingKupac && linkedinurl) {
      const { data } = await supabase
        .from('kupacimport')
        .select('id')
        .eq('linkedinurl', linkedinurl)
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
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

  // Dohvati kampanju sa kodkampanje i ponudaid
  const { data: kampanja, error: kampanjaError } = await supabase
    .from('kampanja')
    .select('kodkampanje, ponudaid')
    .eq('id', kampanjaId)
    .single()

  if (kampanjaError || !kampanja) {
    console.error('Error fetching kampanja:', kampanjaError)
    return { added: 0, error: 'Kampanja nije pronađena' }
  }

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

  // Insert sa select da dobijemo ID-eve novih zapisa
  const { data: insertedData, error: insertError } = await supabase
    .from('kupackampanja')
    .insert(insertData)
    .select('id')

  if (insertError) {
    console.error('Error inserting kupackampanja:', insertError)
    return { added: 0, error: insertError.message }
  }

  if (!insertedData || insertedData.length === 0) {
    console.error('No data returned after insert')
    return { added: 0, error: 'Insert nije vratio podatke' }
  }

  // Generiši URL-ove za svaki novi zapis
  if (kampanja.ponudaid) {
    const baseUrl = 'https://www.auditclaw.io/p'
    const kodkampanje = kampanja.kodkampanje || ''
    
    for (const record of insertedData) {
      const url = `${baseUrl}/${kampanja.ponudaid}?c=${encodeURIComponent(kodkampanje)}&u=${record.id}`
      
      const { error: updateError } = await supabase
        .from('kupackampanja')
        .update({ url })
        .eq('id', record.id)
      
      if (updateError) {
        console.error('Error updating URL for record:', record.id, updateError)
      }
    }
  }

  revalidatePath('/dashboard/ponude')

  return { added: insertedData.length, error: null }
}

export async function getKupciForKampanja(kampanjaId: number) {
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

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
