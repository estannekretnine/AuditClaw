'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  AnalyticsFilter, 
  AnalyticsSummary, 
  PonudaAnalytics,
  PoziviWithAnalytics 
} from '@/lib/types/webstrana-log'

export async function getAnalyticsSummary(filter: AnalyticsFilter): Promise<AnalyticsSummary> {
  const supabase = await createClient()
  
  let query = supabase.from('webstrana_log').select('*')
  
  if (filter.ponudaId) {
    query = query.eq('ponuda_id', filter.ponudaId)
  }
  if (filter.kampanjaId) {
    query = query.eq('kampanja_id', filter.kampanjaId)
  }
  if (filter.eventType) {
    query = query.eq('event_type', filter.eventType)
  }
  if (filter.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }
  if (filter.dateTo) {
    query = query.lte('created_at', filter.dateTo)
  }
  if (filter.language) {
    query = query.eq('language', filter.language)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('Error fetching analytics:', error)
    return {
      totalPageViews: 0,
      uniqueSessions: 0,
      avgTimeSpent: 0,
      totalWhatsappClicks: 0,
      totalPhotoClicks: 0,
      languageDistribution: [],
      eventDistribution: [],
      dailyViews: []
    }
  }

  const pageViews = logs?.filter(l => l.event_type === 'page_view') || []
  const uniqueSessions = new Set(logs?.map(l => l.session_id) || []).size
  
  const pageLeaves = logs?.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds) || []
  const avgTimeSpent = pageLeaves.length > 0 
    ? Math.round(pageLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / pageLeaves.length)
    : 0

  const whatsappClicks = logs?.filter(l => l.event_type === 'whatsapp_click').length || 0
  const photoClicks = logs?.filter(l => l.event_type === 'photo_click').length || 0

  const languageCounts: Record<string, number> = {}
  logs?.forEach(l => {
    if (l.language) {
      languageCounts[l.language] = (languageCounts[l.language] || 0) + 1
    }
  })
  const languageDistribution = Object.entries(languageCounts).map(([language, count]) => ({
    language,
    count
  }))

  const eventCounts: Record<string, number> = {}
  logs?.forEach(l => {
    eventCounts[l.event_type] = (eventCounts[l.event_type] || 0) + 1
  })
  const eventDistribution = Object.entries(eventCounts).map(([event_type, count]) => ({
    event_type,
    count
  }))

  const dailyCounts: Record<string, number> = {}
  pageViews.forEach(l => {
    const date = l.created_at.split('T')[0]
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })
  const dailyViews = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalPageViews: pageViews.length,
    uniqueSessions,
    avgTimeSpent,
    totalWhatsappClicks: whatsappClicks,
    totalPhotoClicks: photoClicks,
    languageDistribution,
    eventDistribution,
    dailyViews
  }
}

export async function getPonudeAnalytics(): Promise<PonudaAnalytics[]> {
  const supabase = await createClient()

  const { data: ponude, error: ponudeError } = await supabase
    .from('ponuda')
    .select('id, naslovoglasa')
    .eq('stsaktivan', true)

  if (ponudeError || !ponude) {
    console.error('Error fetching ponude:', ponudeError)
    return []
  }

  const { data: logs, error: logsError } = await supabase
    .from('webstrana_log')
    .select('*')

  if (logsError) {
    console.error('Error fetching logs:', logsError)
    return []
  }

  const analytics: PonudaAnalytics[] = ponude.map(ponuda => {
    const ponudaLogs = logs?.filter(l => l.ponuda_id === ponuda.id) || []
    const pageViews = ponudaLogs.filter(l => l.event_type === 'page_view')
    const uniqueVisitors = new Set(ponudaLogs.map(l => l.session_id)).size
    const pageLeaves = ponudaLogs.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds)
    const avgTimeSpent = pageLeaves.length > 0
      ? Math.round(pageLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / pageLeaves.length)
      : 0
    const whatsappClicks = ponudaLogs.filter(l => l.event_type === 'whatsapp_click').length
    const lastVisit = ponudaLogs.length > 0 
      ? ponudaLogs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
      : null

    return {
      ponudaId: ponuda.id,
      ponudaNaslov: ponuda.naslovoglasa || `Ponuda #${ponuda.id}`,
      totalViews: pageViews.length,
      uniqueVisitors,
      avgTimeSpent,
      whatsappClicks,
      lastVisit
    }
  })

  return analytics.sort((a, b) => b.totalViews - a.totalViews)
}

