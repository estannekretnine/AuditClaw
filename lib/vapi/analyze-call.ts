import Groq from 'groq-sdk'

interface CallAnalysis {
  ocena_ai: string
  obrazlozenjeocene_ai: string
}

interface AnalyzeCallOptions {
  opisServisa?: string | null
  systemPrompt?: string | null
  summary?: string | null
}

function buildAnalysisPrompt(options: AnalyzeCallOptions): string {
  const contextParts: string[] = []

  if (options.opisServisa?.trim()) {
    contextParts.push(`Opis servisa: ${options.opisServisa.trim()}`)
  }

  if (options.systemPrompt?.trim()) {
    contextParts.push(`System prompt asistenta: ${options.systemPrompt.trim()}`)
  }

  if (options.summary?.trim()) {
    contextParts.push(`Sažetak poziva (pomoćni kontekst): ${options.summary.trim()}`)
  }

  const contextBlock =
    contextParts.length > 0 ? `\n\nKontekst:\n${contextParts.join('\n')}` : ''

  return `Ti si AI evaluator kvaliteta razgovora između korisnika i glasovnog asistenta.
Oceni koliko je asistent uspešno obavio razgovor prema svom zadatku (tačnost, profesionalnost, potpunost, jasnoća, empatičnost).${contextBlock}

Odgovori ISKLJUČIVO u JSON formatu:
{
  "ocena_ai": "Broj od 1 do 10 kao string (npr. '7')",
  "obrazlozenjeocene_ai": "Kratko obrazloženje na srpskom (2-4 rečenice): šta je bilo dobro i šta može bolje, konkretno za ovaj razgovor."
}`
}

function normalizeOcena(value: string): string {
  const match = value.match(/\d+/)
  if (!match) return value.trim()
  const num = Math.min(10, Math.max(1, Number(match[0])))
  return String(num)
}

export async function analyzeVapiCallTranscript(
  transcript: string,
  options: AnalyzeCallOptions = {}
): Promise<CallAnalysis | null> {
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
        { role: 'system', content: buildAnalysisPrompt(options) },
        { role: 'user', content: `Dijalog razgovora:\n\n${transcript.slice(0, 12000)}` },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content) as CallAnalysis
    if (!parsed.ocena_ai || !parsed.obrazlozenjeocene_ai) return null

    return {
      ocena_ai: normalizeOcena(String(parsed.ocena_ai)),
      obrazlozenjeocene_ai: String(parsed.obrazlozenjeocene_ai).trim(),
    }
  } catch (error) {
    console.error('Greška pri AI analizi Vapi poziva:', error)
    return null
  }
}
