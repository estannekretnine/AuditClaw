export interface Korisnik {
  id: number
  naziv: string
  email: string
  password: string
  brojmob: string | null
  adresa: string | null
  stsstatus: 'admin' | 'agent' | 'user'
  stsaktivan: 'da' | 'ne'
  datumk: string | null
  datumpt: string | null
}

export interface KorisnikInsert {
  naziv: string
  email: string
  password: string
  brojmob?: string | null
  adresa?: string | null
  stsstatus?: 'admin' | 'agent' | 'user'
  stsaktivan?: 'da' | 'ne'
}

export interface KorisnikUpdate {
  naziv?: string
  email?: string
  password?: string
  brojmob?: string | null
  adresa?: string | null
  stsstatus?: 'admin' | 'agent' | 'user'
  stsaktivan?: 'da' | 'ne'
}
