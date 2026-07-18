'use client'

import PusherClient from 'pusher-js'

let clientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (clientInstance) return clientInstance

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()

  if (!key || !cluster) {
    throw new Error(
      'Pusher klijent nije konfigurisan. Dodajte NEXT_PUBLIC_PUSHER_KEY i NEXT_PUBLIC_PUSHER_CLUSTER.'
    )
  }

  clientInstance = new PusherClient(key, {
    cluster,
    authEndpoint: '/api/pusher/auth',
    authTransport: 'ajax',
    forceTLS: true,
  })

  return clientInstance
}

export function isPusherClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim()
  )
}
