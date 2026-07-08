'use client'

import { Activity, Droplets, HeartPulse, Thermometer, Wifi } from 'lucide-react'

export type VitalKey = 'pritisak' | 'puls' | 'temperatura' | 'saturacija' | 'secer'

export interface VitalSignsState {
  pritisak?: string
  puls?: number
  temperatura?: number
  saturacija?: number
  secer?: number
}

interface DeviceDef {
  key: VitalKey
  label: string
  device: string
  unit: string
  Icon: typeof HeartPulse
}

const DEVICES: DeviceDef[] = [
  {
    key: 'pritisak',
    label: 'Krvni pritisak',
    device: 'Aparat za pritisak',
    unit: 'mmHg',
    Icon: HeartPulse,
  },
  {
    key: 'puls',
    label: 'Puls',
    device: 'Monitor pulsa',
    unit: 'bpm',
    Icon: Activity,
  },
  {
    key: 'temperatura',
    label: 'Temperatura',
    device: 'Termometar',
    unit: '°C',
    Icon: Thermometer,
  },
  {
    key: 'saturacija',
    label: 'Saturacija',
    device: 'Pulsni oksimetar',
    unit: '%',
    Icon: Wifi,
  },
  {
    key: 'secer',
    label: 'Šećer',
    device: 'Glukometar',
    unit: 'mmol/L',
    Icon: Droplets,
  },
]

interface VapiVitalniUredjajiProps {
  values: VitalSignsState
  /** Ključevi za koje je merenje već prikazano. */
  revealed: Partial<Record<VitalKey, boolean>>
  /** Uređaj koji je upravo izmeren — kratko animacija. */
  activeKey: VitalKey | null
  measuringKey: VitalKey | null
}

function formatValue(key: VitalKey, values: VitalSignsState): string {
  const raw = values[key]
  if (raw === undefined || raw === null) return '—'
  return String(raw)
}

