import { createAdminClient } from '@/lib/supabase/admin'
import type { Korisnik } from '@/lib/types/database'

interface VapiLogInput {
  user: Korisnik
  eventType: string
  route?: string | null
  details?: string | null
}

export async function writeVapiUserLog({
  user,
  eventType,
  route = null,
  details = null,
}: VapiLogInput) {
  if (user.stsstatus !== 'vapi') {
    return
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('vapi_user_log').insert([
      {
        korisnikid: user.id,
        naziv: user.naziv,
        email: user.email,
        event_type: eventType,
        route,
        details,
      },
    ])
  } catch (error) {
    console.error('Vapi user log error:', error)
  }
}
