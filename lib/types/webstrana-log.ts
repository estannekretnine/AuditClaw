// Tipovi za webstrana_log tabelu - praćenje aktivnosti korisnika

export type EventType = 
  | 'page_view'
  | 'photo_click'
  | 'language_change'
  | 'whatsapp_click'
  | 'video_click'
  | '3d_tour_click'
  | 'map_interaction'
  | 'page_leave'

export type Language = 'sr' | 'en' | 'de'

export interface WebstranaLog {
  id: number
  created_at: string
  session_id: string
  ponuda_id: number
  kampanja_id: number | null
  event_type: EventType
  event_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  language: Language | null
  time_spent_seconds: number | null
  country: string | null
  city: string | null
}

export interface WebstranaLogInsert {
  session_id: string
  ponuda_id: number
  kampanja_id?: number | null
  event_type: EventType
  event_data?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  language?: Language | null
  time_spent_seconds?: number | null
  country?: string | null
  city?: string | null
}

// Tipovi za analitiku
export interface AnalyticsFilter {
  ponudaId?: number
  kampanjaId?: number
  korisnikId?: number
  eventType?: EventType
  dateFrom?: string
  dateTo?: string
  language?: Language
}

export interface AnalyticsSummary {
  totalPageViews: number
  uniqueSessions: number
  avgTimeSpent: number
  totalWhatsappClicks: number
  totalPhotoClicks: number
  languageDistribution: { language: string; count: number }[]
  eventDistribution: { event_type: string; count: number }[]
  dailyViews: { date: string; count: number }[]
}

export interface PonudaAnalytics {
  ponudaId: number
  ponudaNaslov: string
  totalViews: number
  uniqueVisitors: number
  avgTimeSpent: number
  whatsappClicks: number
  lastVisit: string | null
}

export interface PoziviWithAnalytics {
  id: number
  created_at: string
  imekupca: string | null
  mobtel: string | null
  email: string | null
  drzava: string | null
  regija: string | null
  kodkampanje: string | null
  ponudaid: number | null
  ponuda_naslov?: string
  validacija_ag: string | null
}
