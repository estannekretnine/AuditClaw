'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Play,
  Plus,
  Radio,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Square,
} from 'lucide-react'
import {
  azurirajStanjeSimulacije,
  getSobaDetalji,
  getSobeList,
  kreirajSobu,
  zavrsiSobu,
  getVapiUceniciList,
  getSimulacijaUserContext,
} from '@/lib/actions/vapi-simulacija'
import { getVapiAssistants } from '@/lib/actions/vapi-assistants'
import { getVapiProfesori } from '@/lib/actions/vapi-profesor'
import { useSobaPusher } from '@/lib/hooks/use-soba-pusher'
import { QrCodeCard } from '@/components/vapi/qr-code-card'
import { VitalsWidget } from '@/components/vapi/vitals-widget'
import { SearchableSelect, type SearchableOption } from '@/components/ui/searchable-select'
import {
  DEFAULT_VITALNI,
  ULOGA_LABELI,
  type SobaJoinLinkovi,
  type VapiSoba,
  type VapiSobaDetalji,
  type VapiSimulacijaUloga,
  type VitalniParametri,
  type UcesnikAssignments,
} from '@/lib/types/vapi-simulacija'
import type { VapiAssistant, VapiProfesor } from '@/lib/types/vapi'

function ucenikImeFromSlot(
  soba: VapiSobaDetalji | null,
  uloga: VapiSimulacijaUloga
): string | null {
  const slot = soba?.ucesnici.find((u) => u.uloga === uloga)
  if (!slot?.vapi_ucenik) return null
  return `${slot.vapi_ucenik.ime}${slot.vapi_ucenik.prezime ? ` ${slot.vapi_ucenik.prezime}` : ''}`.trim()
}

function isOnline(soba: VapiSobaDetalji | null, uloga: VapiSimulacijaUloga): boolean {
  return Boolean(soba?.ucesnici.find((u) => u.uloga === uloga)?.online_status)
}

