'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { EventType, Language } from '@/lib/types/webstrana-log'

interface TrackingConfig {
  ponudaId: number
  kampanjaId?: number | null
  initialLanguage?: Language
}

interface TrackEventData {
  event_type: EventType
  event_data?: Record<string, unknown>
  language?: Language
  time_spent_seconds?: number
}

function generateSessionId(): string {
  const stored = typeof window !== 'undefined' ? sessionStorage.getItem('webstrana_session_id') : null
  if (stored) return stored
  
  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('webstrana_session_id', newId)
  }
  return newId
}

export function useWebstranaTracking(config: TrackingConfig) {
  const { ponudaId, kampanjaId, initialLanguage } = config
  const sessionIdRef = useRef<string>('')
  const startTimeRef = useRef<number>(Date.now())
  const currentLanguageRef = useRef<Language>(initialLanguage || 'sr')
  const hasTrackedPageView = useRef(false)

  useEffect(() => {
    sessionIdRef.current = generateSessionId()
    startTimeRef.current = Date.now()
  }, [])

  const trackEvent = useCallback(async (data: TrackEventData) => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId()
    }

    try {
      await fetch('/api/webstrana-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          ponuda_id: ponudaId,
          kampanja_id: kampanjaId || null,
          event_type: data.event_type,
          event_data: data.event_data || null,
          language: data.language || currentLanguageRef.current,
          time_spent_seconds: data.time_spent_seconds || null
        })
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [ponudaId, kampanjaId])

  const trackPageView = useCallback(() => {
    if (hasTrackedPageView.current) return
    hasTrackedPageView.current = true
    
    trackEvent({
      event_type: 'page_view',
      event_data: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      }
    })
  }, [trackEvent])

  const trackPhotoClick = useCallback((photoIndex: number, photoUrl?: string) => {
    trackEvent({
      event_type: 'photo_click',
      event_data: { photoIndex, photoUrl }
    })
  }, [trackEvent])

  const trackLanguageChange = useCallback((newLanguage: Language, oldLanguage: Language) => {
    currentLanguageRef.current = newLanguage
    trackEvent({
      event_type: 'language_change',
      event_data: { from: oldLanguage, to: newLanguage },
      language: newLanguage
    })
  }, [trackEvent])

  const trackWhatsAppClick = useCallback(() => {
    trackEvent({
      event_type: 'whatsapp_click',
      event_data: { timestamp: new Date().toISOString() }
    })
  }, [trackEvent])

  const trackVideoClick = useCallback((videoUrl?: string) => {
    trackEvent({
      event_type: 'video_click',
      event_data: { videoUrl }
    })
  }, [trackEvent])

  const track3DTourClick = useCallback((tourUrl?: string) => {
    trackEvent({
      event_type: '3d_tour_click',
      event_data: { tourUrl }
    })
  }, [trackEvent])

  const trackMapInteraction = useCallback((interactionType: string) => {
    trackEvent({
      event_type: 'map_interaction',
      event_data: { interactionType }
    })
  }, [trackEvent])

  const trackPageLeave = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        session_id: sessionIdRef.current,
        ponuda_id: ponudaId,
        kampanja_id: kampanjaId || null,
        event_type: 'page_leave',
        event_data: { timeSpent },
        language: currentLanguageRef.current,
        time_spent_seconds: timeSpent
      })
      navigator.sendBeacon('/api/webstrana-log', data)
    } else {
      trackEvent({
        event_type: 'page_leave',
        event_data: { timeSpent },
        time_spent_seconds: timeSpent
      })
    }
  }, [ponudaId, kampanjaId, trackEvent])

  useEffect(() => {
    trackPageView()

    const handleBeforeUnload = () => {
      trackPageLeave()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPageLeave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [trackPageView, trackPageLeave])

  return {
    trackPageView,
    trackPhotoClick,
    trackLanguageChange,
    trackWhatsAppClick,
    trackVideoClick,
    track3DTourClick,
    trackMapInteraction,
    trackPageLeave,
    sessionId: sessionIdRef.current
  }
}
