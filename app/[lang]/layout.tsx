import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { type Language, getTranslations } from '@/lib/i18n/translations'
import { StructuredData } from '@/components/landing/structured-data'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains',
  display: 'swap',
})

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateStaticParams() {
  return [{ lang: 'sr' }, { lang: 'en' }]
}

function isValidLanguage(lang: string): lang is Language {
  return lang === 'sr' || lang === 'en'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: rawLang } = await params
  const lang = isValidLanguage(rawLang) ? rawLang : 'sr'
  const t = getTranslations(lang)

  return {
    title: t.meta.title,
    description: t.meta.description,
    metadataBase: new URL('https://auditclaw.io'),
    alternates: {
      canonical: `https://auditclaw.io/${lang}`,
      languages: {
        'sr': 'https://auditclaw.io/sr',
        'en': 'https://auditclaw.io/en',
      },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url: `https://auditclaw.io/${lang}`,
      siteName: 'AuditClaw',
      locale: lang === 'sr' ? 'sr_RS' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.meta.title,
      description: t.meta.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: rawLang } = await params
  const lang = isValidLanguage(rawLang) ? rawLang : 'sr'
  const t = getTranslations(lang)

  return (
    <html lang={lang} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <StructuredData lang={lang} />
      </head>
      <body className="antialiased font-sans bg-background text-foreground min-h-screen">
        <a href="#main-content" className="skip-to-content">
          {t.skipToContent}
        </a>
        {children}
      </body>
    </html>
  )
}
