# AuditClaw - Deployment Guide

Ovaj dokument sadrži korak-po-korak uputstva za deployment AuditClaw aplikacije na Vercel sa custom domenom `auditclaw.io`.

## Preduslovi

- GitHub nalog sa pristupom repozitorijumu `estannekretnine/AuditClaw`
- Vercel nalog (besplatan ili plaćeni)
- Pristup DNS podešavanjima za domen `auditclaw.io`
- Supabase projekat sa konfigurisanom bazom podataka

## Korak 1: Povezivanje GitHub repozitorijuma sa Vercelom

1. Idite na [Vercel Dashboard](https://vercel.com/dashboard)
2. Kliknite na **"Add New..."** → **"Project"**
3. Izaberite **"Import Git Repository"**
4. Ako niste povezali GitHub nalog, kliknite na **"Connect GitHub"**
5. Pronađite i izaberite repozitorijum `estannekretnine/AuditClaw`
6. Kliknite **"Import"**

## Korak 2: Konfiguracija projekta na Vercelu

### Build Settings

Vercel će automatski detektovati Next.js framework. Proverite da su postavke:

| Postavka | Vrednost |
|----------|----------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### Environment Variables

**VAŽNO:** Morate dodati environment varijable pre prvog deploy-a!

1. U sekciji **"Environment Variables"** dodajte:

| Ime varijable | Vrednost | Environment |
|---------------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tuwiowidfkktqsospbpa.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[vaš Supabase anon key]` | Production, Preview, Development |

2. Kliknite **"Deploy"**

## Korak 3: Dodavanje custom domena

### Dodavanje domena u Vercel

1. Nakon uspešnog deploy-a, idite na **Settings** → **Domains**
2. U polje unesite `auditclaw.io` i kliknite **"Add"**
3. Ponovite za `www.auditclaw.io`

### DNS Konfiguracija

Idite na vašeg DNS provajdera (gde ste kupili domen) i dodajte sledeće zapise:

#### Za root domen (auditclaw.io)

| Tip | Ime | Vrednost | TTL |
|-----|-----|----------|-----|
| A | @ | `76.76.21.21` | 3600 |

#### Za www subdomen (www.auditclaw.io)

| Tip | Ime | Vrednost | TTL |
|-----|-----|----------|-----|
| CNAME | www | `cname.vercel-dns.com` | 3600 |

### Verifikacija DNS-a

1. Nakon dodavanja DNS zapisa, sačekajte 5-30 minuta za propagaciju
2. U Vercel Dashboard-u proverite status domena
3. Trebalo bi da vidite zelenu kvačicu pored oba domena

## Korak 4: SSL Sertifikat

Vercel automatski generiše i obnavlja SSL sertifikat za vaš domen. Ne morate ništa dodatno da radite.

## Korak 5: Testiranje

### Provera deployment-a

1. Otvorite https://auditclaw.io u browseru
2. Proverite da li se stranica učitava ispravno
3. Testirajte login funkcionalnost:
   - Email: `admin@auditclaw.com`
   - Password: `admin123`

### Provera redirekcije

1. Otvorite https://www.auditclaw.io
2. Trebalo bi da vas automatski preusmeri na https://auditclaw.io

### Provera HTTPS-a

1. Proverite da li je zeleni lokot vidljiv u browser-u
2. Otvorite http://auditclaw.io - trebalo bi da vas preusmeri na HTTPS

## Troubleshooting

### Problem: "Domain not configured"

- Proverite da li su DNS zapisi ispravno podešeni
- Sačekajte do 48 sati za potpunu DNS propagaciju
- Koristite [DNS Checker](https://dnschecker.org/) za proveru propagacije

### Problem: Build fails

1. Proverite Vercel build logs
2. Najčešći uzroci:
   - Nedostaju environment varijable
   - TypeScript greške
   - Nedostaju zavisnosti

### Problem: 500 Internal Server Error

1. Proverite Vercel Function logs
2. Najčešći uzroci:
   - Pogrešne Supabase kredencijale
   - Supabase tabele nisu kreirane

### Problem: Login ne radi

1. Proverite da li su environment varijable ispravno postavljene
2. Proverite Supabase Dashboard → Authentication → Users
3. Proverite da li postoji admin korisnik u bazi

## Automatski Deployments

Vercel automatski deploy-uje:

- **Production**: Svaki push na `main` branch
- **Preview**: Svaki push na druge branch-eve i Pull Request-ove

## Korisni linkovi

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Dokumentacija](https://vercel.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [DNS Checker](https://dnschecker.org/)

## Sigurnosne napomene

1. **Promenite default admin kredencijale** nakon prvog login-a
2. **Nikada ne commit-ujte** `.env.local` fajl u Git
3. **Koristite Vercel Environment Variables** za sve osetljive podatke
4. **Omogućite 2FA** na Vercel i GitHub nalozima
