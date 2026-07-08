'use client'

import { useEffect, useRef, useState } from 'react'
import type Vapi from '@vapi-ai/web'
// Direct path: package root re-exports `./Client` but the file is `client.js`
// (breaks case-sensitive Linux / Turbopack builds).
import { LogLevel, SimliClient } from 'simli-client/dist/client'

const SIMLI_SAMPLE_RATE = 16000
const SIMLI_AUDIO_BUFFER_SIZE = 4800
const INITIAL_BUFFER_SAMPLES = SIMLI_SAMPLE_RATE

interface VapiSimliAvatarProps {
  vapi: Vapi | null
  active: boolean
  faceId: string
  sessionToken: string
  iceServers?: RTCIceServer[]
  onError: (message: string) => void
  /** Veći prikaz za fullscreen modal (video pacijent). */
  large?: boolean
}

function stopTracks(stream: MediaStream | null): void {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

function iceServersKey(servers: RTCIceServer[]): string {
  try {
    return JSON.stringify(servers)
  } catch {
    return String(servers.length)
  }
}

export function VapiSimliAvatar({
  vapi,
  active,
  faceId,
  sessionToken,
  iceServers = [],
  onError,
  large = false,
}: VapiSimliAvatarProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const simliRef = useRef<SimliClient | null>(null)
  const onErrorRef = useRef(onError)
  const iceServersRef = useRef(iceServers)
  const iceKey = iceServersKey(iceServers)

  const contextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const speakingRef = useRef(false)
  const initialChunkSentRef = useRef(false)
  const pcmBufferRef = useRef<Int16Array>(new Int16Array(0))
  const speechEndTimeoutRef = useRef<number | null>(null)
  const pollingRef = useRef<number | null>(null)
  const speechHandlersRef = useRef<{ start: () => void; end: () => void } | null>(null)
  const muteWatchRef = useRef<number | null>(null)
  const [avatarStarted, setAvatarStarted] = useState(false)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    iceServersRef.current = iceServers
  }, [iceServers, iceKey])

  /** Simli = samo usne. Glas uvek iz Vapi/Daily. */
  const muteSimliPlayback = () => {
    if (audioRef.current) {
      audioRef.current.muted = true
      audioRef.current.volume = 0
      audioRef.current.pause()
    }
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.volume = 0
    }
  }

  /** Eksplicitno ostavi Vapi zvuk upaljen (sve audio elemente osim Simli). */
  const ensureVapiAudioAudible = () => {
    const allAudioElements = document.getElementsByTagName('audio')
    for (const audio of allAudioElements) {
      if (audio.id === 'simli_audio') {
        audio.muted = true
        audio.volume = 0
        continue
      }
      audio.muted = false
      if (audio.volume === 0) audio.volume = 1
    }
    try {
      vapi?.setMuted(false)
    } catch {
      // ignore
    }
  }

  const startMuteWatch = () => {
    if (muteWatchRef.current) window.clearInterval(muteWatchRef.current)
    muteSimliPlayback()
    ensureVapiAudioAudible()
    muteWatchRef.current = window.setInterval(() => {
      muteSimliPlayback()
      ensureVapiAudioAudible()
    }, 400)
  }

  const flushBuffer = () => {
    const simli = simliRef.current
    if (!simli || pcmBufferRef.current.length === 0) {
      pcmBufferRef.current = new Int16Array(0)
      return
    }
    if (!initialChunkSentRef.current) {
      simli.sendAudioDataImmediate(new Uint8Array(pcmBufferRef.current.buffer))
      initialChunkSentRef.current = true
    } else {
      simli.sendAudioData(new Uint8Array(pcmBufferRef.current.buffer))
    }
    pcmBufferRef.current = new Int16Array(0)
  }

  const processAudio = (samples: Int16Array) => {
    const simli = simliRef.current
    if (!simli) return

    const merged = new Int16Array(pcmBufferRef.current.length + samples.length)
    merged.set(pcmBufferRef.current, 0)
    merged.set(samples, pcmBufferRef.current.length)
    pcmBufferRef.current = merged

    if (!initialChunkSentRef.current) {
      if (pcmBufferRef.current.length < INITIAL_BUFFER_SAMPLES) return
      const initialChunk = pcmBufferRef.current.slice(0, INITIAL_BUFFER_SAMPLES)
      pcmBufferRef.current = pcmBufferRef.current.slice(INITIAL_BUFFER_SAMPLES)
      simli.sendAudioDataImmediate(new Uint8Array(initialChunk.buffer))
      initialChunkSentRef.current = true
    }

    while (pcmBufferRef.current.length >= SIMLI_AUDIO_BUFFER_SIZE) {
      const chunk = pcmBufferRef.current.slice(0, SIMLI_AUDIO_BUFFER_SIZE)
      pcmBufferRef.current = pcmBufferRef.current.slice(SIMLI_AUDIO_BUFFER_SIZE)
      simli.sendAudioData(new Uint8Array(chunk.buffer))
    }
  }

  const setupAudioPipeline = (audioTrack: MediaStreamTrack) => {
    if (processorRef.current || contextRef.current) return

    const ctx = new AudioContext({ sampleRate: SIMLI_SAMPLE_RATE })
    contextRef.current = ctx

    const stream = new MediaStream([audioTrack])
    mediaStreamRef.current = stream

    const source = ctx.createMediaStreamSource(stream)
    sourceNodeRef.current = source
    const processor = ctx.createScriptProcessor(2048, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!speakingRef.current) return
      const channelData = event.inputBuffer.getChannelData(0)
      const pcm16 = new Int16Array(channelData.length)
      for (let i = 0; i < channelData.length; i += 1) {
        const clamped = Math.max(-1, Math.min(1, channelData[i]))
        pcm16[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767)
      }
      processAudio(pcm16)
    }

    // Ne povezuj na destination — to bi ponovo puštalo Vapi audio (echo).
    const silentGain = ctx.createGain()
    silentGain.gain.value = 0
    source.connect(processor)
    processor.connect(silentGain)
    silentGain.connect(ctx.destination)
  }

  const findSpeakerTrack = (): MediaStreamTrack | null => {
    const daily = vapi?.getDailyCallObject()
    const participants = daily?.participants()
    if (!participants) return null

    for (const participant of Object.values(participants)) {
      if (participant.user_name !== 'Vapi Speaker') continue
      const possibleTrack = participant.tracks?.audio?.track ?? null
      if (possibleTrack) return possibleTrack
    }

    return null
  }

  const startPollingForTrack = () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current)
    pollingRef.current = window.setInterval(() => {
      const track = findSpeakerTrack()
      if (!track) return
      if (pollingRef.current) window.clearInterval(pollingRef.current)
      pollingRef.current = null
      setupAudioPipeline(track)
    }, 120)
  }

  useEffect(() => {
    let disposed = false

    const cleanup = async () => {
      if (speechEndTimeoutRef.current) {
        window.clearTimeout(speechEndTimeoutRef.current)
        speechEndTimeoutRef.current = null
      }
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (muteWatchRef.current) {
        window.clearInterval(muteWatchRef.current)
        muteWatchRef.current = null
      }

      if (vapi && speechHandlersRef.current) {
        try {
          vapi.off('speech-start', speechHandlersRef.current.start)
          vapi.off('speech-end', speechHandlersRef.current.end)
        } catch {
          // Vapi tipovi/okruženje mogu da ne podrže off u svim verzijama
        }
        speechHandlersRef.current = null
      }

      speakingRef.current = false
      initialChunkSentRef.current = false
      pcmBufferRef.current = new Int16Array(0)

      processorRef.current?.disconnect()
      sourceNodeRef.current?.disconnect()
      processorRef.current = null
      sourceNodeRef.current = null

      stopTracks(mediaStreamRef.current)
      mediaStreamRef.current = null

      if (contextRef.current && contextRef.current.state !== 'closed') {
        await contextRef.current.close()
      }
      contextRef.current = null

      const client = simliRef.current
      simliRef.current = null
      if (client) {
        try {
          await client.stop()
        } catch {
          // ignore cleanup errors
        }
      }
      setAvatarStarted(false)
    }

    if (!active || !vapi || !sessionToken || !faceId) {
      cleanup().catch(() => undefined)
      return () => {
        disposed = true
      }
    }

    const setup = async () => {
      // Sačekaj da video/audio ref-ovi budu montirani
      if (!videoRef.current || !audioRef.current) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
      }
      if (disposed || !videoRef.current || !audioRef.current) return

      try {
        muteSimliPlayback()

        const currentIce = iceServersRef.current
        const resolvedIce = currentIce.length > 0 ? currentIce : null
        // Prefer p2p when ICE is available; SDK falls back to livekit after retries.
        const transportMode = resolvedIce ? 'p2p' : 'livekit'

        const client = new SimliClient(
          sessionToken,
          videoRef.current,
          audioRef.current,
          resolvedIce,
          LogLevel.INFO,
          transportMode,
          'websockets',
          'wss://api.simli.ai',
          3000
        )
        simliRef.current = client

        const handleStart = () => {
          if (disposed) return
          setAvatarStarted(true)
          startMuteWatch()
          ensureVapiAudioAudible()
          const warmup = new Uint8Array(6000).fill(0)
          client.sendAudioData(warmup)
          startPollingForTrack()
        }
        const handleFail = (detail: string) => {
          if (disposed) return
          // Ne prekidaj Vapi poziv zbog Simli greške; samo prikaži poruku.
          onErrorRef.current(detail || 'Simli avatar konekcija je prekinuta. Pokušajte ponovo.')
        }

        client.on('start', handleStart)
        client.on('startup_error', handleFail)
        client.on('error', handleFail)
        client.on('stop', () => {
          if (disposed) return
          setAvatarStarted(false)
        })

        const onSpeechStart = () => {
          if (speechEndTimeoutRef.current) {
            window.clearTimeout(speechEndTimeoutRef.current)
            speechEndTimeoutRef.current = null
          }
          if (!speakingRef.current) {
            pcmBufferRef.current = new Int16Array(0)
            initialChunkSentRef.current = false
          }
          speakingRef.current = true
        }

        const onSpeechEnd = () => {
          if (speechEndTimeoutRef.current) {
            window.clearTimeout(speechEndTimeoutRef.current)
          }
          speechEndTimeoutRef.current = window.setTimeout(() => {
            speakingRef.current = false
            flushBuffer()
            speechEndTimeoutRef.current = null
          }, 500)
        }

        speechHandlersRef.current = { start: onSpeechStart, end: onSpeechEnd }
        vapi.on('speech-start', onSpeechStart)
        vapi.on('speech-end', onSpeechEnd)

        await client.start()
      } catch (error) {
        if (disposed) return
        onErrorRef.current(
          error instanceof Error ? error.message : 'Greška pri pokretanju Simli avatara.'
        )
      }
    }

    setup().catch(() => undefined)

    return () => {
      disposed = true
      cleanup().catch(() => undefined)
    }
    // Namerno bez iceServers/onError objekata — restart samo kad se token/sesija menja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, faceId, sessionToken, vapi, iceKey])

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-gray-950/95 h-full ${
        large ? 'p-1.5 sm:p-2' : 'p-3 sm:p-4'
      }`}
    >
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-black ${
          large ? 'h-full min-h-[280px]' : 'aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!avatarStarted && (
          <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm text-gray-300">
            Pokretanje video pacijenta...
          </div>
        )}
      </div>
      <audio ref={audioRef} id="simli_audio" autoPlay muted />
    </div>
  )
}
