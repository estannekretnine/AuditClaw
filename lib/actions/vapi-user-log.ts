'use server'

import { getCurrentUser } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VapiUserLog } from '@/lib/types/vapi'
import { writeVapiUserLog } from '@/lib/vapi-user-log'

async function requireViewAccess() {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: 'Niste prijavljeni.' }
  }

  if (user.stsstatus !== 'admin' && user.stsstatus !== 'manager' && user.stsstatus !== 'vapi') {
    return { user, error: 'Nemate dozvolu za ovu akciju.' }
  }

  return { user, error: null }
}

export async function getVapiUserLogs(limit: number = 300) {
  const access = await requireViewAccess()
  if (access.error || !access.user) {
    return { data: null, error: access.error || 'Nemate dozvolu.', count: 0 }
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('vapi_user_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (access.user.stsstatus === 'vapi') {
    query = query.eq('korisnikid', access.user.id)
  }

  const { data, error, count } = await query
  if (error) {
    return { data: null, error: error.message, count: 0 }
  }

  return { data: (data || []) as VapiUserLog[], error: null, count: count || 0 }
}

export async function logCurrentVapiPageVisit(route: string, details?: string) {
  const user = await getCurrentUser()
  if (!user || user.stsstatus !== 'vapi') {
    return { success: false }
  }

  await writeVapiUserLog({
    user,
    eventType: 'page_view',
    route,
    details: details || null,
  })

  return { success: true }
}
