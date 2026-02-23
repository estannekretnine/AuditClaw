import Link from 'next/link'
import { type Translations, type Language } from '@/lib/i18n/translations'
import { LanguageSwitcher } from './language-switcher'

interface HeroProps {
  t: Translations
  lang: Language
}

export function Hero({ t, lang }: HeroProps) {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16" aria-label="Main navigation">
          <Link 
            href={`/${lang}`} 
            className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
            aria-label="AuditClaw - Home"
          >
            <span className="font-mono text-2xl font-bold text-accent">AC</span>
            <span className="font-sans text-xl font-semibold hidden sm:inline">AuditClaw</span>
          </Link>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/login" 
              className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
            >
              {t.nav.login}
            </Link>
            <LanguageSwitcher currentLang={lang} />
          </div>
        </nav>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-4xl">
          {t.hero.title}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-foreground-secondary max-w-3xl leading-relaxed">
          {t.hero.subtitle}
        </p>
      </div>
    </header>
  )
}
