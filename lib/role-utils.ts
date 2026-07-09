import type { Korisnik } from '@/lib/types/database'

const VAPI_ROLE_MARKER = '[role:vapi]'

function hasVapiMarker(adresa: string | null | undefined): boolean {
  return typeof adresa === 'string' && adresa.includes(VAPI_ROLE_MARKER)
}

function stripVapiMarker(adresa: string | null | undefined): string | null {
  if (!adresa) return null
  const cleaned = adresa.replace(VAPI_ROLE_MARKER, '').trim()
  return cleaned || null
}

function ensureVapiMarker(adresa: string | null | undefined): string {
  const base = stripVapiMarker(adresa)
  return base ? `${base} ${VAPI_ROLE_MARKER}` : VAPI_ROLE_MARKER
}

export function getEffectiveStatus(
  status: Korisnik['stsstatus'],
  adresa: string | null | undefined
): Korisnik['stsstatus'] {
  if (status === 'agent' && hasVapiMarker(adresa)) {
    return 'vapi'
  }
  return status
}

export function normalizeStoredRoleInput(
  status: string,
  adresa: string | null | undefined
): { stsstatus: string; adresa: string | null } {
  if (status === 'vapi') {
    return { stsstatus: 'agent', adresa: ensureVapiMarker(adresa) }
  }

  return { stsstatus: status, adresa: stripVapiMarker(adresa) }
}

export function normalizeKorisnikForApp(user: Korisnik): Korisnik {
  return {
    ...user,
    stsstatus: getEffectiveStatus(user.stsstatus, user.adresa),
    adresa: stripVapiMarker(user.adresa),
    profesorid: user.profesorid ?? null,
  }
}

export function resolveProfesorRelation(
  rel: unknown
): { ime: string; prezime: string | null } | null {
  if (!rel) return null

  const item = Array.isArray(rel) ? rel[0] : rel
  if (!item || typeof item !== 'object') return null

  const record = item as { ime?: unknown; prezime?: unknown }
  if (typeof record.ime !== 'string') return null

  return {
    ime: record.ime,
    prezime: typeof record.prezime === 'string' ? record.prezime : null,
  }
}

export function formatProfesorLabel(
  profesor: { ime: string; prezime: string | null } | null
): string | null {
  if (!profesor) return null
  return `${profesor.ime}${profesor.prezime ? ` ${profesor.prezime}` : ''}`.trim()
}
