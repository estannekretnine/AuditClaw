'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Korisnik, KorisnikProfile } from '@/lib/types/database'
import { normalizeKorisnikForApp, resolveProfesorRelation, formatProfesorLabel } from '@/lib/role-utils'
import { writeVapiUserLog } from '@/lib/vapi-user-log'

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

  const korisnik = normalizeKorisnikForApp(korisnici[0])

  // Provera da li je korisnik aktivan
  if (korisnik.stsaktivan !== 'da') {
    return { error: 'Vaš nalog je deaktiviran. Kontaktirajte administratora.' }
  }

  // Provera da li ima dozvoljenu dashboard rolu
  if (
    korisnik.stsstatus !== 'admin' &&
    korisnik.stsstatus !== 'manager' &&
    korisnik.stsstatus !== 'agent' &&
    korisnik.stsstatus !== 'vapi'
  ) {
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

  await writeVapiUserLog({
    user: korisnik,
    eventType: 'login',
    route: '/dashboard',
    details: 'Prijava kroz server action login formu.',
  })

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('user')
  redirect('/login')
}

export async function getCurrentUser(): Promise<Korisnik | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie) {
    return null
  }

  try {
    const raw = JSON.parse(userCookie.value) as Korisnik
    return normalizeKorisnikForApp(raw)
  } catch {
    return null
  }
}

export async function getCurrentUserProfile(): Promise<{
  data: KorisnikProfile | null
  error: string | null
}> {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { data: null, error: 'Nije prijavljen' }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('korisnici')
    .select('*, vapi_profesor(ime, prezime)')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return { data: null, error: error.message }
  }

  if (!data) {
    return {
      data: {
        ...user,
        profesorNaziv: null,
      },
      error: null,
    }
  }

  const normalized = normalizeKorisnikForApp(data as Korisnik)
  const profesorNaziv =
    normalized.stsstatus === 'vapi'
      ? formatProfesorLabel(resolveProfesorRelation(data.vapi_profesor))
      : null

  return {
    data: {
      ...normalized,
      profesorNaziv,
    },
    error: null,
  }
}
