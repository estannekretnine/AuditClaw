-- Relacija servisa: asistent moze da pripada drugom asistentu (vrh servisa).
-- Ako je servisid NULL => asistent je vrh (top-level servis).
ALTER TABLE public.vapi_assistants
ADD COLUMN IF NOT EXISTS servisid bigint null;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vapi_assistants_servisid_fkey'
  ) THEN
    ALTER TABLE public.vapi_assistants
    ADD CONSTRAINT vapi_assistants_servisid_fkey
    FOREIGN KEY (servisid) REFERENCES public.vapi_assistants (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vapi_assistants_servisid ON public.vapi_assistants(servisid);
