# Instrukcije za Deployment na Vercel

## ⚠️ VAŽNO: Pre Deploy-a

Morate izvršiti SQL migraciju na Supabase bazi!

## Korak 1: SQL Migracija (OBAVEZNO!)

1. Otvorite Supabase Dashboard: https://supabase.com/dashboard
2. Idite na projekat: `tuwiowidfkktqsospbpa`
3. Kliknite na **SQL Editor** (leva strana)
4. Kliknite **New Query**
5. Kopirajte i nalepite sledeći SQL kod:

```sql
-- Dodavanje polja naslov_ai i opis_ai u tabelu kampanja
ALTER TABLE public.kampanja 
ADD COLUMN IF NOT EXISTS naslov_ai text NULL,
ADD COLUMN IF NOT EXISTS opis_ai text NULL;

-- Dodaj komentare za dokumentaciju
COMMENT ON COLUMN public.kampanja.naslov_ai IS 'AI generisani naslov za web stranu (max 80 karaktera)';
COMMENT ON COLUMN public.kampanja.opis_ai IS 'AI generisani opis za web stranu (max 200 karaktera)';

-- Proveri da li su kolone uspešno dodate
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'kampanja' 
    AND column_name IN ('naslov_ai', 'opis_ai');
```

6. Kliknite **Run** (ili Ctrl+Enter)
7. Proverite da su kolone dodate (trebalo bi da vidite 2 reda u rezultatu)

## Korak 2: Git Commit i Push

Sada možete commit-ovati izmene:

```bash
# Dodaj sve izmenjene fajlove
git add .

# Kreiraj commit
git commit -m "feat: Dodati naslov_ai i opis_ai u kampanja modul

- Dodati nova polja naslov_ai i opis_ai u tabelu kampanja
- AI automatski generiše atraktivne naslove i opise
- Ažurirana forma za kampanju sa novim poljima
- Web strana koristi naslov i opis iz kampanje za SEO
- Dodati prioritet prikazivanja sa fallback sistemom
- Kreirana dokumentacija i SQL migracija"

# Push na GitHub
git push origin main
```

## Korak 3: Vercel Deployment

Vercel će **automatski** pokrenuti deployment kada push-ujete na GitHub.

### Praćenje Deployment-a

1. Otvorite Vercel Dashboard: https://vercel.com/dashboard
2. Kliknite na projekat `auditclaw`
3. Videćete novi deployment u toku
4. Pratite build log za eventualne greške

### Provera Environment Varijabli

Proverite da su sve environment varijable postavljene u Vercel:

1. Idite na projekat → Settings → Environment Variables
2. Proverite da postoje:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `WHAPI_TOKEN`
   - ⚠️ `GROQ_API_KEY` (ako koristite AI funkcionalnost)

## Korak 4: Testiranje na Produkciji

Nakon uspešnog deployment-a:

1. Otvorite production URL (npr. `auditclaw.vercel.app`)
2. Idite na Dashboard → Ponude
3. Kreirajte test kampanju
4. Kliknite "Analiziraj AI"
5. Proverite da su popunjena polja:
   - ✅ Naslov za web stranu (AI)
   - ✅ Opis za web stranu (AI)
6. Sačuvajte i aktivirajte kampanju
7. Otvorite javnu web stranu ponude
8. Proverite da se prikazuje novi naslov i opis

## 🆘 Troubleshooting

### Problem: Build greška na Vercel

**Greška:** `GROQ_API_KEY environment variable is missing`

**Rešenje:**
1. Idite na Vercel → Settings → Environment Variables
2. Dodajte `GROQ_API_KEY` sa vrednošću vašeg API ključa
3. Redeploy projekat

### Problem: SQL greška na Supabase

**Greška:** `column "naslov_ai" already exists`

**Rešenje:** Kolone su već dodate, možete nastaviti sa git commit-om

### Problem: Naslov/opis se ne prikazuje

**Rešenje:**
1. Proverite da je kampanja aktivna (`stsaktivan = true`)
2. Proverite da su polja popunjena u bazi
3. Očistite cache u browseru (Ctrl+Shift+R)

## ✅ Checklist

Pre nego što označite kao gotovo:

- [ ] SQL migracija izvršena na Supabase
- [ ] Git commit kreiran
- [ ] Push na GitHub uspešan
- [ ] Vercel deployment uspešan
- [ ] Environment varijable postavljene
- [ ] Testiranje na produkciji uspešno
- [ ] Dokumentacija pročitana
- [ ] Korisnici obučeni

## 📞 Podrška

Za dodatnu pomoć:
- Pogledajte `KAKO_KORISTITI_NASLOV_OPIS.md`
- Pogledajte `KAMPANJA_NASLOV_OPIS.md`
- Kontaktirajte development tim

---

**Verzija:** 1.0  
**Datum:** 17. Februar 2026  
**Status:** Spremno za Deployment ✅
