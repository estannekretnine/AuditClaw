'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import DailyIframe, { type DailyCall } from '@daily-co/daily-js'
import { Bot, Mic, PhoneOff, X } from 'lucide-react'
import type { VapiUcenik } from '@/lib/types/vapi'
import { VapiSimliAvatar } from '@/components/admin/vapi-simli-avatar'

export interface VapiStartConfig {
  assistantDbId: number
  assistantId: string
  publicKey: string
  opisServisa: string | null
  imaVideoPacijenta?: boolean
  simliFaceId?: string | null
  vitalniZnaciDefault?: Record<string, string | number> | null
  simliSessionToken?: string | null
  simliIceServers?: RTCIceServer[]
  webhookSynced?: boolean
  webhookWarning?: string | null
}

interface TranscriptLine {
  role: string
  text: string
}

interface VitalSigns {
  pritisak?: string
  puls?: number
  temperatura?: number
  saturacija?: number
  secer?: number
}

interface VapiCallModalProps {
  open: boolean
  onClose: () => void
  config: VapiStartConfig | null
  loading?: boolean
  loadError?: string | null
  ucenici?: VapiUcenik[]
}

function extractVapiError(event: unknown): string {
  if (typeof event === 'string' && event.trim()) return event
  if (!event || typeof event !== 'object') return 'Greška pri audio pozivu.'

  const record = event as Record<string, unknown>

  if (typeof record.errorMsg === 'string' && record.errorMsg.trim()) return record.errorMsg
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.error === 'string' && record.error.trim()) return record.error

  if (record.error && typeof record.error === 'object') {
    const nested = record.error as Record<string, unknown>
    if (typeof nested.message === 'string' && nested.message.trim()) return nested.message
    if (typeof nested.msg === 'string' && nested.msg.trim()) return nested.msg
    if (Array.isArray(nested.message)) {
      const joined = nested.message.filter((m) => typeof m === 'string').join(' ')
      if (joined.trim()) return joined
    }
    try {
      const serialized = JSON.stringify(nested)
      if (serialized && serialized !== '{}') return serialized.slice(0, 300)
    } catch {
      // ignore
    }
  }

  if (Array.isArray(record.message)) {
    const joined = record.message.filter((m) => typeof m === 'string').join(' ')
    if (joined.trim()) return joined
  }

  try {
    const serialized = JSON.stringify(record)
    if (serialized && serialized !== '{}') return serialized.slice(0, 300)
  } catch {
    // ignore
  }

  return 'Greška pri audio pozivu.'
}

function isBenignCallEndMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('meeting has ended') ||
    lower.includes('call ended') ||
    lower.includes('ejected')
  )
}

function isDeviceInUseMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('in use') || lower.includes('notreadable') || lower.includes('not allowed')
}

function ucenikLabel(ucenik: VapiUcenik): string {
  const puno = `${ucenik.ime} ${ucenik.prezime || ''}`.trim()
  return ucenik.razred ? `${puno} — ${ucenik.razred}` : puno
}

function stopDailyLocalTrack(state: unknown): void {
  if (!state || typeof state !== 'object') return
  const track = (state as { track?: MediaStreamTrack }).track
  track?.stop?.()
}

function releaseAllParticipantTracks(daily: DailyCall): void {
  try {
    const participants = daily.participants()
    for (const participant of Object.values(participants)) {
      const tracks = participant.tracks
      if (!tracks) continue
      for (const trackEntry of Object.values(tracks)) {
        const mediaTrack = trackEntry?.persistentTrack ?? trackEntry?.track
        mediaTrack?.stop?.()
      }
    }
  } catch {
    // ignore
  }

  try {
    stopDailyLocalTrack(daily.localAudio())
    stopDailyLocalTrack(daily.localVideo())
  } catch {
    // ignore
  }
}

async function releaseDailyCall(daily: DailyCall): Promise<void> {
  try {
    await daily.setLocalAudio(false)
  } catch {
    // ignore
  }
  try {
    await daily.setLocalVideo(false)
  } catch {
    // ignore
  }

  releaseAllParticipantTracks(daily)

  try {
    await daily.leave()
  } catch {
    // ignore
  }
  try {
    await daily.destroy()
  } catch {
    // ignore
  }
}

