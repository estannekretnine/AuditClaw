import { type Language } from '@/lib/i18n/translations'

interface StructuredDataProps {
  lang: Language
}

export function StructuredData({ lang }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'AuditClaw Engineering',
    description: lang === 'sr' 
      ? 'Inženjerski audit nekretnina za investitore u dijaspori'
      : 'Engineering real estate audit for diaspora investors',
    url: 'https://auditclaw.io',
    logo: 'https://auditclaw.io/logo.png',
    areaServed: {
      '@type': 'Country',
      name: 'Serbia',
    },
    serviceType: ['Building Inspection', 'Real Estate Audit', 'Structural Analysis'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+381-63-867-6663',
      contactType: 'customer service',
      availableLanguage: ['Serbian', 'English'],
    },
    sameAs: [
      'https://linkedin.com/in/placeholder',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
