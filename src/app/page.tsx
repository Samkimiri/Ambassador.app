"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Coins,
  ExternalLink,
  Layers,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/status-badge";

export default function HomePage() {
  const { db } = useApp();
  const publishedCourses = db.courses.filter((c) => c.status === "published");
  const activeCampaigns = db.campaigns.filter((c) => c.status === "active");
  const topAmbassadors = [...db.ambassadors]
    .filter((a) => a.isActive)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sam Creative Design School · Cohort 11 Intake Open
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.15]">
                  Champion Practical Creative &amp; Engineering Skills.{" "}
                  <span className="text-brand-500">Grow With SCDS.</span>
                </h1>

                <p className="max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
                  Join the official <strong>SCDS Ambassador Hub</strong>—a community
                  of campus leaders, designers, developers, CAD engineers, and
                  digital creators connecting learners to industry-level mentorship
                  at Sam Creative Design School.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition"
                  >
                    Apply to Become an Ambassador
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
                  >
                    Submit Course Enquiry
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300 hover:text-white"
                  >
                    Open Portal →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/90">
                  <div>
                    <div className="text-2xl font-bold text-white">7 Tracks</div>
                    <div className="text-xs text-slate-400">
                      Design, Coding, AI, Video &amp; CAD
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-400">15%–25%</div>
                    <div className="text-xs text-slate-400">
                      Verified Enrolment Commission
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-xs text-slate-400">
                      SCDS Alumni Trained
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">M-Pesa</div>
                    <div className="text-xs text-slate-400">
                      Audited Weekly Payouts
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                        Transparent Attribution Engine
                      </span>
                      <h2 className="text-lg font-bold text-white mt-0.5">
                        How SCDS Referral Tracking Works
                      </h2>
                    </div>
                    <ShieldCheck className="h-7 w-7 text-brand-500" />
                  </div>

                  <ol className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-500/40 text-xs font-bold text-brand-400">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          Get Approved &amp; Unlock Your Referral Code
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Receive a unique link like{" "}
                          <code className="text-brand-300">/join?ref=SCDS-AMI-8K4P</code>{" "}
                          plus official posters &amp; captions.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-500/40 text-xs font-bold text-brand-400">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          30-Day Attribution Window
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          When a learner opens your link and submits an enquiry for
                          any SCDS course, your attribution is locked server-side.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-500/40 text-xs font-bold text-brand-400">
                        3
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          Verified Enrolment &amp; Auditable Ledger
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Once SCDS Admissions verifies tuition payment, points and
                          KES commissions are credited to your ledger automatically.
                        </p>
                      </div>
                    </li>
                  </ol>

                  <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">
                        Test Referral Attribution Flow
                      </div>
                      <div className="text-xs font-mono text-brand-300 mt-0.5">
                        /join?ref=SCDS-AMI-8K4P
                      </div>
                    </div>
                    <Link
                      href="/join?ref=SCDS-AMI-8K4P"
                      className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      Try Referral Link →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active Campaigns */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Active Growth Drives
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Live Ambassador Campaigns
              </h2>
            </div>
            <Link
              href="/dashboard/campaigns"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View Campaign Briefs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {activeCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Active Campaign
                    </span>
                    <span className="text-xs text-slate-500">
                      Ends {camp.endDate}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{camp.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-700">
                    +{camp.bonusPointsPerEnrolment} Bonus Pts · +
                    {camp.bonusCommissionPct}% Boost
                  </span>
                  <Link
                    href="/auth/register"
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    Participate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Official SCDS Courses */}
        <section className="bg-white border-y border-slate-200 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Practical Portfolio Programs
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  7 Official SCDS Skill Tracks
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Online LMS + WhatsApp Mentorship by Samuel Kimiri + Google Meet Classes + Verified Certificates.
                </p>
              </div>
              <Link
                href="/courses"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                Explore All Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publishedCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:border-brand-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-brand-400">
                        {course.shortCode}
                      </span>
                      <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                        {course.duration}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {course.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Published Tuition</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatKes(course.publishedFeeKes)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/join?course=${course.slug}`}
                        className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ambassador Tiers & Leaderboard Preview */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Growth &amp; Progression
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                5 Ambassador Tiers With Transparent Criteria
              </h2>
              <p className="text-sm text-slate-600">
                Progress from Starter to Elite based on verified enrolments and
                impact points. Every promotion unlocks higher commission rates and
                career mentorship perks.
              </p>

              <div className="space-y-3 pt-2">
                {db.rewardRules.levelThresholds.map((tier) => (
                  <div
                    key={tier.level}
                    className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={tier.level} />
                        <span className="text-xs font-semibold text-slate-500">
                          {tier.minPoints.toLocaleString()}+ pts · {tier.minEnrolments}+ verified enrolments
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {tier.perks.join(" · ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-block rounded-lg bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700">
                        {tier.commissionPct}% Commission
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      Verified Impact
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Top Ambassadors This Month
                    </h3>
                  </div>
                  <Trophy className="h-6 w-6 text-brand-500" />
                </div>

                <div className="space-y-3">
                  {topAmbassadors.map((amb, idx) => {
                    const verifiedEnrolments = db.referrals.filter(
                      (r) =>
                        r.ambassadorId === amb.id &&
                        r.status === "payment_verified"
                    ).length;
                    return (
                      <div
                        key={amb.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {amb.fullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {amb.institution} · <LevelBadge level={amb.level} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-brand-600">
                            {amb.totalPoints.toLocaleString()} pts
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {verifiedEnrolments} verified enrolments
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/ambassadors"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  View Full Public Leaderboard →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

