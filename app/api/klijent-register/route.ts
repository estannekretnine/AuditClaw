import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const klijentSchema = z.object({
  ime: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  prezime: z.string().min(2, 'Prezime mora imati najmanje 2 karaktera'),
  firma: z.string().optional(),
  email: z.string().email('Unesite validnu email adresu'),
  kontakt: z.string().min(6, 'Telefon mora imati najmanje 6 cifara'),
  stsinvestitor: z.boolean().optional().default(false),
  stskupac: z.boolean().optional().default(false),
  stsprijateljsajta: z.boolean().optional().default(false),
  stsprodavac: z.boolean().optional().default(false),
  opis: z.string().optional(),
})

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return null
  }
  return createClient(url, key)
}

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
        stskupac: data.stskupac,
        stsprijateljsajta: data.stsprijateljsajta,
        stsprodavac: data.stsprodavac,
        opis: data.opis || null,
        stsarhiviran: false,
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save klijent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Klijent register API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
