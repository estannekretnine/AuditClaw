'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

interface NavLink {
  href: string
  label: string
  active?: boolean
}

interface PublicHeaderProps {
  lang: 'sr' | 'en'
  currentPage?: 'home' | 'customer-center' | 'news' | 'experience'
  langSwitchUrls?: {
    sr: string
    en: string
  }
}

export function PublicHeader({ lang, currentPage, langSwitchUrls }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const labels = {
    sr: {
      home: 'Početna',
      customerCenter: 'Korisnički Centar',
      news: 'Aktuelnosti',
      experience: 'Iskustvo',
    },
    en: {
      home: 'Home',
      customerCenter: 'Customer Center',
      news: 'News',
      experience: 'Experience',
    },
  }

  const t = labels[lang]

  const navLinks: NavLink[] = [
    { href: lang === 'en' ? '/en' : '/sr', label: t.home, active: currentPage === 'home' },
    { href: lang === 'en' ? '/en/customer-center' : '/korisnicki-centar', label: t.customerCenter, active: currentPage === 'customer-center' },
    { href: lang === 'en' ? '/en/news' : '/aktuelnosti', label: t.news, active: currentPage === 'news' },
    { href: lang === 'en' ? '/en/experience' : '/iskustvo', label: t.experience, active: currentPage === 'experience' },
  ]

  const defaultLangUrls = {
    sr: lang === 'en' ? '/sr' : '#',
    en: lang === 'sr' ? '/en' : '#',
  }

  const switchUrls = langSwitchUrls || defaultLangUrls

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20" aria-label="Main navigation">
          <Link 
            href={lang === 'en' ? '/en' : '/sr'} 
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
              link.active ? (
                <span 
                  key={link.href}
                  className="px-2 py-1 rounded bg-accent text-background font-semibold text-sm"
                >
                  {link.label}
                </span>
              ) : (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
                >
                  {link.label}
                </Link>
              )
            ))}
            <div className="flex items-center gap-1 text-sm font-mono">
              <Link
                href={switchUrls.sr}
                className={`px-2 py-1 rounded transition-colors ${lang === 'sr' ? 'bg-accent/20 text-accent' : 'text-foreground-secondary hover:text-foreground'}`}
                hrefLang="sr"
              >
                SRB
              </Link>
              <span className="text-border">/</span>
              <Link
                href={switchUrls.en}
                className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-accent/20 text-accent' : 'text-foreground-secondary hover:text-foreground'}`}
                hrefLang="en"
              >
                ENG
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex items-center gap-1 text-sm font-mono">
              <Link
                href={switchUrls.sr}
                className={`px-2 py-1 rounded transition-colors ${lang === 'sr' ? 'bg-accent/20 text-accent' : 'text-foreground-secondary hover:text-foreground'}`}
                hrefLang="sr"
              >
                SRB
              </Link>
              <span className="text-border">/</span>
              <Link
                href={switchUrls.en}
                className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-accent/20 text-accent' : 'text-foreground-secondary hover:text-foreground'}`}
                hrefLang="en"
              >
                ENG
              </Link>
            </div>
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
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                link.active ? (
                  <span 
                    key={link.href}
                    className="py-3 px-2 rounded bg-accent/10 text-accent font-semibold text-base"
                  >
                    {link.label}
                  </span>
                ) : (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground-secondary hover:text-foreground transition-colors text-base py-3 px-2"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
