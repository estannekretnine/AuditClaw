'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export interface WebLogReport {
  totalPageViews: number
  uniqueSessions: number
  whatsappClicks: number
  photoClicks: number
  videoClicks: number
  tourClicks: number
  mapInteractions: number
  avgTimeOnPage: number
  eventDistribution: Array<{ eventType: string; count: number }>
  byCountry: Array<{ country: string; count: number }>
  byCity: Array<{ city: string; count: number }>
  byLanguage: Array<{ language: string; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  topPonude: Array<{
    id: number
    naslov: string
    poslato: number
    pageViews: number
    uniqueSessions: number
    whatsappClicks: number
    photoClicks: number
    avgTime: number
    kontakt: number
  }>
  dailyStats: Array<{ date: string; pageViews: number; whatsapp: number }>
  periodComparison: {
    currentPeriod: { pageViews: number; whatsapp: number; photo: number }
    previousPeriod: { pageViews: number; whatsapp: number; photo: number }
    changePercent: { pageViews: number; whatsapp: number; photo: number }
  }
}

export async function getWebLogReport(filter?: {
  dateFrom?: string
  dateTo?: string
  ponudaId?: number
}): Promise<WebLogReport> {
  const supabase = await createClient()
  const admin = createAdminClient()

  let query = supabase.from('webstrana_log').select('*')
  if (filter?.ponudaId) query = query.eq('ponuda_id', filter.ponudaId)
  if (filter?.dateFrom) query = query.gte('created_at', filter.dateFrom)
  if (filter?.dateTo) query = query.lte('created_at', filter.dateTo)
  
  const { data: logs } = await query
  const { data: ponude } = await supabase.from('ponuda').select('id, naslovoglasa').eq('stsaktivan', true)
  const { data: kampanje } = await admin.from('kampanja').select('id, ponudaid')
  const { data: kupackampanja } = await admin.from('kupackampanja').select('kampanjaid')
  const { data: pozivi } = await admin.from('pozivi').select('ponudaid')

  const safeLog = logs || []
  const safePonude = ponude || []
  const safeKampanje = kampanje || []
  const safeKupackampanja = kupackampanja || []
  const safePozivi = pozivi || []

  const pageViews = safeLog.filter(l => l.event_type === 'page_view')
  const totalPageViews = pageViews.length
  const uniqueSessions = new Set(safeLog.map(l => l.session_id)).size
  const whatsappClicks = safeLog.filter(l => l.event_type === 'whatsapp_click').length
  const photoClicks = safeLog.filter(l => l.event_type === 'photo_click').length
  const videoClicks = safeLog.filter(l => l.event_type === 'video_click').length
  const tourClicks = safeLog.filter(l => l.event_type === '3d_tour_click').length
  const mapInteractions = safeLog.filter(l => l.event_type === 'map_interaction').length

  const pageLeaves = safeLog.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds)
  const avgTimeOnPage = pageLeaves.length > 0 
    ? Math.round(pageLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / pageLeaves.length)
    : 0

  const eventCounts: Record<string, number> = {}
  safeLog.forEach(l => {
    eventCounts[l.event_type] = (eventCounts[l.event_type] || 0) + 1
  })
  const eventDistribution = Object.entries(eventCounts)
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)

  const countryCounts: Record<string, number> = {}
  safeLog.filter(l => l.country).forEach(l => {
    countryCounts[l.country!] = (countryCounts[l.country!] || 0) + 1
  })
  const byCountry = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)

  const cityCounts: Record<string, number> = {}
  safeLog.filter(l => l.city).forEach(l => {
    cityCounts[l.city!] = (cityCounts[l.city!] || 0) + 1
  })
  const byCity = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)

  const langCounts: Record<string, number> = {}
  safeLog.filter(l => l.language).forEach(l => {
    langCounts[l.language!] = (langCounts[l.language!] || 0) + 1
  })
  const byLanguage = Object.entries(langCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)

  const referrerCounts: Record<string, number> = {}
  safeLog.filter(l => l.referrer).forEach(l => {
    try {
      const url = new URL(l.referrer!)
      const domain = url.hostname
      referrerCounts[domain] = (referrerCounts[domain] || 0) + 1
    } catch {
      referrerCounts[l.referrer!] = (referrerCounts[l.referrer!] || 0) + 1
    }
  })
  const directCount = safeLog.filter(l => !l.referrer).length
  if (directCount > 0) referrerCounts['Direktno'] = directCount
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)

  const topPonude = safePonude.map(p => {
    const pId = Number(p.id)
    const getKampanjaPonudaId = (k: Record<string, unknown>) => Number(k.ponudaid ?? k.ponuda_id)
    const getKampanjaId = (k: Record<string, unknown>) => Number(k.id)
    const getKkKampanjaId = (kk: Record<string, unknown>) => kk.kampanjaid ?? kk.kampanja_id
    const ponudaKampanjeIds = safeKampanje
      .filter(k => getKampanjaPonudaId(k as Record<string, unknown>) === pId)
      .map(k => getKampanjaId(k as Record<string, unknown>))
      .filter(id => !Number.isNaN(id))
    const poslato = safeKupackampanja
      .filter(kk => {
        const kid = getKkKampanjaId(kk as Record<string, unknown>)
        return kid != null && kid !== '' && !Number.isNaN(Number(kid)) && ponudaKampanjeIds.includes(Number(kid))
      })
      .length

    const ponudaLogs = safeLog.filter(l => Number(l.ponuda_id) === pId)
    const ponudaPageViews = ponudaLogs.filter(l => l.event_type === 'page_view').length
    const ponudaSessions = new Set(ponudaLogs.map(l => l.session_id)).size
    const ponudaWhatsapp = ponudaLogs.filter(l => l.event_type === 'whatsapp_click').length
    const ponudaPhoto = ponudaLogs.filter(l => l.event_type === 'photo_click').length
    const ponudaLeaves = ponudaLogs.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds)
    const ponudaAvgTime = ponudaLeaves.length > 0
      ? Math.round(ponudaLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / ponudaLeaves.length)
      : 0
    const ponudaKontakt = safePozivi.filter(pz => Number(pz.ponudaid) === pId).length

    return {
      id: p.id,
      naslov: p.naslovoglasa || `Ponuda #${p.id}`,
      poslato,
      pageViews: ponudaPageViews,
      uniqueSessions: ponudaSessions,
      whatsappClicks: ponudaWhatsapp,
      photoClicks: ponudaPhoto,
      avgTime: ponudaAvgTime,
      kontakt: ponudaKontakt
    }
  }).filter(p => p.pageViews > 0).sort((a, b) => b.pageViews - a.pageViews)

  const dailyCounts: Record<string, { pageViews: number; whatsapp: number }> = {}
  safeLog.forEach(l => {
    const date = l.created_at.split('T')[0]
    if (!dailyCounts[date]) dailyCounts[date] = { pageViews: 0, whatsapp: 0 }
    if (l.event_type === 'page_view') dailyCounts[date].pageViews++
    if (l.event_type === 'whatsapp_click') dailyCounts[date].whatsapp++
  })
  const dailyStats = Object.entries(dailyCounts)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const currentLogs = safeLog.filter(l => new Date(l.created_at) >= thirtyDaysAgo)
  const previousLogs = safeLog.filter(l => {
    const d = new Date(l.created_at)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })

  const currentPeriod = {
    pageViews: currentLogs.filter(l => l.event_type === 'page_view').length,
    whatsapp: currentLogs.filter(l => l.event_type === 'whatsapp_click').length,
    photo: currentLogs.filter(l => l.event_type === 'photo_click').length
  }
  const previousPeriod = {
    pageViews: previousLogs.filter(l => l.event_type === 'page_view').length,
    whatsapp: previousLogs.filter(l => l.event_type === 'whatsapp_click').length,
    photo: previousLogs.filter(l => l.event_type === 'photo_click').length
  }

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  return {
    totalPageViews,
    uniqueSessions,
    whatsappClicks,
    photoClicks,
    videoClicks,
    tourClicks,
    mapInteractions,
    avgTimeOnPage,
    eventDistribution,
    byCountry,
    byCity,
    byLanguage,
    topReferrers,
    topPonude,
    dailyStats,
    periodComparison: {
      currentPeriod,
      previousPeriod,
      changePercent: {
        pageViews: calcChange(currentPeriod.pageViews, previousPeriod.pageViews),
        whatsapp: calcChange(currentPeriod.whatsapp, previousPeriod.whatsapp),
        photo: calcChange(currentPeriod.photo, previousPeriod.photo)
      }
    }
  }
}

