import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getKlijentByCode } from '@/lib/actions/klijenti'
import { DigitalnaKarticaView } from '@/components/landing/digitalna-kartica-view'
import { PublicHeader } from '@/components/landing/public-header'

interface PageProps {
  params: Promise<{ kod: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kod } = await params
  const { data } = await getKlijentByCode(kod)
  const name = data ? [data.ime, data.prezime].filter(Boolean).join(' ') : 'Klijent'

  return {
    title: `Digitalna Kartica — ${name} | AuditClaw`,
    description: 'Digitalna kartica AuditClaw klijenta.',
    robots: { index: false, follow: false },
  }
}

export default async function DigitalnaKarticaPage({ params }: PageProps) {
  const { kod } = await params
  const { data: klijent, error } = await getKlijentByCode(kod)

  if (error || !klijent || !klijent.preporukacode) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader
        lang="sr"
        currentPage="customer-center"
        langSwitchUrls={{
          sr: `/digitalna-kartica/${kod}`,
          en: `/en/digital-card/${kod}`,
        }}
      />
      <DigitalnaKarticaView klijent={klijent} lang="sr" />
    </div>
  )
}
