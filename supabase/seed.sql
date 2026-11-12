-- ==============================================================================
-- SCDS AMBASSADOR HUB - SEED DATA (supabase/seed.sql)
-- Official SCDS Courses, Default Reward Rules, Badges & Campaigns
-- ==============================================================================

-- 1. Seed Default Reward Rules (Configurable Example Policy)
INSERT INTO public.reward_rules (
  code,
  name,
  description,
  currency,
  points_per_click,
  points_per_qualified_lead,
  points_per_verified_enrolment,
  default_commission_pct,
  min_payout_kes,
  attribution_window_days,
  is_business_policy_confirmed
) VALUES (
  'default_policy',
  'SCDS Standard Ambassador Growth Policy (Configurable Example)',
  'Default points, commission percentages, and minimum M-Pesa payout thresholds. Admin configurable.',
  'KES',
  0,
  25,
  250,
  15.00,
  1000.00,
  30,
  FALSE
) ON CONFLICT (code) DO NOTHING;

-- 2. Seed Official SCDS Courses (All 7 Tracks from samcreativedesignschool.com)
INSERT INTO public.courses (
  slug, title, short_code, description, category, duration, published_fee_kes, currency, commission_rate_pct, points_reward, enrollment_url, highlights, status
) VALUES
(
  'photoshop-masterclass',
  'Adobe Photoshop Masterclass',
  'PS',
  'Master the world''s most powerful image editing software. Learn professional photo retouching, manipulation, poster design, and digital brand identity creation.',
  'Design Software',
  '4 Weeks (30 Days)',
  4000.00,
  'KES',
  15.00,
  400,
  'https://samcreativedesignschool.com/enroll?course=photoshop-masterclass',
  ARRAY['Poster Design', 'Brand Identity', 'Photo Retouching', 'Mockup Design'],
  'published'
),
(
  'illustrator-training',
  'Adobe Illustrator Training',
  'AI',
  'Unlock your creativity with vector graphics. Create scalable logos, custom typography, icons, and complex commercial illustrations.',
  'Design Software',
  '4 Weeks (30 Days)',
  4000.00,
  'KES',
  15.00,
  400,
  'https://samcreativedesignschool.com/enroll?course=illustrator-training',
  ARRAY['Logo Design', 'Vector Illustration', 'Typography', 'Brand Identity'],
  'published'
),
(
  'vibe-designing-uiux',
  'Vibe Designing — UI/UX Masterclass',
  'UX',
  'Design modern mobile apps and web platforms with user research, wireframing, Figma design systems, interactive prototypes, and client case studies.',
  'Product Design',
  '5 Weeks (35 Days)',
  5500.00,
  'KES',
  18.00,
  550,
  'https://samcreativedesignschool.com/enroll?course=vibe-designing-uiux',
  ARRAY['User Research', 'Wireframing', 'Figma UI Design', 'UX Case Studies'],
  'published'
),
(
  'vibe-coding-web-dev',
  'Vibe Coding — Web Development Bootcamp',
  'DEV',
  'Build responsive websites and full-stack web apps with HTML, CSS, JavaScript, React, Next.js, APIs, and production deployment workflows.',
  'Software Engineering',
  '8 Weeks (56 Days)',
  8500.00,
  'KES',
  20.00,
  850,
  'https://samcreativedesignschool.com/enroll?course=vibe-coding-web-dev',
  ARRAY['HTML & CSS', 'JavaScript & React', 'Next.js & APIs', 'Live Deployment'],
  'published'
),
(
  'ai-prompt-engineering',
  'AI & Prompt Engineering',
  'AIP',
  'Use AI tools responsibly and strategically for content creation, design workflows, business automation, research, and structured prompt systems.',
  'Artificial Intelligence',
  '3 Weeks (21 Days)',
  3500.00,
  'KES',
  15.00,
  350,
  'https://samcreativedesignschool.com/enroll?course=ai-prompt-engineering',
  ARRAY['Prompt Design', 'AI Content Workflows', 'Business Automation', 'Research Systems'],
  'published'
),
(
  'solidworks-engineers',
  'SolidWorks for Engineers',
  'CAD',
  'Master 3D CAD design for mechanical engineering. Create complex parametric parts, assemblies, and ISO-standard technical drawings for real-world fabrication.',
  'Engineering Setup',
  '6 Weeks (45 Days)',
  9000.00,
  'KES',
  18.00,
  900,
  'https://samcreativedesignschool.com/enroll?course=solidworks-engineers',
  ARRAY['3D Part Modeling', 'Mechanical Assemblies', 'Technical Drawings', 'Engineering Portfolio'],
  'published'
),
(
  'capcut-masterclass',
  'CapCut Video Editing Masterclass',
  'CC',
  'Plan, cut, caption, color-grade, and export high-retention short-form videos for TikTok, Instagram Reels, YouTube Shorts, and commercial brands.',
  'Video Workflow',
  '2 Weeks (15 Days)',
  2000.00,
  'KES',
  15.00,
  200,
  'https://samcreativedesignschool.com/enroll?course=capcut-masterclass',
  ARRAY['Video Trimming', 'Effects & Transitions', 'Motion Captions', 'Reels & TikTok Exports'],
  'published'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Badges
INSERT INTO public.badges (code, name, description, icon_name, criteria_type, criteria_threshold) VALUES
('first_spark', 'First Spark', 'Submitted your first qualified learner lead to SCDS.', 'Sparkles', 'qualified_leads', 1),
('verified_pioneer', 'Verified Pioneer', 'Achieved your first verified student enrolment.', 'CheckCircle2', 'verified_enrolments', 1),
('campus_catalyst', 'Campus Catalyst', 'Referred 5 verified learners into SCDS cohorts.', 'Award', 'verified_enrolments', 5),
('creative_strategist', 'Creative Strategist', 'Earned 1,500+ cumulative ambassador impact points.', 'Trophy', 'points', 1500),
('scds_elite_fellow', 'SCDS Elite Fellow', 'Reached 15+ verified enrolments with impeccable attribution integrity.', 'Crown', 'verified_enrolments', 15)
ON CONFLICT (code) DO NOTHING;


-- 4. Seed Super Administrator in auth.users and public.profiles
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  admin_email text := 'Samcreativedesignschool@gmail.com';
BEGIN
  -- Insert into auth.users if not present
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt('Admin@SCDS2026!#Sam', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Samuel Ndung''u Kimiri"}'::jsonb,
      now(),
      now(),
      '',
      ''
    );
  ELSE
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
  END IF;

  -- Upsert into public.profiles
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, status
  ) VALUES (
    admin_id,
    admin_email,
    'Samuel Ndung''u Kimiri',
    '0748201131',
    'super_admin',
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = 'super_admin',
    status = 'active';
END $$;
