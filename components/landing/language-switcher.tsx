'use client'

import Link from 'next/link'
import { type Language } from '@/lib/i18n/translations'

interface LanguageSwitcherProps {
  currentLang: Language
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-1 text-sm font-mono" role="navigation" aria-label="Language selection">
      <Link
        href="/sr"
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === 'sr'
            ? 'bg-accent text-background font-semibold'
            : 'text-foreground-secondary hover:text-foreground'
        }`}
        aria-current={currentLang === 'sr' ? 'page' : undefined}
        hrefLang="sr"
      >
        SRB
      </Link>
      <span className="text-border">/</span>
      <Link
        href="/en"
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === 'en'
            ? 'bg-accent text-background font-semibold'
            : 'text-foreground-secondary hover:text-foreground'
        }`}
        aria-current={currentLang === 'en' ? 'page' : undefined}
        hrefLang="en"
      >
        ENG
      </Link>
    </div>
  )
}
