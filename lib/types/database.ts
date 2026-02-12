export interface Korisnik {
  id: number
  naziv: string
  email: string | null
  password: string | null
  brojmob: string | null
  adresa: string | null
  stsstatus: 'kupac' | 'prodavac' | 'agent' | 'admin' | 'manager' | null
  stsaktivan: 'da' | 'ne' | null
  datumk: string | null
  datump: string | null
  datumpt: string | null
}

export interface KorisnikInsert {
  naziv: string
  email?: string | null
  password?: string | null
  brojmob?: string | null
  adresa?: string | null
  stsstatus?: 'kupac' | 'prodavac' | 'agent' | 'admin' | 'manager' | null
  stsaktivan?: 'da' | 'ne' | null
}

export interface KorisnikUpdate {
  naziv?: string
  email?: string | null
  password?: string | null
  brojmob?: string | null
  adresa?: string | null
  stsstatus?: 'kupac' | 'prodavac' | 'agent' | 'admin' | 'manager' | null
  stsaktivan?: 'da' | 'ne' | null
  datumpt?: string | null
}
