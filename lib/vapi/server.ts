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

interface VapiAssistantRemote {
  id?: string
  name?: string
  model?: Record<string, unknown>
  voice?: Record<string, unknown>
}

function getDefaultModelConfig(systemPrompt: string | null): Record<string, unknown> {
  const provider = process.env.VAPI_DEFAULT_MODEL_PROVIDER?.trim() || 'openai'
  const model = process.env.VAPI_DEFAULT_MODEL?.trim() || 'gpt-4o'

  const config: Record<string, unknown> = { provider, model }
  if (systemPrompt?.trim()) {
    config.messages = [{ role: 'system', content: systemPrompt.trim() }]
  }
  return config
}

function getDefaultVoiceConfig(): { ok: true; voice: Record<string, unknown> } | { ok: false; error: string } {
  const voiceId = process.env.VAPI_DEFAULT_VOICE_ID?.trim()
  if (!voiceId) {
    return {
      ok: false,
      error:
        'VAPI_DEFAULT_VOICE_ID nije podešen u env. Administrator ga jednom postavlja u Vercel (Vapi glas za nove asistente).',
    }
  }

  const provider = process.env.VAPI_DEFAULT_VOICE_PROVIDER?.trim() || '11labs'
  return { ok: true, voice: { provider, voiceId } }
}

// Gradi ČIST voice objekat bez fallbackPlan-a. Vapi dashboard ume automatski da
// doda neispravan fallback glas (npr. Cartesia sa praznim voiceId), što blokira
// objavljivanje i ostavlja asistenta bez glasa (poziv ćuti). Slanjem čistog
// voice objekta preko API-ja zamenjujemo ceo voice i uklanjamo pokvareni fallback.
function buildCleanVoice(
  remoteVoice: Record<string, unknown> | undefined
): Record<string, unknown> | null {
  const envVoiceId = process.env.VAPI_DEFAULT_VOICE_ID?.trim()
  if (envVoiceId) {
    const envProvider = process.env.VAPI_DEFAULT_VOICE_PROVIDER?.trim() || '11labs'
    return { provider: envProvider, voiceId: envVoiceId }
  }

  if (remoteVoice) {
    const provider = typeof remoteVoice.provider === 'string' ? remoteVoice.provider.trim() : ''
    const voiceId =
      typeof remoteVoice.voiceId === 'string'
        ? remoteVoice.voiceId.trim()
        : typeof remoteVoice.voiceId === 'number'
          ? String(remoteVoice.voiceId)
          : ''
    if (provider && voiceId) {
      return { provider, voiceId }
    }
  }

  return null
}

function buildServerPayload(assistantDbId: number, webhookSecret: string) {
  const serverUrl = getVapiWebhookUrl(assistantDbId)
  return {
    server: {
      url: serverUrl,
      secret: webhookSecret,
      timeoutSeconds: 20,
    },
    serverUrl,
    serverUrlSecret: webhookSecret,
  }
}

async function patchVapiAssistant(
  vapiAssistantId: string,
  privateApiKey: string,
  body: Record<string, unknown>
): Promise<VapiApiResult> {
  const response = await fetch(`${VAPI_API_BASE}/assistant/${vapiAssistantId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${privateApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.ok) {
    return { ok: true, error: null }
  }

  const text = await response.text()
  return { ok: false, error: `Vapi API greška (${response.status}): ${text.slice(0, 300)}` }
}

export async function fetchVapiAssistant(
  vapiAssistantId: string,
  privateApiKey: string
): Promise<{ ok: boolean; error: string | null; data: VapiAssistantRemote | null }> {
  try {
    const response = await fetch(`${VAPI_API_BASE}/assistant/${vapiAssistantId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${privateApiKey}` },
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        ok: false,
        error: `Vapi API greška (${response.status}): ${body.slice(0, 200)}`,
        data: null,
      }
    }

    const data = (await response.json()) as VapiAssistantRemote
    return { ok: true, error: null, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Greška pri učitavanju Vapi asistenta',
      data: null,
    }
  }
}

export async function createVapiAssistantOnPlatform(options: {
  privateApiKey: string
  assistantDbId: number
  name: string
  systemPrompt: string | null
}): Promise<{ ok: boolean; error: string | null; assistantId: string | null }> {
  const webhookSecret = getVapiWebhookSecret()
  if (!webhookSecret) {
    return { ok: false, error: 'VAPI_WEBHOOK_SECRET nije konfigurisan u env varijablama.', assistantId: null }
  }

  const voiceResult = getDefaultVoiceConfig()
  if (!voiceResult.ok) {
    return { ok: false, error: voiceResult.error, assistantId: null }
  }

  const server = buildServerPayload(options.assistantDbId, webhookSecret)

  try {
    const response = await fetch(`${VAPI_API_BASE}/assistant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.privateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: options.name.trim() || `AuditClaw #${options.assistantDbId}`,
        model: getDefaultModelConfig(options.systemPrompt),
        voice: voiceResult.voice,
        server: server.server,
        firstMessage: 'Zdravo! Kako vam mogu pomoći?',
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
      return { ok: false, error: `Vapi greška (${response.status}): ${message}`, assistantId: null }
    }

    const assistantId = typeof body.id === 'string' ? body.id : null
    if (!assistantId) {
      return { ok: false, error: 'Vapi nije vratio ID novog asistenta.', assistantId: null }
    }

    return { ok: true, error: null, assistantId }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Greška pri kreiranju Vapi asistenta',
      assistantId: null,
    }
  }
}

