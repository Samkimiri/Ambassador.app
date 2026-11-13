-- ==============================================================================
-- SCDS AMBASSADOR HUB - APPLICATIONS & SHARED STATE MIGRATION
-- Ensures persistent cross-device storage for ambassador applications on Vercel.
-- ==============================================================================

-- 1. Ensure shared app_state table exists for real-time sync
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages app_state" ON public.app_state;
CREATE POLICY "Service role manages app_state" ON public.app_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow realtime select on app_state" ON public.app_state;
CREATE POLICY "Allow realtime select on app_state" ON public.app_state
  FOR SELECT
  USING (true);

-- Enable Supabase Realtime on app_state
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 2. Dedicated applications table (server-side service role read/write, no auth.users FK block)
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  county TEXT,
  institution TEXT,
  occupation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on applications" ON public.applications;
CREATE POLICY "Service role full access on applications" ON public.applications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
