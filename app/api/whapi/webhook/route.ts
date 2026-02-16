import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Kreiraj Supabase client sa service role (za API routes bez auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

// Izvlačenje teksta poruke iz različitih formata
function extractMessageText(message: any): string {
  if (!message) return ''
  
  // Format 1: message.text.body
  if (message.text?.body) return message.text.body
  
  // Format 2: message.body
  if (message.body) return message.body
  
  // Format 3: direktno string
  if (typeof message === 'string') return message
  
  return ''
}

// Izvlačenje broja telefona iz različitih formata
function extractPhoneNumber(message: any): string {
  if (!message) return ''
  
  // Različiti formati koje Whapi može koristiti
  return message.from || message.chat_id || message.sender || ''
}

export async function POST(request: NextRequest) {
  const logs: string[] = []
  
  try {
    let payload: any
    
    try {
      const rawBody = await request.text()
      logs.push(`Raw body: ${rawBody.substring(0, 500)}`)
      payload = JSON.parse(rawBody)
    } catch (e) {
      logs.push(`JSON parse error: ${e}`)
      return NextResponse.json({ status: 'ok', message: 'Invalid JSON', logs })
    }
    
    logs.push(`Payload keys: ${Object.keys(payload).join(', ')}`)

    // Pronađi poruke u payload-u
    let messages: any[] = []
    
    if (Array.isArray(payload.messages)) {
      messages = payload.messages
      logs.push(`Found messages array with ${messages.length} items`)
    } else if (payload.message) {
      messages = [payload.message]
      logs.push(`Found single message`)
    } else if (payload.event === 'messages' && payload.data) {
      messages = Array.isArray(payload.data) ? payload.data : [payload.data]
      logs.push(`Found messages in data field`)
    } else {
      // Možda je ceo payload jedna poruka
      if (payload.from || payload.chat_id) {
        messages = [payload]
        logs.push(`Treating entire payload as message`)
      }
    }

    if (messages.length === 0) {
      logs.push(`No messages found in payload`)
      return NextResponse.json({ status: 'ok', message: 'No messages', logs })
    }

    let processed = 0
    
    for (const message of messages) {
      logs.push(`Processing message: ${JSON.stringify(message).substring(0, 200)}`)
      
      // Preskoči poruke koje smo mi poslali
      if (message.from_me === true) {
        logs.push(`Skipping: from_me=true`)
        continue
      }

      const messageText = extractMessageText(message)
      logs.push(`Message text: ${messageText.substring(0, 100)}`)
      
      if (!messageText) {
        logs.push(`Skipping: empty message text`)
        continue
      }

      const ponudaId = extractPonudaId(messageText)
      const phoneNumber = formatPhoneNumber(extractPhoneNumber(message))
      
      logs.push(`Extracted: phone=${phoneNumber}, ponudaId=${ponudaId}`)

      // Kreiraj zapis u pozivi tabeli
      const insertData = {
        mobtel: phoneNumber || null,
        ponudaid: ponudaId,
        validacija_ag: messageText.substring(0, 500), // Ograniči dužinu
        created_at: new Date().toISOString(),
      }
      
      logs.push(`Inserting: ${JSON.stringify(insertData)}`)

      const { data, error } = await supabase
        .from('pozivi')
        .insert(insertData)
        .select()

      if (error) {
        logs.push(`Insert error: ${JSON.stringify(error)}`)
        continue
      }

      logs.push(`Insert success: ${JSON.stringify(data)}`)
      processed++
    }

    return NextResponse.json({ 
      status: 'ok', 
      processed,
      logs 
    })

  } catch (error) {
    logs.push(`Catch error: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      logs
    })
  }
}

// GET endpoint za health check
export async function GET() {
  // Test database connection
  const { data, error } = await supabase.from('pozivi').select('id').limit(1)
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Whapi webhook endpoint is active',
    timestamp: new Date().toISOString(),
    dbConnection: error ? `Error: ${error.message}` : 'OK',
    supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
    serviceKey: supabaseServiceKey ? 'Set' : 'Missing'
  })
}
