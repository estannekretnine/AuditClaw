'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(1, 'Password je obavezan'),
})

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validacija
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()

  // Provera korisnika u tabeli korisnici
  const { data: korisnici, error: dbError } = await supabase
    .from('korisnici')
    .select('*')
    .eq('email', email.trim())
    .eq('password', password.trim())

  if (dbError) {
    console.error('Database error:', dbError)
    return { error: 'Greška pri povezivanju sa bazom' }
  }

  if (!korisnici || korisnici.length === 0) {
    // Proveri da li email postoji
    const { data: emailCheck } = await supabase
      .from('korisnici')
      .select('id')
      .eq('email', email.trim())
      .limit(1)

    if (emailCheck && emailCheck.length > 0) {
      return { error: 'Pogrešan password' }
    }
    return { error: 'Korisnik sa ovim email-om ne postoji' }
  }

  const korisnik = korisnici[0]

  // Provera da li je korisnik aktivan
  if (korisnik.stsaktivan !== 'da') {
    return { error: 'Vaš nalog je deaktiviran. Kontaktirajte administratora.' }
  }

  // Provera da li je admin, manager ili agent
  if (korisnik.stsstatus !== 'admin' && korisnik.stsstatus !== 'manager' && korisnik.stsstatus !== 'agent') {
    return { error: 'Nemate pristup panelu.' }
  }

  // Čuvanje korisnika u cookie
  const cookieStore = await cookies()
  cookieStore.set('user', JSON.stringify(korisnik), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dana
  })

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('user')
  redirect('/login')
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}
