-- ==============================================================================
-- SCDS AMBASSADOR HUB - INITIAL DATABASE SCHEMA & RLS MIGRATION
-- Organization: Sam Creative Design School (SCDS)
-- Brand Positioning: Exceptional, Strategic & Realistic
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('super_admin', 'ambassador', 'learner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ------------------------------------------------------------------------------
-- 2. AMBASSADOR APPLICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  county TEXT NOT NULL,
  institution TEXT,
  occupation TEXT NOT NULL,
  social_links JSONB DEFAULT '{}'::jsonb,
  motivation TEXT NOT NULL,
  experience TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT FALSE CHECK (accepted_terms = TRUE),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status ON public.ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_email ON public.ambassador_applications(email);

-- ------------------------------------------------------------------------------
-- 3. AMBASSADOR PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambassador_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL DEFAULT 'Starter' CHECK (level IN ('Starter', 'Bronze', 'Silver', 'Gold', 'Elite')),
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  available_points INTEGER NOT NULL DEFAULT 0 CHECK (available_points >= 0),
  total_commission_kes NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_commission_kes >= 0),
  available_commission_kes NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_commission_kes >= 0),
  paid_commission_kes NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_commission_kes >= 0),
  payout_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payout_method IN ('MPESA', 'BANK_TRANSFER')),
  payout_phone TEXT,
  county TEXT,
  institution TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_referral_code ON public.ambassador_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_ambassador_level ON public.ambassador_profiles(level);

-- ------------------------------------------------------------------------------
-- 4. COURSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_code TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  published_fee_kes NUMERIC(12, 2) NOT NULL CHECK (published_fee_kes >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (commission_rate_pct >= 0 AND commission_rate_pct <= 100),
  points_reward INTEGER NOT NULL DEFAULT 250 CHECK (points_reward >= 0),
  enrollment_url TEXT NOT NULL,
  image_url TEXT,
  highlights TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- ------------------------------------------------------------------------------
-- 5. CAMPAIGNS & CAMPAIGN_COURSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  bonus_points_per_enrolment INTEGER NOT NULL DEFAULT 0,
  bonus_commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'completed', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, course_id)
);

-- ------------------------------------------------------------------------------
-- 6. REFERRALS & REFERRAL_EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL REFERENCES public.ambassador_profiles(referral_code) ON UPDATE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  learner_name TEXT NOT NULL,
  learner_email TEXT NOT NULL,
  learner_phone TEXT NOT NULL,
  learner_county TEXT,
  enquiry_notes TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE CHECK (consent_given = TRUE),
  status TEXT NOT NULL DEFAULT 'lead_submitted' CHECK (
    status IN (
      'clicked',
      'lead_submitted',
      'contacted',
      'application_submitted',
      'enrolled',
      'payment_pending',
      'payment_verified',
      'rejected',
      'cancelled'
    )
  ),
  attribution_source TEXT NOT NULL DEFAULT 'direct_link',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate active referral for the same learner email + course
  UNIQUE (learner_email, course_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_ambassador ON public.referrals(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_events_referral ON public.referral_events(referral_id);

-- ------------------------------------------------------------------------------
-- 7. ENROLMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrolments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID UNIQUE NOT NULL REFERENCES public.referrals(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  learner_name TEXT NOT NULL,
  learner_email TEXT NOT NULL,
  cohort TEXT NOT NULL DEFAULT 'Cohort 11 (Oct 2026)',
  tuition_amount_kes NUMERIC(12, 2) NOT NULL CHECK (tuition_amount_kes >= 0),
  amount_paid_kes NUMERIC(12, 2) NOT NULL CHECK (amount_paid_kes >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL DEFAULT 'MPESA',
  payment_reference TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrolments_ambassador ON public.enrolments(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_verification ON public.enrolments(verification_status);

-- ------------------------------------------------------------------------------
-- 8. REWARD RULES, POINTS LEDGER & COMMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL DEFAULT 'default_policy',
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  points_per_click INTEGER NOT NULL DEFAULT 0 CHECK (points_per_click = 0), -- Clicks never earn enrolment points
  points_per_qualified_lead INTEGER NOT NULL DEFAULT 25 CHECK (points_per_qualified_lead >= 0),
  points_per_verified_enrolment INTEGER NOT NULL DEFAULT 250 CHECK (points_per_verified_enrolment >= 0),
  default_commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (default_commission_pct >= 0 AND default_commission_pct <= 100),
  min_payout_kes NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (min_payout_kes >= 0),
  attribution_window_days INTEGER NOT NULL DEFAULT 30 CHECK (attribution_window_days >= 1),
  level_thresholds JSONB NOT NULL DEFAULT '[
    {"level": "Starter", "minPoints": 0, "minEnrolments": 0, "commissionPct": 15},
    {"level": "Bronze", "minPoints": 500, "minEnrolments": 3, "commissionPct": 17},
    {"level": "Silver", "minPoints": 1500, "minEnrolments": 8, "commissionPct": 20},
    {"level": "Gold", "minPoints": 3500, "minEnrolments": 18, "commissionPct": 22},
    {"level": "Elite", "minPoints": 7500, "minEnrolments": 35, "commissionPct": 25}
  ]'::jsonb,
  is_business_policy_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  -- Unique event_key prevents duplicate point issuance for the same qualifying event
  event_key TEXT UNIQUE NOT NULL,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_ambassador ON public.points_ledger(ambassador_id);

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  enrolment_id UUID UNIQUE NOT NULL REFERENCES public.enrolments(id) ON DELETE RESTRICT,
  referral_id UUID UNIQUE NOT NULL REFERENCES public.referrals(id) ON DELETE RESTRICT,
  course_title TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  tuition_paid_kes NUMERIC(12, 2) NOT NULL,
  commission_rate_pct NUMERIC(5, 2) NOT NULL,
  amount_kes NUMERIC(12, 2) NOT NULL CHECK (amount_kes >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'reversed')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_ambassador ON public.commissions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);

-- ------------------------------------------------------------------------------
-- 9. PAYOUT REQUESTS & PAYOUTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  amount_kes NUMERIC(12, 2) NOT NULL CHECK (amount_kes > 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payment_method IN ('MPESA', 'BANK_TRANSFER')),
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_ambassador ON public.payout_requests(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID UNIQUE NOT NULL REFERENCES public.payout_requests(id) ON DELETE RESTRICT,
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE RESTRICT,
  amount_kes NUMERIC(12, 2) NOT NULL CHECK (amount_kes > 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL,
  transaction_reference TEXT UNIQUE NOT NULL,
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. MARKETING ASSETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'Course Posters',
      'Social Media Graphics',
      'Short Promotional Videos',
      'WhatsApp Promotional Content',
      'Course Descriptions',
      'Ready-to-Use Captions',
      'Approved Testimonials',
      'Campaign Guidelines',
      'Brand Assets',
      'Referral Campaign Materials'
    )
  ),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  file_url TEXT,
  preview_url TEXT,
  caption_template TEXT NOT NULL,
  usage_instructions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. BADGES & AMBASSADOR BADGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('verified_enrolments', 'qualified_leads', 'points', 'campaign')),
  criteria_threshold INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ambassador_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ambassador_id, badge_id)
);

