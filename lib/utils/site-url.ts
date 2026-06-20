/**
 * Bazni URL sajta za generisanje linkova (kartica, preporuka).
 * Koristi NEXT_PUBLIC_SITE_URL ili fallback na produkciju.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://auditclaw.io'
  return url.replace(/\/$/, '')
}

/**
 * Link na digitalnu karticu klijenta.
 */
export function getDigitalCardUrl(kod: string, lang: 'sr' | 'en' = 'sr'): string {
  const base = getSiteUrl()
  if (lang === 'en') {
    return `${base}/en/digital-card/${encodeURIComponent(kod)}`
  }
  return `${base}/digitalna-kartica/${encodeURIComponent(kod)}`
}

/**
 * Link na formu za registraciju sa pre-popunjenim kodom preporuke.
 */
export function getReferralFormUrl(
  kod: string,
  referrerName: string,
  lang: 'sr' | 'en' = 'sr'
): string {
  const base = getSiteUrl()
  const path = lang === 'en' ? '/en/customer-center' : '/korisnicki-centar'
  const params = new URLSearchParams({
    ref: kod,
    od: referrerName.trim(),
  })
  return `${base}${path}?${params.toString()}`
}