export default function VapiSimulacija1Page() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sobe, setSobe] = useState<VapiSoba[]>([])
  const [activeSoba, setActiveSoba] = useState<VapiSobaDetalji | null>(null)
  const [linkovi, setLinkovi] = useState<SobaJoinLinkovi | null>(null)
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [profesori, setProfesori] = useState<VapiProfesor[]>([])
  const [ucenici, setUcenici] = useState<
    Array<{ id: number; ime: string; prezime: string | null; razred: string | null }>
  >([])

  const [naziv, setNaziv] = useState('')
  const [assistantId, setAssistantId] = useState('')
  const [profesorId, setProfesorId] = useState('')
  const [lockedProfesorId, setLockedProfesorId] = useState<number | null>(null)
  const [istorija, setIstorija] = useState('Pacijent sa bolom u grudima, 58 godina.')
  const [ucesnikTrijaza, setUcesnikTrijaza] = useState('')
  const [ucesnikZapisnik, setUcesnikZapisnik] = useState('')
  const [ucesnikPosmatrac, setUcesnikPosmatrac] = useState('')

  const [vitalni, setVitalni] = useState<VitalniParametri>({ ...DEFAULT_VITALNI })
  const [trenutnoStanje, setTrenutnoStanje] = useState('stabilan')
  const [alarm, setAlarm] = useState(false)
  const [alarmPoruka, setAlarmPoruka] = useState<string | null>(null)
  const [qrIndex, setQrIndex] = useState(0)

  const profesorOptions = useMemo<SearchableOption[]>(
    () =>
      profesori.map((p) => ({
        value: String(p.id),
        label: `${p.ime}${p.prezime ? ` ${p.prezime}` : ''}`,
      })),
    [profesori]
  )

  const ucenikOptions = useMemo<SearchableOption[]>(
    () =>
      ucenici.map((u) => ({
        value: String(u.id),
        label: `${u.ime}${u.prezime ? ` ${u.prezime}` : ''}${u.razred ? ` (${u.razred})` : ''}`,
      })),
    [ucenici]
  )

  const generateNaziv = useCallback(() => {
    const rand = Math.floor(1000 + Math.random() * 9000)
    const suffix = Date.now().toString().slice(-4)
    return `soba-${rand}-${suffix}`
  }, [])

  const loadLists = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sobeRes, assRes, profRes, uceniciRes, userCtx] = await Promise.all([
        getSobeList(40),
        getVapiAssistants(200, 0),
        getVapiProfesori(200, 0),
        getVapiUceniciList(500),
        getSimulacijaUserContext(),
      ])
      if (sobeRes.error) setError(sobeRes.error)
      setSobe(sobeRes.data || [])
      setAssistants(assRes.data || [])
      setProfesori(profRes.data || [])
      setUcenici((uceniciRes.data as typeof ucenici) || [])
      if (userCtx.role === 'vapi' && userCtx.profesorId) {
        setProfesorId(String(userCtx.profesorId))
        setLockedProfesorId(userCtx.profesorId)
      } else {
        setLockedProfesorId(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  useEffect(() => {
    setNaziv(generateNaziv())
  }, [generateNaziv])

  const buildJoinUrl = useCallback(
    (sobaId: string, uloga: VapiSimulacijaUloga, assignments?: UcesnikAssignments) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const ucenikId = assignments?.[uloga]
      const query = ucenikId ? `?uloga=${uloga}&ucenikId=${ucenikId}` : `?uloga=${uloga}`
      return `${origin}/soba/${sobaId}${query}`
    },
    []
  )

  const refreshActive = useCallback(async (sobaId: string) => {
    const result = await getSobaDetalji(sobaId)
    if (result.data) {
      setActiveSoba(result.data)
      const assignments: UcesnikAssignments = {}
      result.data.ucesnici.forEach((u) => {
        assignments[u.uloga] = u.ucenik_id ?? null
      })
      if (result.data.karton) {
        setVitalni(result.data.karton.vitalni_parametri)
        setTrenutnoStanje(result.data.karton.trenutno_stanje)
      }
      setLinkovi({
        trijaza: buildJoinUrl(sobaId, 'trijaza', assignments),
        zapisnik: buildJoinUrl(sobaId, 'zapisnik', assignments),
        posmatrac: buildJoinUrl(sobaId, 'posmatrac', assignments),
      })
    }
  }, [buildJoinUrl])

  const { connected, connectionError, members } = useSobaPusher({
    sobaId: activeSoba?.id ?? null,
    enabled: Boolean(activeSoba?.id),
    onStudentJoined: () => {
      if (activeSoba?.id) void refreshActive(activeSoba.id)
    },
    onUpdateState: (payload) => {
      setVitalni(payload.vitalniParametri)
      setTrenutnoStanje(payload.trenutnoStanje)
      if (payload.hitanAlarm) {
        setAlarm(true)
        setAlarmPoruka(payload.poruka || 'HITAN ALARM')
      }
    },
    onHitanAlarm: (payload) => {
      setAlarm(true)
      setAlarmPoruka(payload.poruka)
      if (payload.vitalniParametri) setVitalni(payload.vitalniParametri)
      if (payload.trenutnoStanje) setTrenutnoStanje(payload.trenutnoStanje)
    },
  })

  const handleCreate = async () => {
    const finalNaziv = naziv.trim() || generateNaziv()
    setSaving(true)
    setError(null)
    setAlarm(false)
    setAlarmPoruka(null)
    try {
      const assignments: { uloga: VapiSimulacijaUloga; ucenikId: number }[] = []
      if (ucesnikTrijaza) assignments.push({ uloga: 'trijaza', ucenikId: Number(ucesnikTrijaza) })
      if (ucesnikZapisnik) assignments.push({ uloga: 'zapisnik', ucenikId: Number(ucesnikZapisnik) })
      if (ucesnikPosmatrac) assignments.push({ uloga: 'posmatrac', ucenikId: Number(ucesnikPosmatrac) })

      const result = await kreirajSobu({
        naziv: finalNaziv,
        assistantId: assistantId ? Number(assistantId) : null,
        profesorId: profesorId ? Number(profesorId) : lockedProfesorId,
        istorijaBolesti: istorija.trim() || null,
        origin: window.location.origin,
        ucesnici: assignments,
      })
      if (result.error || !result.data?.soba) {
        setError(result.error || 'Greška pri kreiranju sobe.')
        return
      }
      setActiveSoba(result.data.soba)
      setLinkovi(result.data.linkovi)
      setVitalni(result.data.soba.karton?.vitalni_parametri || { ...DEFAULT_VITALNI })
      setTrenutnoStanje(result.data.soba.karton?.trenutno_stanje || 'stabilan')
      setNaziv(generateNaziv())
      setUcesnikTrijaza('')
      setUcesnikZapisnik('')
      setUcesnikPosmatrac('')
      await loadLists()
    } finally {
      setSaving(false)
    }
  }

  const handleSelectSoba = async (soba: VapiSoba) => {
    setAlarm(false)
    setAlarmPoruka(null)
    await refreshActive(soba.id)
  }

  const pushState = async (opts?: { hitanAlarm?: boolean; poruka?: string }) => {
    if (!activeSoba) return
    setSaving(true)
    setError(null)
    try {
      const result = await azurirajStanjeSimulacije({
        sobaId: activeSoba.id,
        vitalniParametri: vitalni,
        trenutnoStanje,
        hitanAlarm: opts?.hitanAlarm,
        poruka: opts?.poruka,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data?.pusherWarning) {
        setError(`Stanje sačuvano, ali Pusher upozorenje: ${result.data.pusherWarning}`)
      }
      if (opts?.hitanAlarm) {
        setAlarm(true)
        setAlarmPoruka(opts.poruka || 'HITAN ALARM')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleInfarkt = async () => {
    const nextVitalni: VitalniParametri = {
      ...vitalni,
      puls: 140,
      pritisak: '90/60',
      saturacija: 88,
    }
    setVitalni(nextVitalni)
    setTrenutnoStanje('kritično — sumnja na infarkt')
    if (!activeSoba) return
    setSaving(true)
    try {
      const result = await azurirajStanjeSimulacije({
        sobaId: activeSoba.id,
        vitalniParametri: nextVitalni,
        trenutnoStanje: 'kritično — sumnja na infarkt',
        hitanAlarm: true,
        poruka: 'HITAN ALARM: Simulacija infarkta — puls 140, SpO₂ 88%, hipotenzija.',
      })
      if (result.error) setError(result.error)
      setAlarm(true)
      setAlarmPoruka('HITAN ALARM: Simulacija infarkta')
    } finally {
      setSaving(false)
    }
  }

  const handleLiveSync = useCallback(async () => {
    if (!activeSoba || activeSoba.status === 'zavrsena') return
    try {
      await azurirajStanjeSimulacije({
        sobaId: activeSoba.id,
        vitalniParametri: vitalni,
        trenutnoStanje,
      })
    } catch (err) {
      console.error('Live sync stanja neuspešan:', err)
    }
  }, [activeSoba, vitalni, trenutnoStanje])

  const handleQrPrev = () => {
    setQrIndex((prev) => (prev - 1 + qrUloge.length) % qrUloge.length)
  }

  const handleQrNext = () => {
    setQrIndex((prev) => (prev + 1) % qrUloge.length)
  }

  const handleZavrsi = async () => {
    if (!activeSoba) return
    if (!window.confirm('Završiti ovu simulaciju?')) return
    const result = await zavrsiSobu(activeSoba.id)
    if (result.error) {
      setError(result.error)
      return
    }
    await refreshActive(activeSoba.id)
    await loadLists()
  }

  const sistola = useMemo(() => {
    const parts = String(vitalni.pritisak).split('/')
    return Number(parts[0]) || 120
  }, [vitalni.pritisak])

  const diastola = useMemo(() => {
    const parts = String(vitalni.pritisak).split('/')
    return Number(parts[1]) || 80
  }, [vitalni.pritisak])

  const qrUloge = useMemo<VapiSimulacijaUloga[]>(() => ['trijaza', 'zapisnik', 'posmatrac'], [])
  const currentQrUloga = qrUloge[qrIndex % qrUloge.length]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Vapi Simulacija 1
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Real-time medicinska simulacija: QR uloge, Pusher kanal, Vapi + Simli AI pacijent.
          </p>
        </div>
        {activeSoba && (
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 border border-emerald-200">
                <Wifi className="h-3.5 w-3.5" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 border border-amber-200">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            )}
            <span className="text-gray-500">{members.length} prisutnih</span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {connectionError && activeSoba && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {connectionError}
        </div>
      )}

      {/* Kreiranje sobe */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-amber-500" /> Nova soba
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-600">Naziv (automatski)</label>
            <input
              value={naziv}
              readOnly
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Vapi asistent</label>
            <select
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="">— opciono —</option>
              {assistants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.opis_servisa || a.assistant_id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Profesor</label>
            <SearchableSelect
              value={profesorId}
              onChange={setProfesorId}
              options={[{ value: '', label: '— automatski —' }, ...profesorOptions]}
              placeholder="Pretraži profesora…"
              disabled={Boolean(lockedProfesorId)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Istorija bolesti</label>
          <textarea
            value={istorija}
            onChange={(e) => setIstorija(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Trijaža učenik</label>
            <SearchableSelect
              value={ucesnikTrijaza}
              onChange={setUcesnikTrijaza}
              options={[{ value: '', label: '— izaberi učenika —' }, ...ucenikOptions]}
              placeholder="Pretraži učenika…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Zapisnik učenik</label>
            <SearchableSelect
              value={ucesnikZapisnik}
              onChange={setUcesnikZapisnik}
              options={[{ value: '', label: '— izaberi učenika —' }, ...ucenikOptions]}
              placeholder="Pretraži učenika…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Posmatrač učenik</label>
            <SearchableSelect
              value={ucesnikPosmatrac}
              onChange={setUcesnikPosmatrac}
              options={[{ value: '', label: '— izaberi učenika —' }, ...ucenikOptions]}
              placeholder="Pretraži učenika…"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {saving ? 'Kreiranje…' : 'Kreiraj sobu'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista soba */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg lg:col-span-1">
          <h3 className="mb-3 text-base font-bold text-gray-900">Prethodne sobe</h3>
          {sobe.length === 0 ? (
            <p className="text-sm text-gray-500">Još nema kreiranih soba.</p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {sobe.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelectSoba(s)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      activeSoba?.id === s.id
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.naziv}</p>
                    <p className="text-xs text-gray-500">
                      {s.status} · {new Date(s.created_at).toLocaleString('sr-RS')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aktivna soba */}
        <div className="space-y-4 lg:col-span-2">
          {!activeSoba ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
              Kreirajte ili izaberite sobu da prikažete QR kodove i kontrolnu tablu.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-white">
                <div>
                  <p className="font-bold">{activeSoba.naziv}</p>
                  <p className="text-xs text-gray-400">
                    Status: {activeSoba.status} · ID: {activeSoba.id.slice(0, 8)}…
                  </p>
                </div>
                {activeSoba.status !== 'zavrsena' && (
                  <button
                    type="button"
                    onClick={() => void handleZavrsi()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
                  >
                    <Square className="h-3.5 w-3.5" /> Završi
                  </button>
                )}
              </div>

              {linkovi && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="text-xs uppercase tracking-wide text-gray-500">QR kod za</span>
                      <span className="text-base font-bold text-gray-900">
                        {ULOGA_LABELI[currentQrUloga]}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {qrIndex + 1} / {qrUloge.length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQrPrev}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        ← Prethodni
                      </button>
                      <button
                        type="button"
                        onClick={handleQrNext}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Sledeći →
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <QrCodeCard
                      label={ULOGA_LABELI[currentQrUloga]}
                      url={linkovi[currentQrUloga]}
                      online={isOnline(activeSoba, currentQrUloga)}
                      studentName={ucenikImeFromSlot(activeSoba, currentQrUloga)}
                    />
                  </div>
                </div>
              )}

              <VitalsWidget
                vitalni={vitalni}
                trenutnoStanje={trenutnoStanje}
                alarm={alarm}
                alarmPoruka={alarmPoruka}
              />

              {/* Kontrolna tabla */}
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg space-y-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <Radio className="h-5 w-5 text-amber-500" /> Kontrolna tabla
                </h3>

                <div>
                  <label className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span className="flex items-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5" /> Puls
                    </span>
                    <span>{vitalni.puls} bpm</span>
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={vitalni.puls}
                    onChange={(e) =>
                      setVitalni((prev) => ({ ...prev, puls: Number(e.target.value) }))
                    }
                  onMouseUp={() => void handleLiveSync()}
                  onTouchEnd={() => void handleLiveSync()}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                      <span>Sistola</span>
                      <span>{sistola}</span>
                    </label>
                    <input
                      type="range"
                      min={70}
                      max={200}
                      value={sistola}
                      onChange={(e) =>
                        setVitalni((prev) => ({
                          ...prev,
                          pritisak: `${e.target.value}/${diastola}`,
                        }))
                      }
                    onMouseUp={() => void handleLiveSync()}
                    onTouchEnd={() => void handleLiveSync()}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                      <span>Dijastola</span>
                      <span>{diastola}</span>
                    </label>
                    <input
                      type="range"
                      min={40}
                      max={120}
                      value={diastola}
                      onChange={(e) =>
                        setVitalni((prev) => ({
                          ...prev,
                          pritisak: `${sistola}/${e.target.value}`,
                        }))
                      }
                    onMouseUp={() => void handleLiveSync()}
                    onTouchEnd={() => void handleLiveSync()}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                    <span>Saturacija</span>
                    <span>{vitalni.saturacija}%</span>
                  </label>
                  <input
                    type="range"
                    min={70}
                    max={100}
                    value={vitalni.saturacija}
                    onChange={(e) =>
                      setVitalni((prev) => ({ ...prev, saturacija: Number(e.target.value) }))
                    }
                  onMouseUp={() => void handleLiveSync()}
                  onTouchEnd={() => void handleLiveSync()}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Trenutno stanje
                  </label>
                  <input
                    value={trenutnoStanje}
                  onChange={(e) => setTrenutnoStanje(e.target.value)}
                  onBlur={() => void handleLiveSync()}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving || activeSoba.status === 'zavrsena'}
                    onClick={() => void pushState()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Pošalji stanje
                  </button>
                  <button
                    type="button"
                    disabled={saving || activeSoba.status === 'zavrsena'}
                    onClick={() => void handleInfarkt()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-4 w-4" /> Simuliraj infarkt
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
