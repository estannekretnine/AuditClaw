-- Public key za Vapi web pozive (/call/web zahteva Public, ne Private key)
ALTER TABLE public.vapi_assistants
  ADD COLUMN IF NOT EXISTS vapi_public_key text null;
