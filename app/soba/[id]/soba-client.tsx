'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  UserCheck,
  ClipboardList,
  Eye,
  Wifi,
  WifiOff,
  Save,
  AlertCircle,
} from 'lucide-react'
import {
  getSimulacijaJoinContext,
  pridruziSeSobi,
  sacuvajBeleskePosmatraca,
  sacuvajZapisnik,
} from '@/lib/actions/vapi-simulacija'
import { useSobaPusher } from '@/lib/hooks/use-soba-pusher'
import { TrijazaVoicePanel } from '@/components/vapi/trijaza-voice-panel'
import { VitalsWidget } from '@/components/vapi/vitals-widget'
import {
  DEFAULT_VITALNI,
  ULOGA_LABELI,
  type VapiSobaDetalji,
  type VapiSimulacijaUloga,
  type VitalniParametri,
} from '@/lib/types/vapi-simulacija'

interface UcenikOption {
  id: number
  ime: string
  prezime: string | null
  razred: string | null
}

function isValidUloga(value: string | null): value is VapiSimulacijaUloga {
  return value === 'trijaza' || value === 'zapisnik' || value === 'posmatrac'
}

function buildStatePrompt(vitalni: VitalniParametri, stanje: string, alarm: boolean): string {
  return [
    'SISTEMSKO AŽURIRANJE STANJA PACIJENTA (simulacija):',
    `Trenutno stanje: ${stanje}.`,
    `Puls: ${vitalni.puls} bpm, Pritisak: ${vitalni.pritisak}, Saturacija: ${vitalni.saturacija}%.`,
    alarm
      ? 'HITAN ALARM: Pacijent se pogoršava. Diši teže, žali se na jači bol u grudima, budi uznemireniji.'
      : 'Prilagodi odgovore trenutnim vitalnim parametrima.',
  ].join(' ')
}

