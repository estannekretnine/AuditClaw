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
    return { title: 'Article not found - AuditClaw' }
  }

  const title = aktuelnost.naslov_en || aktuelnost.naslov_sr
  const description = (aktuelnost.tekst_en || aktuelnost.tekst_sr).substring(0, 160)

  return {
    title: `${title} - AuditClaw`,
    description,
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: aktuelnost } = await getActiveAktuelnostById(parseInt(id))
  const currentYear = new Date().getFullYear()

  if (!aktuelnost) {
    notFound()
  }

  const title = aktuelnost.naslov_en || aktuelnost.naslov_sr
  const text = aktuelnost.tekst_en || aktuelnost.tekst_sr

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-20" aria-label="Main navigation">
            <Link 
              href="/en" 
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
                href="/en" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
              >
                Home
              </Link>
              <Link 
                href="/en/customer-center" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm hidden sm:inline"
              >
                Customer Center
              </Link>
              <Link 
                href="/en/news" 
                className="px-2 py-1 rounded bg-accent text-background font-semibold text-sm"
              >
                News
              </Link>
              <Link 
                href="/en/experience" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm hidden sm:inline"
              >
                Experience
              </Link>
              <div className="flex items-center gap-1 text-sm font-mono">
                <Link
                  href={`/aktuelnosti/${id}`}
                  className="px-2 py-1 rounded text-foreground-secondary hover:text-foreground transition-colors"
                  hrefLang="sr"
                >
                  SRB
                </Link>
                <span className="text-border">/</span>
                <Link
                  href={`/en/news/${id}`}
                  className="px-2 py-1 rounded bg-accent/20 text-accent transition-colors"
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
            href="/en/news"
            className="inline-flex items-center gap-2 text-foreground-secondary hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to news
          </Link>

          {/* Article */}
          <article>
            {aktuelnost.slika_url && (
              <div className="aspect-video relative overflow-hidden rounded-xl mb-8">
                <img
                  src={aktuelnost.slika_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-4">
              <Calendar className="w-4 h-4" />
              {formatDate(aktuelnost.datum_objave)}
            </div>

            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-8">
              {title}
            </h1>

            <div 
              className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground-secondary prose-a:text-accent prose-strong:text-foreground prose-li:text-foreground-secondary"
              dangerouslySetInnerHTML={{ __html: text }}
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
                Profession before sales. Verified on LinkedIn.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
              >
                Login
              </Link>
              <p className="text-foreground-secondary text-sm">
                © {currentYear} AuditClaw Engineering. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
