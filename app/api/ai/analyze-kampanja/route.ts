import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `Ti si 'AuditClaw AI', brutalno iskren investicioni analitičar nekretnina. 
Tvoj fokus je na inženjerskoj preciznosti i psihologiji kupaca visoke platežne moći iz dijaspore (Nemačka, Švajcarska, Austrija, USA). 
Tvoj ton je autoritativan i tehnički, bez marketinških prideva poput 'prelep' ili 'jedinstven'. 
Fokusiraj se na statiku, instalacije, ROI i ekskluzivnost lokacije.

UVEK odgovaraj na SRPSKOM jeziku.

Tvoj zadatak je da analiziraš nekretninu i generišeš sadržaj za marketing kampanju.

Odgovori ISKLJUČIVO u JSON formatu sa sledećim poljima (bez markdown formatiranja, samo čist JSON):

{
  "analizaoglasa_ai": "Oceni trenutni opis ocenom 1-10. Navedi šta nedostaje od tehničkih detalja (npr. stanje vertikala, izolacija, specifikacija prozora, elektro-instalacije, vodovod).",
  "ciljnagrupa_ai": "Definiši 3 precizna profila iz dijaspore. Format: '1. [Pozicija] u [Grad], poreklom sa [Lokacija u Srbiji] - [Zašto bi kupio]'. Primer: 'Senior Software Architect u Cirihu, poreklom sa Vračara - traži investiciju za roditelje'.",
  "ciljaniregion_ai": "Specifični gradovi i kompanije gde rade idealni kupci. Format lista: 'Minhen (Siemens, BMW), Cirih (Google, UBS), Beč (Erste Bank), Frankfurt (Deutsche Bank)'.",
  "kljucnereci_ai": "Generiši listu ključnih reči za LinkedIn Outreach i meta-tagove. Kombinuj lokaciju, tip nekretnine i investicione termine na engleskom i srpskom. Primer: 'Vračar Heritage investment, Technical Due Diligence Belgrade, Private Parking Krunska, Stan Beograd dijaspora'.",
  "psiholoskiprofil_ai": "Identifikuj 3 glavna straha kupca iz dijaspore i kako ih AuditClaw tehnički izveštaj rešava. Format: 'STRAH: [opis] → REŠENJE: [kako Audit pomaže]'.",
  "predlogkampanje_ai": "Napravi plan za direktan Outreach. Uključi: 1) Apollo.io filtere (Job titles, Years of experience, Industry, Location), 2) LinkedIn Search String, 3) Jednu 'Cold' poruku (max 300 karaktera) koja poziva na preuzimanje tehničkog izveštaja.",
  "zakljucak_ai": "Sumiraj investicioni potencijal u 2-3 rečenice. Na kraju dodaj 'AuditClaw Score: [X]/100' gde X odražava investicioni potencijal na osnovu lokacije, cene po m², tehničkog stanja i potražnje iz dijaspore."
}`

interface PonudaData {
  id: number
  naslovoglasa?: string | null
  opis_ag?: string | null
  vrstaobjekta_ag?: string | null
  cena_ag?: number | null
  kvadratura_ag?: number | null
  struktura_ag?: number | null
  lokacija_ag?: string | null
  opstina_ag?: string | null
  grad_ag?: string | null
  adresa?: string | null
  sprat?: string | null
  grejanje?: string | null
  lift?: string | null
  stsimagarazu?: boolean | null
  stsparking?: boolean | null
  stsrentaprodaja?: string | null
  oglasid_agencija?: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Proveri da li postoji API ključ
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API ključ nije konfigurisan. Dodajte GEMINI_API_KEY u environment variables.' },
        { status: 500 }
      )
    }

    const ponuda: PonudaData = await request.json()

    // Kreiraj user prompt sa podacima o nekretnini
    const userPrompt = `Analiziraj sledeću nekretninu i generiši sadržaj za marketing kampanju:

PODACI O NEKRETNINI:
- ID: ${ponuda.id}
- Naslov: ${ponuda.naslovoglasa || 'Nije unet'}
- Vrsta objekta: ${ponuda.vrstaobjekta_ag || 'Nije unet'}
- Tip transakcije: ${ponuda.stsrentaprodaja === 'renta' ? 'Izdavanje' : 'Prodaja'}
- Cena: ${ponuda.cena_ag ? `${ponuda.cena_ag.toLocaleString('sr-RS')} €` : 'Nije uneta'}
- Kvadratura: ${ponuda.kvadratura_ag ? `${ponuda.kvadratura_ag} m²` : 'Nije uneta'}
- Struktura: ${ponuda.struktura_ag ? `${ponuda.struktura_ag} soba` : 'Nije uneta'}
- Cena po m²: ${ponuda.cena_ag && ponuda.kvadratura_ag ? `${Math.round(ponuda.cena_ag / ponuda.kvadratura_ag).toLocaleString('sr-RS')} €/m²` : 'N/A'}
- Lokacija: ${ponuda.lokacija_ag || 'Nije uneta'}
- Opština: ${ponuda.opstina_ag || 'Nije uneta'}
- Grad: ${ponuda.grad_ag || 'Beograd'}
- Adresa: ${ponuda.adresa || 'Nije uneta'}
- Sprat: ${ponuda.sprat || 'Nije unet'}
- Grejanje: ${ponuda.grejanje || 'Nije uneto'}
- Lift: ${ponuda.lift || 'Nije unet'}
- Garaža: ${ponuda.stsimagarazu ? 'Da' : 'Ne'}
- Parking: ${ponuda.stsparking ? 'Da' : 'Ne'}
- Agencijski ID: ${ponuda.oglasid_agencija || ponuda.id}

OPIS NEKRETNINE:
${ponuda.opis_ag || 'Opis nije unet - ovo je kritičan nedostatak za marketing.'}

Generiši JSON odgovor sa analizom i preporukama za kampanju. Odgovori SAMO sa JSON objektom, bez dodatnog teksta.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000,
      }
    })

    const responseText = result.response.text()

    if (!responseText) {
      return NextResponse.json(
        { error: 'AI nije vratio odgovor. Pokušajte ponovo.' },
        { status: 500 }
      )
    }

    // Očisti odgovor od markdown formatiranja ako postoji
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Parsiraj JSON odgovor
    let aiResponse
    try {
      aiResponse = JSON.parse(cleanedResponse)
    } catch {
      console.error('Failed to parse AI response:', cleanedResponse)
      return NextResponse.json(
        { error: 'AI je vratio neispravan format. Pokušajte ponovo.' },
        { status: 500 }
      )
    }

    // Generiši URL slug za kodkampanje
    const lokacija = (ponuda.lokacija_ag || ponuda.opstina_ag || 'beograd')
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šś]/g, 's')
      .replace(/[žź]/g, 'z')
      .replace(/đ/g, 'dj')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 20)
    
    const urlSlug = `${lokacija}-premium-id${ponuda.oglasid_agencija || ponuda.id}`

    return NextResponse.json({
      ...aiResponse,
      urlSlug
    })

  } catch (error) {
    console.error('AI Analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Vrati tačnu grešku za debugging
    return NextResponse.json(
      { error: `AI greška: ${errorMessage}` },
      { status: 500 }
    )
  }
}
