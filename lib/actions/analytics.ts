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
