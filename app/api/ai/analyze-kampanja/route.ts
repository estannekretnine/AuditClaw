import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `Ti si 'AuditClaw AI', brutalno iskren investicioni analitičar nekretnina. 
Tvoj fokus je na inženjerskoj preciznosti i psihologiji kupaca visoke platežne moći iz dijaspore (Nemačka, Švajcarska, Austrija, USA). 
Tvoj ton je autoritativan i tehnički, bez marketinških prideva poput 'prelep' ili 'jedinstven'. 
Fokusiraj se na statiku, instalacije, ROI i ekskluzivnost lokacije.

UVEK odgovaraj na SRPSKOM jeziku (osim za LinkedIn i Email koji mogu biti na engleskom).

Tvoj zadatak je da analiziraš nekretninu i generišeš sadržaj za marketing kampanju.

Odgovori ISKLJUČIVO u JSON formatu sa sledećim poljima (bez markdown formatiranja, samo čist JSON):

{
  "analizaoglasa_ai": "Generiši 'AUDIT HIGHLIGHTS' - 3-4 najbitnija tehnička bulleta koja opravdavaju cenu. Format: '+ [Tehnički detalj] - [Konkretna prednost/ocena]'. Fokus na: izolaciju (termičku/zvučnu), instalacije (grejanje/hlađenje/elektro), strukturu (zidovi/plafoni), završnu obradu. Primer: '+ Dupli spoljni zidovi + kamena vuna - Termička izolacija 8/10\n+ Predimenzionisani radijatori - 30% bolja efikasnost\n+ Inverter klime u svakoj sobi - Energetska klasa A++'. Bez marketinških fraza.",
  "ciljnagrupa_ai": "Definiši 3 precizna profila iz dijaspore. Format: '1. [Pozicija] u [Grad], poreklom sa [Lokacija u Srbiji] - [Zašto bi kupio]'. Primer: 'Senior Software Architect u Cirihu, poreklom sa Vračara - traži investiciju za roditelje'.",
  "ciljaniregion_ai": "Specifični gradovi i kompanije gde rade idealni kupci. Format lista: 'Minhen (Siemens, BMW), Cirih (Google, UBS), Beč (Erste Bank), Frankfurt (Deutsche Bank)'.",
  "kljucnereci_ai": "Generiši SEO optimizovanu listu ključnih reči (10-15 fraza). Kombinuj: 1) Specifičnu lokaciju (ulica + opština), 2) Tip nekretnine, 3) Tehničke termine, 4) Investicione fraze. Format: '[Lokacija] [tip] [tehnika]'. Primer: 'Dorćol dupleks investicija, Gundulićev venac premium, Šantićeva tehnička izvrsnost, Belgrade duplex thermal efficiency, Dorćol heritage investment, Stari Grad technical audit, Beograd centar izolacija'.",
  "psiholoskiprofil_ai": "Identifikuj 3 glavna straha kupca iz dijaspore i kako ih AuditClaw tehnički izveštaj rešava. Format: 'STRAH: [opis] → REŠENJE: [kako Audit pomaže]'.",
  "predlogkampanje_ai": "Napravi plan za direktan Outreach. Uključi: 1) Apollo.io filtere (Job titles, Years of experience, Industry, Location), 2) LinkedIn Search String, 3) Jednu 'Cold' poruku (max 300 karaktera) koja poziva na preuzimanje tehničkog izveštaja.",
  "zakljucak_ai": "Sumiraj investicioni potencijal u 2-3 rečenice. Na kraju dodaj 'AuditClaw Score: [X]/100' gde X odražava investicioni potencijal na osnovu lokacije, cene po m², tehničkog stanja i potražnje iz dijaspore.",
  "tekst_linkedin": "Napiši LinkedIn outreach poruku (max 300 karaktera) na engleskom jeziku. Fokus na ROI, tehničku preciznost i ekskluzivnost. Pozovi na preuzimanje tehničkog izveštaja. Primer: 'Hi [Name], noticed your background in [Industry]. We're offering a pre-vetted Belgrade property with full technical audit. ROI 8%+, prime location. Download report: [link]'",
  "tekst_email_naslov": "Napiši email subject line (max 60 karaktera) koji privlači pažnju. Primer: 'Belgrade Investment: 8% ROI + Full Technical Report'",
  "tekst_email_telo": "Napiši email telo (max 500 karaktera) sa strukturom: 1) Problem/prilika, 2) Rešenje (AuditClaw audit), 3) Poziv na akciju. Može biti na engleskom.",
  "tekst_whatsapp": "Napiši WhatsApp poruku (max 250 karaktera) na srpskom jeziku. Direktan, prijateljski ton. Pozovi na razgovor ili preuzimanje izveštaja.",
  "naslov_ai": "Napiši inženjerski precizan H1 naslov (max 80 karaktera) na srpskom jeziku. Format: '[Lokacija] [Tip] - [Kvadratura]m² [Ključna Tehnička Prednost]'. Izbegavaj marketinške pridev poput 'luksuzni', 'prelep'. Fokus na tehničku superiornost i investicionu vrednost. Primer: 'Gundulićev Venac Dupleks - 104m² Termička Izvrsnost'",
  "opis_ai": "Napiši profesionalan marketing opis (max 200 karaktera) na srpskom jeziku u AuditClaw stilu. Fokusiraj se na tehničke specifikacije, izolaciju, instalacije, energetsku efikasnost. Bez agencijskih fraza ('prelep pogled', 'jedinstvena prilika'). Direktan, autoritativan ton. Primer: 'Dupli spoljni zidovi + kamena vuna, predimenzionisani radijatori, inverter klime. Tehnička izvrsnost za zahtevne investitore iz dijaspore.'"
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
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API ključ nije konfigurisan. Dodajte GROQ_API_KEY u environment variables.' },
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

Generiši JSON odgovor sa analizom i preporukama za kampanju. Odgovori SAMO sa JSON objektom, bez dodatnog teksta ili markdown formatiranja.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      return NextResponse.json(
        { error: 'AI nije vratio odgovor. Pokušajte ponovo.' },
        { status: 500 }
      )
    }

    // Parsiraj JSON odgovor
    let aiResponse
    try {
      aiResponse = JSON.parse(responseContent)
    } catch {
      console.error('Failed to parse AI response:', responseContent)
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
    
    return NextResponse.json(
      { error: `AI greška: ${errorMessage}` },
      { status: 500 }
    )
  }
}
