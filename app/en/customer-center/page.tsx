import Link from 'next/link'
import Image from 'next/image'
import { KlijentRegistrationForm } from '@/components/landing/klijent-registration-form'

export const metadata = {
  title: 'Customer Center - AuditClaw',
  description: 'Register as an AuditClaw client. Investors, buyers and sellers of real estate.',
}

interface PageProps {
  searchParams: Promise<{ ap_id?: string; source?: string }>
}

export default async function CustomerCenterPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()

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
              <div className="flex items-center gap-1 text-sm font-mono">
                <Link
                  href="/korisnicki-centar"
                  className="px-2 py-1 rounded text-foreground-secondary hover:text-foreground transition-colors"
                  hrefLang="sr"
                >
                  SRB
                </Link>
                <span className="text-border">/</span>
                <Link
                  href="/en/customer-center"
                  className="px-2 py-1 rounded text-foreground-secondary hover:text-foreground transition-colors"
                  hrefLang="en"
                >
                  ENG
                </Link>
              </div>
              <span className="px-2 py-1 rounded bg-accent text-background font-semibold text-sm">
                Customer Center
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground">
              Customer Center
            </h1>
            <p className="mt-4 text-lg text-foreground-secondary max-w-2xl mx-auto">
              Register and become part of our team.
            </p>
          </div>

          <KlijentRegistrationForm lang="en" contactid={params.ap_id} source={params.source} />
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
