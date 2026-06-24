-- Dodavanje statusa "Ekspert" u tabelu klijenti
ALTER TABLE public.klijenti
  ADD COLUMN IF NOT EXISTS stsekspert boolean NOT NULL DEFAULT false;
