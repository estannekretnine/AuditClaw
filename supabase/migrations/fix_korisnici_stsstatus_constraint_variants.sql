-- Robusna korekcija check ograničenja za korisnici.stsstatus.
-- U nekim okruženjima constraint može imati drugačije ime,
-- pa brišemo sve CHECK constraint-e koji referenciraju stsstatus.

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'c'
      AND nsp.nspname = 'public'
      AND rel.relname = 'korisnici'
      AND pg_get_constraintdef(con.oid) ILIKE '%stsstatus%'
  LOOP
    EXECUTE format('ALTER TABLE public.korisnici DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.korisnici
ADD CONSTRAINT korisnici_stsstatus_check
CHECK (
  stsstatus IS NULL
  OR stsstatus IN ('kupac', 'prodavac', 'agent', 'admin', 'manager', 'vapi')
);
