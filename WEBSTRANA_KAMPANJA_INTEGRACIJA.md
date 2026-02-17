# WebStrana - Kampanja Integracija

## 📋 Pregled

Implementirana je integracija selekcije kampanje u WebStrana modal, omogućavajući korisnicima da izaberu koja kampanja će se koristiti za naslov i opis na javnoj web strani ponude.

---

## ✨ Nova Funkcionalnost

### 1. Novi Tab "Kampanja" u WebStrana Modal

**Lokacija:** Dashboard → Ponude → ⋮ → WebStrana-Kupac → Tab "Kampanja"

**Funkcionalnost:**
- Prikazuje sve kampanje za izabranu ponudu
- Omogućava izbor specifične kampanje
- Prikazuje naslov i opis iz svake kampanje
- Označava aktivne/neaktivne kampanje
- Automatski bira prvu aktivnu kampanju

---

## 🎯 Kako Funkcioniše?

### Tok Rada

```
1. Korisnik otvara WebStrana modal
   ↓
2. Automatski se učitavaju sve kampanje za ponudu
   ↓
3. Ako postoji prethodno izabrana kampanja → prikaži je
   Ako ne → automatski izaberi prvu aktivnu kampanju
   ↓
4. Korisnik može da izabere drugu kampanju
   ↓
5. Klikne "Sačuvaj i aktiviraj"
   ↓
6. kampanjaId se čuva u webstrana konfiguraciji
   ↓
7. Web strana koristi naslov i opis iz izabrane kampanje
```

---

## 🖥️ Korisnički Interfejs

### Tab "Kampanja"

**Prikazuje:**
- Lista svih kampanja za ponudu
- Za svaku kampanju:
  - ✅ Kampanja ID
  - ✅ Status (Aktivna/Neaktivna)
  - ✅ Naslov (naslov_ai) sa Sparkles ikonom
  - ✅ Opis (opis_ai) sa Sparkles ikonom
  - ✅ Datum kreiranja
  - ✅ Radio button za izbor

**Vizuelni Indikatori:**
- Izabrana kampanja: Violet border + background
- Aktivna kampanja: Zeleni badge
- Neaktivna kampanja: Sivi badge
- Sparkles ikona: Označava AI generisani sadržaj

**Ako nema kampanja:**
```
┌─────────────────────────────────────────┐
│  📢 Nema kampanja za ovu ponudu         │
│                                          │
│  Kreirajte kampanju da biste mogli da   │
│  koristite AI generisani naslov i opis  │
└─────────────────────────────────────────┘
```

---

## 💾 Struktura Podataka

### webstrana JSON Format

**Stari format:**
```json
{
  "link": "https://www.auditclaw.io/p/123",
  "config": {
    "showPrice": true,
    "theme": "dark",
    ...
  }
}
```

**Novi format:**
```json
{
  "link": "https://www.auditclaw.io/p/123",
  "kampanjaId": 456,
  "config": {
    "showPrice": true,
    "theme": "dark",
    ...
  }
}
```

**Novo polje:**
- `kampanjaId` (number | null) - ID izabrane kampanje

---

## 🔄 Prioritet Prikazivanja

### Naslov na Web Strani

```
1. config.heroTitle (Custom naslov iz WebStrana konfiguracije)
   ↓
2. selectedKampanja.naslov_ai (AI naslov iz IZABRANE kampanje)
   ↓
3. ponuda.naslovoglasa (Ručno uneti naslov)
   ↓
4. Auto-generisani (Vrsta objekta + Lokacija)
```

### Opis na Web Strani

```
1. selectedKampanja.opis_ai (AI opis iz IZABRANE kampanje)
   ↓
2. ponuda.opis_ag (Ručno uneti opis)
   ↓
3. Auto-generisani (Osnovni podaci)
```

---

## 🎨 Preview Funkcionalnost

### Preview Panel

**Prikazuje:**
- Naslov iz izabrane kampanje
- Indikator: "Koristi se Kampanja #456"
- Real-time preview svih izmena

**Primer:**
```
┌─────────────────────────────────────────┐
│ ✨ Koristi se Kampanja #456             │
│ Gundulićev Venac Dupleks - 104m²...    │
└─────────────────────────────────────────┘
```

---

## 📝 Kako Koristiti?

### Korak 1: Kreirajte Kampanju

1. Dashboard → Ponude → ⋮ → Kampanja
2. Dodaj novu kampanju
3. Kliknite "Analiziraj AI"
4. AI će generisati naslov_ai i opis_ai
5. Sačuvajte i aktivirajte kampanju

### Korak 2: Izaberite Kampanju za Web Stranu

1. Dashboard → Ponude → ⋮ → WebStrana-Kupac
2. Kliknite na tab **"Kampanja"**
3. Videćete listu svih kampanja
4. Kliknite na kampanju koju želite da koristite
5. Pregledajte naslov i opis u preview-u
6. Kliknite **"Sačuvaj i aktiviraj"**

### Korak 3: Proverite Web Stranu

