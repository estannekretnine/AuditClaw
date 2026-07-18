import { NextRequest, NextResponse } from 'next/server'
import { pridruziSeSobi } from '@/lib/actions/vapi-simulacija'
import type { VapiSimulacijaUloga } from '@/lib/types/vapi-simulacija'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sobaId?: string
      uloga?: VapiSimulacijaUloga
      ucenikId?: number
    }

    if (!body.sobaId || !body.uloga || !body.ucenikId) {
      return NextResponse.json(
        { error: 'Obavezna polja: sobaId, uloga, ucenikId.' },
        { status: 400 }
      )
    }

    const result = await pridruziSeSobi({
      sobaId: body.sobaId,
      uloga: body.uloga,
      ucenikId: Number(body.ucenikId),
    })

    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error || 'Greška pri pridruživanju.' }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('POST /api/soba/pridruzi:', error)
    const message = error instanceof Error ? error.message : 'Nepoznata greška'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
