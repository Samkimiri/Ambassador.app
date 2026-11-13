-- ==============================================================================
-- SCDS AMBASSADOR HUB - APPLICATION APPROVAL EMAIL TRACKING
-- Adds delivery tracking columns to public.applications without modifying data.
-- ==============================================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS approval_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_email_last_error TEXT;
