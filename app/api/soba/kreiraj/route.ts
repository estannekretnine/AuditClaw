import { NextRequest, NextResponse } from 'next/server'
import { kreirajSobu } from '@/lib/actions/vapi-simulacija'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      naziv?: string
      profesorId?: number | null
      assistantId?: number | null
      istorijaBolesti?: string | null
    }

    if (!body.naziv?.trim()) {
      return NextResponse.json({ error: 'Naziv sobe je obavezan.' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin

    const result = await kreirajSobu({
      naziv: body.naziv.trim(),
      profesorId: body.profesorId ?? null,
      assistantId: body.assistantId ?? null,
      istorijaBolesti: body.istorijaBolesti ?? null,
      origin,
    })

    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error || 'Greška pri kreiranju sobe.' }, { status: 400 })
    }

    return NextResponse.json({
      soba_id: result.data.soba?.id,
      soba: result.data.soba,
      linkovi: result.data.linkovi,
      pusherConfigured: result.data.pusherConfigured,
    })
  } catch (error) {
    console.error('POST /api/soba/kreiraj:', error)
    const message = error instanceof Error ? error.message : 'Nepoznata greška'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
