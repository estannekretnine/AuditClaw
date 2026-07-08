ALTER TABLE public.vapi_assistants
  ADD COLUMN IF NOT EXISTS simli_model text NOT NULL DEFAULT 'fasttalk',
  ADD COLUMN IF NOT EXISTS simli_max_session_length integer NOT NULL DEFAULT 600,
  ADD COLUMN IF NOT EXISTS simli_max_idle_time integer NOT NULL DEFAULT 600;