export async function getPoziviWithAnalytics(filter?: { 
  ponudaId?: number
  korisnikId?: number 
  dateFrom?: string
  dateTo?: string
}): Promise<PoziviWithAnalytics[]> {
  const supabase = await createClient()

  let query = supabase
    .from('pozivi')
    .select(`
      id,
      created_at,
      imekupca,
      mobtel,
      email,
      drzava,
      regija,
      kodkampanje,
      ponudaid,
      validacija_ag
    `)
    .order('created_at', { ascending: false })

  if (filter?.ponudaId) {
    query = query.eq('ponudaid', filter.ponudaId)
  }
  if (filter?.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte('created_at', filter.dateTo)
  }

  const { data: pozivi, error } = await query

  if (error) {
    console.error('Error fetching pozivi:', error)
    return []
  }

  const ponudaIds = [...new Set(pozivi?.map(p => p.ponudaid).filter(Boolean) || [])]
  
  let ponudeMap: Record<number, string> = {}
  if (ponudaIds.length > 0) {
    const { data: ponude } = await supabase
      .from('ponuda')
      .select('id, naslovoglasa')
      .in('id', ponudaIds)
    
    ponude?.forEach(p => {
      ponudeMap[p.id] = p.naslovoglasa || `Ponuda #${p.id}`
    })
  }

  return (pozivi || []).map(p => ({
    ...p,
    ponuda_naslov: p.ponudaid ? ponudeMap[p.ponudaid] : undefined
  }))
}

export async function getKorisnici() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('korisnici')
    .select('id, naziv, email, stsstatus')
    .order('naziv')

  if (error) {
    console.error('Error fetching korisnici:', error)
    return []
  }

  return data || []
}

