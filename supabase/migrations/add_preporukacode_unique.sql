-- Migracija: dodavanje UNIQUE constraint-a na klijenti.preporukacode
-- Datum: 2026-06-20
--
-- VAŽNO: Pokrenuti korake redom (1 → 2 → 3). Korak 3 je opcionalan (NOT NULL).
-- Ako pokrenete sve odjednom u Supabase SQL Editor-u, sve radi u istoj transakciji.

-- =============================================================
-- KORAK 1: Popuniti sve postojeće NULL vrednosti jedinstvenim kodom
-- =============================================================
-- Format: AC-XXXXXXXX (8 hex karaktera, dovoljno za postojeće redove).
-- Koristimo md5(id || random) za garantovanu jedinstvenost među postojećim redovima.
-- Aplikacija će za nove redove koristiti pravi charset (bez ambiguous znakova).
UPDATE public.klijenti
SET preporukacode = 'AC-' || upper(substr(md5(id::text || clock_timestamp()::text || random()::text), 1, 8))
WHERE preporukacode IS NULL;

-- Provera (opciono — ako vrati > 0, KORAK 2 i 3 ne treba pokretati):
-- SELECT COUNT(*) FROM public.klijenti WHERE preporukacode IS NULL;

-- =============================================================
-- KORAK 2: Provera duplikata pre dodavanja UNIQUE constraint-a
-- =============================================================
-- Ako vrati ijedan red, ne smete dodati UNIQUE dok ih ne razrešite:
-- SELECT preporukacode, COUNT(*) FROM public.klijenti
-- WHERE preporukacode IS NOT NULL GROUP BY preporukacode HAVING COUNT(*) > 1;

-- Dodavanje UNIQUE constraint-a (ako već postoji, drop pa add)
ALTER TABLE public.klijenti
  DROP CONSTRAINT IF EXISTS klijenti_preporukacode_key;

ALTER TABLE public.klijenti
  ADD CONSTRAINT klijenti_preporukacode_key UNIQUE (preporukacode);

-- =============================================================
-- KORAK 3 (OPCIONO): Forsirati NOT NULL
-- =============================================================
-- Pokrenuti SAMO nakon što ste sigurni da KORAK 1 nije ostavio NULL vrednosti.
ALTER TABLE public.klijenti
  ALTER COLUMN preporukacode SET NOT NULL;
