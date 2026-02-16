import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Whapi webhook payload struktura
interface WhapiMessage {
  id: string
  from: string // Broj telefona pošiljaoca
  to: string
  body: string // Tekst poruke
  timestamp: number
  type: string
}

interface WhapiWebhookPayload {
  messages?: WhapiMessage[]
  event?: string
}

// Parsiranje ID ponude iz teksta poruke
function extractPonudaId(text: string): number | null {
  // Traži pattern "(ID: 123)" ili "ID: 123" ili "id:123"
  const match = text.match(/\(?\s*ID\s*:\s*(\d+)\s*\)?/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

// Formatiranje broja telefona
function formatPhoneNumber(phone: string): string {
  // Ukloni sve osim brojeva
  const cleaned = phone.replace(/\D/g, '')
  // Dodaj + ako počinje sa brojem
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export async function POST(request: NextRequest) {
  try {
    // Verifikuj Whapi token (opciono, za dodatnu sigurnost)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.WHAPI_TOKEN
    
    // Whapi može slati token u headeru
    if (expectedToken && authHeader && !authHeader.includes(expectedToken)) {
      console.warn('Whapi webhook: Invalid token')
      // Ne vraćamo 401 jer Whapi možda ne šalje token u headeru
    }

    const payload: WhapiWebhookPayload = await request.json()
    
    console.log('Whapi webhook received:', JSON.stringify(payload, null, 2))

    // Proveri da li ima poruka
    if (!payload.messages || payload.messages.length === 0) {
      // Možda je test ping ili drugi event
      return NextResponse.json({ status: 'ok', message: 'No messages to process' })
    }

    const supabase = await createClient()

    // Obradi svaku poruku
    for (const message of payload.messages) {
      // Preskoči ako nije tekstualna poruka
      if (message.type !== 'text' && !message.body) {
        continue
      }

      const ponudaId = extractPonudaId(message.body)
      const phoneNumber = formatPhoneNumber(message.from)

      // Kreiraj zapis u pozivi tabeli
      const { error } = await supabase
        .from('pozivi')
        .insert({
          mobtel: phoneNumber,
          ponudaid: ponudaId,
          validacija_ag: message.body, // Čuvamo celu poruku
          // created_at se automatski popunjava
        })

      if (error) {
        console.error('Error inserting poziv:', error)
        // Nastavi sa sledećom porukom
        continue
      }

      console.log(`Poziv kreiran: telefon=${phoneNumber}, ponudaId=${ponudaId}`)
    }

    return NextResponse.json({ 
      status: 'ok', 
      processed: payload.messages.length 
    })

  } catch (error) {
    console.error('Whapi webhook error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint za verifikaciju webhooks (neki servisi to zahtevaju)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get('hub.challenge')
  
  // Ako je verifikacioni request, vrati challenge
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Whapi webhook endpoint is active' 
  })
}
