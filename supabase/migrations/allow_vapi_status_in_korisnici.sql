-- Omogućava novu rolu "vapi" u tabeli korisnici.
-- Bez ove izmene insert/update puca na check constraint.

ALTER TABLE public.korisnici
DROP CONSTRAINT IF EXISTS korisnici_stsstatus_check;

ALTER TABLE public.korisnici
ADD CONSTRAINT korisnici_stsstatus_check
CHECK (
  stsstatus IS NULL
  OR stsstatus IN ('kupac', 'prodavac', 'agent', 'admin', 'manager', 'vapi')
);
