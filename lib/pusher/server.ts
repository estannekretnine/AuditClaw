import 'server-only'
import Pusher from 'pusher'

let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher {
  if (pusherInstance) return pusherInstance

  const appId = process.env.PUSHER_APP_ID?.trim()
  const key = process.env.PUSHER_KEY?.trim() || process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()
  const secret = process.env.PUSHER_SECRET?.trim()
  const cluster = process.env.PUSHER_CLUSTER?.trim() || process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      'Pusher nije konfigurisan. Dodajte PUSHER_APP_ID, PUSHER_KEY (ili NEXT_PUBLIC_PUSHER_KEY), PUSHER_SECRET i PUSHER_CLUSTER u env.'
    )
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: process.env.PUSHER_USE_TLS !== 'false',
  })

  return pusherInstance
}

export function isPusherConfigured(): boolean {
  const appId = process.env.PUSHER_APP_ID?.trim()
  const key = process.env.PUSHER_KEY?.trim() || process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()
  const secret = process.env.PUSHER_SECRET?.trim()
  const cluster = process.env.PUSHER_CLUSTER?.trim() || process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()
  return Boolean(appId && key && secret && cluster)
}

export async function triggerSobaEvent(
  channelName: string,
  eventName: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(channelName, eventName, data)
    return { ok: true, error: null }
  } catch (error) {
    console.error('Pusher trigger error:', error)
    const message = error instanceof Error ? error.message : 'Nepoznata Pusher greška'
    return { ok: false, error: message }
  }
}
