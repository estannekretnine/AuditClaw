'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import DailyIframe from '@daily-co/daily-js'
import { Bot, Mic, PhoneOff, X } from 'lucide-react'

export interface VapiStartConfig {
  assistantDbId: number
  assistantId: string
  publicKey: string
  opisServisa: string | null
  webhookSynced?: boolean
  webhookWarning?: string | null
}

interface TranscriptLine {
  role: string
  text: string
}

interface VapiCallModalProps {
  open: boolean
  onClose: () => void
  config: VapiStartConfig | null
  loading?: boolean
  loadError?: string | null
}

function extractVapiError(event: unknown): string {
  if (!event || typeof event !== 'object') return 'Greška pri audio pozivu.'
  const record = event as Record<string, unknown>
  if (typeof record.errorMsg === 'string' && record.errorMsg.trim()) return record.errorMsg
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.error === 'string' && record.error.trim()) return record.error
  if (record.error && typeof record.error === 'object') {
    const nested = record.error as Record<string, unknown>
    if (typeof nested.message === 'string') return nested.message
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

async function forceReleaseMediaDevices(vapi: Vapi | null): Promise<void> {
  if (vapi) {
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

    const daily = vapi.getDailyCallObject()
    if (daily) {
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

    vapi.removeAllListeners()
  }

  try {
    const existing = DailyIframe.getCallInstance()
    if (existing) {
      await existing.leave()
      await existing.destroy()
    }
  } catch {
    // ignore
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
}

export function VapiCallModal({
  open,
  onClose,
  config,
  loading = false,
  loadError = null,
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
    if (vapiRef.current) return vapiRef.current

    const vapi = new Vapi(publicKey.trim(), undefined, {
      alwaysIncludeMicInPermissionPrompt: true,
    })
    vapiRef.current = vapi
    return vapi
  }, [])

  const attachVapiListeners = useCallback((vapi: Vapi) => {
    vapi.removeAllListeners()

    vapi.on('call-start', () => {
      hasStartedRef.current = true
      setIsConnected(true)
      setIsStarting(false)
    })

    vapi.on('call-start-success', () => {
      hasStartedRef.current = true
      setIsConnected(true)
      setIsStarting(false)
    })

    vapi.on('call-start-failed', async (event) => {
      const message =
        event && typeof event === 'object' && 'error' in event
          ? String((event as { error: unknown }).error)
          : 'Neuspelo pokretanje poziva.'
      setError(message)
      setIsStarting(false)
      setIsConnected(false)
      await cleanupCall()
    })

    vapi.on('call-end', () => {
      setIsConnected(false)
      setIsStarting(false)
      setCallEnded(true)
    })

    vapi.on('error', async (event: unknown) => {
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

    vapi.on('message', (message: { type?: string; role?: string; transcript?: string }) => {
      if (message.type === 'transcript' && message.transcript) {
        setTranscript((prev) => [
          ...prev,
          { role: message.role || 'unknown', text: message.transcript as string },
        ])
      }
    })
  }, [cleanupCall])

  useEffect(() => {
    if (!open) {
      cleanupCall()
      setTranscript([])
      setError(null)
      setCallEnded(false)
    }
  }, [open, cleanupCall])

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

    setError(null)
    setCallEnded(false)
    setIsStarting(true)
    setTranscript([])
    hasStartedRef.current = false

    try {
      await cleanupCall()

      const vapi = initVapi(config.publicKey)
      attachVapiListeners(vapi)

      await vapi.start(config.assistantId, {
        metadata: {
          assistantDbId: String(config.assistantDbId),
        },
      })
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

  if (!open) return null

  const startDisabled = isStarting || isReleasing

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Vapi poziv</h3>
              {config && (
                <p className="text-sm text-gray-300">{config.opisServisa || config.assistantId}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
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

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-green-100' : callEnded ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <Bot className={`w-7 h-7 ${isConnected ? 'text-green-600' : callEnded ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
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
                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? 'Slušajte i govorite u mikrofon'
                      : callEnded
                        ? 'Dijalog se automatski čuva u Vapi Odgovor'
                        : 'Kliknite Započni, zatim „Allow“ za mikrofon (kamera nije obavezna)'}
                  </p>
                </div>
              </div>

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
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50"
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
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Završi poziv
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Transkript (uživo)</h4>
                <div className="min-h-[160px] max-h-[240px] overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
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