export interface KampanjaAnalytics {
  kampanjaId: number
  kodKampanje: string
  ponudaId: number
  ponudaNaslov: string
  kupacaPoslato: number
  dosliNaSajt: number
  whatsappKlikovi: number
  kontaktPoslat: number
  conversionRate: number
}

export interface KampanjeFilter {
  ponudaId?: number
  dateFrom?: string
  dateTo?: string
}

export async function getKampanjeAnalytics(filter?: KampanjeFilter): Promise<KampanjaAnalytics[]> {
  const admin = createAdminClient()

  let kampanjeQuery = admin
    .from('kampanja')
    .select('id, kodkampanje, ponudaid')
    .not('ponudaid', 'is', null)
  
  if (filter?.ponudaId) {
    kampanjeQuery = kampanjeQuery.eq('ponudaid', filter.ponudaId)
  }
  
  const { data: kampanje, error: kampanjeError } = await kampanjeQuery.order('created_at', { ascending: false })

  if (kampanjeError || !kampanje) {
    console.error('Error fetching kampanje:', kampanjeError)
    return []
  }

  const ponudaIds = [...new Set(kampanje.map(k => k.ponudaid).filter(Boolean))]
  const ponudeMap: Record<number, string> = {}
  
  if (ponudaIds.length > 0) {
    const { data: ponude } = await admin
      .from('ponuda')
      .select('id, naslovoglasa')
      .in('id', ponudaIds)
    
    ponude?.forEach(p => {
      ponudeMap[Number(p.id)] = p.naslovoglasa || `Ponuda #${p.id}`
    })
  }

  const { data: kupacKampanja } = await admin
    .from('kupackampanja')
    .select('id, kampanjaid, created_at')

  let logsQuery = admin
    .from('webstrana_log')
    .select('kampanja_id, event_type, created_at')
  if (filter?.dateFrom) logsQuery = logsQuery.gte('created_at', filter.dateFrom)
  if (filter?.dateTo) logsQuery = logsQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { data: logs } = await logsQuery

  let poziviQuery = admin
    .from('pozivi')
    .select('idkampanjakupac, created_at')
  if (filter?.dateFrom) poziviQuery = poziviQuery.gte('created_at', filter.dateFrom)
  if (filter?.dateTo) poziviQuery = poziviQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { data: pozivi } = await poziviQuery

  const safeKupacKampanja = kupacKampanja || []
  const safeLogs = logs || []
  const safePozivi = pozivi || []

  const getKkKampanjaId = (kk: Record<string, unknown>) => kk.kampanjaid ?? kk.kampanja_id
  const getKkId = (kk: Record<string, unknown>) => kk.id
  const getLogKampanjaId = (l: Record<string, unknown>) => l.kampanja_id ?? l.kampanjaid
  const getPoziviIdKampanjaKupac = (p: Record<string, unknown>) => p.idkampanjakupac ?? p.id_kampanja_kupac

  const analytics: KampanjaAnalytics[] = kampanje
    .filter(k => k.ponudaid != null)
    .map(k => {
      const kId = Number(k.id)
      const pId = Number(k.ponudaid)
      const kampanjaKupciIds = safeKupacKampanja
        .filter(kk => Number(getKkKampanjaId(kk as Record<string, unknown>)) === kId)
        .map(kk => Number(getKkId(kk as Record<string, unknown>)))
        .filter(id => !Number.isNaN(id))
      const kupacaPoslato = kampanjaKupciIds.length
      const kampanjaLogs = safeLogs.filter(l => Number(getLogKampanjaId(l as Record<string, unknown>)) === kId)
      const dosliNaSajt = kampanjaLogs.filter(l => l.event_type === 'page_view').length
      const whatsappKlikovi = kampanjaLogs.filter(l => l.event_type === 'whatsapp_click').length
      const kontaktPoslat = safePozivi.filter(p => {
        const idKK = getPoziviIdKampanjaKupac(p as Record<string, unknown>)
        return idKK != null && !Number.isNaN(Number(idKK)) && kampanjaKupciIds.includes(Number(idKK))
      }).length
      
      const conversionRate = kupacaPoslato > 0 
        ? Math.round((kontaktPoslat / kupacaPoslato) * 10000) / 100 
        : 0

      return {
        kampanjaId: kId,
        kodKampanje: k.kodkampanje || `#${kId}`,
        ponudaId: pId,
        ponudaNaslov: ponudeMap[pId] || `Ponuda #${pId}`,
        kupacaPoslato,
        dosliNaSajt,
        whatsappKlikovi,
        kontaktPoslat,
        conversionRate
      }
    })

  return analytics.sort((a, b) => b.kupacaPoslato - a.kupacaPoslato)
}

