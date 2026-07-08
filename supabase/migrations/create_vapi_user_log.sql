-- Audit log za vapi korisnike: login i pregled ruta/modula.

CREATE TABLE IF NOT EXISTS public.vapi_user_log (
  id BIGSERIAL PRIMARY KEY,
  korisnikid BIGINT NULL,
  naziv TEXT NULL,
  email TEXT NULL,
  event_type TEXT NOT NULL,
  route TEXT NULL,
  details TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vapi_user_log_created_at
  ON public.vapi_user_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vapi_user_log_korisnikid
  ON public.vapi_user_log (korisnikid);
