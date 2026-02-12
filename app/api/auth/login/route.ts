import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email i password su obavezni' }, { status: 400 })
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
      return NextResponse.json({ error: 'Greška pri povezivanju sa bazom' }, { status: 500 })
    }

    if (!korisnici || korisnici.length === 0) {
      // Proveri da li email postoji
      const { data: emailCheck } = await supabase
        .from('korisnici')
        .select('id')
        .eq('email', email.trim())
        .limit(1)

      if (emailCheck && emailCheck.length > 0) {
        return NextResponse.json({ error: 'Pogrešan password' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Korisnik sa ovim email-om ne postoji' }, { status: 401 })
    }

    const korisnik = korisnici[0]

    // Provera da li je korisnik aktivan
    if (korisnik.stsaktivan !== 'da') {
      return NextResponse.json({ error: 'Vaš nalog je deaktiviran. Kontaktirajte administratora.' }, { status: 403 })
    }

    // Provera da li je admin ili manager
    if (korisnik.stsstatus !== 'admin' && korisnik.stsstatus !== 'manager') {
      return NextResponse.json({ error: 'Nemate pristup admin panelu.' }, { status: 403 })
    }

    // Čuvanje korisnika u cookie (bez httpOnly da bi klijent mogao da čita)
    const cookieStore = await cookies()
    cookieStore.set('user', JSON.stringify(korisnik), {
      httpOnly: false, // Mora biti false da bi klijent mogao da čita user data
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dana
    })

    return NextResponse.json({ success: true, user: korisnik })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Greška pri prijavljivanju' }, { status: 500 })
  }
}