export async function syncVapiAssistantConfig(options: {
  vapiAssistantId: string
  privateApiKey: string
  assistantDbId: number
  name: string | null
  systemPrompt: string | null
}): Promise<VapiApiResult> {
  const webhookSecret = getVapiWebhookSecret()
  if (!webhookSecret) {
    return { ok: false, error: 'VAPI_WEBHOOK_SECRET nije konfigurisan u env varijablama.' }
  }

  const remote = await fetchVapiAssistant(options.vapiAssistantId, options.privateApiKey)
  if (!remote.ok || !remote.data) {
    return { ok: false, error: remote.error || 'Asistent nije pronađen na Vapi platformi.' }
  }

  const existingModel =
    remote.data.model && typeof remote.data.model === 'object' ? { ...remote.data.model } : {}

  if (options.systemPrompt?.trim()) {
    existingModel.messages = [{ role: 'system', content: options.systemPrompt.trim() }]
  }

  const patchBody: Record<string, unknown> = {
    model: existingModel,
    server: buildServerPayload(options.assistantDbId, webhookSecret).server,
  }

  // Postavi čist glas (bez pokvarenog fallback plana) da poziv sigurno ima zvuk.
  const cleanVoice = buildCleanVoice(remote.data.voice)
  if (cleanVoice) {
    patchBody.voice = cleanVoice
  }

  if (options.name?.trim()) {
    patchBody.name = options.name.trim()
  }

  const primary = await patchVapiAssistant(options.vapiAssistantId, options.privateApiKey, patchBody)
  if (primary.ok) {
    return primary
  }

  const legacyBody: Record<string, unknown> = {
    model: existingModel,
    serverUrl: buildServerPayload(options.assistantDbId, webhookSecret).serverUrl,
    serverUrlSecret: webhookSecret,
  }
  if (cleanVoice) {
    legacyBody.voice = cleanVoice
  }

  const legacy = await patchVapiAssistant(options.vapiAssistantId, options.privateApiKey, legacyBody)

  return legacy
}

export async function pushAssistantToVapi(options: {
  vapiAssistantId: string | null
  privateApiKey: string
  assistantDbId: number
  name: string | null
  systemPrompt: string | null
}): Promise<{ ok: boolean; error: string | null; assistantId: string | null }> {
  if (!options.vapiAssistantId?.trim()) {
    return createVapiAssistantOnPlatform({
      privateApiKey: options.privateApiKey,
      assistantDbId: options.assistantDbId,
      name: options.name?.trim() || `AuditClaw #${options.assistantDbId}`,
      systemPrompt: options.systemPrompt,
    })
  }

  const sync = await syncVapiAssistantConfig({
    vapiAssistantId: options.vapiAssistantId.trim(),
    privateApiKey: options.privateApiKey,
    assistantDbId: options.assistantDbId,
    name: options.name,
    systemPrompt: options.systemPrompt,
  })

  return {
    ok: sync.ok,
    error: sync.error,
    assistantId: options.vapiAssistantId.trim(),
  }
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
  return syncVapiAssistantConfig({
    vapiAssistantId,
    privateApiKey,
    assistantDbId,
    name: null,
    systemPrompt: null,
  })
}

// Postavlja SAMO webhook (server) na asistentu, bez diranja model/voice
// konfiguracije. Koristi se pri pokretanju poziva da ne bi menjali LLM/glas
// asistenta (što bi moglo da prekine govor).
export async function patchVapiWebhookOnly(
  vapiAssistantId: string,
  privateApiKey: string,
  assistantDbId: number
): Promise<VapiApiResult> {
  const webhookSecret = getVapiWebhookSecret()
  if (!webhookSecret) {
    return { ok: false, error: 'VAPI_WEBHOOK_SECRET nije konfigurisan u env varijablama.' }
  }

  const payload = buildServerPayload(assistantDbId, webhookSecret)

  const primary = await patchVapiAssistant(vapiAssistantId, privateApiKey, {
    server: payload.server,
  })
  if (primary.ok) {
    return primary
  }

  return patchVapiAssistant(vapiAssistantId, privateApiKey, {
    serverUrl: payload.serverUrl,
    serverUrlSecret: webhookSecret,
  })
}
