'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import { Bot, Mic, PhoneOff, X } from 'lucide-react'

export interface VapiStartConfig {
  assistantDbId: number
  assistantId: string
  publicKey: string
  systemPrompt: string | null
  opisServisa: string | null
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

function formatVapiError(error: unknown): string {
  if (!error) return 'Greška pri Vapi pozivu'

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string') return error

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>

    if (typeof record.error === 'object' && record.error !== null) {
      const nested = record.error as Record<string, unknown>
      if (typeof nested.message === 'string') return nested.message
    }

    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error

    if (record.type === 'start-method-error') {
      return 'Vapi nije mogao da pokrene web poziv (400). Proverite da je NEXT_PUBLIC_VAPI_PUBLIC_KEY javni ključ iz istog Vapi naloga kao asistent.'
    }
  }

  return 'Greška pri Vapi pozivu'
}

export function VapiCallModal({
  open,
  onClose,
  config,
  loading = false,
  loadError = null,
}: VapiCallModalProps) {
  const vapiRef = useRef<Vapi | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [error, setError] = useState<string | null>(null)

  const cleanupCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop()
      vapiRef.current = null
    }
    setIsConnected(false)
    setIsSpeaking(false)
    setIsStarting(false)
  }, [])

  useEffect(() => {
    if (!open) {
      cleanupCall()
      setTranscript([])
      setError(null)
    }
  }, [open, cleanupCall])

  useEffect(() => {
    return () => {
      cleanupCall()
    }
  }, [cleanupCall])

  const handleStart = async () => {
    if (!config) return

    setError(null)
    setIsStarting(true)
    setTranscript([])

    try {
      cleanupCall()

      const vapi = new Vapi(config.publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setIsConnected(true)
        setIsStarting(false)
      })

      vapi.on('call-end', () => {
        setIsConnected(false)
        setIsSpeaking(false)
        setIsStarting(false)
      })

      vapi.on('speech-start', () => setIsSpeaking(true))
      vapi.on('speech-end', () => setIsSpeaking(false))

      vapi.on('message', (message: { type?: string; role?: string; transcript?: string }) => {
        if (message.type === 'transcript' && message.transcript) {
          setTranscript((prev) => [
            ...prev,
            { role: message.role || 'unknown', text: message.transcript as string },
          ])
        }
      })

      vapi.on('call-start-failed', (event: { error?: string }) => {
        setError(event.error || 'Vapi nije uspeo da pokrene poziv.')
        setIsStarting(false)
      })

      vapi.on('error', (e: unknown) => {
        setError(formatVapiError(e))
        setIsStarting(false)
      })

      // Samo metadata — delimičan model override bez provider/model uzrokuje 400 na /call/web
      await vapi.start(config.assistantId, {
        metadata: {
          assistantDbId: String(config.assistantDbId),
        },
      })
    } catch (e) {
      setError(formatVapiError(e))
      setIsStarting(false)
    }
  }

  const handleStop = () => {
    cleanupCall()
  }

  const handleClose = () => {
    cleanupCall()
    onClose()
  }

  if (!open) return null

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
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <Bot className={`w-7 h-7 ${isConnected ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {isConnected ? 'Poziv je aktivan' : isStarting ? 'Povezivanje...' : 'Spreman za poziv'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isSpeaking
                      ? 'Asistent govori...'
                      : isConnected
                        ? 'Slušajte i govorite u mikrofon'
                        : 'Kliknite Započni da pokrenete web razgovor'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm space-y-2">
                  <p>{error}</p>
                  <p className="text-xs text-red-600">
                    Proverite: Public Key i Assistant ID moraju biti iz istog Vapi naloga. U bazi `vapi_api_key` mora biti Private key.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={isStarting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50"
                  >
                    <Mic className="w-5 h-5" />
                    {isStarting ? 'Pokretanje...' : 'Započni poziv'}
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