export async function getRecentLogs(limit: number = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('webstrana_log')
    .select(`
      *,
      ponuda:ponuda_id (
        id,
        naslovoglasa
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent logs:', error)
    return []
  }

  return data || []
}

export async function getPonudeForFilter() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ponuda')
    .select('id, naslovoglasa')
    .eq('stsaktivan', true)
    .order('naslovoglasa')

  if (error) {
    console.error('Error fetching ponude:', error)
    return []
  }

  return data || []
}

export async function getKampanjeForFilter() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kampanja')
    .select('id, kodkampanje, ponudaid')
    .eq('stsaktivan', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kampanje:', error)
    return []
  }

  return data || []
}

export type PeriodType = 'daily' | 'weekly' | 'monthly'

export interface PeriodData {
  period: string
  label: string
  pageViews: number
  uniqueVisitors: number
  whatsappClicks: number
  photoClicks: number
}

export async function getAnalyticsByPeriod(
  periodType: PeriodType,
  filter?: { ponudaId?: number; dateFrom?: string; dateTo?: string }
): Promise<PeriodData[]> {
  const supabase = await createClient()

  let query = supabase.from('webstrana_log').select('*')

  if (filter?.ponudaId) {
    query = query.eq('ponuda_id', filter.ponudaId)
  }
  if (filter?.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte('created_at', filter.dateTo)
  }

  const { data: logs, error } = await query

  if (error || !logs) {
    console.error('Error fetching logs for period:', error)
    return []
  }

  const periodMap: Record<string, {
    pageViews: number
    sessions: Set<string>
    whatsappClicks: number
    photoClicks: number
  }> = {}

  logs.forEach(log => {
    const date = new Date(log.created_at)
    let periodKey: string
    let label: string

    if (periodType === 'daily') {
      periodKey = date.toISOString().split('T')[0]
      label = date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
    } else if (periodType === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1)
      periodKey = weekStart.toISOString().split('T')[0]
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      label = `${weekStart.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })}`
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      label = date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })
    }

    if (!periodMap[periodKey]) {
      periodMap[periodKey] = {
        pageViews: 0,
        sessions: new Set(),
        whatsappClicks: 0,
        photoClicks: 0
      }
    }

    periodMap[periodKey].sessions.add(log.session_id)

    if (log.event_type === 'page_view') {
      periodMap[periodKey].pageViews++
    } else if (log.event_type === 'whatsapp_click') {
      periodMap[periodKey].whatsappClicks++
    } else if (log.event_type === 'photo_click') {
      periodMap[periodKey].photoClicks++
    }
  })

  const monthNames: Record<string, string> = {
    'january': 'Januar', 'february': 'Februar', 'march': 'Mart',
    'april': 'April', 'may': 'Maj', 'june': 'Jun',
    'july': 'Jul', 'august': 'Avgust', 'september': 'Septembar',
    'october': 'Oktobar', 'november': 'Novembar', 'december': 'Decembar'
  }

  return Object.entries(periodMap)
    .map(([period, data]) => {
      let displayLabel = period
      if (periodType === 'daily') {
        const d = new Date(period)
        displayLabel = d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
      } else if (periodType === 'weekly') {
        const weekStart = new Date(period)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        displayLabel = `${weekStart.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })}`
      } else {
        const [year, month] = period.split('-')
        const d = new Date(parseInt(year), parseInt(month) - 1, 1)
        const monthName = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
        displayLabel = `${monthNames[monthName] || monthName} ${year}`
      }

      return {
        period,
        label: displayLabel,
        pageViews: data.pageViews,
        uniqueVisitors: data.sessions.size,
        whatsappClicks: data.whatsappClicks,
        photoClicks: data.photoClicks
      }
    })
    .sort((a, b) => a.period.localeCompare(b.period))
}

export interface SyntheticReport {
  totalVisits: number
  uniqueVisitors: number
  returningVisitors: number
  avgVisitsPerUser: number
  totalWhatsappClicks: number
  whatsappConversionRate: number
  totalPozivi: number
  poziviConversionRate: number
  avgTimeOnPage: number
  topPonude: Array<{
    id: number
    naslov: string
    visits: number
    uniqueVisitors: number
    whatsappClicks: number
    pozivi: number
    conversionRate: number
  }>
  byLanguage: Array<{
    language: string
    visits: number
    whatsappClicks: number
    conversionRate: number
  }>
  byCountry: Array<{
    country: string
    visits: number
    pozivi: number
  }>
  periodComparison: {
    currentPeriod: { visits: number; whatsapp: number; pozivi: number }
    previousPeriod: { visits: number; whatsapp: number; pozivi: number }
    changePercent: { visits: number; whatsapp: number; pozivi: number }
  }
}

export async function getSyntheticReport(filter?: {
  dateFrom?: string
  dateTo?: string
  ponudaId?: number
}): Promise<SyntheticReport> {
  const supabase = await createClient()

  // Fetch all logs
  let logsQuery = supabase.from('webstrana_log').select('*')
  if (filter?.ponudaId) logsQuery = logsQuery.eq('ponuda_id', filter.ponudaId)
  if (filter?.dateFrom) logsQuery = logsQuery.gte('created_at', filter.dateFrom)
  if (filter?.dateTo) logsQuery = logsQuery.lte('created_at', filter.dateTo)
  
  const { data: logs } = await logsQuery

  // Fetch pozivi
  let poziviQuery = supabase.from('pozivi').select('*')
  if (filter?.ponudaId) poziviQuery = poziviQuery.eq('ponudaid', filter.ponudaId)
  if (filter?.dateFrom) poziviQuery = poziviQuery.gte('created_at', filter.dateFrom)
  if (filter?.dateTo) poziviQuery = poziviQuery.lte('created_at', filter.dateTo)
  
  const { data: pozivi } = await poziviQuery

  // Fetch ponude
  const { data: ponude } = await supabase.from('ponuda').select('id, naslovoglasa').eq('stsaktivan', true)

  const safeLog = logs || []
  const safePozivi = pozivi || []
  const safePonude = ponude || []

  // Basic metrics
  const pageViews = safeLog.filter(l => l.event_type === 'page_view')
  const totalVisits = pageViews.length
  const allSessions = new Set(safeLog.map(l => l.session_id))
  const uniqueVisitors = allSessions.size
  
  // Sessions with multiple page views (returning)
  const sessionVisits: Record<string, number> = {}
  pageViews.forEach(l => {
    sessionVisits[l.session_id] = (sessionVisits[l.session_id] || 0) + 1
  })
  const returningVisitors = Object.values(sessionVisits).filter(v => v > 1).length
  const avgVisitsPerUser = uniqueVisitors > 0 ? Math.round((totalVisits / uniqueVisitors) * 100) / 100 : 0

  // WhatsApp metrics
  const whatsappClicks = safeLog.filter(l => l.event_type === 'whatsapp_click')
  const totalWhatsappClicks = whatsappClicks.length
  const whatsappConversionRate = uniqueVisitors > 0 ? Math.round((totalWhatsappClicks / uniqueVisitors) * 10000) / 100 : 0

  // Pozivi metrics
  const totalPozivi = safePozivi.length
  const poziviConversionRate = uniqueVisitors > 0 ? Math.round((totalPozivi / uniqueVisitors) * 10000) / 100 : 0

  // Average time on page
  const pageLeaves = safeLog.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds)
  const avgTimeOnPage = pageLeaves.length > 0 
    ? Math.round(pageLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / pageLeaves.length)
    : 0

  // Top ponude with correlations
  const topPonude = safePonude.map(p => {
    const ponudaLogs = safeLog.filter(l => l.ponuda_id === p.id)
    const ponudaPageViews = ponudaLogs.filter(l => l.event_type === 'page_view')
    const ponudaUnique = new Set(ponudaLogs.map(l => l.session_id)).size
    const ponudaWhatsapp = ponudaLogs.filter(l => l.event_type === 'whatsapp_click').length
    const ponudaPozivi = safePozivi.filter(pz => pz.ponudaid === p.id).length
    
    return {
      id: p.id,
      naslov: p.naslovoglasa || `Ponuda #${p.id}`,
      visits: ponudaPageViews.length,
      uniqueVisitors: ponudaUnique,
      whatsappClicks: ponudaWhatsapp,
      pozivi: ponudaPozivi,
      conversionRate: ponudaUnique > 0 ? Math.round(((ponudaWhatsapp + ponudaPozivi) / ponudaUnique) * 10000) / 100 : 0
    }
  }).filter(p => p.visits > 0).sort((a, b) => b.visits - a.visits).slice(0, 10)

  // By language
  const languageMap: Record<string, { visits: number; whatsapp: number }> = {}
  pageViews.forEach(l => {
    const lang = l.language || 'unknown'
    if (!languageMap[lang]) languageMap[lang] = { visits: 0, whatsapp: 0 }
    languageMap[lang].visits++
  })
  whatsappClicks.forEach(l => {
    const lang = l.language || 'unknown'
    if (!languageMap[lang]) languageMap[lang] = { visits: 0, whatsapp: 0 }
    languageMap[lang].whatsapp++
  })
  const byLanguage = Object.entries(languageMap).map(([language, data]) => ({
    language,
    visits: data.visits,
    whatsappClicks: data.whatsapp,
    conversionRate: data.visits > 0 ? Math.round((data.whatsapp / data.visits) * 10000) / 100 : 0
  })).sort((a, b) => b.visits - a.visits)

  // By country (from pozivi)
  const countryMap: Record<string, { visits: number; pozivi: number }> = {}
  safePozivi.forEach(p => {
    const country = p.drzava || 'Nepoznato'
    if (!countryMap[country]) countryMap[country] = { visits: 0, pozivi: 0 }
    countryMap[country].pozivi++
  })
  // Add country from logs if available
  safeLog.filter(l => l.country).forEach(l => {
    const country = l.country || 'Nepoznato'
    if (!countryMap[country]) countryMap[country] = { visits: 0, pozivi: 0 }
    if (l.event_type === 'page_view') countryMap[country].visits++
  })
  const byCountry = Object.entries(countryMap).map(([country, data]) => ({
    country,
    visits: data.visits,
    pozivi: data.pozivi
  })).sort((a, b) => b.pozivi - a.pozivi).slice(0, 10)

  // Period comparison (last 30 days vs previous 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const currentLogs = safeLog.filter(l => new Date(l.created_at) >= thirtyDaysAgo)
  const previousLogs = safeLog.filter(l => {
    const d = new Date(l.created_at)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })
  const currentPozivi = safePozivi.filter(p => new Date(p.created_at) >= thirtyDaysAgo)
  const previousPozivi = safePozivi.filter(p => {
    const d = new Date(p.created_at)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })

  const currentPeriod = {
    visits: currentLogs.filter(l => l.event_type === 'page_view').length,
    whatsapp: currentLogs.filter(l => l.event_type === 'whatsapp_click').length,
    pozivi: currentPozivi.length
  }
  const previousPeriod = {
    visits: previousLogs.filter(l => l.event_type === 'page_view').length,
    whatsapp: previousLogs.filter(l => l.event_type === 'whatsapp_click').length,
    pozivi: previousPozivi.length
  }

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  return {
    totalVisits,
    uniqueVisitors,
    returningVisitors,
    avgVisitsPerUser,
    totalWhatsappClicks,
    whatsappConversionRate,
    totalPozivi,
    poziviConversionRate,
    avgTimeOnPage,
    topPonude,
    byLanguage,
    byCountry,
    periodComparison: {
      currentPeriod,
      previousPeriod,
      changePercent: {
        visits: calcChange(currentPeriod.visits, previousPeriod.visits),
        whatsapp: calcChange(currentPeriod.whatsapp, previousPeriod.whatsapp),
        pozivi: calcChange(currentPeriod.pozivi, previousPeriod.pozivi)
      }
    }
  }
}

