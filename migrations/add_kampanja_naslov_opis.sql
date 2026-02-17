-- Dodavanje polja naslov_ai i opis_ai u tabelu kampanja
-- Datum: 2026-02-17
-- Opis: Polja za naslov i opis koji se koriste na web strani ponude/akcije

-- Dodaj kolone ako ne postoje
ALTER TABLE public.kampanja 
ADD COLUMN IF NOT EXISTS naslov_ai text NULL,
ADD COLUMN IF NOT EXISTS opis_ai text NULL;

-- Dodaj komentare za dokumentaciju
COMMENT ON COLUMN public.kampanja.naslov_ai IS 'AI generisani naslov za web stranu (max 80 karaktera). Koristi se kao hero naslov na javnoj strani ponude.';
COMMENT ON COLUMN public.kampanja.opis_ai IS 'AI generisani opis za web stranu (max 200 karaktera). Koristi se u meta tagovima i kao glavni opis na javnoj strani ponude.';

-- Proveri da li su kolone uspešno dodate
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'kampanja' 
    AND column_name IN ('naslov_ai', 'opis_ai');
