import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getVapiWebhookSecret } from '@/lib/vapi/server'
import { analyzeVapiCallTranscript } from '@/lib/vapi/analyze-call'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function extractTranscript(payload: Record<string, unknown>): string {
  if (typeof payload.transcript === 'string' && payload.transcript.trim()) {
    return payload.transcript
  }

  if (typeof payload.summary === 'string' && payload.summary.trim()) {
    return payload.summary
  }

  const messages = payload.messages
  if (Array.isArray(messages)) {
    return messages
      .map((msg) => {
        if (!msg || typeof msg !== 'object') return ''
        const record = msg as Record<string, unknown>
        const role = typeof record.role === 'string' ? record.role : 'unknown'
        const content =
          typeof record.content === 'string'
            ? record.content
            : typeof record.message === 'string'
              ? record.message
              : typeof record.text === 'string'
                ? record.text
                : ''
        return content ? `${role}: ${content}` : ''
      })
      .filter(Boolean)
      .join('\n')
  }

  return ''
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

  const call = payload.call
  if (call && typeof call === 'object') {
    const callRecord = call as Record<string, unknown>
    const metadata = callRecord.metadata
    if (metadata && typeof metadata === 'object') {
      const metaRecord = metadata as Record<string, unknown>
      const dbId = metaRecord.assistantDbId
      if (typeof dbId === 'string' || typeof dbId === 'number') {
        const parsed = Number(dbId)
        if (!Number.isNaN(parsed)) return parsed
      }
    }
  }

  return null
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
    const messageType = typeof payload.message === 'object' && payload.message !== null
      ? (payload.message as Record<string, unknown>).type
      : payload.type

    if (messageType !== 'end-of-call-report') {
      return NextResponse.json({ received: true })
    }

    const report =
      typeof payload.message === 'object' && payload.message !== null
        ? (payload.message as Record<string, unknown>)
        : payload

    const transcript = extractTranscript(report)
    if (!transcript.trim()) {
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

    const analysis = await analyzeVapiCallTranscript(transcript)

    const { error } = await supabase.from('vapi_odgovor').insert([
      {
        dijalog: transcript,
        obrazlozenjeocene_ai: analysis?.obrazlozenjeocene_ai || null,
        ocena_ai: analysis?.ocena_ai || null,
        assistant_id: assistantDbId,
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
