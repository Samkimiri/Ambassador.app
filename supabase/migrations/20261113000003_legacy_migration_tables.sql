-- ==============================================================================
-- SCDS AMBASSADOR HUB - ONE-TIME LEGACY MIGRATION TABLES (INSERT-ONLY)
-- Strictly CREATE TABLE IF NOT EXISTS + RLS. No DROP, DELETE, TRUNCATE, UPDATE.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.legacy_import_log (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_import_log_collection
  ON public.legacy_import_log(collection, record_id);

CREATE TABLE IF NOT EXISTS public.legacy_quarantine (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  raw JSONB NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_quarantine_collection
  ON public.legacy_quarantine(collection);

CREATE TABLE IF NOT EXISTS public.legacy_records (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  email_normalized TEXT,
  raw JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_records_email
  ON public.legacy_records(email_normalized);
CREATE INDEX IF NOT EXISTS idx_legacy_records_collection
  ON public.legacy_records(collection, record_id);

ALTER TABLE public.legacy_import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legacy_import_log'
      AND policyname = 'Service role manages legacy_import_log'
  ) THEN
    CREATE POLICY "Service role manages legacy_import_log" ON public.legacy_import_log
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legacy_quarantine'
      AND policyname = 'Service role manages legacy_quarantine'
  ) THEN
    CREATE POLICY "Service role manages legacy_quarantine" ON public.legacy_quarantine
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legacy_records'
      AND policyname = 'Service role manages legacy_records'
  ) THEN
    CREATE POLICY "Service role manages legacy_records" ON public.legacy_records
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
