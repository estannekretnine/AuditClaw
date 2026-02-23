import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone must be at least 6 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
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
    
    const result = contactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, phone, message } = result.data

    const supabase = getSupabase()
    if (!supabase) {
      console.error('Supabase not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('poruke_sajt')
      .insert({
        ime: name,
        email: email,
        telefon: phone,
        poruka: message,
        procitano: false,
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