export interface KontaktKupac {
  id: number
  kupacId: number
  created_at: string
  ime: string | null
  prezime: string | null
  email: string | null
  mobprimarni: string | null
  mobsek: string | null
  linkedinurl: string | null
  drzava: string | null
  grad: string | null
  kodkampanje: string | null
}

export async function getKontaktiZaPonudu(ponudaId: number): Promise<KontaktKupac[]> {
  const admin = createAdminClient()
  
  const { data: pozivi, error } = await admin
    .from('pozivi')
    .select('id, created_at, kodkampanje, idkampanjakupac')
    .eq('ponudaid', ponudaId)
    .not('idkampanjakupac', 'is', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching kontakti:', error)
    return []
  }
  
  if (!pozivi || pozivi.length === 0) return []
  
  const idkampanjakupacIds = [...new Set(
    pozivi.map(p => p.idkampanjakupac).filter(Boolean).map(Number)
  )]
  
  const { data: kupackampanje } = await admin
    .from('kupackampanja')
    .select('id, kupacid')
    .in('id', idkampanjakupacIds)
  
  const kupackampanjaMap: Record<number, number> = {}
  kupackampanje?.forEach(kk => {
    if (kk.kupacid) {
      kupackampanjaMap[Number(kk.id)] = Number(kk.kupacid)
    }
  })
  
  const kupacIds = [...new Set(Object.values(kupackampanjaMap))]
  
  if (kupacIds.length === 0) return []
  
  const { data: kupciData } = await admin
    .from('kupacimport')
    .select('id, ime, prezime, email, mobprimarni, mobsek, linkedinurl, drzava, grad')
    .in('id', kupacIds)
  
  const kupacDataMap: Record<number, {
    ime: string | null
    prezime: string | null
    email: string | null
    mobprimarni: string | null
    mobsek: string | null
    linkedinurl: string | null
    drzava: string | null
    grad: string | null
  }> = {}
  
  kupciData?.forEach(k => {
    kupacDataMap[Number(k.id)] = {
      ime: k.ime,
      prezime: k.prezime,
      email: k.email,
      mobprimarni: k.mobprimarni,
      mobsek: k.mobsek,
      linkedinurl: k.linkedinurl,
      drzava: k.drzava,
      grad: k.grad
    }
  })
  
  const result: KontaktKupac[] = []
  
  for (const p of pozivi) {
    if (!p.idkampanjakupac) continue
    
    const kupacId = kupackampanjaMap[Number(p.idkampanjakupac)]
    if (!kupacId) continue
    
    const kupacData = kupacDataMap[kupacId]
    if (!kupacData) continue
    
    result.push({
      id: Number(p.id),
      kupacId,
      created_at: p.created_at,
      ime: kupacData.ime,
      prezime: kupacData.prezime,
      email: kupacData.email,
      mobprimarni: kupacData.mobprimarni,
      mobsek: kupacData.mobsek,
      linkedinurl: kupacData.linkedinurl,
      drzava: kupacData.drzava,
      grad: kupacData.grad,
      kodkampanje: p.kodkampanje
    })
  }
  
  return result
}

