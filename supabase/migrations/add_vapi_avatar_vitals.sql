ALTER TABLE public.vapi_assistants
  ADD COLUMN IF NOT EXISTS ima_video_pacijenta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simli_face_id text null,
  ADD COLUMN IF NOT EXISTS vitalni_znaci_default jsonb null;
