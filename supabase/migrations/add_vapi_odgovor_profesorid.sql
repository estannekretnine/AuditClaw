-- Povezuje Vapi odgovor sa profesorom koji je vodio poziv.
ALTER TABLE public.vapi_odgovor
ADD COLUMN IF NOT EXISTS profesorid bigint NULL;

ALTER TABLE public.vapi_odgovor
DROP CONSTRAINT IF EXISTS vapi_odgovor_profesorid_fkey;

ALTER TABLE public.vapi_odgovor
ADD CONSTRAINT vapi_odgovor_profesorid_fkey
FOREIGN KEY (profesorid) REFERENCES public.vapi_profesor (id)
ON UPDATE RESTRICT
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_vapi_odgovor_profesorid ON public.vapi_odgovor (profesorid);