export function VapiVitalniUredjaji({
  values,
  revealed,
  activeKey,
  measuringKey,
}: VapiVitalniUredjajiProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-3 sm:p-4 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-800 mb-1 shrink-0">Merni uređaji</h4>
      <p className="text-[11px] text-gray-500 mb-3 shrink-0">
        Vrednosti se pojavljuju tek kad kažete da izmerite (npr. „izmeri pritisak”).
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:gap-3 flex-1 content-start">
        {DEVICES.map(({ key, label, device, unit, Icon }) => {
          const isRevealed = Boolean(revealed[key])
          const isActive = activeKey === key
          const isMeasuring = measuringKey === key

          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-2xl border px-3 py-3 transition-all duration-500 ${
                isMeasuring
                  ? 'border-amber-300 bg-amber-50 shadow-md shadow-amber-100'
                  : isActive
                    ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100 scale-[1.01]'
                    : isRevealed
                      ? 'border-slate-200 bg-white'
                      : 'border-dashed border-slate-200 bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isMeasuring
                      ? 'bg-amber-200 text-amber-800 animate-pulse'
                      : isRevealed
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{device}</p>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  {isMeasuring ? (
                    <p className="mt-1 text-sm font-medium text-amber-700">Merenje u toku...</p>
                  ) : isRevealed ? (
                    <p className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
                        {formatValue(key, values)}
                      </span>
                      <span className="text-xs text-slate-500">{unit}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">Čeka merenje</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Prepoznaj zahtev za merenje iz govora/transkripta (fallback ako tool-call kasni). */
export function detectMeasurementKeysFromSpeech(text: string): VitalKey[] {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const keys: VitalKey[] = []
  const asks =
    /\b(izmeri\w*|izmjeri\w*|meri\w*|meren\w*|proveri\w*|provjeri\w*|pokazi\w*|pokazati)\b/.test(
      normalized
    )

  const hasPritisak = /\bpritis\w*\b|\bblood pressure\b|\bbb\b/.test(normalized)
  const hasPuls = /\bpuls\w*\b|\bheartbeat\b|\bheart rate\b/.test(normalized)
  const hasTemp = /\btemperatur\w*\b|\btoplot\w*\b|\bfever\b/.test(normalized)
  const hasSat = /\bsaturacij\w*\b|\boksimetr\w*\b|\bspo2\b|\bkiseonik\w*\b/.test(normalized)
  const hasSecer = /\bsecer\w*\b|\bglukoz\w*\b/.test(normalized)

  if (asks && hasPritisak) keys.push('pritisak')
  if (asks && hasPuls) keys.push('puls')
  if (asks && hasTemp) keys.push('temperatura')
  if (asks && hasSat) keys.push('saturacija')
  if (asks && hasSecer) keys.push('secer')

  // „izmeriti mu puls“, „hajde pritisak“…
  if (keys.length === 0) {
    if (/\b(izmeri\w*|meri\w*|proveri\w*|provjeri\w*|pokazi\w*).{0,40}pritis/.test(normalized)) {
      keys.push('pritisak')
    }
    if (/\b(izmeri\w*|meri\w*|proveri\w*|provjeri\w*|pokazi\w*).{0,40}puls/.test(normalized)) {
      keys.push('puls')
    }
    if (/\b(izmeri\w*|meri\w*|proveri\w*|provjeri\w*|pokazi\w*).{0,40}temperatur/.test(normalized)) {
      keys.push('temperatura')
    }
    if (/\b(izmeri\w*|meri\w*|proveri\w*|provjeri\w*|pokazi\w*).{0,40}saturacij/.test(normalized)) {
      keys.push('saturacija')
    }
    if (/\b(izmeri\w*|meri\w*|proveri\w*|provjeri\w*|pokazi\w*).{0,40}secer/.test(normalized)) {
      keys.push('secer')
    }
  }

  return keys
}

/**
 * AI često pošalje sva polja odjednom — otkrij samo ono što je korisnik tražio.
 * Ako nema konteksta zahteva, a stiglo je više polja: ne otkrivaj ništa
 * (osim ako je samo jedno još neotkriveno).
 */
export function narrowVitalKeysToReveal(
  payloadKeys: VitalKey[],
  requestedKeys: VitalKey[],
  measuringKey: VitalKey | null = null,
  alreadyRevealed: Partial<Record<VitalKey, boolean>> = {}
): VitalKey[] {
  if (requestedKeys.length > 0) {
    const matched = payloadKeys.filter((key) => requestedKeys.includes(key))
    return matched.length > 0 ? matched : requestedKeys
  }

  if (measuringKey && (payloadKeys.length === 0 || payloadKeys.includes(measuringKey))) {
    return [measuringKey]
  }

  if (payloadKeys.length === 1) return payloadKeys

  const notYetRevealed = payloadKeys.filter((key) => !alreadyRevealed[key])
  if (notYetRevealed.length === 1) return notYetRevealed

  return []
}

export const VITAL_TOOL_NAMES = new Set([
  'azurirajVitalneZnake',
  'izmeriPritisak',
  'izmeriPuls',
  'izmeriTemperaturu',
  'izmeriSaturaciju',
  'izmeriSecer',
])

export function vitalKeysFromToolName(name: string): VitalKey[] {
  switch (name) {
    case 'izmeriPritisak':
      return ['pritisak']
    case 'izmeriPuls':
      return ['puls']
    case 'izmeriTemperaturu':
      return ['temperatura']
    case 'izmeriSaturaciju':
      return ['saturacija']
    case 'izmeriSecer':
      return ['secer']
    default:
      return []
  }
}

export function parseVitalToolCalls(message: {
  type?: string
  toolCallList?: unknown
  toolCalls?: unknown
}): Array<{ name: string; payload: Record<string, unknown> }> {
  if (message.type !== 'tool-calls' && message.type !== 'function-call') return []

  const list = Array.isArray(message.toolCallList)
    ? message.toolCallList
    : Array.isArray(message.toolCalls)
      ? message.toolCalls
      : []

  const parsed: Array<{ name: string; payload: Record<string, unknown> }> = []

  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const fn =
      record.function && typeof record.function === 'object'
        ? (record.function as Record<string, unknown>)
        : null

    const name =
      (typeof fn?.name === 'string' && fn.name) ||
      (typeof record.name === 'string' && record.name) ||
      ''

    const rawArgs = fn?.arguments ?? record.arguments ?? record.parameters ?? {}
    parsed.push({ name, payload: normalizeVitalToolPayload(rawArgs) })
  }

  // Stari format: jedan function-call na root message
  if (parsed.length === 0 && message.type === 'function-call') {
    const root = message as Record<string, unknown>
    const fn =
      root.function && typeof root.function === 'object'
        ? (root.function as Record<string, unknown>)
        : null
    const name =
      (typeof fn?.name === 'string' && fn.name) ||
      (typeof root.name === 'string' && root.name) ||
      ''
    if (name) {
      parsed.push({
        name,
        payload: normalizeVitalToolPayload(fn?.arguments ?? root.parameters ?? root.arguments),
      })
    }
  }

  return parsed
}

export function normalizeVitalToolPayload(raw: unknown): Record<string, unknown> {
  let payload: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object') payload = parsed as Record<string, unknown>
    } catch {
      return {}
    }
  } else if (raw && typeof raw === 'object') {
    payload = raw as Record<string, unknown>
  }

  const next: Record<string, unknown> = {}
  if (typeof payload.pritisak === 'string' && payload.pritisak.trim()) {
    next.pritisak = payload.pritisak.trim()
  }
  if (typeof payload.puls === 'number') next.puls = payload.puls
  else if (typeof payload.puls === 'string' && payload.puls.trim() && !Number.isNaN(Number(payload.puls))) {
    next.puls = Number(payload.puls)
  }
  if (typeof payload.temperatura === 'number') next.temperatura = payload.temperatura
  else if (
    typeof payload.temperatura === 'string' &&
    payload.temperatura.trim() &&
    !Number.isNaN(Number(payload.temperatura))
  ) {
    next.temperatura = Number(payload.temperatura)
  }
  if (typeof payload.saturacija === 'number') next.saturacija = payload.saturacija
  else if (
    typeof payload.saturacija === 'string' &&
    payload.saturacija.trim() &&
    !Number.isNaN(Number(payload.saturacija))
  ) {
    next.saturacija = Number(payload.saturacija)
  }
  if (typeof payload.secer === 'number') next.secer = payload.secer
  else if (typeof payload.secer === 'string' && payload.secer.trim() && !Number.isNaN(Number(payload.secer))) {
    next.secer = Number(payload.secer)
  }
  return next
}

export function extractVitalKeysFromPayload(
  payload: Record<string, unknown>
): VitalKey[] {
  const keys: VitalKey[] = []
  if (typeof payload.pritisak === 'string' && payload.pritisak.trim()) keys.push('pritisak')
  if (typeof payload.puls === 'number') keys.push('puls')
  if (typeof payload.temperatura === 'number') keys.push('temperatura')
  if (typeof payload.saturacija === 'number') keys.push('saturacija')
  if (typeof payload.secer === 'number') keys.push('secer')
  return keys
}

export function applyVitalPayload(
  prev: VitalSignsState,
  payload: Record<string, unknown>
): VitalSignsState {
  const next: VitalSignsState = { ...prev }
  if (typeof payload.pritisak === 'string' && payload.pritisak.trim()) {
    next.pritisak = payload.pritisak.trim()
  }
  if (typeof payload.puls === 'number') next.puls = payload.puls
  if (typeof payload.temperatura === 'number') next.temperatura = payload.temperatura
  if (typeof payload.saturacija === 'number') next.saturacija = payload.saturacija
  if (typeof payload.secer === 'number') next.secer = payload.secer
  return next
}
