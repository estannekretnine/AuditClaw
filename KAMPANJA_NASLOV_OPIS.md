# Implementacija Naslova i Opisa za Web Stranu Kampanje

## Pregled

Implementirana su dva nova polja u tabelu `kampanja`:
- `naslov_ai` - Naslov za web stranu (max 80 karaktera)
- `opis_ai` - Opis za web stranu (max 200 karaktera)

Ova polja se automatski generišu pomoću AI analize i koriste se za prikazivanje atraktivnog sadržaja na javnoj web strani ponude.

## Izmene u Bazi Podataka

Tabela `kampanja` je proširena sa dva nova polja:

```sql
ALTER TABLE public.kampanja 
ADD COLUMN naslov_ai text NULL,
ADD COLUMN opis_ai text NULL;
```

## Implementirane Izmene

### 1. TypeScript Tipovi (`lib/types/kampanja.ts`)

Dodati novi atributi u interfejse:
- `Kampanja` - dodato `naslov_ai` i `opis_ai`
- `KampanjaInsert` - dodato `naslov_ai` i `opis_ai`

### 2. Server Akcije (`lib/actions/kampanje.ts`)

Ažurirane funkcije za kreiranje i ažuriranje kampanja:
- `createKampanja()` - sada čuva `naslov_ai` i `opis_ai`
- `updateKampanja()` - sada ažurira `naslov_ai` i `opis_ai`
- Zod schema validacija ažurirana za nova polja

### 3. AI Analiza (`app/api/ai/analyze-kampanja/route.ts`)

AI prompt je proširen da generiše:
- **naslov_ai**: Atraktivan naslov za web stranu (max 80 karaktera) na srpskom jeziku
  - Fokus na lokaciju, tip nekretnine i ključne prednosti
  - Primer: "Luksuzni stan na Vračaru - 120m² sa garažom i pogledom"

- **opis_ai**: Kratak opis za web stranu (max 200 karaktera) na srpskom jeziku
  - Ističe ključne karakteristike i prednosti nekretnine
  - Primer: "Renoviran trosoban stan u mirnoj ulici, blizina parka i škole. Centralno grejanje, lift, parking. Idealno za porodicu ili investiciju."

### 4. Forma za Kampanju (`components/kampanja-form.tsx`)

Dodati novi input polja u formu:
- **Naslov za web stranu (AI)** - text input sa placeholder-om i objašnjenjem
- **Opis za web stranu (AI)** - textarea sa placeholder-om i objašnjenjem
- Polja su stilizovana sa amber/orange gradijentom da se istaknu
- Automatski se popunjavaju kada se pokrene AI analiza

### 5. Web Strana Ponude (`app/p/[id]/page.tsx`)

Ažurirana funkcija `getPonudaWithPhotos()`:
- Dohvata aktivnu kampanju za ponudu
- Kampanja se prosleđuje u `PropertyView` komponentu

Ažurirana `generateMetadata()`:
- Koristi `naslov_ai` iz kampanje ako postoji (prioritet)
- Koristi `opis_ai` iz kampanje za meta description (prioritet)
- Fallback na postojeće vrednosti iz ponude

### 6. Prikaz Nekretnine (`app/p/[id]/property-view.tsx`)

Ažuriran prikaz:
- Hero sekcija koristi `naslov_ai` iz kampanje ako postoji
- Sekcija "AuditClaw Analysis" prikazuje `opis_ai` iz kampanje kao poseban AI Opis
- AI Opis je stilizovan sa amber gradijentom i Sparkles ikonom
- Fallback na postojeći opis iz ponude

## Tok Rada

1. **Admin kreira kampanju** za ponudu
2. **Klikne "Analiziraj AI"** - AI generiše sve podatke uključujući `naslov_ai` i `opis_ai`
3. **Admin pregleda i može ručno izmeniti** generisane naslove i opise
4. **Sačuva kampanju** - podaci se čuvaju u bazu
5. **Aktivira kampanju** - postavlja `stsaktivan = true`
6. **Web strana automatski koristi** naslov i opis iz aktivne kampanje

## Prioritet Prikazivanja

### Naslov (Hero sekcija):
1. `config.heroTitle` (custom naslov iz WebStrana konfiguracije)
2. `kampanja.naslov_ai` (AI generisani naslov)
3. `ponuda.naslovoglasa` (ručno uneti naslov)
4. Automatski generisani naslov iz vrste objekta i lokacije

### Opis (Meta tags i sekcija):
1. `kampanja.opis_ai` (AI generisani opis)
2. `ponuda.opis_ag` (ručno uneti opis)
3. Automatski generisani opis iz osnovnih podataka

## Prednosti

✅ **SEO optimizacija** - Atraktivni naslovi i opisi poboljšavaju klik-through rate  
✅ **Konzistentnost** - AI generiše profesionalne opise u istom stilu  
✅ **Brzina** - Automatsko generisanje štedi vreme  
✅ **Fleksibilnost** - Mogućnost ručnog prilagođavanja  
✅ **Višejezičnost** - Opis se može prevesti kroz postojeći sistem prevođenja  

## Testiranje

Za testiranje implementacije:

1. Kreirajte novu kampanju za ponudu
2. Kliknite "Analiziraj AI"
3. Proverite da li su `naslov_ai` i `opis_ai` popunjeni
4. Sačuvajte kampanju i aktivirajte je
5. Otvorite javnu web stranu ponude (`/p/{id}`)
6. Proverite da li se prikazuje naslov i opis iz kampanje

## Napomene

- Polja su opciona (`NULL` vrednosti su dozvoljene)
- AI generiše sadržaj na srpskom jeziku
- Maksimalne dužine su preporuke, ne ograničenja u bazi
- Samo aktivna kampanja (`stsaktivan = true`) se koristi na web strani
- Ako ima više aktivnih kampanja, koristi se najnovija
