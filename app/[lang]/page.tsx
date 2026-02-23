import { type Language, getTranslations } from '@/lib/i18n/translations'
import { 
  Hero, 
  Services, 
  WhyAuditClaw, 
  Trust, 
  ContactCTA, 
  Footer 
} from '@/components/landing'

type Props = {
  params: Promise<{ lang: string }>
}

function isValidLanguage(lang: string): lang is Language {
  return lang === 'sr' || lang === 'en'
}

export default async function LandingPage({ params }: Props) {
  const { lang: rawLang } = await params
  const lang = isValidLanguage(rawLang) ? rawLang : 'sr'
  const t = getTranslations(lang)

  return (
    <>
      <Hero t={t} lang={lang} />
      <main id="main-content">
        <Services t={t} />
        <WhyAuditClaw t={t} />
        <Trust t={t} />
        <ContactCTA t={t} />
      </main>
      <Footer t={t} />
    </>
  )
}
