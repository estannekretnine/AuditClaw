import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowLeft } from 'lucide-react'
import { getActiveAktuelnostById } from '@/lib/actions/aktuelnosti'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const { data: aktuelnost } = await getActiveAktuelnostById(parseInt(id))
  
  if (!aktuelnost) {
    return { title: 'Članak nije pronađen - AuditClaw' }
  }

  return {
    title: `${aktuelnost.naslov_sr} - AuditClaw`,
    description: aktuelnost.tekst_sr.substring(0, 160),
  }
}

export default async function AktuelnostDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: aktuelnost } = await getActiveAktuelnostById(parseInt(id))
  const currentYear = new Date().getFullYear()

  if (!aktuelnost) {
    notFound()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatContent = (text: string) => {
    if (text.includes('<p>') || text.includes('<h2>') || text.includes('<strong>')) {
      return text
    }
    return text
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')
  }

  const htmlContent = formatContent(aktuelnost.tekst_sr)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-20" aria-label="Main navigation">
            <Link 
              href="/sr" 
              className="flex items-center gap-3 text-foreground hover:text-accent transition-colors"
              aria-label="AuditClaw - Home"
            >
              <Image 
                src="/logo.png" 
                alt="AuditClaw Logo" 
                width={48} 
                height={48}
                className="rounded"
                priority
              />
              <span className="font-sans text-xl font-semibold hidden sm:inline">AuditClaw</span>
            </Link>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <Link 
                href="/sr" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
              >
                Početna
              </Link>
              <Link 
                href="/korisnicki-centar" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm hidden sm:inline"
              >
                Korisnički Centar
              </Link>
              <Link 
                href="/aktuelnosti" 
                className="px-2 py-1 rounded bg-accent text-background font-semibold text-sm"
              >
                Aktuelnosti
              </Link>
              <Link 
                href="/iskustvo" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm hidden sm:inline"
              >
                Iskustvo
              </Link>
              <div className="flex items-center gap-1 text-sm font-mono">
                <Link
                  href={`/aktuelnosti/${id}`}
                  className="px-2 py-1 rounded bg-accent/20 text-accent transition-colors"
                  hrefLang="sr"
                >
                  SRB
                </Link>
                <span className="text-border">/</span>
                <Link
                  href={`/en/news/${id}`}
                  className="px-2 py-1 rounded text-foreground-secondary hover:text-foreground transition-colors"
                  hrefLang="en"
                >
                  ENG
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link 
            href="/aktuelnosti"
            className="inline-flex items-center gap-2 text-foreground-secondary hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na aktuelnosti
          </Link>

          {/* Article */}
          <article>
            {aktuelnost.slika_url && (
              <div className="aspect-video relative overflow-hidden rounded-xl mb-8">
                <img
                  src={aktuelnost.slika_url}
                  alt={aktuelnost.naslov_sr}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-4">
              <Calendar className="w-4 h-4" />
              {formatDate(aktuelnost.datum_objave)}
            </div>

            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-8">
              {aktuelnost.naslov_sr}
            </h1>

            <div 
              className="prose prose-invert prose-lg max-w-none 
                prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-h2:text-2xl prose-h3:text-xl
                prose-p:text-foreground-secondary prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-li:text-foreground-secondary prose-li:my-1
                prose-ul:my-4 prose-ol:my-4
                prose-blockquote:border-l-accent prose-blockquote:text-foreground-secondary prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-mono text-foreground font-semibold">
                AuditClaw Engineering
              </p>
              <p className="text-foreground-secondary text-sm mt-1">
                Struka ispred prodaje. Verifikovano na LinkedIn-u.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
              >
                Prijava
              </Link>
              <p className="text-foreground-secondary text-sm">
                © {currentYear} AuditClaw Engineering. Sva prava zadržana.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
