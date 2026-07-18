import { NextRequest, NextResponse } from 'next/server'
import { azurirajStanjeSimulacije } from '@/lib/actions/vapi-simulacija'
import type { VitalniParametri } from '@/lib/types/vapi-simulacija'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sobaId?: string
      vitalniParametri?: VitalniParametri
      trenutnoStanje?: string
      istorijaBolesti?: string | null
      hitanAlarm?: boolean
      poruka?: string | null
    }

    if (!body.sobaId || !body.vitalniParametri || !body.trenutnoStanje) {
      return NextResponse.json(
        { error: 'Obavezna polja: sobaId, vitalniParametri, trenutnoStanje.' },
        { status: 400 }
      )
    }

    const result = await azurirajStanjeSimulacije({
      sobaId: body.sobaId,
      vitalniParametri: body.vitalniParametri,
      trenutnoStanje: body.trenutnoStanje,
      istorijaBolesti: body.istorijaBolesti,
      hitanAlarm: body.hitanAlarm,
      poruka: body.poruka,
    })

    if (result.error || !result.data) {
      return NextResponse.json({ error: result.error || 'Greška pri ažuriranju.' }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('POST /api/simulacija/azuriraj-stanje:', error)
    const message = error instanceof Error ? error.message : 'Nepoznata greška'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
