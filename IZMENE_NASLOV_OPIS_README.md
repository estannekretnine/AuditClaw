# Brzi Pregled - Naslov i Opis za Web Stranu

## 🎯 Šta je Novo?

Dodati su **naslov** i **opis** koji se automatski generišu pomoću AI i prikazuju na javnoj web strani ponuda.

## 📦 Šta Treba Da Uradite?

### 1. Izvršite SQL Migraciju (5 min)

```sql
ALTER TABLE public.kampanja 
ADD COLUMN IF NOT EXISTS naslov_ai text NULL,
ADD COLUMN IF NOT EXISTS opis_ai text NULL;
```

**Gde:** Supabase SQL Editor ili PostgreSQL klijent  
**Fajl:** `migrations/add_kampanja_naslov_opis.sql`

### 2. Testirajte Funkcionalnost (10 min)

1. Otvorite Dashboard → Ponude
2. Kliknite na ⋮ → Kampanja
3. Dodajte novu kampanju
4. Kliknite "Analiziraj AI"
5. Proverite da su popunjena polja:
   - ✅ Naslov za web stranu (AI)
   - ✅ Opis za web stranu (AI)
6. Sačuvajte i aktivirajte kampanju
7. Otvorite javnu web stranu ponude (`/p/{id}`)
8. Proverite da se prikazuje novi naslov i opis

### 3. Obučite Korisnike (15 min)

Pokažite korisnicima kako da:
- Koriste "Analiziraj AI" dugme
- Pregledaju i izmene generisani sadržaj
- Aktiviraju kampanju

## 📚 Dokumentacija

| Dokument | Opis | Za Koga |
|----------|------|---------|
| `KAKO_KORISTITI_NASLOV_OPIS.md` | Korisnički vodič | Admini, Agenti |
| `KAMPANJA_NASLOV_OPIS.md` | Tehnička dokumentacija | Developeri |
| `IMPLEMENTACIJA_PREGLED.md` | Sveobuhvatan pregled | Svi |
| `FINALNI_PREGLED_IZMENA.md` | Detaljan pregled izmena | Developeri |

## 🔧 Tehnički Detalji

### Izmenjeni Fajlovi
- `lib/types/kampanja.ts` - Tipovi
- `lib/actions/kampanje.ts` - Server akcije
- `app/api/ai/analyze-kampanja/route.ts` - AI API
- `components/kampanja-form.tsx` - Forma
- `app/p/[id]/page.tsx` - Metadata
- `app/p/[id]/property-view.tsx` - Prikaz

### Nova Polja
- `naslov_ai` - text, nullable
- `opis_ai` - text, nullable

## ✅ Checklist

- [ ] SQL migracija izvršena
- [ ] Testiranje na staging-u
- [ ] Testiranje na produkciji
- [ ] Obuka korisnika
- [ ] Dokumentacija pročitana

## 🆘 Pomoć

**Problem:** AI ne generiše naslov/opis  
**Rešenje:** Proverite da li je `GROQ_API_KEY` postavljen

**Problem:** Naslov/opis se ne prikazuje na web strani  
**Rešenje:** Proverite da li je kampanja aktivna (`stsaktivan = true`)

**Problem:** Greška pri čuvanju kampanje  
**Rešenje:** Proverite da li je SQL migracija izvršena

## 📞 Kontakt

Za dodatnu pomoć, pogledajte detaljnu dokumentaciju ili kontaktirajte development tim.

---

**Verzija:** 1.0  
**Datum:** 17. Februar 2026  
**Status:** Spremno ✅
