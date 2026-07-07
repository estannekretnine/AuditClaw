import { getSiteUrl } from '@/lib/utils/site-url'

const VAPI_API_BASE = 'https://api.vapi.ai'

export function getVapiPrivateKey(rowKey: string | null | undefined): string | null {
  return rowKey || process.env.VAPI_API_KEY || null
}

export function getVapiPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || null
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
