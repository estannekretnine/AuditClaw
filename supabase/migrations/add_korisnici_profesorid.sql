-- Povezuje Vapi korisnika sa profesorom iz vapi_profesor tabele.
ALTER TABLE public.korisnici
ADD COLUMN IF NOT EXISTS profesorid bigint NULL;

ALTER TABLE public.korisnici
DROP CONSTRAINT IF EXISTS korisnici_profesorid_fkey;

ALTER TABLE public.korisnici
ADD CONSTRAINT korisnici_profesorid_fkey
FOREIGN KEY (profesorid) REFERENCES public.vapi_profesor (id)
ON UPDATE RESTRICT
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_korisnici_profesorid ON public.korisnici (profesorid);