export interface KampanjaAnalytics {
  kampanjaId: number
  kodKampanje: string
  ponudaNaslov: string | null
  kupacaPoslato: number
  dosliNaSajt: number
  whatsappKlikovi: number
  kontaktPoslat: number
  conversionRate: number
}

export async function getKampanjeAnalytics(): Promise<KampanjaAnalytics[]> {
  const supabase = await createClient()

  const { data: kampanje, error: kampanjeError } = await supabase
    .from('kampanja')
    .select('id, kodkampanje, ponudaid')
    .eq('stsaktivan', true)
    .order('created_at', { ascending: false })

  if (kampanjeError || !kampanje) {
    console.error('Error fetching kampanje:', kampanjeError)
    return []
  }

  const ponudaIds = [...new Set(kampanje.map(k => k.ponudaid).filter(Boolean))]
  let ponudeMap: Record<number, string> = {}
  
  if (ponudaIds.length > 0) {
    const { data: ponude } = await supabase
      .from('ponuda')
      .select('id, naslovoglasa')
      .in('id', ponudaIds)
    
    ponude?.forEach(p => {
      ponudeMap[p.id] = p.naslovoglasa || `Ponuda #${p.id}`
    })
  }

  const { data: kupacKampanja } = await supabase
    .from('kupac_kampanja')
    .select('kampanjaid')

  const { data: logs } = await supabase
    .from('webstrana_log')
    .select('kampanja_id, event_type')

  const { data: pozivi } = await supabase
    .from('pozivi')
    .select('kodkampanje')

  const safeKupacKampanja = kupacKampanja || []
  const safeLogs = logs || []
  const safePozivi = pozivi || []

  const analytics: KampanjaAnalytics[] = kampanje.map(k => {
    const kupacaPoslato = safeKupacKampanja.filter(kk => kk.kampanjaid === k.id).length
    const kampanjaLogs = safeLogs.filter(l => l.kampanja_id === k.id)
    const dosliNaSajt = kampanjaLogs.filter(l => l.event_type === 'page_view').length
    const whatsappKlikovi = kampanjaLogs.filter(l => l.event_type === 'whatsapp_click').length
    const kontaktPoslat = safePozivi.filter(p => p.kodkampanje === k.kodkampanje).length
    
    const conversionRate = kupacaPoslato > 0 
      ? Math.round((kontaktPoslat / kupacaPoslato) * 10000) / 100 
      : 0

    return {
      kampanjaId: k.id,
      kodKampanje: k.kodkampanje || `#${k.id}`,
      ponudaNaslov: k.ponudaid ? ponudeMap[k.ponudaid] || null : null,
      kupacaPoslato,
      dosliNaSajt,
      whatsappKlikovi,
      kontaktPoslat,
      conversionRate
    }
  })

  return analytics.sort((a, b) => b.kupacaPoslato - a.kupacaPoslato)
}
