# SCDS Ambassador Hub

**Organization:** Sam Creative Design School (SCDS) (`https://samcreativedesignschool.com`)  
**Brand Positioning:** *Exceptional, Strategic & Realistic.*  
**Local Project Directory:** `C:\Users\user\Desktop\scds-ambassador-hub`

---

## 1. Overview

**SCDS Ambassador Hub** is a production-ready web application built for **Sam Creative Design School (SCDS)** to onboard, manage, and reward student leaders, designers, developers, CAD engineers, and digital creators who promote SCDS courses and refer prospective learners.

### Core Capabilities
- **3 Role-Based Portals:**
  - **Prospective Learner (Public):** Browse the 7 official SCDS skill tracks, open referral links (`/join?ref=CODE`), have 30-day referral attribution preserved, and submit course enquiries without needing an ambassador account or seeing private ambassador data.
  - **Ambassador Portal (`/dashboard`):** Application status gating, personalized referral link & code (`SCDS-XXX-YYYY`), one-click WhatsApp & X sharing, real-time referral lifecycle tracker, personalized Marketing Resource Library, points & commission transaction ledger, M-Pesa payout requests, leaderboard, notifications, and support desk.
  - **Super Administrator Console (`/admin`):** Executive analytics (Recharts), application review & approval, ambassador directory, referral status transition management, M-Pesa enrolment payment verification with idempotent reward issuance, course & campaign management, configurable reward rules, payout confirmation, resource publishing, announcements, CSV exports, and immutable audit logs.

---

## 2. Running Locally

```bash
cd "C:\Users\user\Desktop\scds-ambassador-hub"

# 1. Install dependencies
npm install

# 2. Run automated tests, typecheck, and lint
npm run test
npm run typecheck
npm run lint

# 3. Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 3. Supabase Configuration & Database Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Populate your environment variables in `.env.local`:
   - `NEXT_PUBLIC_APP_URL=https://ambassadors.samcreativedesignschool.com` (or `http://localhost:3000` locally)
   - `NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>` *(Server-only — never exposed to browser)*
4. Apply the SQL schema, Row Level Security (RLS) policies, and seed data:
   - Run [`supabase/migrations/20261019000001_initial_schema.sql`](supabase/migrations/20261019000001_initial_schema.sql) in the Supabase SQL Editor (or via `npx supabase db push`).
   - Run [`supabase/seed.sql`](supabase/seed.sql) to seed the 7 official SCDS courses, default reward rules, and badges.
5. Configure a Supabase Storage bucket named `marketing-assets` with public read access for `published` assets and `INSERT`/`UPDATE`/`DELETE` restricted to `public.is_super_admin()`.

> **Development / Demo Mode Note:** When `NEXT_PUBLIC_SUPABASE_URL` is not set, the app explicitly displays a **Development / Demo Mode** banner at the top of the screen and uses local stateful persistence so all workflows can be tested end-to-end without fabricating a live cloud connection.

---

## 4. Deploying to Vercel & Custom Subdomain Setup (`ambassadors.samcreativedesignschool.com`)

1. Push the repository to GitHub/GitLab.
2. Import the project into **Vercel**:
   - Framework Preset: **Next.js**
   - Add all environment variables from `.env.example` in **Vercel Project Settings → Environment Variables**.
3. Connect the SCDS Subdomain:
   - In Vercel, navigate to **Settings → Domains** and add `ambassadors.samcreativedesignschool.com`.
   - In your DNS provider for `samcreativedesignschool.com`, add a `CNAME` record:
     - **Host / Name:** `ambassadors`
     - **Target / Value:** `cname.vercel-dns.com`
   - Once DNS propagates, Vercel automatically provisions the SSL/TLS certificate.
   - Add `https://ambassadors.samcreativedesignschool.com/**` to your **Supabase Authentication → URL Configuration → Redirect URLs**.