1. Otvorite javnu web stranu ponude (`/p/{id}`)
2. Proverite da se prikazuje naslov iz izabrane kampanje
3. Proverite da se prikazuje opis iz izabrane kampanje

---

## 🔧 Tehnički Detalji

### Backend - Dohvatanje Kampanje

**Fajl:** `app/p/[id]/page.tsx`

**Logika:**
```typescript
1. Dohvati ponudu
2. Parsiraj webstrana JSON
3. Ako postoji kampanjaId → dohvati tu kampanju
4. Ako ne → dohvati prvu aktivnu kampanju (fallback)
5. Prosleđi kampanju u PropertyView komponentu
```

### Frontend - WebStrana Modal

**Fajl:** `components/webstrana-modal.tsx`

**Funkcionalnost:**
- `loadKampanje()` - Dohvata sve kampanje za ponudu
- `selectedKampanjaId` - State za izabranu kampanju
- `handleSave()` - Čuva kampanjaId u webstrana JSON
- Automatska selekcija prve aktivne kampanje

---

## 🎯 Primeri Korišćenja

### Scenario 1: Nova Web Strana

```
1. Korisnik kreira kampanju sa AI analizom
2. Otvara WebStrana modal
3. Tab "Kampanja" automatski bira aktivnu kampanju
4. Korisnik vidi preview sa naslovom iz kampanje
5. Klikne "Sačuvaj i aktiviraj"
6. Web strana koristi naslov i opis iz kampanje
```

### Scenario 2: Promena Kampanje

```
1. Web strana već postoji sa Kampanjom #1
2. Korisnik kreira novu Kampanju #2 sa boljim naslovom
3. Otvara WebStrana modal → Tab "Kampanja"
4. Bira Kampanju #2
5. Preview se ažurira sa novim naslovom
6. Klikne "Sačuvaj izmene"
7. Web strana sada koristi Kampanju #2
```

### Scenario 3: Bez Kampanje

```
1. Ponuda nema kampanje
2. Otvara WebStrana modal → Tab "Kampanja"
3. Vidi poruku: "Nema kampanja za ovu ponudu"
4. Web strana koristi fallback (ponuda.naslovoglasa)
```

---

## ✅ Prednosti

### Za Korisnike
- ✅ Jasna selekcija kampanje
- ✅ Real-time preview
- ✅ Automatska selekcija aktivne kampanje
- ✅ Mogućnost promene kampanje bez brisanja konfiguracije

### Za Sistem
- ✅ Čista arhitektura (kampanjaId u webstrana JSON)
- ✅ Fallback mehanizam (aktivna kampanja ako nema izbora)
- ✅ Backward compatibility (stari format i dalje radi)
- ✅ Fleksibilnost (lako dodati nove opcije)

---

## 🔍 Testiranje

### Test Scenario 1: Izbor Kampanje

1. Kreirajte 2-3 kampanje za ponudu
2. Otvorite WebStrana modal
3. Proverite da se prikazuju sve kampanje
4. Izaberite kampanju
5. Proverite preview
6. Sačuvajte
7. Otvorite web stranu i proverite naslov

### Test Scenario 2: Bez Kampanje

1. Kreirajte ponudu bez kampanje
2. Otvorite WebStrana modal
3. Proverite poruku "Nema kampanja"
4. Sačuvajte konfiguraciju
5. Otvorite web stranu
6. Proverite da se koristi fallback naslov

### Test Scenario 3: Promena Kampanje

1. Izaberite Kampanju #1
2. Sačuvajte
3. Ponovo otvorite modal
4. Proverite da je Kampanja #1 izabrana
5. Izaberite Kampanju #2
6. Sačuvajte
7. Otvorite web stranu i proverite novi naslov

---

## 📊 Statistika Izmena

| Fajl | Izmene |
|------|--------|
| `components/webstrana-modal.tsx` | +211 linija |
| `app/p/[id]/page.tsx` | +16 linija |
| **UKUPNO** | **+227 linija** |

---

## 🚀 Deployment

✅ Kod commit-ovan  
✅ Push-ovano na GitHub  
⏳ Vercel deployment u toku  
⚠️ **SQL migracija - već urađena**

---

## 📚 Povezana Dokumentacija

- `KAMPANJA_NASLOV_OPIS.md` - Tehnička dokumentacija kampanja
- `AI_GENERISANJE_PRIMERI.md` - Primeri AI generisanog sadržaja
- `KAKO_KORISTITI_NASLOV_OPIS.md` - Korisnički vodič

---

## 🔮 Buduća Poboljšanja

### Kratkoročno
- [ ] A/B testiranje različitih kampanja
- [ ] Analytics za praćenje konverzija po kampanjama
- [ ] Automatsko prebacivanje na najbolju kampanju

### Dugoročno
- [ ] Višejezične kampanje (EN, DE)
- [ ] Personalizovane kampanje po tipu kupca
- [ ] Machine learning optimizacija

---

**Verzija:** 1.0  
**Datum:** 17. Februar 2026  
**Status:** Implementirano i Testirano ✅
