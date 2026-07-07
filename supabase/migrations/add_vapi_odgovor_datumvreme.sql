-- Datum i vreme upisa Vapi odgovora
ALTER TABLE public.vapi_odgovor
ADD COLUMN IF NOT EXISTS datumvreme timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_vapi_odgovor_datumvreme ON public.vapi_odgovor(datumvreme DESC);
