import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WebstranaLogInsert, EventType, Language } from '@/lib/types/webstrana-log'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      session_id,
      ponuda_id,
      kampanja_id,
      event_type,
      event_data,
      language,
      time_spent_seconds
    } = body as {
      session_id: string
      ponuda_id: number
      kampanja_id?: number | null
      event_type: EventType
      event_data?: Record<string, unknown> | null
      language?: Language | null
      time_spent_seconds?: number | null
    }

    if (!session_id || !ponuda_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, ponuda_id, event_type' },
        { status: 400 }
      )
    }

    const validEventTypes: EventType[] = [
      'page_view',
      'photo_click',
      'language_change',
      'whatsapp_click',
      'video_click',
      '3d_tour_click',
      'map_interaction',
      'page_leave'
    ]

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    const logEntry: WebstranaLogInsert = {
      session_id,
      ponuda_id,
      kampanja_id: kampanja_id || null,
      event_type,
      event_data: event_data || null,
      ip_address,
      user_agent,
      referrer,
      language: language || null,
      time_spent_seconds: time_spent_seconds || null
    }

    const { data, error } = await supabase
      .from('webstrana_log')
      .insert(logEntry)
      .select()
      .single()

    if (error) {
      console.error('Error inserting webstrana_log:', error)
      return NextResponse.json(
        { error: 'Failed to log event', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Webstrana log API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const ponudaId = searchParams.get('ponuda_id')
    const eventType = searchParams.get('event_type')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('webstrana_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (ponudaId) {
      query = query.eq('ponuda_id', parseInt(ponudaId))
    }
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching webstrana_log:', error)
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Webstrana log GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
