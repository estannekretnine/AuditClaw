import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropertyView from './property-view'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getPonudaWithPhotos(id: number) {
  const supabase = await createClient()
  
  // Dohvati ponudu
  const { data: ponuda, error: ponudaError } = await supabase
    .from('ponuda')
    .select('*')
    .eq('id', id)
    .single()

  if (ponudaError || !ponuda) {
    return { ponuda: null, photos: [], kampanja: null }
  }

  // Dohvati fotografije
  const { data: photos } = await supabase
    .from('ponudafoto')
    .select('*')
    .eq('idponude', id)
    .order('redosled', { ascending: true })

  // Dohvati kampanju na osnovu webstrana konfiguracije
  let kampanja = null
  if (ponuda.webstrana) {
    try {
      const webStranaData = JSON.parse(ponuda.webstrana)
      if (webStranaData.kampanjaId) {
        // Dohvati specifičnu kampanju iz konfiguracije
        const { data: selectedKampanja } = await supabase
          .from('kampanja')
          .select('*')
          .eq('id', webStranaData.kampanjaId)
          .single()
        kampanja = selectedKampanja
      }
    } catch (err) {
      console.error('Error parsing webstrana config:', err)
    }
  }
  
  // Fallback: ako nema izabrane kampanje, dohvati prvu aktivnu
  if (!kampanja) {
    const { data: aktivnaKampanja } = await supabase
      .from('kampanja')
      .select('*')
      .eq('ponudaid', id)
      .eq('stsaktivan', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    kampanja = aktivnaKampanja
  }

  return { ponuda, photos: photos || [], kampanja: kampanja || null }
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params
  const ponudaId = parseInt(id, 10)

  if (isNaN(ponudaId)) {
    notFound()
  }

  const { ponuda, photos, kampanja } = await getPonudaWithPhotos(ponudaId)

  if (!ponuda) {
    notFound()
  }

  return <PropertyView ponuda={ponuda} photos={photos} kampanja={kampanja} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const ponudaId = parseInt(id, 10)

  if (isNaN(ponudaId)) {
    return { title: 'Nekretnina nije pronađena' }
  }

  const { ponuda, kampanja } = await getPonudaWithPhotos(ponudaId)

  if (!ponuda) {
    return { title: 'Nekretnina nije pronađena' }
  }

  // Koristi naslov i opis iz kampanje ako postoje
  const title = kampanja?.naslov_ai || ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`
  const description = kampanja?.opis_ai || `${ponuda.kvadratura_ag}m² | ${ponuda.struktura_ag} soba | ${ponuda.cena_ag?.toLocaleString('sr-RS')}€ | ${ponuda.lokacija_ag}, ${ponuda.opstina_ag}`

  return {
    title: `${title} | AuditClaw`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}
