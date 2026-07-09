'use server'

import { getCurrentUser } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveStatus } from '@/lib/role-utils'
import type { Korisnik } from '@/lib/types/database'
import type {
  VapiAnalizaFilter,
  VapiAnalizaFilterOptions,
  VapiAnalizaReport,
  VapiAnalizaCountItem,
  VapiAnalizaDailyItem,
  VapiAnalizaGradeBucket,
} from '@/lib/types/vapi-analiza'
import type { VapiOdgovor } from '@/lib/types/vapi'

const ODGOVOR_SELECT =
  '*, vapi_assistants(assistant_id, opis_servisa), vapi_ucenik(ime, prezime, razred), vapi_profesor(ime, prezime)'

function emptyReport(filter: VapiAnalizaFilter): VapiAnalizaReport {
  return {
    period: {
      dateFrom: filter.dateFrom || null,
      dateTo: filter.dateTo || null,
      profesorId: filter.profesorId ?? null,
      ucenikId: filter.ucenikId ?? null,
      odeljenje: filter.odeljenje || null,
    },
    summary: {
      totalOdgovori: 0,
      uniqueUcenici: 0,
      uniqueProfesori: 0,
      uniqueAssistants: 0,
      avgOcenaAi: null,
      avgOcenaProfesor: null,
      withProfesorOcena: 0,
      withAiOcena: 0,
      totalAssistants: 0,
      totalUcenici: 0,
      totalProfesori: 0,
      totalOprema: 0,
      activeProfesori: 0,
    },
    dailyOdgovori: [],
    byAssistant: [],
    byProfesor: [],
    byUcenik: [],
    byRazred: [],
    byOprema: [],
    gradeDistributionAi: [],
    gradeDistributionProf: [],
  }
}

async function requireReadAccess() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Nemate dozvolu za ovu akciju.', user: null as Korisnik | null }
  }

  const effectiveStatus = getEffectiveStatus(user.stsstatus, user.adresa)
  if (effectiveStatus !== 'admin' && effectiveStatus !== 'manager' && effectiveStatus !== 'vapi') {
    return { error: 'Nemate dozvolu za ovu akciju.', user: null as Korisnik | null }
  }

  return { error: null, user: { ...user, stsstatus: effectiveStatus } }
}

async function getVapiUserProfesorId(user: Korisnik): Promise<number | null> {
  if (user.profesorid) return user.profesorid

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('korisnici')
    .select('profesorid')
    .eq('id', user.id)
    .maybeSingle()

  return data?.profesorid ?? null
}

function parseGrade(value: string | null): number | null {
  if (!value) return null
  const normalized = value.replace(',', '.').trim()
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100
}

function buildCountItems(
  map: Map<string, { id: number | string; label: string; extra?: string | null; count: number; ai: number[]; prof: number[] }>
): VapiAnalizaCountItem[] {
  return [...map.values()]
    .map((item) => ({
      id: item.id,
      label: item.label,
      extra: item.extra ?? null,
      count: item.count,
      avgAi: average(item.ai),
      avgProf: average(item.prof),
    }))
    .sort((a, b) => b.count - a.count)
}

