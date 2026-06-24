'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, Share2, User } from 'lucide-react'
import type { Klijent } from '@/lib/types/klijenti'
import { getDigitalCardUrl, getReferralFormUrl } from '@/lib/utils/site-url'

interface DigitalnaKarticaViewProps {
  klijent: Klijent
  lang: 'sr' | 'en'
}

const labels = {
  sr: {
    title: 'Digitalna Kartica',
    subtitle: 'AuditClaw Korisnički Centar',
    referralCode: 'Vaš kod za preporuku',
    copyCardLink: 'Kopiraj link kartice',
    copied: 'Kopirano!',
    recommendUs: 'Preporuči nas',
    recommendHint: 'Podelite ovaj link — forma će automatski prepoznati vašu preporuku.',
    memberSince: 'Član od',
    statuses: {
      agencija: 'Agencija za nekretnine',
      investitor: 'Investitor',
      investitorAudit: 'Investitor AuditClaw-Project',
      kupac: 'Kupac',
      prijatelj: 'Prijatelj sajta',
      prodavac: 'Prodavac',
      ekspert: 'Ekspert',
    },
    footer: 'AuditClaw Engineering — Struka ispred prodaje.',
    home: 'Početna',
    register: 'Registruj se',
  },
  en: {
    title: 'Digital Card',
    subtitle: 'AuditClaw Customer Center',
    referralCode: 'Your referral code',
    copyCardLink: 'Copy card link',
    copied: 'Copied!',
    recommendUs: 'Recommend us',
    recommendHint: 'Share this link — the form will automatically recognize your referral.',
    memberSince: 'Member since',
    statuses: {
      agencija: 'Real estate agency',
      investitor: 'Investor',
      investitorAudit: 'Investor AuditClaw-Project',
      kupac: 'Buyer',
      prijatelj: 'Friend of the site',
      prodavac: 'Seller',
      ekspert: 'Expert',
    },
    footer: 'AuditClaw Engineering — Profession before sales.',
    home: 'Home',
    register: 'Register',
  },
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/30">
      {label}
    </span>
  )
}

export function DigitalnaKarticaView({ klijent, lang }: DigitalnaKarticaViewProps) {
  const t = labels[lang]
  const [copied, setCopied] = useState<'card' | null>(null)

  const fullName = [klijent.ime, klijent.prezime].filter(Boolean).join(' ') || '—'
  const kod = klijent.preporukacode || ''
  const cardUrl = kod ? getDigitalCardUrl(kod, lang) : ''
  const referralUrl = kod ? getReferralFormUrl(kod, fullName, lang) : ''

  const statuses: string[] = []
  if (klijent.stsagencijazanekretnine) statuses.push(t.statuses.agencija)
  if (klijent.stsinvestitor) statuses.push(t.statuses.investitor)
  if (klijent.stsinvestitoraudit) statuses.push(t.statuses.investitorAudit)
  if (klijent.stskupac) statuses.push(t.statuses.kupac)
  if (klijent.stsprijateljsajta) statuses.push(t.statuses.prijatelj)
  if (klijent.stsprodavac) statuses.push(t.statuses.prodavac)
  if (klijent.stsekspert) statuses.push(t.statuses.ekspert)

  const copyToClipboard = async (text: string, type: 'card') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  const memberDate = klijent.datumupisa
    ? new Date(klijent.datumupisa).toLocaleDateString(lang === 'sr' ? 'sr-RS' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-12 sm:py-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Kartica */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            {/* Accent header strip */}
            <div className="h-2 bg-gradient-to-r from-accent/80 via-accent to-accent/80" />

            <div className="p-8">
              {/* Logo / branding */}
              <div className="text-center mb-6">
                <p className="font-mono text-accent font-bold text-lg tracking-wider">AuditClaw</p>
                <p className="text-foreground-secondary text-sm mt-1">{t.subtitle}</p>
              </div>

              {/* Avatar + ime */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground text-center">{fullName}</h1>
                {klijent.firma && (
                  <p className="text-foreground-secondary mt-1 text-center">{klijent.firma}</p>
                )}
                {memberDate && (
                  <p className="text-foreground-secondary/70 text-xs mt-2">
                    {t.memberSince} {memberDate}
                  </p>
                )}
              </div>

              {/* Statusi */}
              {statuses.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {statuses.map((s) => (
                    <StatusBadge key={s} label={s} />
                  ))}
                </div>
              )}

              {/* Preporuka kod */}
              {kod && (
                <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-center">
                  <p className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">
                    {t.referralCode}
                  </p>
                  <p className="font-mono text-2xl font-bold text-accent tracking-wider select-all">
                    {kod}
                  </p>
                </div>
              )}

              {/* CTA — Preporuči nas */}
              {referralUrl && (
                <div className="space-y-3">
                  <Link
                    href={referralUrl}
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-accent hover:bg-accent-hover text-background font-semibold rounded-xl transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    {t.recommendUs}
                  </Link>
                  <p className="text-xs text-foreground-secondary text-center">{t.recommendHint}</p>
                </div>
              )}

              {/* Copy link kartice */}
              {cardUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(cardUrl, 'card')}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl text-foreground-secondary hover:text-foreground hover:border-accent/50 transition-colors text-sm"
                >
                  {copied === 'card' ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t.copyCardLink}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Navigacija */}
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <Link
              href={lang === 'en' ? '/en' : '/'}
              className="text-foreground-secondary hover:text-accent transition-colors"
            >
              {t.home}
            </Link>
            <span className="text-border">|</span>
            <Link
              href={lang === 'en' ? '/en/customer-center' : '/korisnicki-centar'}
              className="text-foreground-secondary hover:text-accent transition-colors"
            >
              {t.register}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-border text-center">
        <p className="text-foreground-secondary text-xs">{t.footer}</p>
      </footer>
    </div>
  )
}
