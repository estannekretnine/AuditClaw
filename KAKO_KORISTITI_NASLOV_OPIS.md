# Kako Koristiti Naslov i Opis za Web Stranu

## Brzi Vodič

### Korak 1: Primeni SQL Migraciju

Prvo morate dodati nova polja u bazu podataka:

```bash
# Povežite se na Supabase bazu i izvršite SQL skriptu
# Fajl: migrations/add_kampanja_naslov_opis.sql
```

Ili ručno u Supabase SQL Editor-u:

```sql
ALTER TABLE public.kampanja 
ADD COLUMN IF NOT EXISTS naslov_ai text NULL,
ADD COLUMN IF NOT EXISTS opis_ai text NULL;
```

### Korak 2: Kreirajte ili Ažurirajte Kampanju

1. Idite na **Dashboard → Ponude**
2. Kliknite na **⋮** (tri tačke) pored ponude
3. Izaberite **Kampanja**
4. Kliknite **Dodaj** (ako nema kampanje) ili **Izmeni** (ako postoji)

### Korak 3: Generiši AI Sadržaj

1. U formi za kampanju, kliknite dugme **"Analiziraj AI"** (zeleno dugme sa Sparkles ikonom)
2. AI će automatski popuniti sva polja, uključujući:
   - **Naslov za web stranu (AI)** - Atraktivan naslov
   - **Opis za web stranu (AI)** - Kratak opis nekretnine

### Korak 4: Pregledajte i Prilagodite (Opciono)

Možete ručno izmeniti generisani sadržaj:

- **Naslov** - Maksimalno 80 karaktera
  - Primer: "Luksuzni stan na Vračaru - 120m² sa garažom"
  
- **Opis** - Maksimalno 200 karaktera
  - Primer: "Renoviran trosoban stan u mirnoj ulici, blizina parka i škole. Centralno grejanje, lift, parking. Idealno za porodicu."

### Korak 5: Sačuvajte i Aktivirajte

1. Kliknite **"Sačuvaj"**
2. Proverite da je kampanja **Aktivna** (checkbox "Kampanja je aktivna")
3. Zatvorite modal

### Korak 6: Proverite Web Stranu

1. Idite na **Dashboard → Ponude**
2. Kliknite na **⋮** → **WebStrana-Kupac**
3. Kliknite **"Otvori"** da vidite javnu stranu
4. Proverite da li se prikazuje novi naslov i opis

## Gde se Prikazuje?

### 1. Hero Sekcija (Vrh Strane)
- **Naslov** se prikazuje kao veliki naslov na vrhu strane
- Prioritet: Custom naslov > AI naslov > Naslov oglasa

### 2. Meta Tagovi (SEO)
- **Naslov** se koristi u `<title>` tagu
- **Opis** se koristi u `<meta name="description">` tagu
- Poboljšava SEO i klik-through rate u Google rezultatima

### 3. Sekcija "AuditClaw Analysis"
- **Opis** se prikazuje kao poseban "AI Opis" sa amber pozadinom
- Ističe ključne karakteristike nekretnine

## Saveti za Najbolje Rezultate

✅ **Koristite AI generisanje** - AI je obučen da kreira atraktivne naslove i opise  
✅ **Budite specifični** - Uključite lokaciju, tip nekretnine i ključne prednosti  
✅ **Kratko i jasno** - Držite se preporučenih dužina (80/200 karaktera)  
✅ **Aktivirajte kampanju** - Samo aktivne kampanje se prikazuju na web strani  
✅ **Jedna aktivna kampanja** - Ako ima više, koristi se najnovija  

## Primeri Dobrih Naslova

✅ "Luksuzni stan na Vračaru - 120m² sa garažom i pogledom"  
✅ "Moderan trosoban stan u Novom Beogradu - Blok 21"  
✅ "Renovirana kuća u Zemunu - 200m² sa dvorištem"  
✅ "Poslovni prostor u centru Beograda - 80m² sa parkingom"  

## Primeri Dobrih Opisa

✅ "Renoviran trosoban stan u mirnoj ulici, blizina parka i škole. Centralno grejanje, lift, parking. Idealno za porodicu ili investiciju."

✅ "Moderan dvosoban stan sa garažom i terasom. Kompletno opremljen, useljiv odmah. Odlična lokacija sa svim sadržajima u blizini."

✅ "Prostrana kuća sa dvorištem i garažom. Novija gradnja, kvalitetni materijali. Mirna ulica, blizina autoputa i centra grada."

## Česta Pitanja

**P: Šta ako ne želim da koristim AI naslov/opis?**  
O: Jednostavno ostavite polja prazna ili obrišite sadržaj. Sistem će koristiti postojeće vrednosti iz ponude.

**P: Mogu li imati više kampanja za jednu ponudu?**  
O: Da, ali samo jedna može biti aktivna. Aktivna kampanja se prikazuje na web strani.

**P: Kako da promenim naslov bez menjanja cele kampanje?**  
O: Otvorite kampanju, izmenite samo polje "Naslov za web stranu (AI)" i sačuvajte.

**P: Da li se naslov i opis prevode na druge jezike?**  
O: Trenutno se generišu na srpskom. Za druge jezike, koristite postojeći sistem prevođenja.

**P: Šta ako AI generiše loš sadržaj?**  
O: Uvek možete ručno izmeniti generisani sadržaj pre čuvanja.
