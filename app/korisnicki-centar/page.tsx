import Link from 'next/link'
import { KlijentRegistrationForm } from '@/components/landing/klijent-registration-form'
import { PublicHeader } from '@/components/landing/public-header'

export const metadata = {
  title: 'Korisnički Centar - AuditClaw',
  description: 'Registrujte se kao klijent AuditClaw platforme. Investitori, kupci i prodavci nekretnina.',
}

interface PageProps {
  searchParams: Promise<{ ap_id?: string; source?: string }>
}

export default async function KorisnickiCentarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader 
        lang="sr" 
        currentPage="customer-center" 
        langSwitchUrls={{ sr: '/korisnicki-centar', en: '/en/customer-center' }}
      />

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground">
              Korisnički Centar
            </h1>
            <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
              Registrujte se i postanite deo našeg tima.
            </p>
          </div>

          <KlijentRegistrationForm contactid={params.ap_id} source={params.source} />
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
