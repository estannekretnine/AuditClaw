import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'
import { getAktuelnosti } from '@/lib/actions/aktuelnosti'

export const metadata = {
  title: 'News - AuditClaw',
  description: 'Latest news and articles from the world of real estate and technical audit.',
}

export default async function NewsPage() {
  const { data: aktuelnosti } = await getAktuelnosti(50, 0, true)
  const currentYear = new Date().getFullYear()

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
              <span className="px-2 py-1 rounded bg-accent text-background font-semibold text-sm">
                News
              </span>
              <Link 
                href="/en/experience" 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm hidden sm:inline"
              >
                Experience
              </Link>
              <div className="flex items-center gap-1 text-sm font-mono">
                <Link
                  href="/aktuelnosti"
                  className="px-2 py-1 rounded text-foreground-secondary hover:text-foreground transition-colors"
                  hrefLang="sr"
                >
                  SRB
                </Link>
                <span className="text-border">/</span>
                <Link
                  href="/en/news"
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground">
              News
            </h1>
          </div>

          {/* Articles Grid */}
          {aktuelnosti && aktuelnosti.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aktuelnosti.map((aktuelnost) => (
                <Link
                  key={aktuelnost.id}
                  href={`/en/news/${aktuelnost.id}`}
                  className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
                >
                  {aktuelnost.slika_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={aktuelnost.slika_url}
                        alt={aktuelnost.naslov_en || aktuelnost.naslov_sr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-border/30 flex items-center justify-center">
                      <span className="text-foreground-secondary text-sm">No image</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-3">
                      <Calendar className="w-4 h-4" />
                      {formatDate(aktuelnost.datum_objave)}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      {aktuelnost.naslov_en || aktuelnost.naslov_sr}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-accent text-sm font-medium">
                      Read more
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-foreground-secondary">No articles published yet.</p>
            </div>
          )}
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
