'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { type Translations, type Language } from '@/lib/i18n/translations'
import { LanguageSwitcher } from './language-switcher'

interface HeroProps {
  t: Translations
  lang: Language
}

export function Hero({ t, lang }: HeroProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: `/${lang}`, label: t.nav.home },
    { href: lang === 'en' ? '/en/customer-center' : '/korisnicki-centar', label: t.nav.customerCenter },
    { href: lang === 'en' ? '/en/news' : '/aktuelnosti', label: t.nav.news },
    { href: lang === 'en' ? '/en/experience' : '/iskustvo', label: t.nav.experience },
  ]

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20" aria-label="Main navigation">
          <Link 
            href={`/${lang}`} 
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher currentLang={lang} />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher currentLang={lang} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
              aria-label={mobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-foreground-secondary hover:text-foreground transition-colors text-base py-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
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
