'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import { Mic, MicOff, PhoneOff, Bot, AlertCircle } from 'lucide-react'
import { getSimulacijaVapiConfig } from '@/lib/actions/vapi-simulacija'
import { VapiSimliAvatar } from '@/components/admin/vapi-simli-avatar'
import type { VitalniParametri } from '@/lib/types/vapi-simulacija'
import { VitalsWidget } from '@/components/vapi/vitals-widget'

interface SimulacijaVapiConfig {
  assistantDbId: number
  assistantId: string
  publicKey: string
  opisServisa: string | null
  imaVideoPacijenta: boolean
  simliFaceId: string | null
  simliSessionToken: string | null
  simliIceServers: RTCIceServer[]
  simliWarning: string | null
}

interface TrijazaVoicePanelProps {
  sobaId: string
  assistantDbId: number | null
  vitalni: VitalniParametri
  trenutnoStanje: string
  alarm?: boolean
  alarmPoruka?: string | null
  /** Kada se vitalni promene, šaljemo sistemski prompt Vapi agentu */
  lastStatePrompt?: string | null
}

export function TrijazaVoicePanel({
  sobaId,
  assistantDbId,
  vitalni,
  trenutnoStanje,
  alarm = false,
  alarmPoruka,
  lastStatePrompt,
}: TrijazaVoicePanelProps) {
  const [config, setConfig] = useState<SimulacijaVapiConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const vapiRef = useRef<Vapi | null>(null)
  const lastPromptSentRef = useRef<string | null>(null)

  useEffect(() => {
    if (!assistantDbId || !sobaId) {
      setConfig(null)
      setLoadError('Profesor nije izabrao Vapi asistenta za ovu sobu.')
      return
    }

    let cancelled = false
    setLoadingConfig(true)
    setLoadError(null)

    void getSimulacijaVapiConfig(sobaId).then((result) => {
      if (cancelled) return
      setLoadingConfig(false)
      if (result.error || !result.data) {
        setLoadError(result.error || 'Nije moguće učitati Vapi konfiguraciju.')
        setConfig(null)
        return
      }
      setConfig(result.data)
      if (result.data.simliWarning) {
        setCallError(result.data.simliWarning)
      }
    })

    return () => {
      cancelled = true
    }
  }, [assistantDbId, sobaId])

  const stopCall = useCallback(async () => {
    try {
      await vapiRef.current?.stop()
    } catch {
      // ignore
    }
    vapiRef.current = null
    setCallActive(false)
    setMuted(false)
  }, [])

  useEffect(() => {
    return () => {
      void stopCall()
    }
  }, [stopCall])

  // Sistemski prompt kada se stanje promeni tokom poziva
  useEffect(() => {
    if (!callActive || !lastStatePrompt || !vapiRef.current) return
    if (lastPromptSentRef.current === lastStatePrompt) return
    lastPromptSentRef.current = lastStatePrompt

    try {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: lastStatePrompt,
        },
      })
    } catch (error) {
      console.error('Failed to send system prompt to Vapi:', error)
    }
  }, [callActive, lastStatePrompt])

  const startCall = async () => {
    if (!config?.publicKey || !config.assistantId) {
      setCallError('Vapi public key ili assistant ID nisu dostupni.')
      return
    }

    setCallError(null)
    try {
      const vapi = new Vapi(config.publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setCallActive(true)
      })
      vapi.on('call-end', () => {
        setCallActive(false)
        vapiRef.current = null
      })
      vapi.on('error', (event: unknown) => {
        console.error('Vapi error:', event)
        setCallError('Greška u Vapi pozivu. Proverite mikrofon i ključeve.')
        setCallActive(false)
      })

      await vapi.start(config.assistantId, {
        metadata: {
          context: 'simulacija-ucionica',
          trenutno_stanje: trenutnoStanje,
          puls: vitalni.puls,
          pritisak: vitalni.pritisak,
          saturacija: vitalni.saturacija,
        },
      })
    } catch (error) {
      console.error('Start call error:', error)
      setCallError(error instanceof Error ? error.message : 'Neuspešan start poziva.')
      setCallActive(false)
      vapiRef.current = null
    }
  }

  const toggleMute = () => {
    if (!vapiRef.current) return
    const next = !muted
    try {
      vapiRef.current.setMuted(next)
      setMuted(next)
    } catch {
      setCallError('Nije moguće promeniti mute stanje mikrofona.')
    }
  }

  const showSimli =
    callActive &&
    Boolean(config?.imaVideoPacijenta) &&
    Boolean(config?.simliFaceId) &&
    Boolean(config?.simliSessionToken)

  return (
    <div className="space-y-4">
      <VitalsWidget
        vitalni={vitalni}
        trenutnoStanje={trenutnoStanje}
        alarm={alarm}
        alarmPoruka={alarmPoruka}
      />

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Pacijent (Trijaža)</h3>
            <p className="text-xs text-gray-500">
              {config?.opisServisa || 'Vapi glasovni agent + Simli avatar'}
            </p>
          </div>
        </div>

        {loadingConfig && (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-500" />
          </div>
        )}

        {(loadError || callError) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError || callError}</span>
          </div>
        )}

        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black aspect-video flex items-center justify-center">
          {showSimli && config?.simliFaceId && config.simliSessionToken ? (
            <VapiSimliAvatar
              vapi={vapiRef.current}
              active={callActive}
              faceId={config.simliFaceId}
              sessionToken={config.simliSessionToken}
              iceServers={config.simliIceServers}
              onError={(msg) => setCallError(msg)}
              large
            />
          ) : (
            <div className="text-center px-4">
              <Bot className="mx-auto mb-2 h-12 w-12 text-amber-400/60" />
              <p className="text-sm text-gray-400">
                {config?.imaVideoPacijenta
                  ? callActive
                    ? 'Pokretanje Simli avatara…'
                    : 'Pokrenite mikrofon da aktivirate video pacijenta'
                  : 'Simli video nije podešen za ovog asistenta — dostupan je samo audio (Vapi)'}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!callActive ? (
            <button
              type="button"
              onClick={() => void startCall()}
              disabled={!config || loadingConfig}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              Aktiviraj mikrofon
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={() => void stopCall()}
                className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25"
              >
                <PhoneOff className="h-4 w-4" />
                Završi poziv
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