-- ------------------------------------------------------------------------------
-- 12. ANNOUNCEMENTS, NOTIFICATIONS, SUPPORT REQUESTS & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'ambassadors', 'level_specific')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'reward')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ambassador_name TEXT NOT NULL,
  ambassador_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Attribution Review', 'Commission & Payout', 'Marketing Assets', 'Account & Level', 'Technical Support')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_response TEXT,
  responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  );
$$;

-- Profiles: Users read own profile, Super Admins read/manage all. Users cannot escalate their own role.
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Super admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_super_admin());

-- Courses & Campaigns: Publicly readable when published/active; Super Admins full access
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (status = 'published' OR public.is_super_admin());

CREATE POLICY "Super admins manage courses" ON public.courses
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
  FOR SELECT USING (status IN ('active', 'completed') OR public.is_super_admin());

CREATE POLICY "Super admins manage campaigns" ON public.campaigns
  FOR ALL USING (public.is_super_admin());

-- Applications: Users can submit and view their own application; Super Admins view/update all
CREATE POLICY "Applicants view own application" ON public.ambassador_applications
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Authenticated users submit application" ON public.ambassador_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins manage applications" ON public.ambassador_applications
  FOR UPDATE USING (public.is_super_admin());

-- Ambassador Profiles: Ambassadors view own record; Super Admins view/manage all
CREATE POLICY "Ambassadors view own profile" ON public.ambassador_profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Super admins manage ambassador profiles" ON public.ambassador_profiles
  FOR ALL USING (public.is_super_admin());

-- Referrals: Ambassadors view only their own referrals; Super Admins view/manage all
CREATE POLICY "Ambassadors view own referrals" ON public.referrals
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM public.ambassador_profiles WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );

CREATE POLICY "Super admins manage referrals" ON public.referrals
  FOR ALL USING (public.is_super_admin());

-- Enrolments, Points Ledger, Commissions, Payout Requests: Own records or Super Admin
CREATE POLICY "Ambassadors view own enrolments" ON public.enrolments
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM public.ambassador_profiles WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );

CREATE POLICY "Ambassadors view own points ledger" ON public.points_ledger
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM public.ambassador_profiles WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );

CREATE POLICY "Ambassadors view own commissions" ON public.commissions
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM public.ambassador_profiles WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );

CREATE POLICY "Ambassadors view and create own payout requests" ON public.payout_requests
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM public.ambassador_profiles WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );

-- Marketing Assets & Announcements: Published readable by approved ambassadors & admins
CREATE POLICY "Approved users view marketing assets" ON public.marketing_assets
  FOR SELECT USING (status = 'published' OR public.is_super_admin());

CREATE POLICY "Super admins manage marketing assets" ON public.marketing_assets
  FOR ALL USING (public.is_super_admin());

-- Audit Logs: Super Admin only
CREATE POLICY "Super admins view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_super_admin());

