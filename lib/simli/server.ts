import 'server-only'

export interface SimliFaceOption {
  id: string
  label: string
}

export const DEFAULT_SIMLI_FACE_OPTIONS: SimliFaceOption[] = [
  { id: '5514e24d-6086-46a3-ace4-6a7264e5cb7c', label: 'Pacijent M' },
  { id: 'f8bf3b2d-8162-4436-8452-e4f96f3c8e2f', label: 'Pacijentkinja A' },
  { id: '76a4f8d6-7b1f-4ce8-9098-026f5ba64a9f', label: 'Pacijentkinja B' },
  { id: '35f9cc21-c5fe-4c69-8f5d-9f01a2c9f728', label: 'Pacijent S' },
]

function requireSimliApiKey(): string {
  const key = process.env.SIMLI_API_KEY?.trim()
  if (!key) {
    throw new Error('SIMLI_API_KEY nije podešen u env varijablama.')
  }
  return key
}

interface SimliSessionOptions {
  model?: 'fasttalk' | 'artalk'
  maxSessionLength?: number
  maxIdleTime?: number
}

export async function getSimliSessionToken(
  faceId: string,
  options: SimliSessionOptions = {}
): Promise<string> {
  const apiKey = requireSimliApiKey()
  const cleanFaceId = faceId.trim()
  if (!cleanFaceId) {
    throw new Error('Simli face ID je obavezan za video pacijenta.')
  }

  const model = options.model === 'artalk' ? 'artalk' : 'fasttalk'
  const maxSessionLength = Number.isFinite(options.maxSessionLength)
    ? Math.min(3600, Math.max(60, Number(options.maxSessionLength)))
    : 600
  const maxIdleTime = Number.isFinite(options.maxIdleTime)
    ? Math.min(3600, Math.max(30, Number(options.maxIdleTime)))
    : 600

  const response = await fetch('https://api.simli.ai/compose/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-simli-api-key': apiKey,
    },
    body: JSON.stringify({
      faceId: cleanFaceId,
      isJPG: false,
      syncAudio: true,
      handleSilence: true,
      maxSessionLength,
      maxIdleTime,
      model,
    }),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Simli token greška (${response.status}): ${message.slice(0, 200)}`)
  }
  const tokenResult = (await response.json()) as { session_token?: string }

  if (!tokenResult?.session_token) {
    throw new Error('Simli nije vratio session token za pokretanje video avatara.')
  }

  return tokenResult.session_token
}

export async function getSimliIceServers() {
  const apiKey = requireSimliApiKey()
  const response = await fetch('https://api.simli.ai/compose/ice', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-simli-api-key': apiKey,
    },
  })
  if (!response.ok) {
    return [{ urls: ['stun:stun.l.google.com:19302'] }]
  }
  const iceServers = (await response.json()) as RTCIceServer[]
  if (!Array.isArray(iceServers) || iceServers.length === 0) {
    return [{ urls: ['stun:stun.l.google.com:19302'] }]
  }
  return iceServers
}
