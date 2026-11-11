"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Megaphone,
  MessageSquare,
  PhoneCall,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";

export default function AmbassadorGuidePage() {
  const { db, currentAmbassador } = useApp();
  const [activeTab, setActiveTab] = useState<
    "blueprint" | "courses" | "scripts" | "channels" | "objections" | "conduct"
  >("blueprint");
  const [copiedScriptIndex, setCopiedScriptIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const amb = currentAmbassador || db.ambassadors[0];
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ambassador.scds.ke";
  const referralUrl = `${origin}/join?ref=${amb.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(amb.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyScript = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(index);
    setTimeout(() => setCopiedScriptIndex(null), 2500);
  };

  // Ready-to-use marketing scripts tailored with the ambassador's live code & URL
  const pitchScripts = [
    {
      title: "WhatsApp Group & Class Broadcast",
      category: "WhatsApp / Telegram",
      audience: "Campus groups, youth groups, high school leavers, alumni forums",
      description: "Best for sharing in university WhatsApp groups or student communities.",
      text: `Hey everyone! 🎨💻 If you've been looking to learn high-income creative or tech skills, Sam Creative Design School (SCDS) has opened registration for their upcoming practical cohorts.

Courses offered:
✨ Graphic Design & Brand Identity
✨ UI/UX Product Design (Figma)
✨ Fullstack Web Development (React & Node)
✨ CapCut & Short-form Video Mastery
✨ SolidWorks & 3D Mechanical CAD
✨ AI for Creatives & Business

Classes are physical (in Nairobi) and live online with personal mentorship and project portfolios.

Use my official Ambassador link to reserve your seat and get priority onboarding:
👉 ${referralUrl}
(Ambassador Referral Code: ${amb.referralCode})

Feel free to DM me if you have any questions!`,
    },
    {
      title: "Direct 1-on-1 Chat / DM to a Friend",
      category: "Personal Chat",
      audience: "Friends, classmates, colleagues asking about career or design skills",
      description: "A natural, warm message when someone asks how to start learning design or tech.",
      text: `Hey [Friend's Name]! I remembered you mentioned wanting to level up in design / tech. You should definitely check out Sam Creative Design School (SCDS).

Their training is 100% hands-on with real portfolio projects, not just boring theory. Whether you want to master Graphic Design, UI/UX, Web Dev, or Video Editing with CapCut, they guide you step-by-step.

Here is my direct ambassador link to apply or request course details:
👉 ${referralUrl}

Make sure my code ${amb.referralCode} is on the form so the admissions team knows you came through me! Let me know once you submit so I can follow up for you.`,
    },
    {
      title: "Social Media Caption (Instagram, TikTok, WhatsApp Status)",
      category: "Social Media Post",
      audience: "Your followers, status viewers, creative reels",
      description: "Concise, engaging caption with an urgent call-to-action.",
      text: `Stop waiting for the "perfect time" to build real digital skills. 🚀

Whether you want to design logos, build web apps, create viral TikTok videos on CapCut, or master Figma UI/UX, Sam Creative Design School (SCDS) will get you job-ready.

🔥 Intake is currently ongoing for both physical & online cohorts!
🔗 Tap the link to view the courses and apply: ${referralUrl}
🎟️ Official Referral Code: ${amb.referralCode}

DM me if you need help choosing the right course for your career goals!`,
    },
    {
      title: "Professional LinkedIn Post for Career Switchers",
      category: "LinkedIn / Twitter (X)",
      audience: "Graduates, freelancers, professionals seeking tech transitions",
      description: "Professional tone highlighting market-ready skills and portfolios.",
      text: `In today's digital economy, practical skills speak louder than degrees alone. 

Sam Creative Design School (SCDS) is helping aspiring creators and engineers master industry-grade tools — from Figma (UI/UX) and Fullstack Web Development to SolidWorks 3D CAD and AI workflows.

Every cohort builds authentic client-ready portfolios and receives personalized mentor reviews.

If you or someone in your network is looking to upskill or transition into the creative tech industry, explore the course lineup here:
👉 ${referralUrl}
Referral Code: ${amb.referralCode}

Proud to represent SCDS as an Official Ambassador. Feel free to connect or message me for enrolment details!`,
    },
  ];

  const tabs = [
    { id: "blueprint", label: "Operational Blueprint", icon: Compass },
    { id: "courses", label: "Course Rates & Commissions", icon: DollarSign },
    { id: "scripts", label: "Ready-to-Use Scripts", icon: MessageSquare },
    { id: "channels", label: "Promotion Channels", icon: Megaphone },
    { id: "objections", label: "Handling Student FAQs", icon: HelpCircle },
    { id: "conduct", label: "Code of Conduct", icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-navy-900 text-white p-6 sm:p-8 shadow-sm border border-brand-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy-900 shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-navy-900" /> Ambassador Operations Playbook
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                SCDS Partner Network
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              How to Operate &amp; Maximize Your Effectiveness
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Welcome to the official SCDS Ambassador Playbook. Here you will find proven strategies,
              ready-made pitch scripts, student FAQ responses, and commission details to help you
              represent SCDS confidently and earn high rewards.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20 space-y-3 shrink-0">
            <div className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              Earning Potential
            </div>
            <div className="text-2xl font-black text-gold-400">
              10% Commission
            </div>
            <div className="text-xs text-white/90 space-y-1">
              <div>• KES 400 – KES 3,500 per student</div>
              <div>• Instant M-Pesa withdrawals</div>
              <div>• Milestone points &amp; tier badges</div>
            </div>
          </div>
        </div>

        {/* Quick Ambassador Toolbox */}
        <div className="rounded-xl bg-white/10 p-4 border border-white/20 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase text-gold-400 tracking-wider">
              Your Official Tracking Link:
            </div>
            <div className="text-xs sm:text-sm font-mono text-white truncate bg-black/20 px-3 py-2 rounded-lg border border-white/10">
              {referralUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-4 py-2 text-xs font-bold text-navy-900 hover:bg-gold-300 transition shadow-sm"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Link Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy My Link
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              {copiedCode ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-gold-400" /> Code Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Code: {amb.referralCode}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-gold-400" : "text-slate-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Operational Blueprint */}
      {activeTab === "blueprint" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                The 5-Step Journey
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                How the SCDS Ambassador Program Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                From sharing your link to receiving M-Pesa in your phone, here is how the workflow operates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-sm">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Share Your Link &amp; Code
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Post on WhatsApp status, university groups, TikTok, or message interested friends directly.
                  When a learner opens your link, our 30-day cookie ensures you get full attribution even if they apply weeks later.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-sm">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Learner Submits Enquiry
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The prospective student completes the course inquiry form at <span className="font-mono text-brand-600 font-bold">/join</span>.
                  You instantly see a new lead in your <Link href="/dashboard/referrals" className="text-brand-600 underline font-semibold">My Referrals</Link> dashboard!
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-sm">
                  03
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Admissions Team Follow-Up
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The SCDS admissions team reaches out to the learner to answer questions, explain schedules,
                  and arrange physical or online orientation. You can track the lead status live in your dashboard.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-sm">
                  04
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tuition Verification &amp; Points
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once the learner pays their tuition fees, the payment is verified. Your account is immediately credited
                  with 10% commission points and leaderboard ranking points.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-extrabold text-sm">
                  05
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cash Out via M-Pesa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Head over to <Link href="/dashboard/rewards" className="text-brand-600 underline font-semibold">Points &amp; Payouts</Link>,
                  enter the amount, and submit your withdrawal request. Payouts are sent directly to your M-Pesa line.
                </p>
              </div>

              <div className="rounded-xl border border-gold-300 bg-gold-50 p-5 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400 text-navy-900 font-extrabold text-sm">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-navy-900">
                  Tier Up &amp; Unlock Bonuses
                </h3>
                <p className="text-xs text-navy-800 leading-relaxed">
                  Move from Bronze to Silver, Gold, Platinum, and Diamond tiers as your successful enrolments grow.
                  Higher tiers receive exclusive branded merchandise, bonus cash prizes, and priority support.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Start Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-600">
              <Zap className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">
                Your 10-Minute Getting Started Checklist
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Check Your Profile:</strong> Ensure your M-Pesa number is correctly entered under{" "}
                  <Link href="/dashboard/profile" className="text-brand-600 underline font-semibold">My Profile</Link>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Test Your Link:</strong> Open an incognito browser window and paste your link to verify that your code loads automatically.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Download Promo Graphics:</strong> Grab high-resolution flyers and banners from the{" "}
                  <Link href="/dashboard/resources" className="text-brand-600 underline font-semibold">Resource Library</Link>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Post Your First Status:</strong> Copy Script #1 from the &quot;Ready-to-Use Scripts&quot; tab and post it to your WhatsApp status today!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Course Rates & Commissions */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Course Catalog &amp; Reward Breakdown
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  What You Earn per Enrolled Student
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Ambassadors receive 10% commission on the student&apos;s verified tuition fee upon enrolment verification.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 font-bold shrink-0">
                10% Direct Commission Payout
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">Course Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Duration &amp; Mode</th>
                    <th className="p-3.5">Tuition Fee</th>
                    <th className="p-3.5 text-emerald-700">Your Commission (10%)</th>
                    <th className="p-3.5">Ideal Audience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {db.courses.map((course) => {
                    const commission = Math.round(
                      course.publishedFeeKes * ((course.commissionRatePct || 10) / 100)
                    );
                    return (
                      <tr key={course.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          {course.title}
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                            {course.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {course.duration}
                        </td>
                        <td className="p-3.5 font-semibold">
                          {formatKes(course.publishedFeeKes)}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          {formatKes(commission)}
                        </td>
                        <td className="p-3.5 text-slate-500 max-w-xs truncate">
                          {course.description || "High school leavers & career changers"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs text-brand-900 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong>Earnings Example:</strong> If you refer 5 students who enroll in UI/UX Product Design (KES 25,000 each),
                you earn <strong>5 × KES 2,500 = KES 12,500</strong> credited directly to your Ambassador balance and ready for M-Pesa withdrawal!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ready-to-Use Scripts */}
      {activeTab === "scripts" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Plug &amp; Play Marketing Material
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Copy-and-Paste Pitch Templates
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                These templates are automatically injected with your unique referral link (
                <span className="font-mono font-bold text-brand-600">{amb.referralCode}</span>
                ). Click &quot;Copy Script&quot; and paste into your groups or direct chats.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {pitchScripts.map((script, idx) => (
                <div
                  key={script.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        {script.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {script.audience}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {script.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {script.description}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {script.text}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyScript(script.text, idx)}
                    className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm"
                  >
                    {copiedScriptIndex === idx ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-gold-400" /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy This Script
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Promotion Channels */}
      {activeTab === "channels" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Distribution &amp; Outreach Strategy
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Where &amp; How to Promote Effectively
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                The top-performing ambassadors focus on specific channels where aspiring learners already spend time.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 font-bold">
                    WA
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    WhatsApp Status &amp; Groups
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  WhatsApp has the highest conversion rate in Kenya. Post short videos or flyers on your Status with a clear message:
                  <em>&ldquo;Reply to this status for course details!&rdquo;</em> When someone asks, send them your direct ambassador link.
                </p>
                <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  💡 Tip: Don&apos;t just spam links in random groups. Share a genuine story or showcase a sample graphic made by SCDS students first!
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-pink-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 font-bold">
                    TT
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    TikTok &amp; Instagram Reels
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create quick 15-second screen recordings showing:
                  &ldquo;How I edit videos on CapCut&rdquo;, &ldquo;How a UI Designer builds a mobile app in Figma&rdquo;, or &ldquo;How to learn design without a fancy degree.&rdquo;
                  Put your referral link in your bio.
                </p>
                <div className="text-[11px] text-pink-800 font-semibold bg-pink-50 p-2.5 rounded-lg border border-pink-100">
                  💡 Tip: The CapCut and UI/UX courses perform exceptionally well on TikTok and Instagram!
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-blue-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 font-bold">
                    CP
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Campus Tech &amp; Design Clubs
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Partner with university student leaders, computer science clubs, business associations, and engineering societies.
                  Offer to host an intro design session or distribute official SCDS digital course brochures.
                </p>
                <div className="text-[11px] text-blue-800 font-semibold bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  💡 Tip: If you need co-branded campus flyers, request them through the Support Desk!
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 font-bold">
                    HS
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    High School Leavers (KCSE)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High school leavers waiting to join university or college are eager for short, practical certifications that make them employable immediately.
                  Graphic Design and CapCut courses are ideal starting points for this demographic.
                </p>
                <div className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  💡 Tip: Parents often sponsor these courses for their children — emphasize job readiness and portfolio building!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Handling Student FAQs */}
      {activeTab === "objections" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Objection Handling
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Answers to Questions Prospective Students Ask
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Be prepared to answer these common questions with clarity and confidence.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  &ldquo;Are the classes physical, online, or both?&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Answer:</strong> SCDS offers flexible options! We have in-person hands-on lab sessions in Nairobi for learners who want physical immersion, as well as live interactive online evening/weekend cohorts for students across Kenya, East Africa, and diaspora. All classes include recorded sessions for revision.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  &ldquo;Do I need prior experience or an art/coding background?&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Answer:</strong> No prior experience is required! Courses are structured from foundational basics to advanced real-world project delivery. Instructors take learners step-by-step through industry standard tools.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  &ldquo;Do students get an official certificate upon completion?&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Answer:</strong> Yes. Graduates receive an official, verifiable SCDS Completion Certificate along with a live portfolio showcasing projects completed during the cohort.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  &ldquo;Can fees be paid in installments?&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Answer:</strong> Yes! SCDS offers manageable installment plans so students can begin learning with an initial deposit and clear the balance during the cohort duration.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  &ldquo;What if a student enters the website directly without clicking my link?&rdquo;
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Answer:</strong> They can manually type your Ambassador Referral Code (<span className="font-mono font-bold text-brand-600">{amb.referralCode}</span>) directly into the &quot;Referral Code (Optional)&quot; field on the application form at <span className="font-mono text-brand-600">/join</span>, and the referral will still be attributed to you 100%!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Code of Conduct */}
      {activeTab === "conduct" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Ethical Guidelines
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Ambassador Code of Conduct
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                To maintain the integrity of Sam Creative Design School and protect your ambassador status, all ambassadors must adhere to these standards.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What to Always Do
                </div>
                <ul className="space-y-2 text-emerald-900">
                  <li>• Clearly identify yourself as an authorized SCDS Ambassador.</li>
                  <li>• Share truthful course schedules, fees, and syllabus details.</li>
                  <li>• Provide helpful, encouraging support to prospective students.</li>
                  <li>• Respect group posting rules and permissions.</li>
                  <li>• Report any payment or enrolment queries promptly to SCDS support.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-rose-600" /> What is Strictly Prohibited
                </div>
                <ul className="space-y-2 text-rose-900">
                  <li>• No fake promises or guaranteeing employment after completion.</li>
                  <li>• No unauthorized fee discounts or collecting payments on your personal number. (All fees must go through official SCDS channels).</li>
                  <li>• No spamming unrelated WhatsApp groups or social comment sections.</li>
                  <li>• No self-referrals or submitting fraudulent fake student inquiries.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/resources"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600">
              Download Media Assets
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access high-res flyers, curriculum brochures, and Instagram templates.
          </p>
        </Link>

        <Link
          href="/dashboard/referrals"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600">
              Track My Referrals
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            See real-time status of student enquiries and verified enrolments.
          </p>
        </Link>

        <Link
          href="/dashboard/support"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600">
              Need Admin Help?
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submit a support ticket or reach the admissions desk on WhatsApp.
          </p>
        </Link>
      </div>
    </div>
  );
}
