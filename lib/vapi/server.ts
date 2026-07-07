import { getSiteUrl } from '@/lib/utils/site-url'

const VAPI_API_BASE = 'https://api.vapi.ai'

export function getVapiPrivateKey(rowKey: string | null | undefined): string | null {
  const trimmed = rowKey?.trim()
  if (trimmed) return trimmed
  const envKey = process.env.VAPI_API_KEY?.trim()
  return envKey || null
}

export function getVapiPublicKeyForCall(rowPublicKey: string | null | undefined): string | null {
  const trimmed = rowPublicKey?.trim()
  if (trimmed) return trimmed
  return process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim() || null
}

export function getVapiWebhookSecret(): string | null {
  return process.env.VAPI_WEBHOOK_SECRET || null
}

export function getVapiWebhookUrl(assistantDbId: number): string {
  return `${getSiteUrl()}/api/vapi/webhook?assistantDbId=${assistantDbId}`
}

interface VapiApiResult {
  ok: boolean
  error: string | null
}

export async function validateVapiAssistant(
  vapiAssistantId: string,
  privateApiKey: string
): Promise<VapiApiResult> {
  try {
    const response = await fetch(`${VAPI_API_BASE}/assistant/${vapiAssistantId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${privateApiKey}`,
      },
    })

    if (response.status === 404) {
      return {
        ok: false,
        error: `Assistant ID "${vapiAssistantId}" nije pronađen u Vapi nalogu. Proverite ID u Vapi dashboardu.`,
      }
    }

    if (!response.ok) {
      const body = await response.text()
      if (response.status === 401) {
        return {
          ok: false,
          error:
            'Vapi Private API key nije ispravan (401). U polju vapi_api_key mora biti PRIVATE key iz Vapi dashboarda (API Keys → Private), ne Public key. Private i Public key su različiti — proverite i Assistant ID da su sa istog Vapi naloga.',
        }
      }
      return { ok: false, error: `Vapi API greška (${response.status}): ${body.slice(0, 200)}` }
    }

    return { ok: true, error: null }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Greška pri proveri Vapi asistenta',
    }
  }
}

export async function createVapiWebCall(
  vapiAssistantId: string,
  publicApiKey: string,
  assistantDbId: number
): Promise<{
  ok: boolean
  error: string | null
  data: { webCallUrl: string; callId?: string } | null
}> {
  try {
    const response = await fetch(`${VAPI_API_BASE}/call/web`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: vapiAssistantId,
        assistantOverrides: {
          metadata: {
            assistantDbId: String(assistantDbId),
          },
        },
      }),
    })

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>

    if (!response.ok) {
      const message =
        typeof body.message === 'string'
          ? body.message
          : typeof body.error === 'string'
            ? body.error
            : JSON.stringify(body)
      return { ok: false, error: `Vapi greška (${response.status}): ${message}`, data: null }
    }

    const transport =
      typeof body.transport === 'object' && body.transport !== null
        ? (body.transport as Record<string, unknown>)
        : null

    const webCallUrl =
      (typeof body.webCallUrl === 'string' ? body.webCallUrl : null) ||
      (transport && typeof transport.callUrl === 'string' ? transport.callUrl : null) ||
      (transport && typeof transport.webCallUrl === 'string' ? transport.webCallUrl : null)

    if (!webCallUrl) {
      return { ok: false, error: 'Vapi nije vratio webCallUrl za poziv.', data: null }
    }

    return {
      ok: true,
      error: null,
      data: {
        webCallUrl,
        callId: typeof body.id === 'string' ? body.id : undefined,
      },
    }
  } catch (error) {
    console.error('Vapi create web call error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Greška pri kreiranju Vapi poziva',
      data: null,
    }
  }
}

export async function syncVapiAssistantWebhook(
  vapiAssistantId: string,
  privateApiKey: string,
  assistantDbId: number
): Promise<VapiApiResult> {
  const webhookSecret = getVapiWebhookSecret()
  if (!webhookSecret) {
    return { ok: false, error: 'VAPI_WEBHOOK_SECRET nije konfigurisan u env varijablama.' }
  }

  const serverUrl = getVapiWebhookUrl(assistantDbId)

  try {
    const response = await fetch(`${VAPI_API_BASE}/assistant/${vapiAssistantId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${privateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverUrl,
        serverUrlSecret: webhookSecret,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Vapi webhook sync failed:', response.status, body)
      return { ok: false, error: `Vapi API greška (${response.status}): ${body.slice(0, 200)}` }
    }

    return { ok: true, error: null }
  } catch (error) {
    console.error('Vapi webhook sync error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Nepoznata greška pri sinhronizaciji webhook-a',
    }
  }
}
