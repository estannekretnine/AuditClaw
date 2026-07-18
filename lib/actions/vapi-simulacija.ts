'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { getEffectiveStatus } from '@/lib/role-utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerSobaEvent, isPusherConfigured } from '@/lib/pusher/server'
import type { Korisnik } from '@/lib/types/database'
import {
  DEFAULT_VITALNI,
  presenceChannelName,
  type SobaJoinLinkovi,
  type VapiKartonPacijenta,
  type VapiSoba,
  type VapiSobaDetalji,
  type VapiSimulacijaUloga,
  type UcesnikAssignments,
  type VapiUcesnikSimulacije,
  type VitalniParametri,
} from '@/lib/types/vapi-simulacija'

const ULOGE: VapiSimulacijaUloga[] = ['trijaza', 'zapisnik', 'posmatrac']

const kreirajSobuSchema = z.object({
  naziv: z.string().min(1, 'Naziv sobe je obavezan').max(120),
  profesorId: z.number().int().positive().optional().nullable(),
  assistantId: z.number().int().positive().optional().nullable(),
  istorijaBolesti: z.string().optional().nullable(),
  ucesnici: z
    .array(
      z.object({
        uloga: z.enum(['trijaza', 'zapisnik', 'posmatrac']),
        ucenikId: z.number().int().positive(),
      })
    )
    .optional(),
})

const pridruziSchema = z.object({
  sobaId: z.string().uuid('Nevažeći ID sobe'),
  uloga: z.enum(['trijaza', 'zapisnik', 'posmatrac']),
  ucenikId: z.number().int().positive('Izaberite učenika'),
})

const azurirajStanjeSchema = z.object({
  sobaId: z.string().uuid(),
  vitalniParametri: z
    .object({
      puls: z.number().min(0).max(300),
      pritisak: z.string().min(1),
      saturacija: z.number().min(0).max(100),
    })
    .passthrough(),
  trenutnoStanje: z.string().min(1).max(200),
  istorijaBolesti: z.string().optional().nullable(),
  hitanAlarm: z.boolean().optional(),
  poruka: z.string().optional().nullable(),
})

const zapisnikSchema = z.object({
  sobaId: z.string().uuid(),
  anamneza: z.string().optional().nullable(),
  terapija: z.string().optional().nullable(),
  lekovi: z.string().optional().nullable(),
})

const beleskeSchema = z.object({
  sobaId: z.string().uuid(),
  beleske: z.string().optional().nullable(),
})

async function requireSimulacijaAccess() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Morate biti prijavljeni.', user: null as Korisnik | null }
  }

  const effectiveStatus = getEffectiveStatus(user.stsstatus, user.adresa)
  if (effectiveStatus !== 'admin' && effectiveStatus !== 'manager' && effectiveStatus !== 'vapi') {
    return { error: 'Nemate dozvolu za simulaciju.', user: null as Korisnik | null }
  }

  return { error: null, user: { ...user, stsstatus: effectiveStatus } as Korisnik }
}

