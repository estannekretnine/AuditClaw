export interface GeoStat {
  naziv: string
  broj: number
}

export interface KupciGeoTotali {
  drzave: GeoStat[]
  gradovi: GeoStat[]
  ukupnoDrzava: number
  ukupnoGradova: number
}

export interface KontaktZaGeo {
  poziviDrzava: string | null
  poziviRegija: string | null
}

export function izracunajGeoTotale(kontakti: KontaktZaGeo[]): KupciGeoTotali {
  const drzaveMap: Record<string, number> = {}
  const gradoviMap: Record<string, number> = {}
  
  for (const k of kontakti) {
    const drzava = k.poziviDrzava?.trim()
    const grad = k.poziviRegija?.trim()
    
    if (drzava) {
      drzaveMap[drzava] = (drzaveMap[drzava] || 0) + 1
    }
    if (grad) {
      gradoviMap[grad] = (gradoviMap[grad] || 0) + 1
    }
  }
  
  const drzave: GeoStat[] = Object.entries(drzaveMap)
    .map(([naziv, broj]) => ({ naziv, broj }))
    .sort((a, b) => b.broj - a.broj)
  
  const gradovi: GeoStat[] = Object.entries(gradoviMap)
    .map(([naziv, broj]) => ({ naziv, broj }))
    .sort((a, b) => b.broj - a.broj)
  
  return {
    drzave,
    gradovi,
    ukupnoDrzava: drzave.length,
    ukupnoGradova: gradovi.length
  }
}
