# AuditClaw - Admin Panel

Moderni admin panel izgrađen sa Next.js 15, TypeScript, Tailwind CSS i Supabase.

## Tehnologije

- **Next.js 15** - App Router
- **TypeScript** - Strogo tipiziran kod
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (PostgreSQL)
- **Lucide React** - Ikonice

## Instalacija

1. Klonirajte repozitorijum:
```bash
git clone <repo-url>
cd AuditClaw
```

2. Instalirajte zavisnosti:
```bash
npm install
```

3. Konfigurišite environment varijable:
```bash
# Kopirajte .env.local i popunite vrednosti
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Kreirajte tabele u Supabase:
   - Otvorite Supabase Dashboard
   - Idite na SQL Editor
   - Pokrenite SQL iz `supabase/schema.sql`

5. Pokrenite development server:
```bash
npm run dev
```

6. Otvorite [http://localhost:3000](http://localhost:3000)

## Struktura projekta

```
AuditClaw/
├── app/
│   ├── (auth)/
│   │   └── login/          # Login stranica
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Dashboard layout
│   │   ├── page.tsx        # Welcome stranica
│   │   └── korisnici/      # Modul za korisnike
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Globalni stilovi
├── components/
│   └── sidebar.tsx         # Sidebar navigacija
├── lib/
│   ├── supabase/           # Supabase konfiguracija
│   ├── actions/            # Server Actions
│   └── types/              # TypeScript tipovi
├── supabase/
│   └── schema.sql          # SQL šema za bazu
└── middleware.ts           # Auth middleware
```

## Funkcionalnosti

### Autentifikacija
- Login sa email/password
- Zaštita ruta middleware-om
- Cookie-based sesije

### Admin Korisnici modul
- Pregled svih korisnika
- Dodavanje novih korisnika
- Izmena postojećih korisnika
- Brisanje korisnika
- Toggle aktivnog statusa
- Sortiranje i filtriranje
- Responsive dizajn (desktop + mobile)

## Default Admin Kredencijali

```
Email: admin@auditclaw.com
Password: admin123
```

**VAŽNO:** Promenite ove kredencijale u produkciji!

## Deployment na Vercel

### Brzi pregled

1. Push-ujte kod na GitHub
2. Povežite repozitorijum sa Vercel-om
3. Dodajte environment varijable u Vercel Dashboard
4. Deploy!

### Produkcija

Aplikacija je dostupna na: **https://auditclaw.io**

### Detaljno uputstvo

Za kompletno uputstvo za deployment, pogledajte [DEPLOYMENT.md](DEPLOYMENT.md).

### Environment varijable za Vercel

Dodajte sledeće varijable u Vercel Dashboard → Settings → Environment Variables:

| Varijabla | Opis |
|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL vašeg Supabase projekta |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

### DNS Podešavanja

Za custom domen `auditclaw.io`:

| Tip | Ime | Vrednost |
|-----|-----|----------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

## Licenca

MIT