async function resolveProfesorId(user: Korisnik, requested?: number | null): Promise<number | null> {
  if (requested && Number.isFinite(requested)) return requested

  if (user.stsstatus === 'vapi') {
    if (user.profesorid) return user.profesorid
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('korisnici')
      .select('profesorid')
      .eq('id', user.id)
      .maybeSingle()
    return data?.profesorid ?? null
  }

  // Admin/manager: uzmi prvog aktivnog profesora ako nije eksplicitno izabran
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('vapi_profesor')
    .select('id')
    .eq('stsaktivan', true)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

export async function getSimulacijaUserContext() {
  const user = await getCurrentUser()
  if (!user) return { role: null as string | null, profesorId: null as number | null }

  const effectiveStatus = getEffectiveStatus(user.stsstatus, user.adresa)
  let profesorId: number | null = null
  if (effectiveStatus === 'vapi') {
    profesorId = await resolveProfesorId({ ...user, stsstatus: effectiveStatus } as Korisnik)
  }

  return { role: effectiveStatus, profesorId }
}

function buildJoinLinks(
  sobaId: string,
  origin?: string | null,
  assignments?: UcesnikAssignments
): SobaJoinLinkovi {
  const base = (origin || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const path = (uloga: VapiSimulacijaUloga, assignments?: UcesnikAssignments) => {
    const ucenikId = assignments?.[uloga]
    const query = ucenikId ? `?uloga=${uloga}&ucenikId=${ucenikId}` : `?uloga=${uloga}`
    return base ? `${base}/soba/${sobaId}${query}` : `/soba/${sobaId}${query}`
  }

  return {
    trijaza: path('trijaza'),
    zapisnik: path('zapisnik'),
    posmatrac: path('posmatrac'),
  }
}

function normalizeVitalni(raw: unknown): VitalniParametri {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_VITALNI }
  const obj = raw as Record<string, unknown>
  const puls = Number(obj.puls)
  const saturacija = Number(obj.saturacija)
  const pritisak = typeof obj.pritisak === 'string' ? obj.pritisak : String(obj.pritisak ?? '120/80')
  return {
    ...DEFAULT_VITALNI,
    ...obj,
    puls: Number.isFinite(puls) ? puls : DEFAULT_VITALNI.puls,
    pritisak: pritisak || DEFAULT_VITALNI.pritisak,
    saturacija: Number.isFinite(saturacija) ? saturacija : DEFAULT_VITALNI.saturacija,
  }
}

export async function getSobaDetalji(sobaId: string) {
  const supabase = createAdminClient()

  const { data: soba, error } = await supabase
    .from('vapi_soba')
    .select(
      '*, vapi_profesor(ime, prezime), vapi_assistants(id, assistant_id, opis_servisa, ima_video_pacijenta, simli_face_id)'
    )
    .eq('id', sobaId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching soba:', error)
    return { data: null, error: error.message }
  }
  if (!soba) {
    return { data: null, error: 'Soba nije pronađena.' }
  }

  const [{ data: ucesnici }, { data: karton }] = await Promise.all([
    supabase
      .from('vapi_ucesnik_simulacije')
      .select('*, vapi_ucenik(ime, prezime, razred)')
      .eq('soba_id', sobaId)
      .order('id', { ascending: true }),
    supabase.from('vapi_karton_pacijenta').select('*').eq('soba_id', sobaId).maybeSingle(),
  ])

  const detalji: VapiSobaDetalji = {
    ...(soba as VapiSoba),
    ucesnici: ((ucesnici || []) as VapiUcesnikSimulacije[]).map((u) => ({
      ...u,
      online_status: Boolean(u.online_status),
    })),
    karton: karton
      ? ({
          ...(karton as VapiKartonPacijenta),
          vitalni_parametri: normalizeVitalni((karton as VapiKartonPacijenta).vitalni_parametri),
        } as VapiKartonPacijenta)
      : null,
  }

  return { data: detalji, error: null }
}

export async function getSobeList(limit: number = 30) {
  const access = await requireSimulacijaAccess()
  if (access.error || !access.user) {
    return { data: null, error: access.error || 'Nemate dozvolu.', count: 0 }
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('vapi_soba')
    .select('*, vapi_profesor(ime, prezime)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (access.user.stsstatus === 'vapi') {
    const profesorId = await resolveProfesorId(access.user)
    if (!profesorId) {
      return { data: [], error: null, count: 0 }
    }
    query = query.eq('profesor_id', profesorId)
  }

  const { data, error, count } = await query
  if (error) {
    console.error('Error listing sobe:', error)
    return { data: null, error: error.message, count: 0 }
  }

  return { data: (data || []) as VapiSoba[], error: null, count: count || 0 }
}

export async function getVapiUceniciList(limit: number = 500) {
  const access = await requireSimulacijaAccess()
  if (access.error || !access.user) {
    return { data: null, error: access.error || 'Nemate dozvolu.' }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_ucenik')
    .select('id, ime, prezime, razred')
    .order('ime', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error listing ucenici:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}

export async function kreirajSobu(input: {
  naziv: string
  profesorId?: number | null
  assistantId?: number | null
  istorijaBolesti?: string | null
  origin?: string | null
  ucesnici?: { uloga: VapiSimulacijaUloga; ucenikId: number }[]
}) {
  const access = await requireSimulacijaAccess()
  if (access.error || !access.user) {
    return { data: null, error: access.error || 'Nemate dozvolu.' }
  }

  const parsed = kreirajSobuSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message }
  }

  const profesorId = await resolveProfesorId(access.user, parsed.data.profesorId)
  if (!profesorId) {
    return {
      data: null,
      error: 'Nije pronađen profesor. Povežite nalog sa profesorom ili izaberite profesora.',
    }
  }

  const supabase = createAdminClient()
  const naziv = parsed.data.naziv.trim()

  const { data: soba, error: sobaError } = await supabase
    .from('vapi_soba')
    .insert([
      {
        naziv,
        status: 'kreirana',
        profesor_id: profesorId,
        assistant_id: parsed.data.assistantId ?? null,
      },
    ])
    .select()
    .single()

  if (sobaError || !soba) {
    console.error('Error creating soba:', sobaError)
    return { data: null, error: sobaError?.message || 'Greška pri kreiranju sobe.' }
  }

  const sobaId = soba.id as string

  const assignments: UcesnikAssignments = {}
  parsed.data.ucesnici?.forEach((u) => {
    assignments[u.uloga] = u.ucenikId
  })

  const ucesniciRows = ULOGE.map((uloga) => ({
    soba_id: sobaId,
    uloga,
    ucenik_id: assignments[uloga] ?? null,
    online_status: false,
  }))

  const { error: ucesniciError } = await supabase.from('vapi_ucesnik_simulacije').insert(ucesniciRows)
  if (ucesniciError) {
    console.error('Error creating ucesnici:', ucesniciError)
    await supabase.from('vapi_soba').delete().eq('id', sobaId)
    return { data: null, error: ucesniciError.message }
  }

  const { error: kartonError } = await supabase.from('vapi_karton_pacijenta').insert([
    {
      soba_id: sobaId,
      vitalni_parametri: DEFAULT_VITALNI,
      trenutno_stanje: 'stabilan',
      istorija_bolesti: parsed.data.istorijaBolesti?.trim() || null,
    },
  ])

  if (kartonError) {
    console.error('Error creating karton:', kartonError)
    await supabase.from('vapi_soba').delete().eq('id', sobaId)
    return { data: null, error: kartonError.message }
  }

  const detalji = await getSobaDetalji(sobaId)
  const linkovi = buildJoinLinks(sobaId, input.origin, assignments)

  revalidatePath('/dashboard/vapi/simulacija-1')

  return {
    data: {
      soba: detalji.data,
      linkovi,
      pusherConfigured: isPusherConfigured(),
    },
    error: null,
  }
}

export async function pridruziSeSobi(input: {
  sobaId: string
  uloga: VapiSimulacijaUloga
  ucenikId: number
}) {
  const parsed = pridruziSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()

  const { data: soba } = await supabase
    .from('vapi_soba')
    .select('id, status')
    .eq('id', parsed.data.sobaId)
    .maybeSingle()

  if (!soba) {
    return { data: null, error: 'Soba nije pronađena.' }
  }
  if (soba.status === 'zavrsena') {
    return { data: null, error: 'Simulacija je završena.' }
  }

  const { data: ucenik } = await supabase
    .from('vapi_ucenik')
    .select('id, ime, prezime')
    .eq('id', parsed.data.ucenikId)
    .maybeSingle()

  if (!ucenik) {
    return { data: null, error: 'Učenik nije pronađen.' }
  }

  const { data: slot, error: slotError } = await supabase
    .from('vapi_ucesnik_simulacije')
    .select('*')
    .eq('soba_id', parsed.data.sobaId)
    .eq('uloga', parsed.data.uloga)
    .maybeSingle()

  if (slotError || !slot) {
    return { data: null, error: slotError?.message || 'Uloga nije dostupna u ovoj sobi.' }
  }

  if (slot.ucenik_id && slot.ucenik_id !== parsed.data.ucenikId) {
    return {
      data: null,
      error: 'Ova uloga je već zauzeta drugim učenikom.',
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('vapi_ucesnik_simulacije')
    .update({
      ucenik_id: parsed.data.ucenikId,
      online_status: true,
      joined_at: new Date().toISOString(),
    })
    .eq('id', slot.id)
    .select('*, vapi_ucenik(ime, prezime, razred)')
    .single()

  if (updateError || !updated) {
    console.error('Error joining soba:', updateError)
    return { data: null, error: updateError?.message || 'Greška pri pridruživanju.' }
  }

  if (soba.status === 'kreirana') {
    await supabase.from('vapi_soba').update({ status: 'aktivna' }).eq('id', parsed.data.sobaId)
  }

  const ucenikIme = `${ucenik.ime}${ucenik.prezime ? ` ${ucenik.prezime}` : ''}`.trim()
  const channel = presenceChannelName(parsed.data.sobaId)

  const push = await triggerSobaEvent(channel, 'client-student-pristupio', {
    sobaId: parsed.data.sobaId,
    uloga: parsed.data.uloga,
    ucenikId: parsed.data.ucenikId,
    ucenikIme,
    online: true,
  })

  const detalji = await getSobaDetalji(parsed.data.sobaId)

  return {
    data: {
      ucesnik: updated as VapiUcesnikSimulacije,
      soba: detalji.data,
      pusherWarning: push.ok ? null : push.error,
    },
    error: null,
  }
}

export async function azurirajStanjeSimulacije(input: {
  sobaId: string
  vitalniParametri: VitalniParametri
  trenutnoStanje: string
  istorijaBolesti?: string | null
  hitanAlarm?: boolean
  poruka?: string | null
}) {
  const access = await requireSimulacijaAccess()
  if (access.error || !access.user) {
    return { data: null, error: access.error || 'Nemate dozvolu.' }
  }

  const parsed = azurirajStanjeSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const vitalni = normalizeVitalni(parsed.data.vitalniParametri)

  const updatePayload: Record<string, unknown> = {
    vitalni_parametri: vitalni,
    trenutno_stanje: parsed.data.trenutnoStanje.trim(),
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.istorijaBolesti !== undefined) {
    updatePayload.istorija_bolesti = parsed.data.istorijaBolesti
  }

  const { data: karton, error } = await supabase
    .from('vapi_karton_pacijenta')
    .update(updatePayload)
    .eq('soba_id', parsed.data.sobaId)
    .select()
    .single()

  if (error || !karton) {
    console.error('Error updating karton:', error)
    return { data: null, error: error?.message || 'Karton nije ažuriran.' }
  }

  const channel = presenceChannelName(parsed.data.sobaId)
  const payload = {
    sobaId: parsed.data.sobaId,
    vitalniParametri: vitalni,
    trenutnoStanje: parsed.data.trenutnoStanje.trim(),
    istorijaBolesti: (karton as VapiKartonPacijenta).istorija_bolesti,
    hitanAlarm: Boolean(parsed.data.hitanAlarm),
    poruka: parsed.data.poruka ?? null,
  }

  const push = await triggerSobaEvent(channel, 'update-state', payload)

  if (parsed.data.hitanAlarm) {
    await triggerSobaEvent(channel, 'hitan-alarm', {
      sobaId: parsed.data.sobaId,
      poruka: parsed.data.poruka || 'HITAN ALARM: Pogoršanje stanja pacijenta!',
      vitalniParametri: vitalni,
      trenutnoStanje: parsed.data.trenutnoStanje.trim(),
    })
  }

  revalidatePath('/dashboard/vapi/simulacija-1')

  return {
    data: {
      karton: {
        ...(karton as VapiKartonPacijenta),
        vitalni_parametri: vitalni,
      },
      pusherWarning: push.ok ? null : push.error,
    },
    error: null,
  }
}

export async function sacuvajZapisnik(input: {
  sobaId: string
  anamneza?: string | null
  terapija?: string | null
  lekovi?: string | null
}) {
  const parsed = zapisnikSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_karton_pacijenta')
    .update({
      anamneza: parsed.data.anamneza ?? null,
      terapija: parsed.data.terapija ?? null,
      lekovi: parsed.data.lekovi ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('soba_id', parsed.data.sobaId)
    .select()
    .single()

  if (error || !data) {
    return { data: null, error: error?.message || 'Greška pri čuvanju zapisnika.' }
  }

  const channel = presenceChannelName(parsed.data.sobaId)
  await triggerSobaEvent(channel, 'zapisnik-update', {
    sobaId: parsed.data.sobaId,
    anamneza: parsed.data.anamneza ?? null,
    terapija: parsed.data.terapija ?? null,
    lekovi: parsed.data.lekovi ?? null,
  })

  return { data: data as VapiKartonPacijenta, error: null }
}

export async function sacuvajBeleskePosmatraca(input: { sobaId: string; beleske?: string | null }) {
  const parsed = beleskeSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vapi_karton_pacijenta')
    .update({
      beleske_posmatrac: parsed.data.beleske ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('soba_id', parsed.data.sobaId)
    .select()
    .single()

  if (error || !data) {
    return { data: null, error: error?.message || 'Greška pri čuvanju beleški.' }
  }

  return { data: data as VapiKartonPacijenta, error: null }
}

export async function zavrsiSobu(sobaId: string) {
  const access = await requireSimulacijaAccess()
  if (access.error || !access.user) {
    return { error: access.error || 'Nemate dozvolu.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('vapi_soba').update({ status: 'zavrsena' }).eq('id', sobaId)

  if (error) {
    return { error: error.message }
  }

  await triggerSobaEvent(presenceChannelName(sobaId), 'update-state', {
    sobaId,
    vitalniParametri: DEFAULT_VITALNI,
    trenutnoStanje: 'zavrsena',
    poruka: 'Simulacija je završena od strane profesora.',
  })

  revalidatePath('/dashboard/vapi/simulacija-1')
  return { error: null, success: true }
}

export async function getSimulacijaJoinContext(sobaId: string) {
  const detalji = await getSobaDetalji(sobaId)
  if (detalji.error || !detalji.data) {
    return { data: null, error: detalji.error || 'Soba nije pronađena.' }
  }

  const supabase = createAdminClient()
  const { data: ucenici, error } = await supabase
    .from('vapi_ucenik')
    .select('id, ime, prezime, razred')
    .order('ime', { ascending: true })
    .limit(500)

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: {
      soba: detalji.data,
      ucenici: ucenici || [],
      pusherConfigured: isPusherConfigured(),
    },
    error: null,
  }
}

/**
 * Javni (bez dashboard logina) start config za trijažu u sobi.
 * Dozvoljen samo ako je asistent dodeljen toj sobi.
 */
export async function getSimulacijaVapiConfig(sobaId: string) {
  const detalji = await getSobaDetalji(sobaId)
  if (detalji.error || !detalji.data) {
    return { data: null, error: detalji.error || 'Soba nije pronađena.' }
  }

  const assistantDbId = detalji.data.assistant_id
  if (!assistantDbId) {
    return {
      data: null,
      error: 'Profesor nije izabrao Vapi asistenta za ovu sobu.',
    }
  }

  if (detalji.data.status === 'zavrsena') {
    return { data: null, error: 'Simulacija je završena.' }
  }

  const supabase = createAdminClient()
  const { data: assistant, error } = await supabase
    .from('vapi_assistants')
    .select('*')
    .eq('id', assistantDbId)
    .maybeSingle()

  if (error || !assistant) {
    return { data: null, error: error?.message || 'Asistent nije pronađen.' }
  }

  const publicKey =
    (typeof assistant.vapi_public_key === 'string' && assistant.vapi_public_key.trim()) ||
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim() ||
    null

  if (!publicKey) {
    return {
      data: null,
      error: 'Vapi Public key nije podešen za ovog asistenta.',
    }
  }

  if (!assistant.assistant_id) {
    return { data: null, error: 'Assistant ID nije podešen.' }
  }

  let simliSessionToken: string | null = null
  let simliIceServers: RTCIceServer[] = []
  let simliWarning: string | null = null

  if (assistant.ima_video_pacijenta) {
    if (!assistant.simli_face_id?.trim()) {
      simliWarning = 'Video pacijent je uključen, ali Simli face ID nije podešen.'
    } else {
      try {
        const { getSimliSessionToken, getSimliIceServers } = await import('@/lib/simli/server')
        simliSessionToken = await getSimliSessionToken(assistant.simli_face_id, {
          apiKey: assistant.simli_api_key,
          model: assistant.simli_model === 'artalk' ? 'artalk' : 'fasttalk',
          maxSessionLength: assistant.simli_max_session_length || 600,
          maxIdleTime: assistant.simli_max_idle_time || 600,
        })
        simliIceServers = await getSimliIceServers(assistant.simli_api_key)
      } catch (simliError) {
        simliWarning =
          simliError instanceof Error
            ? simliError.message
            : 'Simli token nije dostupan — nastavlja se samo audio.'
      }
    }
  }

  return {
    data: {
      assistantDbId: assistant.id as number,
      assistantId: assistant.assistant_id as string,
      publicKey,
      opisServisa: (assistant.opis_servisa as string | null) || null,
      imaVideoPacijenta: Boolean(assistant.ima_video_pacijenta) && Boolean(simliSessionToken),
      simliFaceId: (assistant.simli_face_id as string | null) || null,
      simliSessionToken,
      simliIceServers,
      simliWarning,
      vitalniZnaciDefault:
        (assistant.vitalni_znaci_default as Record<string, string | number> | null) || null,
    },
    error: null,
  }
}
