import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getVapiWebhookSecret } from '@/lib/vapi/server'
import { analyzeVapiCallTranscript } from '@/lib/vapi/analyze-call'
import { extractVapiCallDialog, extractVapiCallSummary } from '@/lib/vapi/extract-transcript'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

// Vapi metadata koju šaljemo preko assistantOverrides.metadata može u izveštaju
// da se nađe na više mesta, pa proveravamo sve verovatne lokacije.
function getMetadataSources(payload: Record<string, unknown>): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = []
  const push = (value: unknown) => {
    const record = asRecord(value)
    if (record) sources.push(record)
  }

  const call = asRecord(payload.call)
  push(call?.metadata)
  push(asRecord(call?.assistantOverrides)?.metadata)
  push(asRecord(payload.assistantOverrides)?.metadata)
  push(asRecord(payload.assistant)?.metadata)
  push(payload.metadata)

  return sources
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

// Rekurzivno traži ključ bilo gde u izveštaju (poslednji fallback), sa
// ograničenjem dubine da izbegnemo skupu/beskonačnu pretragu.
function deepFindNumber(value: unknown, key: string, depth = 0): number | null {
  if (depth > 6 || !value || typeof value !== 'object') return null

  if (!Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const direct = toNumber(record[key])
    if (direct !== null) return direct
  }

  const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>)
  for (const entry of entries) {
    const found = deepFindNumber(entry, key, depth + 1)
    if (found !== null) return found
  }
  return null
}

function readMetadataNumber(payload: Record<string, unknown>, key: string): number | null {
  for (const source of getMetadataSources(payload)) {
    const value = toNumber(source[key])
    if (value !== null) return value
  }
  return deepFindNumber(payload, key)
}

function resolveAssistantDbId(
  request: NextRequest,
  payload: Record<string, unknown>
): number | null {
  const queryId = request.nextUrl.searchParams.get('assistantDbId')
  if (queryId) {
    const parsed = Number(queryId)
    if (!Number.isNaN(parsed)) return parsed
  }

  return readMetadataNumber(payload, 'assistantDbId')
}

function resolveUcenikId(payload: Record<string, unknown>): number | null {
  return readMetadataNumber(payload, 'ucenikid')
}

function resolveProfesorId(payload: Record<string, unknown>): number | null {
  return readMetadataNumber(payload, 'profesorid')
}

async function resolveProfesorIdFromDb(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  payload: Record<string, unknown>
): Promise<number | null> {
  const direct = resolveProfesorId(payload)
  if (direct !== null) return direct

  const korisnikId = readMetadataNumber(payload, 'korisnikid')
  if (korisnikId === null) return null

  const { data } = await supabase
    .from('korisnici')
    .select('profesorid')
    .eq('id', korisnikId)
    .maybeSingle()

  return data?.profesorid ?? null
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = getVapiWebhookSecret()
    if (webhookSecret) {
      const incomingSecret =
        request.headers.get('x-vapi-secret') ||
        request.headers.get('authorization')?.replace('Bearer ', '')
      if (incomingSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload = (await request.json()) as Record<string, unknown>
    const messageType =
      typeof payload.message === 'object' && payload.message !== null
        ? (payload.message as Record<string, unknown>).type
        : payload.type

    if (messageType !== 'end-of-call-report') {
      return NextResponse.json({ received: true })
    }

    const report =
      typeof payload.message === 'object' && payload.message !== null
        ? (payload.message as Record<string, unknown>)
        : payload

    const dijalog = extractVapiCallDialog(report)
    if (!dijalog.trim()) {
      return NextResponse.json({ received: true, skipped: 'empty transcript' })
    }

    const assistantDbId = resolveAssistantDbId(request, report)
    if (!assistantDbId) {
      console.error('Vapi webhook: assistantDbId nije pronađen')
      return NextResponse.json({ error: 'assistantDbId missing' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: assistant } = await supabase
      .from('vapi_assistants')
      .select('opis_servisa, System_Prompt')
      .eq('id', assistantDbId)
      .single()

    const summary = extractVapiCallSummary(report)
    const analysis = await analyzeVapiCallTranscript(dijalog, {
      opisServisa: assistant?.opis_servisa,
      systemPrompt: assistant?.System_Prompt,
      summary,
    })

    const ucenikId = resolveUcenikId(report)
    const profesorId = await resolveProfesorIdFromDb(supabase, report)
    if (ucenikId === null) {
      const call = asRecord(report.call)
      console.warn('Vapi webhook: ucenikid nije pronađen u metadata.', {
        reportKeys: Object.keys(report),
        callKeys: call ? Object.keys(call) : null,
        callMetadata: call?.metadata ?? null,
        callAssistantOverrides: asRecord(call?.assistantOverrides)?.metadata ?? null,
      })
    }

    const { error } = await supabase.from('vapi_odgovor').insert([
      {
        dijalog,
        obrazlozenjeocene_ai: analysis?.obrazlozenjeocene_ai || null,
        ocena_ai: analysis?.ocena_ai || null,
        assistant_id: assistantDbId,
        ucenikid: ucenikId,
        profesorid: profesorId,
        datumvreme: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Vapi webhook insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ received: true, saved: true })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Vapi webhook endpoint is active' })
}