export default function SobaClientPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const sobaId = params?.id || ''
  const ulogaParam = searchParams.get('uloga')
  const uloga = isValidUloga(ulogaParam) ? ulogaParam : null
  const ucenikIdParam = searchParams.get('ucenikId')
  const forcedUcenikId = useMemo(() => {
    const parsed = ucenikIdParam ? Number(ucenikIdParam) : NaN
    return Number.isFinite(parsed) ? parsed : null
  }, [ucenikIdParam])

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [soba, setSoba] = useState<VapiSobaDetalji | null>(null)
  const [ucenici, setUcenici] = useState<UcenikOption[]>([])
  const [selectedUcenikId, setSelectedUcenikId] = useState('')

  const [vitalni, setVitalni] = useState<VitalniParametri>({ ...DEFAULT_VITALNI })
  const [trenutnoStanje, setTrenutnoStanje] = useState('stabilan')
  const [alarm, setAlarm] = useState(false)
  const [alarmPoruka, setAlarmPoruka] = useState<string | null>(null)
  const [statePrompt, setStatePrompt] = useState<string | null>(null)

  const [anamneza, setAnamneza] = useState('')
  const [terapija, setTerapija] = useState('')
  const [lekovi, setLekovi] = useState('')
  const [beleske, setBeleske] = useState('')
  const [history, setHistory] = useState<Array<{ t: number; puls: number; saturacija: number }>>([])

  const loadContext = useCallback(async () => {
    if (!sobaId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getSimulacijaJoinContext(sobaId)
      if (result.error || !result.data) {
        setError(result.error || 'Soba nije pronađena.')
        return
      }
      setSoba(result.data.soba)
      setUcenici(result.data.ucenici as UcenikOption[])
      if (result.data.soba.karton) {
        setVitalni(result.data.soba.karton.vitalni_parametri)
        setTrenutnoStanje(result.data.soba.karton.trenutno_stanje)
        setAnamneza(result.data.soba.karton.anamneza || '')
        setTerapija(result.data.soba.karton.terapija || '')
        setLekovi(result.data.soba.karton.lekovi || '')
        setBeleske(result.data.soba.karton.beleske_posmatrac || '')
        setHistory([
          {
            t: Date.now(),
            puls: result.data.soba.karton.vitalni_parametri.puls,
            saturacija: result.data.soba.karton.vitalni_parametri.saturacija,
          },
        ])
      }

      if (uloga) {
        const existing = result.data.soba.ucesnici.find((u) => u.uloga === uloga && u.ucenik_id)
        if (existing?.ucenik_id) {
          setSelectedUcenikId(String(existing.ucenik_id))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [sobaId, uloga])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  const { connected, connectionError, members } = useSobaPusher({
    sobaId: joined ? sobaId : null,
    enabled: joined,
    onUpdateState: (payload) => {
      setVitalni(payload.vitalniParametri)
      setTrenutnoStanje(payload.trenutnoStanje)
      setHistory((prev) =>
        [
          ...prev,
          {
            t: Date.now(),
            puls: payload.vitalniParametri.puls,
            saturacija: payload.vitalniParametri.saturacija,
          },
        ].slice(-40)
      )
      if (payload.hitanAlarm) {
        setAlarm(true)
        setAlarmPoruka(payload.poruka || 'HITAN ALARM')
      }
      setStatePrompt(
        buildStatePrompt(payload.vitalniParametri, payload.trenutnoStanje, Boolean(payload.hitanAlarm))
      )
    },
    onHitanAlarm: (payload) => {
      setAlarm(true)
      setAlarmPoruka(payload.poruka)
      if (payload.vitalniParametri) setVitalni(payload.vitalniParametri)
      if (payload.trenutnoStanje) setTrenutnoStanje(payload.trenutnoStanje)
      setStatePrompt(
        buildStatePrompt(
          payload.vitalniParametri || vitalni,
          payload.trenutnoStanje || trenutnoStanje,
          true
        )
      )
    },
    onZapisnikUpdate: (payload) => {
      if (typeof payload.anamneza === 'string') setAnamneza(payload.anamneza)
      if (typeof payload.terapija === 'string') setTerapija(payload.terapija)
      if (typeof payload.lekovi === 'string') setLekovi(payload.lekovi)
    },
  })

  const handleJoin = async () => {
    const targetId = forcedUcenikId ?? Number(selectedUcenikId)
    if (!uloga || !targetId) {
      setError('Izaberite sebe sa liste učenika.')
      return
    }
    setJoining(true)
    setError(null)
    try {
      const result = await pridruziSeSobi({
        sobaId,
        uloga,
        ucenikId: targetId,
      })
      if (result.error || !result.data) {
        setError(result.error || 'Greška pri pridruživanju.')
        return
      }
      setJoined(true)
      if (result.data.soba) setSoba(result.data.soba)
      if (result.data.pusherWarning) {
        setError(`Pridruženi ste, ali Pusher upozorenje: ${result.data.pusherWarning}`)
      }
    } finally {
      setJoining(false)
    }
  }

  useEffect(() => {
    if (forcedUcenikId && !joined && !joining && selectedUcenikId === String(forcedUcenikId)) {
      void handleJoin()
    }
  }, [forcedUcenikId, joined, joining, selectedUcenikId])

  const handleSaveZapisnik = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await sacuvajZapisnik({ sobaId, anamneza, terapija, lekovi })
      if (result.error) setError(result.error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBeleske = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await sacuvajBeleskePosmatraca({ sobaId, beleske })
      if (result.error) setError(result.error)
    } finally {
      setSaving(false)
    }
  }

  const UlogaIcon = uloga === 'trijaza' ? UserCheck : uloga === 'zapisnik' ? ClipboardList : Eye

  const maxPuls = useMemo(
    () => Math.max(100, ...history.map((h) => h.puls), vitalni.puls),
    [history, vitalni.puls]
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!uloga) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-lg text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-xl font-bold text-gray-900">Nedostaje uloga</h1>
          <p className="mt-2 text-sm text-gray-500">
            Skenirajte QR kod koji sadrži parametar <code>?uloga=trijaza|zapisnik|posmatrac</code>.
          </p>
        </div>
      </div>
    )
  }

  if (error && !soba) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-lg text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Greška</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <UlogaIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{ULOGA_LABELI[uloga]}</h1>
              <p className="text-xs text-gray-500">{soba?.naziv || 'Simulacija'}</p>
            </div>
          </div>
          {joined && (
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                  <Wifi className="h-3.5 w-3.5" /> Live · {members.length}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
                  <WifiOff className="h-3.5 w-3.5" /> Offline
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
        {connectionError && joined && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {connectionError}
          </div>
        )}

        {!joined ? (
          <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900">Pridruži se sobi</h2>
            <p className="text-sm text-gray-500">
              Uloga: <strong>{ULOGA_LABELI[uloga]}</strong>. Izaberite svoje ime da se povežete.
            </p>
            {forcedUcenikId ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                Automatski dodeljen učenik:{' '}
                <strong>
                  {ucenici.find((u) => u.id === forcedUcenikId)
                    ? `${ucenici.find((u) => u.id === forcedUcenikId)?.ime}${
                        ucenici.find((u) => u.id === forcedUcenikId)?.prezime
                          ? ` ${ucenici.find((u) => u.id === forcedUcenikId)?.prezime}`
                          : ''
                      }`
                    : forcedUcenikId}
                </strong>
              </div>
            ) : (
              <select
                value={selectedUcenikId}
                onChange={(e) => setSelectedUcenikId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              >
                <option value="">— izaberite učenika —</option>
                {ucenici.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.ime}
                    {u.prezime ? ` ${u.prezime}` : ''}
                    {u.razred ? ` (${u.razred})` : ''}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={joining || (!forcedUcenikId && !selectedUcenikId)}
              onClick={() => void handleJoin()}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              {joining ? 'Povezivanje…' : 'Ulaz u simulaciju'}
            </button>
          </div>
        ) : (
          <>
            {uloga === 'trijaza' && (
              <TrijazaVoicePanel
                sobaId={sobaId}
                assistantDbId={soba?.assistant_id ?? null}
                vitalni={vitalni}
                trenutnoStanje={trenutnoStanje}
                alarm={alarm}
                alarmPoruka={alarmPoruka}
                lastStatePrompt={statePrompt}
              />
            )}

            {uloga === 'zapisnik' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <VitalsWidget
                  vitalni={vitalni}
                  trenutnoStanje={trenutnoStanje}
                  alarm={alarm}
                  alarmPoruka={alarmPoruka}
                />
                <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <ClipboardList className="h-5 w-5 text-amber-500" /> Zapisnik
                  </h3>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Anamneza</label>
                    <textarea
                      value={anamneza}
                      onChange={(e) => setAnamneza(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Glavne tegobe, alergije…"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Terapija</label>
                    <textarea
                      value={terapija}
                      onChange={(e) => setTerapija(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Lekovi</label>
                    <textarea
                      value={lekovi}
                      onChange={(e) => setLekovi(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveZapisnik()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Čuvanje…' : 'Sačuvaj (realtime)'}
                  </button>
                </div>
              </div>
            )}

            {uloga === 'posmatrac' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <VitalsWidget
                    vitalni={vitalni}
                    trenutnoStanje={trenutnoStanje}
                    alarm={alarm}
                    alarmPoruka={alarmPoruka}
                  />
                  <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
                    <h3 className="mb-3 font-bold text-gray-900">Grafikon vitalnih funkcija</h3>
                    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <svg viewBox="0 0 400 160" className="h-full w-full" preserveAspectRatio="none">
                        {history.length > 1 && (
                          <>
                            <polyline
                              fill="none"
                              stroke="#e11d48"
                              strokeWidth="2"
                              points={history
                                .map((h, i) => {
                                  const x = (i / Math.max(1, history.length - 1)) * 400
                                  const y = 140 - (h.puls / maxPuls) * 120
                                  return `${x},${y}`
                                })
                                .join(' ')}
                            />
                            <polyline
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2"
                              points={history
                                .map((h, i) => {
                                  const x = (i / Math.max(1, history.length - 1)) * 400
                                  const y = 140 - (h.saturacija / 100) * 120
                                  return `${x},${y}`
                                })
                                .join(' ')}
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-semibold">
                        <span className="text-rose-600">● Puls</span>
                        <span className="text-sky-600">● SpO₂</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <Eye className="h-5 w-5 text-amber-500" /> Beleške i predlozi
                  </h3>
                  <textarea
                    value={beleske}
                    onChange={(e) => setBeleske(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Šta ste primetili? Predlozi za tim…"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveBeleske()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Čuvanje…' : 'Sačuvaj beleške'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
