import Link from 'next/link'
import { Clock } from 'lucide-react'
import { PublicHeader } from '@/components/landing/public-header'

export const metadata = {
  title: 'Iskustvo - AuditClaw',
  description: 'Naše iskustvo i reference u tehničkom auditu nekretnina.',
}

export default function IskustvoPage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader 
        lang="sr" 
        currentPage="experience" 
        langSwitchUrls={{ sr: '/iskustvo', en: '/en/experience' }}
      />

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6">
              <Clock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Iskustvo
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
              Ova strana je u pripremi.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              U pripremi
            </div>
          </div>
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