export interface PonudaOption {
  id: number
  naslovoglasa: string
  agencija: string | null
}

export async function getPonudeForKampanje(): Promise<PonudaOption[]> {
  const admin = createAdminClient()
  
  const { data: kampanje } = await admin
    .from('kampanja')
    .select('ponudaid')
    .not('ponudaid', 'is', null)
  
  const ponudaIds = [...new Set((kampanje || []).map(k => k.ponudaid).filter(Boolean))]
  
  if (ponudaIds.length === 0) return []
  
  const { data: ponude } = await admin
    .from('ponuda')
    .select('id, naslovoglasa, idkorisnik_agencija, idkorisnik')
    .in('id', ponudaIds)
    .order('naslovoglasa')
  
  const getAgencijaId = (p: Record<string, unknown>) => p.idkorisnik_agencija ?? p['idkorisnik_agencija']
  const getKorisnikId = (p: Record<string, unknown>) => p.idkorisnik ?? p['idkorisnik']
  
  const korisnikIds = [...new Set((ponude || []).flatMap(p => {
    const rec = p as Record<string, unknown>
    return [getAgencijaId(rec), getKorisnikId(rec)]
  }).filter(Boolean))]
  
  const korisniciMap: Record<number, string> = {}
  if (korisnikIds.length > 0) {
    const { data: korisnici } = await admin
      .from('korisnici')
      .select('id, naziv')
      .in('id', korisnikIds)
    
    korisnici?.forEach(k => {
      const rec = k as Record<string, unknown>
      const naziv = rec.naziv ?? rec['naziv']
      korisniciMap[Number(k.id)] = (naziv as string) || `Korisnik #${k.id}`
    })
  }
  
  return (ponude || []).map(p => {
    const rec = p as Record<string, unknown>
    const vlasnikId = getAgencijaId(rec) || getKorisnikId(rec)
    return {
      id: Number(p.id),
      naslovoglasa: p.naslovoglasa || `Ponuda #${p.id}`,
      agencija: vlasnikId ? korisniciMap[Number(vlasnikId)] || null : null
    }
  })
}

