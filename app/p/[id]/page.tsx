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
    return { ponuda: null, photos: [] }
  }

  // Dohvati fotografije
  const { data: photos } = await supabase
    .from('ponudafoto')
    .select('*')
    .eq('idponude', id)
    .order('redosled', { ascending: true })

  return { ponuda, photos: photos || [] }
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params
  const ponudaId = parseInt(id, 10)

  if (isNaN(ponudaId)) {
    notFound()
  }

  const { ponuda, photos } = await getPonudaWithPhotos(ponudaId)

  if (!ponuda) {
    notFound()
  }

  return <PropertyView ponuda={ponuda} photos={photos} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const ponudaId = parseInt(id, 10)

  if (isNaN(ponudaId)) {
    return { title: 'Nekretnina nije pronađena' }
  }

  const { ponuda } = await getPonudaWithPhotos(ponudaId)

  if (!ponuda) {
    return { title: 'Nekretnina nije pronađena' }
  }

  const title = ponuda.naslovoglasa || `${ponuda.vrstaobjekta_ag} - ${ponuda.lokacija_ag}`
  const description = `${ponuda.kvadratura_ag}m² | ${ponuda.struktura_ag} soba | ${ponuda.cena_ag?.toLocaleString('sr-RS')}€ | ${ponuda.lokacija_ag}, ${ponuda.opstina_ag}`

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
