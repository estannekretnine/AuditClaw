export interface VapiAnalizaFilter {
  dateFrom?: string
  dateTo?: string
  profesorId?: number
  ucenikId?: number
  odeljenje?: string
}

export interface VapiAnalizaFilterOptions {
  profesori: Array<{ id: number; label: string }>
  ucenici: Array<{ id: number; label: string; odeljenje: string | null }>
  odeljenja: string[]
}

export interface VapiAnalizaCountItem {
  id: number | string
  label: string
  count: number
  avgAi: number | null
  avgProf: number | null
  extra?: string | null
}

export interface VapiAnalizaDailyItem {
  date: string
  count: number
}

export interface VapiAnalizaGradeBucket {
  grade: string
  count: number
}

export interface VapiAnalizaReport {
  period: {
    dateFrom: string | null
    dateTo: string | null
    profesorId: number | null
    ucenikId: number | null
    odeljenje: string | null
  }
  summary: {
    totalOdgovori: number
    uniqueUcenici: number
    uniqueProfesori: number
    uniqueAssistants: number
    avgOcenaAi: number | null
    avgOcenaProfesor: number | null
    withProfesorOcena: number
    withAiOcena: number
    totalAssistants: number
    totalUcenici: number
    totalProfesori: number
    totalOprema: number
    activeProfesori: number
  }
  dailyOdgovori: VapiAnalizaDailyItem[]
  byAssistant: VapiAnalizaCountItem[]
  byProfesor: VapiAnalizaCountItem[]
  byUcenik: VapiAnalizaCountItem[]
  byRazred: VapiAnalizaCountItem[]
  byOprema: VapiAnalizaCountItem[]
  gradeDistributionAi: VapiAnalizaGradeBucket[]
  gradeDistributionProf: VapiAnalizaGradeBucket[]
}