export interface WebLogEntry {
  id: number
  created_at: string
  session_id: string
  ponuda_id: number
  kampanja_id: number | null
  event_type: string
  event_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  language: string | null
  time_spent_seconds: number | null
  country: string | null
  city: string | null
  ponuda?: { id: number; naslovoglasa: string | null } | null
  kampanja?: { id: number; kodkampanje: string | null } | null
}

export interface WebLogFilter {
  dateFrom?: string
  dateTo?: string
  ponudaId?: number
  kampanjaId?: number
  eventType?: string
  language?: string
  country?: string
  city?: string
  search?: string
}

export interface WebLogPaginatedResult {
  data: WebLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getWebLogs(
  filter: WebLogFilter = {},
  page: number = 1,
  pageSize: number = 50
): Promise<WebLogPaginatedResult> {
  const supabase = await createClient()

  let countQuery = supabase
    .from('webstrana_log')
    .select('*', { count: 'exact', head: true })

  let dataQuery = supabase
    .from('webstrana_log')
    .select(`
      *,
      ponuda:ponuda_id (id, naslovoglasa),
      kampanja:kampanja_id (id, kodkampanje)
    `)
    .order('created_at', { ascending: false })

  if (filter.dateFrom) {
    countQuery = countQuery.gte('created_at', filter.dateFrom)
    dataQuery = dataQuery.gte('created_at', filter.dateFrom)
  }
  if (filter.dateTo) {
    countQuery = countQuery.lte('created_at', filter.dateTo)
    dataQuery = dataQuery.lte('created_at', filter.dateTo)
  }
  if (filter.ponudaId) {
    countQuery = countQuery.eq('ponuda_id', filter.ponudaId)
    dataQuery = dataQuery.eq('ponuda_id', filter.ponudaId)
  }
  if (filter.kampanjaId) {
    countQuery = countQuery.eq('kampanja_id', filter.kampanjaId)
    dataQuery = dataQuery.eq('kampanja_id', filter.kampanjaId)
  }
  if (filter.eventType) {
    countQuery = countQuery.eq('event_type', filter.eventType)
    dataQuery = dataQuery.eq('event_type', filter.eventType)
  }
  if (filter.language) {
    countQuery = countQuery.eq('language', filter.language)
    dataQuery = dataQuery.eq('language', filter.language)
  }
  if (filter.country) {
    countQuery = countQuery.eq('country', filter.country)
    dataQuery = dataQuery.eq('country', filter.country)
  }
  if (filter.city) {
    countQuery = countQuery.eq('city', filter.city)
    dataQuery = dataQuery.eq('city', filter.city)
  }
  if (filter.search) {
    const searchTerm = `%${filter.search}%`
    countQuery = countQuery.or(`session_id.ilike.${searchTerm},ip_address.ilike.${searchTerm},referrer.ilike.${searchTerm}`)
    dataQuery = dataQuery.or(`session_id.ilike.${searchTerm},ip_address.ilike.${searchTerm},referrer.ilike.${searchTerm}`)
  }

  const offset = (page - 1) * pageSize
  dataQuery = dataQuery.range(offset, offset + pageSize - 1)

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

  const total = countResult.count || 0
  const data = (dataResult.data || []) as WebLogEntry[]

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function getWebLogFiltersData() {
  const supabase = await createClient()

  const [ponudeResult, kampanjeResult, countriesResult, citiesResult] = await Promise.all([
    supabase.from('ponuda').select('id, naslovoglasa').eq('stsaktivan', true).order('naslovoglasa'),
    supabase.from('kampanja').select('id, kodkampanje').eq('stsaktivan', true).order('kodkampanje'),
    supabase.from('webstrana_log').select('country').not('country', 'is', null),
    supabase.from('webstrana_log').select('city').not('city', 'is', null)
  ])

  const uniqueCountries = [...new Set((countriesResult.data || []).map(r => r.country).filter(Boolean))]
  const uniqueCities = [...new Set((citiesResult.data || []).map(r => r.city).filter(Boolean))]

  return {
    ponude: ponudeResult.data || [],
    kampanje: kampanjeResult.data || [],
    countries: uniqueCountries.sort(),
    cities: uniqueCities.sort(),
    eventTypes: ['page_view', 'photo_click', 'language_change', 'whatsapp_click', 'video_click', '3d_tour_click', 'map_interaction', 'page_leave'],
    languages: ['sr', 'en', 'de']
  }
}

export interface WebLogStats {
  totalLogs: number
  uniqueSessions: number
  eventCounts: Record<string, number>
  languageCounts: Record<string, number>
  countryCounts: Record<string, number>
  cityCounts: Record<string, number>
  deviceCounts: Record<string, number>
  avgTimeOnPage: number
  dailyStats: Array<{ date: string; count: number; pageViews: number; whatsapp: number; photo: number }>
  hourlyStats: Array<{ hour: number; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
}

export async function getWebLogStats(filter: WebLogFilter = {}): Promise<WebLogStats> {
  const supabase = await createClient()

  let query = supabase.from('webstrana_log').select('*')

  if (filter.dateFrom) query = query.gte('created_at', filter.dateFrom)
  if (filter.dateTo) query = query.lte('created_at', filter.dateTo)
  if (filter.ponudaId) query = query.eq('ponuda_id', filter.ponudaId)
  if (filter.kampanjaId) query = query.eq('kampanja_id', filter.kampanjaId)
  if (filter.eventType) query = query.eq('event_type', filter.eventType)
  if (filter.language) query = query.eq('language', filter.language)
  if (filter.country) query = query.eq('country', filter.country)
  if (filter.city) query = query.eq('city', filter.city)

  const { data: logs } = await query
  const safeLogs = logs || []

  const totalLogs = safeLogs.length
  const uniqueSessions = new Set(safeLogs.map(l => l.session_id)).size

  const eventCounts: Record<string, number> = {}
  safeLogs.forEach(l => {
    eventCounts[l.event_type] = (eventCounts[l.event_type] || 0) + 1
  })

  const languageCounts: Record<string, number> = {}
  safeLogs.filter(l => l.language).forEach(l => {
    languageCounts[l.language!] = (languageCounts[l.language!] || 0) + 1
  })

  const countryCounts: Record<string, number> = {}
  safeLogs.filter(l => l.country).forEach(l => {
    countryCounts[l.country!] = (countryCounts[l.country!] || 0) + 1
  })

  const cityCounts: Record<string, number> = {}
  safeLogs.filter(l => l.city).forEach(l => {
    cityCounts[l.city!] = (cityCounts[l.city!] || 0) + 1
  })

  const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0 }
  safeLogs.forEach(l => {
    if (l.user_agent?.includes('Mobile')) {
      deviceCounts['Mobile']++
    } else {
      deviceCounts['Desktop']++
    }
  })

  const pageLeaves = safeLogs.filter(l => l.event_type === 'page_leave' && l.time_spent_seconds)
  const avgTimeOnPage = pageLeaves.length > 0
    ? Math.round(pageLeaves.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / pageLeaves.length)
    : 0

  const dailyMap: Record<string, { count: number; pageViews: number; whatsapp: number; photo: number }> = {}
  safeLogs.forEach(l => {
    const date = l.created_at.split('T')[0]
    if (!dailyMap[date]) dailyMap[date] = { count: 0, pageViews: 0, whatsapp: 0, photo: 0 }
    dailyMap[date].count++
    if (l.event_type === 'page_view') dailyMap[date].pageViews++
    if (l.event_type === 'whatsapp_click') dailyMap[date].whatsapp++
    if (l.event_type === 'photo_click') dailyMap[date].photo++
  })
  const dailyStats = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const hourlyMap: Record<number, number> = {}
  for (let i = 0; i < 24; i++) hourlyMap[i] = 0
  safeLogs.forEach(l => {
    const hour = new Date(l.created_at).getHours()
    hourlyMap[hour]++
  })
  const hourlyStats = Object.entries(hourlyMap)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour)

  const referrerMap: Record<string, number> = {}
  safeLogs.forEach(l => {
    let ref = 'Direktno'
    if (l.referrer) {
      try {
        ref = new URL(l.referrer).hostname
      } catch {
        ref = l.referrer
      }
    }
    referrerMap[ref] = (referrerMap[ref] || 0) + 1
  })
  const topReferrers = Object.entries(referrerMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalLogs,
    uniqueSessions,
    eventCounts,
    languageCounts,
    countryCounts,
    cityCounts,
    deviceCounts,
    avgTimeOnPage,
    dailyStats,
    hourlyStats,
    topReferrers
  }
}

// ==========================================
// KUPCI ANALIZA
// ==========================================

export interface KorisnikOption {
  id: number
  naziv: string
}

export async function getKorisniciZaKupciAnaliza(): Promise<KorisnikOption[]> {
  const admin = createAdminClient()
  
  const { data: pozivi } = await admin
    .from('pozivi')
    .select('ponudaid')
    .not('ponudaid', 'is', null)
  
  const ponudaIds = [...new Set((pozivi || []).map(p => p.ponudaid).filter(Boolean))]
  
  if (ponudaIds.length === 0) return []
  
  const { data: ponude } = await admin
    .from('ponuda')
    .select('idkorisnik_agencija, idkorisnik')
    .in('id', ponudaIds)
  
  const korisnikIds = [...new Set((ponude || []).flatMap(p => {
    const rec = p as Record<string, unknown>
    const agId = rec.idkorisnik_agencija ?? rec['idkorisnik_agencija']
    const kId = rec.idkorisnik ?? rec['idkorisnik']
    return [agId, kId].filter(Boolean).map(Number)
  }))]
  
  if (korisnikIds.length === 0) return []
  
  const { data: korisnici } = await admin
    .from('korisnici')
    .select('id, naziv')
    .in('id', korisnikIds)
    .order('naziv')
  
  return (korisnici || []).map(k => ({
    id: Number(k.id),
    naziv: k.naziv || `Korisnik #${k.id}`
  }))
}

export interface KupciAnalizaFilter {
  korisnikId?: number
  dateFrom?: string
  dateTo?: string
}

export interface KupacKontaktRow {
  pozivId: number
  kupacId: number
  created_at: string
  ime: string | null
  prezime: string | null
  email: string | null
  mobprimarni: string | null
  mobsek: string | null
  linkedinurl: string | null
  drzava: string | null
  grad: string | null
  ponudaId: number | null
  ponudaNaslov: string | null
  kodkampanje: string | null
}

export async function getKupciAnaliza(filter: KupciAnalizaFilter): Promise<KupacKontaktRow[]> {
  const admin = createAdminClient()
  
  const { data: ponude } = await admin
    .from('ponuda')
    .select('id, naslovoglasa, idkorisnik_agencija, idkorisnik')
  
  const getAgencijaId = (p: Record<string, unknown>) => p.idkorisnik_agencija ?? p['idkorisnik_agencija']
  const getKorisnikId = (p: Record<string, unknown>) => p.idkorisnik ?? p['idkorisnik']
  
  const ponudeMap: Record<number, string> = {}
  ponude?.forEach(p => {
    ponudeMap[Number(p.id)] = p.naslovoglasa || `Ponuda #${p.id}`
  })
  
  let korisnikPonudaIds: number[] | null = null
  
  if (filter.korisnikId) {
    korisnikPonudaIds = (ponude || [])
      .filter(p => {
        const rec = p as Record<string, unknown>
        const agId = Number(getAgencijaId(rec))
        const kId = Number(getKorisnikId(rec))
        return agId === filter.korisnikId || kId === filter.korisnikId
      })
      .map(p => Number(p.id))
    
    if (korisnikPonudaIds.length === 0) return []
  }
  
  let poziviQuery = admin
    .from('pozivi')
    .select('id, created_at, ponudaid, idkampanjakupac, kodkampanje')
    .not('idkampanjakupac', 'is', null)
  
  if (korisnikPonudaIds) {
    poziviQuery = poziviQuery.in('ponudaid', korisnikPonudaIds)
  }
  
  if (filter.dateFrom) poziviQuery = poziviQuery.gte('created_at', filter.dateFrom)
  if (filter.dateTo) poziviQuery = poziviQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  
  const { data: pozivi } = await poziviQuery.order('created_at', { ascending: false })
  
  if (!pozivi || pozivi.length === 0) return []
  
  const idkampanjakupacIds = [...new Set(
    pozivi.map(p => p.idkampanjakupac).filter(Boolean).map(Number)
  )]
  
  const { data: kupackampanje } = await admin
    .from('kupackampanja')
    .select('id, kupacid')
    .in('id', idkampanjakupacIds)
  
  const kupackampanjaMap: Record<number, number> = {}
  kupackampanje?.forEach(kk => {
    if (kk.kupacid) {
      kupackampanjaMap[Number(kk.id)] = Number(kk.kupacid)
    }
  })
  
  const kupacIds = [...new Set(Object.values(kupackampanjaMap))]
  
  if (kupacIds.length === 0) return []
  
  const { data: kupciData } = await admin
    .from('kupacimport')
    .select('id, ime, prezime, email, mobprimarni, mobsek, linkedinurl, drzava, grad')
    .in('id', kupacIds)
  
  const kupacDataMap: Record<number, {
    ime: string | null
    prezime: string | null
    email: string | null
    mobprimarni: string | null
    mobsek: string | null
    linkedinurl: string | null
    drzava: string | null
    grad: string | null
  }> = {}
  
  kupciData?.forEach(k => {
    kupacDataMap[Number(k.id)] = {
      ime: k.ime,
      prezime: k.prezime,
      email: k.email,
      mobprimarni: k.mobprimarni,
      mobsek: k.mobsek,
      linkedinurl: k.linkedinurl,
      drzava: k.drzava,
      grad: k.grad
    }
  })
  
  const result: KupacKontaktRow[] = []
  
  for (const p of pozivi) {
    if (!p.idkampanjakupac) continue
    
    const kupacId = kupackampanjaMap[Number(p.idkampanjakupac)]
    if (!kupacId) continue
    
    const kupacData = kupacDataMap[kupacId]
    if (!kupacData) continue
    
    result.push({
      pozivId: Number(p.id),
      kupacId,
      created_at: p.created_at,
      ime: kupacData.ime,
      prezime: kupacData.prezime,
      email: kupacData.email,
      mobprimarni: kupacData.mobprimarni,
      mobsek: kupacData.mobsek,
      linkedinurl: kupacData.linkedinurl,
      drzava: kupacData.drzava,
      grad: kupacData.grad,
      ponudaId: p.ponudaid ? Number(p.ponudaid) : null,
      ponudaNaslov: p.ponudaid ? ponudeMap[Number(p.ponudaid)] || `Ponuda #${p.ponudaid}` : null,
      kodkampanje: p.kodkampanje
    })
  }
  
  return result
}