async function forceReleaseMediaDevices(vapi: Vapi | null): Promise<void> {
  if (vapi) {
    const daily = vapi.getDailyCallObject()
    if (daily) {
      await releaseDailyCall(daily)
    }

    try {
      vapi.end()
    } catch {
      // ignore
    }
    try {
      await vapi.stop()
    } catch {
      // ignore
    }

    vapi.removeAllListeners()
  }

  try {
    const existing = DailyIframe.getCallInstance()
    if (existing) {
      await releaseDailyCall(existing)
    }
  } catch {
    // ignore
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
}

export function VapiCallModal({
  open,
  onClose,
  config,
  loading = false,
  loadError = null,
  ucenici = [],
}: VapiCallModalProps) {
  const vapiRef = useRef<Vapi | null>(null)
  const hasStartedRef = useRef(false)
  const cleanupInProgressRef = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedUcenikId, setSelectedUcenikId] = useState('')
  const [ucenikQuery, setUcenikQuery] = useState('')
  const [showUcenikList, setShowUcenikList] = useState(false)
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({})
  const [updatedVitalKey, setUpdatedVitalKey] = useState<string | null>(null)

  const handleSimliError = useCallback((message: string) => {
    setError(message)
  }, [])

  const cleanupCall = useCallback(async () => {
    if (cleanupInProgressRef.current) return
    cleanupInProgressRef.current = true
    setIsReleasing(true)

    const vapi = vapiRef.current
    vapiRef.current = null

    await forceReleaseMediaDevices(vapi)

    hasStartedRef.current = false
    setIsConnected(false)
    setIsStarting(false)
    setIsReleasing(false)
    cleanupInProgressRef.current = false
  }, [])

  const initVapi = useCallback((publicKey: string) => {
    const vapi = new Vapi(
      publicKey.trim(),
      undefined,
      { alwaysIncludeMicInPermissionPrompt: true },
      { startAudioOff: false }
    )
    vapiRef.current = vapi
    return vapi
  }, [])

  const disableLocalVideo = useCallback(async (vapi: Vapi) => {
    const daily = vapi.getDailyCallObject()
    if (!daily) return
    try {
      await daily.setLocalVideo(false)
    } catch {
      // ignore
    }
    try {
      stopDailyLocalTrack(daily.localVideo())
    } catch {
      // ignore
    }
  }, [])

  const attachVapiListeners = useCallback((vapi: Vapi) => {
    vapi.removeAllListeners()

    vapi.on('call-start', async () => {
      hasStartedRef.current = true
      setIsConnected(true)
      setIsStarting(false)
      await disableLocalVideo(vapi)
    })

    vapi.on('call-start-success', async () => {
      hasStartedRef.current = true
      setIsConnected(true)
      setIsStarting(false)
      await disableLocalVideo(vapi)
    })

    vapi.on('call-start-failed', async (event) => {
      console.error('[Vapi] call-start-failed', event)
      const message =
        event && typeof event === 'object' && 'error' in event
          ? String((event as { error: unknown }).error)
          : 'Neuspelo pokretanje poziva.'
      setError(message)
      setIsStarting(false)
      setIsConnected(false)
      await cleanupCall()
    })

    vapi.on('call-end', async () => {
      setIsConnected(false)
      setIsStarting(false)
      setCallEnded(true)
      await cleanupCall()
    })

    vapi.on('error', async (event: unknown) => {
      console.error('[Vapi] error', event)
      const message = extractVapiError(event)

      if (isBenignCallEndMessage(message)) {
        setIsStarting(false)
        setIsConnected(false)
        if (hasStartedRef.current) {
          setCallEnded(true)
        } else {
          setError(
            'Poziv se odmah prekinuo. Dozvolite mikrofon u browseru i proverite Public key.'
          )
        }
        await cleanupCall()
        return
      }

      if (isDeviceInUseMessage(message)) {
        setError(
          'Mikrofon ili kamera su zauzeti. Zatvorite druge tabove sa AuditClaw/Vapi, sačekajte par sekundi i pokušajte ponovo.'
        )
        setIsStarting(false)
        setIsConnected(false)
        await cleanupCall()
        return
      }

      setError(message)
      setIsStarting(false)
      setIsConnected(false)
    })

    vapi.on('call-start-progress', (event) => {
      console.log('[Vapi] call-start-progress', event)
    })

    vapi.on('speech-start', () => {
      console.log('[Vapi] speech-start (asistent počinje da govori)')
    })

    vapi.on('speech-end', () => {
      console.log('[Vapi] speech-end (asistent završio govor)')
    })

    vapi.on('message', (message: {
      type?: string
      role?: string
      transcript?: string
      transcriptType?: string
      toolCallList?: Array<{
        name?: string
        arguments?: Record<string, unknown>
        parameters?: Record<string, unknown>
      }>
    }) => {
      console.log('[Vapi] message', message)

      if (
        message.type === 'transcript' &&
        message.transcript &&
        message.transcriptType === 'final'
      ) {
        setTranscript((prev) => [
          ...prev,
          { role: message.role || 'unknown', text: message.transcript as string },
        ])
      }

      if (message.type === 'tool-calls' && Array.isArray(message.toolCallList)) {
        const firstCall = message.toolCallList[0]
        if (firstCall?.name !== 'azurirajVitalneZnake') return

        const payload = firstCall.parameters || firstCall.arguments || {}
        setVitalSigns((prev) => {
          const next: VitalSigns = { ...prev }
          if (typeof payload.pritisak === 'string') {
            next.pritisak = payload.pritisak
            setUpdatedVitalKey('pritisak')
          }
          if (typeof payload.puls === 'number') {
            next.puls = payload.puls
            setUpdatedVitalKey('puls')
          }
          if (typeof payload.temperatura === 'number') {
            next.temperatura = payload.temperatura
            setUpdatedVitalKey('temperatura')
          }
          if (typeof payload.saturacija === 'number') {
            next.saturacija = payload.saturacija
            setUpdatedVitalKey('saturacija')
          }
          if (typeof payload.secer === 'number') {
            next.secer = payload.secer
            setUpdatedVitalKey('secer')
          }
          return next
        })
      }
    })
  }, [cleanupCall, disableLocalVideo])

  useEffect(() => {
    if (!open) {
      cleanupCall()
      setTranscript([])
      setError(null)
      setCallEnded(false)
      setSelectedUcenikId('')
      setUcenikQuery('')
      setShowUcenikList(false)
      setVitalSigns({})
      setUpdatedVitalKey(null)
    }
  }, [open, cleanupCall])

  useEffect(() => {
    if (!config?.vitalniZnaciDefault) return
    setVitalSigns({
      pritisak:
        typeof config.vitalniZnaciDefault.pritisak === 'string'
          ? config.vitalniZnaciDefault.pritisak
          : undefined,
      puls:
        typeof config.vitalniZnaciDefault.puls === 'number'
          ? config.vitalniZnaciDefault.puls
          : undefined,
      temperatura:
        typeof config.vitalniZnaciDefault.temperatura === 'number'
          ? config.vitalniZnaciDefault.temperatura
          : undefined,
      saturacija:
        typeof config.vitalniZnaciDefault.saturacija === 'number'
          ? config.vitalniZnaciDefault.saturacija
          : undefined,
      secer:
        typeof config.vitalniZnaciDefault.secer === 'number'
          ? config.vitalniZnaciDefault.secer
          : undefined,
    })
  }, [config])

  useEffect(() => {
    if (!updatedVitalKey) return
    const timer = window.setTimeout(() => setUpdatedVitalKey(null), 800)
    return () => window.clearTimeout(timer)
  }, [updatedVitalKey])

  useEffect(() => {
    return () => {
      cleanupCall()
    }
  }, [cleanupCall])

  const handleStart = async () => {
    if (!config || isStarting || isReleasing || cleanupInProgressRef.current) return

    if (!config.publicKey?.trim()) {
      setError(
        'Public API key nije podešen. Dodajte vapi_public_key u formi asistenta ili NEXT_PUBLIC_VAPI_PUBLIC_KEY u Vercel env.'
      )
      return
    }

    if (!selectedUcenikId) {
      setError('Prvo izaberite učenika pre pokretanja poziva.')
      return
    }

    setError(null)
    setCallEnded(false)
    setIsStarting(true)
    setTranscript([])
    hasStartedRef.current = false

    try {
      await cleanupCall()

      const vapi = initVapi(config.publicKey)
      attachVapiListeners(vapi)

      const assistantOverrides: Record<string, unknown> = {
        metadata: {
          assistantDbId: String(config.assistantDbId),
          ucenikid: selectedUcenikId,
        },
        clientMessages: ['transcript', 'tool-calls'],
      }

      await vapi.start(
        config.assistantId,
        assistantOverrides as Parameters<typeof vapi.start>[1]
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Neuspelo pokretanje poziva'
      if (isDeviceInUseMessage(message)) {
        setError(
          'Mikrofon ili kamera su zauzeti. Zatvorite druge tabove, sačekajte par sekundi i pokušajte ponovo.'
        )
      } else if (!isBenignCallEndMessage(message)) {
        setError(message)
      }
      setIsStarting(false)
      await cleanupCall()
    }
  }

  const handleStop = async () => {
    await cleanupCall()
    setCallEnded(true)
  }

  const handleClose = async () => {
    await cleanupCall()
    onClose()
  }

  const handleSelectUcenik = (ucenik: VapiUcenik) => {
    setSelectedUcenikId(String(ucenik.id))
    setUcenikQuery(ucenikLabel(ucenik))
    setShowUcenikList(false)
  }

  const handleUcenikInputChange = (value: string) => {
    setUcenikQuery(value)
    setSelectedUcenikId('')
    setShowUcenikList(true)
  }

  const filteredUcenici = (() => {
    const q = ucenikQuery.trim().toLowerCase()
    if (!q) return ucenici
    return ucenici.filter((u) =>
      ucenikLabel(u).toLowerCase().includes(q) ||
      `${u.ime} ${u.prezime || ''}`.toLowerCase().includes(q) ||
      (u.razred || '').toLowerCase().includes(q)
    )
  })()

  if (!open) return null

  const startDisabled = isStarting || isReleasing || !selectedUcenikId
  const showVideoPatient = Boolean(
    config?.imaVideoPacijenta && config?.simliFaceId && config?.simliSessionToken
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full overflow-hidden flex flex-col ${
          showVideoPatient
            ? 'max-w-7xl h-[96vh] max-h-[96vh]'
            : 'max-w-2xl max-h-[90vh]'
        }`}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white">Vapi poziv</h3>
              {config && (
                <p className="text-sm text-gray-300 truncate">{config.opisServisa || config.assistantId}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`overflow-y-auto flex-1 ${
            showVideoPatient
              ? 'p-3 sm:p-5 space-y-3 sm:space-y-4'
              : 'p-4 sm:p-6 space-y-4 sm:space-y-5'
          }`}
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
            </div>
          )}

          {loadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {loadError}
            </div>
          )}

          {!loading && !loadError && config && (
            <>
              {config.webhookWarning && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  {config.webhookWarning}
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${isConnected ? 'bg-green-100' : callEnded ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <Bot className={`w-5 h-5 sm:w-7 sm:h-7 ${isConnected ? 'text-green-600' : callEnded ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {isReleasing
                      ? 'Oslobađanje mikrofona...'
                      : isConnected
                        ? 'Poziv je aktivan'
                        : isStarting
                          ? 'Povezivanje...'
                          : callEnded
                            ? 'Poziv je završen'
                            : 'Spreman za poziv'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {isConnected
                      ? 'Slušajte i govorite u mikrofon'
                      : callEnded
                        ? 'Dijalog se automatski čuva u Vapi Odgovor'
                        : 'Kliknite Započni, zatim „Allow“ za mikrofon (kamera nije obavezna)'}
                  </p>
                </div>
              </div>

              {showVideoPatient && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 min-h-[48vh] lg:min-h-[58vh]">
                  <div className="lg:col-span-3 min-h-[280px] h-full">
                    <VapiSimliAvatar
                      vapi={vapiRef.current}
                      active={isConnected || isStarting}
                      faceId={config?.simliFaceId || ''}
                      sessionToken={config?.simliSessionToken || ''}
                      iceServers={config?.simliIceServers || []}
                      onError={handleSimliError}
                      large
                    />
                  </div>
                  <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 h-full flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 shrink-0">Vitalni znaci</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm flex-1 content-start">
                      {[
                        { key: 'pritisak', label: 'Pritisak', value: vitalSigns.pritisak ?? '-' },
                        { key: 'puls', label: 'Puls', value: vitalSigns.puls ?? '-' },
                        { key: 'temperatura', label: 'Temperatura', value: vitalSigns.temperatura ?? '-' },
                        { key: 'saturacija', label: 'Saturacija', value: vitalSigns.saturacija ?? '-' },
                        { key: 'secer', label: 'Šećer', value: vitalSigns.secer ?? '-' },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`rounded-xl border p-3 transition-colors ${
                            updatedVitalKey === item.key
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <p className="text-[11px] text-gray-500">{item.label}</p>
                          <p className="font-semibold text-gray-900 text-lg sm:text-xl">{String(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm text-amber-800">
                  Za završetak razgovora recite: <span className="font-bold">„Kraj“</span>
                </p>
              </div>

              {!isConnected && !callEnded && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Učenik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ucenikQuery}
                    onChange={(e) => handleUcenikInputChange(e.target.value)}
                    onFocus={() => setShowUcenikList(true)}
                    onBlur={() => setTimeout(() => setShowUcenikList(false), 150)}
                    disabled={isStarting || isReleasing}
                    placeholder="Kucajte ime, prezime ili razred..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50"
                    autoComplete="off"
                  />
                  {showUcenikList && filteredUcenici.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                      {filteredUcenici.map((ucenik) => (
                        <li key={ucenik.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectUcenik(ucenik)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors ${
                              String(ucenik.id) === selectedUcenikId ? 'bg-amber-50 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {ucenikLabel(ucenik)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showUcenikList && ucenikQuery.trim() && filteredUcenici.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 text-sm text-gray-400">
                      Nema rezultata za „{ucenikQuery}“
                    </div>
                  )}
                  {ucenici.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Nema unetih učenika. Dodajte učenika u sekciji „Učenik“ pre poziva.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <p>{error}</p>
                  {error.toLowerCase().includes('401') || error.toLowerCase().includes('key') ? (
                    <p className="text-xs text-red-600 mt-2">
                      Proverite Public key u formi asistenta ili NEXT_PUBLIC_VAPI_PUBLIC_KEY u env.
                    </p>
                  ) : isDeviceInUseMessage(error) ? (
                    <p className="text-xs text-red-600 mt-2">
                      Zatvorite modal (X), sačekajte 3 sekunde, pa otvorite Započni ponovo. Proverite da nema drugog otvorenog taba.
                    </p>
                  ) : null}
                </div>
              )}

              <div className="flex gap-3">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={startDisabled}
                    className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Mic className="w-5 h-5" />
                    {isReleasing
                      ? 'Oslobađanje...'
                      : isStarting
                        ? 'Pokretanje...'
                        : callEnded
                          ? 'Novi poziv'
                          : 'Započni poziv'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium text-sm sm:text-base"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Završi poziv
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Transkript (uživo)</h4>
                <div
                  className={`overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 ${
                    showVideoPatient ? 'min-h-[100px] max-h-[140px]' : 'min-h-[160px] max-h-[240px]'
                  }`}
                >
                  {transcript.length === 0 ? (
                    <p className="text-sm text-gray-400">Transkript će se pojaviti tokom razgovora...</p>
                  ) : (
                    transcript.map((line, index) => (
                      <p key={`${line.role}-${index}`} className="text-sm text-gray-700">
                        <span className="font-semibold capitalize">{line.role}:</span> {line.text}
                      </p>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Posle završetka poziva, dijalog i AI ocena se automatski čuvaju u Vapi Odgovor.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
