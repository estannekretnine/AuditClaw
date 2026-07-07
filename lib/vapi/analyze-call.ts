import Groq from 'groq-sdk'

const ANALYSIS_PROMPT = `Ti si AI analitičar razgovora. Na osnovu transkripta razgovora između korisnika i glasovnog asistenta, oceni kvalitet razgovora.

Odgovori ISKLJUČIVO u JSON formatu:
{
  "ocena_ai": "Brojčana ocena od 1 do 10 (kao string, npr. '8')",
  "obrazlozenjeocene_ai": "Kratko obrazloženje ocene na srpskom (2-4 rečenice): šta je bilo dobro, šta može bolje."
}`

interface CallAnalysis {
  ocena_ai: string
  obrazlozenjeocene_ai: string
}

export async function analyzeVapiCallTranscript(transcript: string): Promise<CallAnalysis | null> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY nije konfigurisan — preskačem AI analizu poziva')
    return null
  }

  if (!transcript.trim()) {
    return null
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: `Transkript razgovora:\n\n${transcript.slice(0, 8000)}` },
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content) as CallAnalysis
    if (!parsed.ocena_ai || !parsed.obrazlozenjeocene_ai) return null

    return parsed
  } catch (error) {
    console.error('Greška pri AI analizi Vapi poziva:', error)
    return null
  }
}
