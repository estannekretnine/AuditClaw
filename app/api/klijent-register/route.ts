import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { generatePreporukaCode } from '@/lib/utils/preporuka-code'

const klijentSchema = z.object({
  ime: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  prezime: z.string().min(2, 'Prezime mora imati najmanje 2 karaktera'),
  firma: z.string().optional(),
  email: z.string().email('Unesite validnu email adresu'),
  kontakt: z.string().min(6, 'Telefon mora imati najmanje 6 cifara'),
  stsinvestitor: z.boolean().optional().default(false),
  stsinvestitoraudit: z.boolean().optional().default(false),
  stskupac: z.boolean().optional().default(false),
  stsprijateljsajta: z.boolean().optional().default(false),
  stsprodavac: z.boolean().optional().default(false),
  opis: z.string().optional(),
  contactid: z.string().optional(),
  source: z.string().optional(),
})

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return null
  }
  return createClient(url, key)
}

// Maks. broj pokušaja u slučaju kolizije UNIQUE constraint-a
const MAX_CODE_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const result = klijentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const data = result.data

    const supabase = getSupabase()
    if (!supabase) {
      console.error('Supabase not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Retry petlja: u (izuzetno retkom) slučaju kolizije UNIQUE koda,
    // generišemo nov kod i pokušavamo ponovo.
    let preporukacode: string | null = null
    let lastError: unknown = null

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const candidate = generatePreporukaCode()

      const { error } = await supabase
        .from('klijenti')
        .insert({
          ime: data.ime,
          prezime: data.prezime,
          firma: data.firma || null,
          email: data.email,
          kontakt: data.kontakt,
          stsagencijazanekretnine: false,
          stsinvestitor: data.stsinvestitor,
          stsinvestitoraudit: data.stsinvestitoraudit,
          stskupac: data.stskupac,
          stsprijateljsajta: data.stsprijateljsajta,
          stsprodavac: data.stsprodavac,
          opis: data.opis || null,
          stsarhiviran: false,
          contactid: data.contactid || null,
          source: data.source || null,
          preporukacode: candidate,
        })

      if (!error) {
        preporukacode = candidate
        break
      }

      lastError = error
      // Postgres unique_violation kod = '23505' → kolizija, idemo u retry
      const isUniqueViolation =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505'

      if (!isUniqueViolation) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'Failed to save klijent' },
          { status: 500 }
        )
      }
    }

    if (!preporukacode) {
      console.error('Failed to generate unique preporuka code after retries:', lastError)
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, preporukacode })
  } catch (error) {
    console.error('Klijent register API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
