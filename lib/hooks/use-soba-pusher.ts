'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Channel, Members, PresenceChannel } from 'pusher-js'
import { getPusherClient, isPusherClientConfigured } from '@/lib/pusher/client'
import {
  presenceChannelName,
  type HitanAlarmPayload,
  type StudentPristupioPayload,
  type UpdateStatePayload,
} from '@/lib/types/vapi-simulacija'

export interface PresenceMember {
  id: string
  name?: string
  role?: string
}

interface UseSobaPusherOptions {
  sobaId: string | null
  enabled?: boolean
  onStudentJoined?: (payload: StudentPristupioPayload) => void
  onUpdateState?: (payload: UpdateStatePayload) => void
  onHitanAlarm?: (payload: HitanAlarmPayload) => void
  onZapisnikUpdate?: (payload: Record<string, unknown>) => void
}

export function useSobaPusher({
  sobaId,
  enabled = true,
  onStudentJoined,
  onUpdateState,
  onHitanAlarm,
  onZapisnikUpdate,
}: UseSobaPusherOptions) {
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [members, setMembers] = useState<PresenceMember[]>([])
  const channelRef = useRef<PresenceChannel | Channel | null>(null)

  const onStudentJoinedRef = useRef(onStudentJoined)
  const onUpdateStateRef = useRef(onUpdateState)
  const onHitanAlarmRef = useRef(onHitanAlarm)
  const onZapisnikUpdateRef = useRef(onZapisnikUpdate)

  useEffect(() => {
    onStudentJoinedRef.current = onStudentJoined
    onUpdateStateRef.current = onUpdateState
    onHitanAlarmRef.current = onHitanAlarm
    onZapisnikUpdateRef.current = onZapisnikUpdate
  }, [onStudentJoined, onUpdateState, onHitanAlarm, onZapisnikUpdate])

  const syncMembers = useCallback((presence: Members) => {
    const list: PresenceMember[] = []
    presence.each((member: { id: string; info?: { name?: string; role?: string } }) => {
      list.push({
        id: member.id,
        name: member.info?.name,
        role: member.info?.role,
      })
    })
    setMembers(list)
  }, [])

  useEffect(() => {
    if (!enabled || !sobaId) return

    if (!isPusherClientConfigured()) {
      setConnectionError(
        'Pusher nije konfigurisan (NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER).'
      )
      setConnected(false)
      return
    }

    let cancelled = false
    let channel: PresenceChannel | null = null

    try {
      const pusher = getPusherClient()
      const channelName = presenceChannelName(sobaId)

      const handleStateChange = (states: { previous: string; current: string }) => {
        if (cancelled) return
        setConnected(states.current === 'connected')
        if (states.current === 'connected') {
          setConnectionError(null)
        } else if (states.current === 'unavailable' || states.current === 'failed') {
          setConnectionError('WebSocket veza sa Pusher-om nije dostupna.')
        } else if (states.current === 'disconnected') {
          setConnectionError('Veza sa Pusher-om je prekinuta. Pokušavam ponovo...')
        }
      }

      pusher.connection.bind('state_change', handleStateChange)
      pusher.connection.bind('error', (err: unknown) => {
        if (cancelled) return
        console.error('Pusher connection error:', err)
        setConnectionError('Greška pri povezivanju na Pusher kanal.')
        setConnected(false)
      })

      channel = pusher.subscribe(channelName) as PresenceChannel
      channelRef.current = channel

      channel.bind('pusher:subscription_succeeded', (membersData: Members) => {
        if (cancelled) return
        setConnected(true)
        setConnectionError(null)
        syncMembers(membersData)
      })

      channel.bind('pusher:subscription_error', (status: number) => {
        if (cancelled) return
        setConnected(false)
        setConnectionError(`Greška autentifikacije Pusher kanala (${status}).`)
      })

      channel.bind('pusher:member_added', () => {
        if (cancelled || !channel) return
        syncMembers(channel.members)
      })

      channel.bind('pusher:member_removed', () => {
        if (cancelled || !channel) return
        syncMembers(channel.members)
      })

      channel.bind('client-student-pristupio', (payload: StudentPristupioPayload) => {
        onStudentJoinedRef.current?.(payload)
      })

      channel.bind('update-state', (payload: UpdateStatePayload) => {
        onUpdateStateRef.current?.(payload)
      })

      channel.bind('hitan-alarm', (payload: HitanAlarmPayload) => {
        onHitanAlarmRef.current?.(payload)
      })

      channel.bind('zapisnik-update', (payload: Record<string, unknown>) => {
        onZapisnikUpdateRef.current?.(payload)
      })

      setConnected(pusher.connection.state === 'connected')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nepoznata Pusher greška'
      setConnectionError(message)
      setConnected(false)
    }

    return () => {
      cancelled = true
      try {
        if (channel && sobaId) {
          const pusher = getPusherClient()
          pusher.unsubscribe(presenceChannelName(sobaId))
        }
      } catch {
        // ignore
      }
      channelRef.current = null
      setConnected(false)
    }
  }, [enabled, sobaId, syncMembers])

  return {
    connected,
    connectionError,
    members,
  }
}