function buildGradeDistribution(values: (string | null)[]): VapiAnalizaGradeBucket[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    const grade = (value || '—').trim() || '—'
    counts.set(grade, (counts.get(grade) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => b.count - a.count)
}

function getAssistantLabel(odgovor: VapiOdgovor): string {
  if (odgovor.vapi_assistants?.opis_servisa) return odgovor.vapi_assistants.opis_servisa
  if (odgovor.vapi_assistants?.assistant_id) return odgovor.vapi_assistants.assistant_id
  return odgovor.assistant_id ? `Asistent #${odgovor.assistant_id}` : 'Bez asistenta'
}

function getUcenikLabel(odgovor: VapiOdgovor): string {
  const ucenik = odgovor.vapi_ucenik
  if (!ucenik) return 'Bez učenika'
  return `${ucenik.ime} ${ucenik.prezime || ''}`.trim()
}

function getProfesorLabel(odgovor: VapiOdgovor): string {
  const profesor = odgovor.vapi_profesor
  if (!profesor) return 'Bez profesora'
  return `${profesor.ime}${profesor.prezime ? ` ${profesor.prezime}` : ''}`.trim()
}

export async function getVapiAnalizaFilterOptions(): Promise<{
  data: VapiAnalizaFilterOptions | null
  error: string | null
}> {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const supabase = createAdminClient()

  let profesoriQuery = supabase
    .from('vapi_profesor')
    .select('id, ime, prezime')
    .order('ime', { ascending: true })

  let uceniciQuery = supabase
    .from('vapi_ucenik')
    .select('id, ime, prezime, razred')
    .order('ime', { ascending: true })

  if (access.user?.stsstatus === 'vapi') {
    const profesorId = await getVapiUserProfesorId(access.user)
    if (!profesorId) {
      return {
        data: { profesori: [], ucenici: [], odeljenja: [] },
        error: null,
      }
    }
    profesoriQuery = profesoriQuery.eq('id', profesorId)
  }

  const [profesoriResult, uceniciResult] = await Promise.all([profesoriQuery, uceniciQuery])

  if (profesoriResult.error) return { data: null, error: profesoriResult.error.message }
  if (uceniciResult.error) return { data: null, error: uceniciResult.error.message }

  const odeljenjaSet = new Set<string>()
  const ucenici = (uceniciResult.data || []).map((ucenik) => {
    const odeljenje = (ucenik.razred as string | null)?.trim() || null
    if (odeljenje) odeljenjaSet.add(odeljenje)
    return {
      id: ucenik.id as number,
      label: `${ucenik.ime}${ucenik.prezime ? ` ${ucenik.prezime}` : ''}${odeljenje ? ` — ${odeljenje}` : ''}`.trim(),
      odeljenje,
    }
  })

  const profesori = (profesoriResult.data || []).map((profesor) => ({
    id: profesor.id as number,
    label: `${profesor.ime}${profesor.prezime ? ` ${profesor.prezime}` : ''}`.trim(),
  }))

  return {
    data: {
      profesori,
      ucenici,
      odeljenja: [...odeljenjaSet].sort((a, b) => a.localeCompare(b, 'sr')),
    },
    error: null,
  }
}

export async function getVapiAnalizaReport(
  filter: VapiAnalizaFilter = {}
): Promise<{ data: VapiAnalizaReport | null; error: string | null }> {
  const access = await requireReadAccess()
  if (access.error) return { data: null, error: access.error }

  const supabase = createAdminClient()

  let odgovorQuery = supabase
    .from('vapi_odgovor')
    .select(ODGOVOR_SELECT)
    .order('datumvreme', { ascending: true })

  if (filter.dateFrom) {
    odgovorQuery = odgovorQuery.gte('datumvreme', `${filter.dateFrom}T00:00:00`)
  }
  if (filter.dateTo) {
    odgovorQuery = odgovorQuery.lte('datumvreme', `${filter.dateTo}T23:59:59.999`)
  }
  if (filter.profesorId) {
    odgovorQuery = odgovorQuery.eq('profesorid', filter.profesorId)
  }
  if (filter.ucenikId) {
    odgovorQuery = odgovorQuery.eq('ucenikid', filter.ucenikId)
  }
  if (filter.odeljenje) {
    const { data: uceniciZaOdeljenje, error: uceniciError } = await supabase
      .from('vapi_ucenik')
      .select('id')
      .eq('razred', filter.odeljenje)

    if (uceniciError) {
      return { data: null, error: uceniciError.message }
    }

    const ucenikIds = (uceniciZaOdeljenje || []).map((item) => item.id as number)
    if (ucenikIds.length === 0) {
      return { data: emptyReport(filter), error: null }
    }
    odgovorQuery = odgovorQuery.in('ucenikid', ucenikIds)
  }

  if (access.user?.stsstatus === 'vapi') {
    const profesorId = await getVapiUserProfesorId(access.user)
    if (!profesorId) {
      return { data: emptyReport(filter), error: null }
    }
    odgovorQuery = odgovorQuery.or(`profesorid.eq.${profesorId},profesorid.is.null`)
  }

  const [
    odgovoriResult,
    assistantsCountResult,
    uceniciCountResult,
    profesoriCountResult,
    opremaCountResult,
    linksResult,
    opremaResult,
    activeProfesoriResult,
  ] = await Promise.all([
    odgovorQuery,
    supabase.from('vapi_assistants').select('id', { count: 'exact', head: true }),
    supabase.from('vapi_ucenik').select('id', { count: 'exact', head: true }),
    supabase.from('vapi_profesor').select('id', { count: 'exact', head: true }),
    supabase.from('vapi_medicinskaoprema').select('id', { count: 'exact', head: true }),
    supabase.from('vapi_assistanmedoprema').select('assistantid, medopremaid'),
    supabase.from('vapi_medicinskaoprema').select('id, naziv'),
    supabase.from('vapi_profesor').select('id', { count: 'exact', head: true }).eq('stsaktivan', true),
  ])

  if (odgovoriResult.error) {
    return { data: null, error: odgovoriResult.error.message }
  }

  const odgovori = (odgovoriResult.data || []) as VapiOdgovor[]
  const opremaById = new Map(
    (opremaResult.data || []).map((item) => [item.id as number, item.naziv as string])
  )

  const assistantToOprema = new Map<number, number[]>()
  for (const link of linksResult.data || []) {
    if (!link.assistantid || !link.medopremaid) continue
    const list = assistantToOprema.get(link.assistantid) || []
    list.push(link.medopremaid)
    assistantToOprema.set(link.assistantid, list)
  }

  const dailyMap = new Map<string, number>()
  const assistantMap = new Map<string, { id: number | string; label: string; count: number; ai: number[]; prof: number[] }>()
  const profesorMap = new Map<string, { id: number | string; label: string; count: number; ai: number[]; prof: number[] }>()
  const ucenikMap = new Map<string, { id: number | string; label: string; extra?: string | null; count: number; ai: number[]; prof: number[] }>()
  const razredMap = new Map<string, { id: number | string; label: string; count: number; ai: number[]; prof: number[] }>()
  const opremaMap = new Map<string, { id: number | string; label: string; count: number; ai: number[]; prof: number[] }>()

  const aiGrades: (string | null)[] = []
  const profGrades: (string | null)[] = []
  const aiNumeric: number[] = []
  const profNumeric: number[] = []

  const uniqueUcenici = new Set<number>()
  const uniqueProfesori = new Set<number>()
  const uniqueAssistants = new Set<number>()

  for (const odgovor of odgovori) {
    if (odgovor.datumvreme) {
      const day = odgovor.datumvreme.slice(0, 10)
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    }

    const ai = parseGrade(odgovor.ocena_ai)
    const prof = parseGrade(odgovor.ocena_profesor)
    aiGrades.push(odgovor.ocena_ai)
    profGrades.push(odgovor.ocena_profesor)
    if (ai !== null) aiNumeric.push(ai)
    if (prof !== null) profNumeric.push(prof)

    if (odgovor.ucenikid) uniqueUcenici.add(odgovor.ucenikid)
    if (odgovor.profesorid) uniqueProfesori.add(odgovor.profesorid)
    if (odgovor.assistant_id) uniqueAssistants.add(odgovor.assistant_id)

    const assistantKey = String(odgovor.assistant_id ?? 'none')
    const assistantEntry = assistantMap.get(assistantKey) || {
      id: odgovor.assistant_id ?? 'none',
      label: getAssistantLabel(odgovor),
      count: 0,
      ai: [],
      prof: [],
    }
    assistantEntry.count += 1
    if (ai !== null) assistantEntry.ai.push(ai)
    if (prof !== null) assistantEntry.prof.push(prof)
    assistantMap.set(assistantKey, assistantEntry)

    const profesorKey = String(odgovor.profesorid ?? 'none')
    const profesorEntry = profesorMap.get(profesorKey) || {
      id: odgovor.profesorid ?? 'none',
      label: getProfesorLabel(odgovor),
      count: 0,
      ai: [],
      prof: [],
    }
    profesorEntry.count += 1
    if (ai !== null) profesorEntry.ai.push(ai)
    if (prof !== null) profesorEntry.prof.push(prof)
    profesorMap.set(profesorKey, profesorEntry)

    const ucenikKey = String(odgovor.ucenikid ?? 'none')
    const ucenikEntry = ucenikMap.get(ucenikKey) || {
      id: odgovor.ucenikid ?? 'none',
      label: getUcenikLabel(odgovor),
      extra: odgovor.vapi_ucenik?.razred ?? null,
      count: 0,
      ai: [],
      prof: [],
    }
    ucenikEntry.count += 1
    if (ai !== null) ucenikEntry.ai.push(ai)
    if (prof !== null) ucenikEntry.prof.push(prof)
    ucenikMap.set(ucenikKey, ucenikEntry)

    const razred = odgovor.vapi_ucenik?.razred?.trim() || 'Bez razreda'
    const razredEntry = razredMap.get(razred) || {
      id: razred,
      label: razred,
      count: 0,
      ai: [],
      prof: [],
    }
    razredEntry.count += 1
    if (ai !== null) razredEntry.ai.push(ai)
    if (prof !== null) razredEntry.prof.push(prof)
    razredMap.set(razred, razredEntry)

    if (odgovor.assistant_id) {
      const linkedOprema = assistantToOprema.get(odgovor.assistant_id) || []
      for (const medId of linkedOprema) {
        const naziv = opremaById.get(medId) || `Oprema #${medId}`
        const opremaKey = String(medId)
        const opremaEntry = opremaMap.get(opremaKey) || {
          id: medId,
          label: naziv,
          count: 0,
          ai: [],
          prof: [],
        }
        opremaEntry.count += 1
        if (ai !== null) opremaEntry.ai.push(ai)
        if (prof !== null) opremaEntry.prof.push(prof)
        opremaMap.set(opremaKey, opremaEntry)
      }
    }
  }

  const dailyOdgovori: VapiAnalizaDailyItem[] = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const report: VapiAnalizaReport = {
    period: {
      dateFrom: filter.dateFrom || null,
      dateTo: filter.dateTo || null,
      profesorId: filter.profesorId ?? null,
      ucenikId: filter.ucenikId ?? null,
      odeljenje: filter.odeljenje || null,
    },
    summary: {
      totalOdgovori: odgovori.length,
      uniqueUcenici: uniqueUcenici.size,
      uniqueProfesori: uniqueProfesori.size,
      uniqueAssistants: uniqueAssistants.size,
      avgOcenaAi: average(aiNumeric),
      avgOcenaProfesor: average(profNumeric),
      withProfesorOcena: profNumeric.length,
      withAiOcena: aiNumeric.length,
      totalAssistants: assistantsCountResult.count || 0,
      totalUcenici: uceniciCountResult.count || 0,
      totalProfesori: profesoriCountResult.count || 0,
      totalOprema: opremaCountResult.count || 0,
      activeProfesori: activeProfesoriResult.count || 0,
    },
    dailyOdgovori,
    byAssistant: buildCountItems(assistantMap),
    byProfesor: buildCountItems(profesorMap),
    byUcenik: buildCountItems(ucenikMap),
    byRazred: buildCountItems(razredMap),
    byOprema: buildCountItems(opremaMap),
    gradeDistributionAi: buildGradeDistribution(aiGrades),
    gradeDistributionProf: buildGradeDistribution(profGrades),
  }

  return { data: report, error: null }
}
