import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Kreiraj Supabase client sa service role (za API routes bez auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Whapi webhook payload struktura - prilagođeno Whapi formatu
interface WhapiMessage {
  id: string
  from: string
  chat_id: string
  text?: {
    body: string
  }
  from_me: boolean
  timestamp: number
  type: string
}

interface WhapiWebhookPayload {
  messages?: WhapiMessage[]
  event?: string
  // Alternativni format
  message?: WhapiMessage
}

// Parsiranje ID ponude iz teksta poruke
function extractPonudaId(text: string): number | null {
  if (!text) return null
  // Traži pattern "(ID: 123)" ili "ID: 123" ili "id:123"
  const match = text.match(/\(?\s*ID\s*:\s*(\d+)\s*\)?/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

// Formatiranje broja telefona
function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  // Ukloni sve osim brojeva i +
  const cleaned = phone.replace(/[^\d+]/g, '')
  // Dodaj + ako nema
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export async function POST(request: NextRequest) {
  try {
    let payload: WhapiWebhookPayload
    
    try {
      payload = await request.json()
    } catch {
      // Ako nije validan JSON, vrati OK (možda je test)
      return NextResponse.json({ status: 'ok', message: 'Invalid JSON' })
    }
    
    console.log('Whapi webhook received:', JSON.stringify(payload, null, 2))

    // Proveri različite formate koje Whapi može slati
    const messages: WhapiMessage[] = []
    
    if (payload.messages && Array.isArray(payload.messages)) {
      messages.push(...payload.messages)
    }
    if (payload.message) {
      messages.push(payload.message)
    }

    // Ako nema poruka, vrati OK (možda je test ping)
    if (messages.length === 0) {
      return NextResponse.json({ status: 'ok', message: 'No messages to process' })
    }

    // Obradi svaku poruku
    for (const message of messages) {
      // Preskoči poruke koje smo mi poslali
      if (message.from_me) {
        continue
      }

      // Izvuci tekst poruke
      const messageText = message.text?.body || ''
      
      // Preskoči prazne poruke
      if (!messageText) {
        continue
      }

      const ponudaId = extractPonudaId(messageText)
      const phoneNumber = formatPhoneNumber(message.from || message.chat_id)

      // Kreiraj zapis u pozivi tabeli
      const { error } = await supabase
        .from('pozivi')
        .insert({
          mobtel: phoneNumber,
          ponudaid: ponudaId,
          validacija_ag: messageText,
        })

      if (error) {
        console.error('Error inserting poziv:', error)
        continue
      }

      console.log(`Poziv kreiran: telefon=${phoneNumber}, ponudaId=${ponudaId}`)
    }

    return NextResponse.json({ 
      status: 'ok', 
      processed: messages.length 
    })

  } catch (error) {
    console.error('Whapi webhook error:', error)
    // Uvek vraćamo 200 da Whapi ne bi ponavljao request
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

// GET endpoint za verifikaciju i health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Whapi webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
