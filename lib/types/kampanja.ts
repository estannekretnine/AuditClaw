// Tipovi za Kampanja modul

export interface Kampanja {
  id: number
  created_at: string
  analizaoglasa_ai: string | null
  ciljnagrupa_ai: string | null
  zakljucak_ai: string | null
  budzet: number | null
  kodkampanje: string | null
  predlogkampanje_ai: string | null
  stsaktivan: boolean | null
  ciljaniregion_ai: string | null
  kljucnereci_ai: string | null
  psiholoskiprofil_ai: string | null
  ponudaid: number | null
  zakljucak_ag: string | null
  tekst_linkedin: string | null
  tekst_email_naslov: string | null
  tekst_email_telo: string | null
  tekst_whatsapp: string | null
  naslov_ai: string | null
  opis_ai: string | null
}

export interface KampanjaInsert {
  analizaoglasa_ai?: string | null
  ciljnagrupa_ai?: string | null
  zakljucak_ai?: string | null
  budzet?: number | null
  kodkampanje?: string | null
  predlogkampanje_ai?: string | null
  stsaktivan?: boolean | null
  ciljaniregion_ai?: string | null
  kljucnereci_ai?: string | null
  psiholoskiprofil_ai?: string | null
  ponudaid?: number | null
  zakljucak_ag?: string | null
  tekst_linkedin?: string | null
  tekst_email_naslov?: string | null
  tekst_email_telo?: string | null
  tekst_whatsapp?: string | null
  naslov_ai?: string | null
  opis_ai?: string | null
}

export interface KampanjaUpdate extends KampanjaInsert {
  id?: number
}
