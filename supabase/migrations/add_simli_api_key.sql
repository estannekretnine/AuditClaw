ALTER TABLE public.vapi_assistants
  ADD COLUMN IF NOT EXISTS simli_api_key text null;
