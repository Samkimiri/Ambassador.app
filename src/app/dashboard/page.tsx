"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Facebook,
  Linkedin,
  Mail,
  Megaphone,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import {
  computeAmbassadorLevel,
  formatDate,
  formatKes,
  isQualifiedLeadStatus,
} from "@/lib/utils";
import { LevelBadge, ReferralStatusBadge } from "@/components/ui/status-badge";

export default function AmbassadorDashboardPage() {
  const { db, currentAmbassador } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      setCanNativeShare(true);
    }
  }, []);

  const amb = currentAmbassador || db.ambassadors[0];
  const myReferrals = db.referrals.filter((r) => r.ambassadorId === amb.id);
  const qualifiedLeads = myReferrals.filter((r) =>
    isQualifiedLeadStatus(r.status)
  );
  const verifiedEnrolments = myReferrals.filter(
    (r) => r.status === "payment_verified"
  );
  const pendingVerifications = myReferrals.filter(
    (r) => r.status === "enrolled" || r.status === "payment_pending"
  );

  // Leaderboard rank calculation
  const sortedAmbassadors = [...db.ambassadors]
    .filter((a) => a.isActive)
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const rank =
    sortedAmbassadors.findIndex((a) => a.id === amb.id) + 1 ||
    sortedAmbassadors.length;

  const levelProgress = computeAmbassadorLevel(
    amb.totalPoints,
    verifiedEnrolments.length,
    db.rewardRules.levelThresholds
  );

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const referralUrl = `${origin}/join?ref=${amb.referralCode}`;

  const handleCopy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsappText = `Join me at Sam Creative Design School (SCDS) and build real portfolio projects in Design, UI/UX, Web Dev, AI, CapCut, or SolidWorks CAD! Reserve your seat using my official ambassador link: ${referralUrl} (Code: ${amb.referralCode})`;
  const linkedinText = `Proud to represent Sam Creative Design School (SCDS) as an Official Ambassador! SCDS provides career-ready, practical training in Graphic Design, UI/UX Product Design (Figma), Fullstack Web Development, and Digital Media. Check out the upcoming cohorts with mentorship and certified portfolios: ${referralUrl}`;
  const twitterText = `Ready to build job-ready creative & tech skills? Join @SCDSDesign for hands-on cohorts in Design, UI/UX, Web Dev, CapCut & CAD. Reserve your seat with my Ambassador link:`;
  const telegramText = `🎨💻 Sam Creative Design School (SCDS) practical cohorts are open! Master Graphic Design, UI/UX (Figma), Web Development, CapCut video editing, and 3D CAD. Join via my official ambassador link: ${referralUrl} (Code: ${amb.referralCode})`;
  const facebookText = `Looking to start a career in creative design or tech? Sam Creative Design School (SCDS) offers hands-on, mentor-led courses in Graphic Design, UI/UX, Web Dev, and Video Production. Apply with my official link: ${referralUrl}`;
  const emailSubject = "Recommended: Practical Creative & Tech Courses at Sam Creative Design School (SCDS)";
  const emailBody = `Hello,\n\nI wanted to personally recommend Sam Creative Design School (SCDS). SCDS specializes in practical, portfolio-driven courses in Graphic Design, UI/UX Product Design, Fullstack Web Development, CapCut Video Editing, and 3D SolidWorks CAD.\n\nClasses are offered physically in Nairobi as well as live interactive online cohorts.\n\nYou can explore courses and enroll directly using my official Ambassador referral link:\n${referralUrl}\n\nReferral Code: ${amb.referralCode}\n\nBest regards,\n${amb.fullName}\nOfficial SCDS Ambassador`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(referralUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(telegramText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Sam Creative Design School - Ambassador Referral",
          text: whatsappText,
          url: referralUrl,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopy(referralUrl, "link");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Referral Share Banner — SCDS Electric Blue (#0048E8) & Golden Yellow (#F8B820) */}
      <div className="rounded-2xl bg-brand-600 text-white p-4 sm:p-6 lg:p-8 shadow-sm border border-brand-700 space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-bold text-navy-900 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-navy-900" /> Active SCDS Ambassador
              </span>
              <LevelBadge level={amb.level} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white pt-1">
              Welcome back, {amb.fullName.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              Share your official SCDS referral link across your networks to attribute course enquiries
              and earn verified rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-navy-900 hover:bg-gold-300 px-4 py-2.5 text-xs font-bold transition shadow-sm w-full sm:w-auto active:scale-95"
              >
                <Smartphone className="h-4 w-4 text-brand-600" /> Share via Phone Apps
              </button>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-gold-300 transition shadow-sm w-full sm:w-auto active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </a>
          </div>
        </div>

        {/* Unique Referral Code and Shareable Link Cards — Responsive for Mobile & Desktop */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-12 pt-3 border-t border-white/20">
          {/* Unique Referral Code Box */}
          <div className="md:col-span-4 rounded-xl bg-navy-900/90 border border-navy-800 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-inner">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Unique Referral Code
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-gold-400 mt-0.5 tracking-wider truncate">
                {amb.referralCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(amb.referralCode, "code")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-2 text-xs font-bold text-white transition shrink-0"
              title="Copy your referral code"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-gold-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Shareable Referral Attribution Link Box */}
          <div className="md:col-span-8 rounded-xl bg-navy-900/90 border border-navy-800 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Shareable Referral Attribution Link
                </div>
                <span className="text-[10px] text-gold-400/90 font-medium hidden sm:inline">
                  30-day cookie active
                </span>
              </div>
              <div
                onClick={() => handleCopy(referralUrl, "link")}
                className="text-xs font-mono text-white/95 bg-black/40 px-2.5 py-2 rounded-lg border border-white/10 break-all select-all cursor-pointer hover:border-gold-400/50 transition"
                title="Tap or click to copy link"
              >
                {referralUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(referralUrl, "link")}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold-400 hover:bg-gold-300 active:scale-95 px-4 py-2.5 text-xs font-bold text-navy-900 transition shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Platform Social Media Sharing Suite with Professionalism Guidelines */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Multi-Platform Professional Sharing
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any platform to share pre-written, professional invitations that automatically track leads back to your ambassador account.
            </p>
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Share with WhatsApp contacts, groups, or status"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>WhatsApp</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Share on LinkedIn with your professional network"
          >
            <Linkedin className="h-4 w-4 shrink-0" />
            <span>LinkedIn</span>
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-slate-900 text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Share on X (Twitter)"
          >
            <span className="font-bold text-sm leading-none shrink-0">𝕏</span>
            <span>Post to X</span>
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1b82b3] text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Share to Telegram student & tech groups"
          >
            <Send className="h-3.5 w-3.5 shrink-0" />
            <span>Telegram</span>
          </a>

          <a
            href={facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] hover:bg-[#0d65d9] text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Share on Facebook groups or feed"
          >
            <Facebook className="h-4 w-4 shrink-0" />
            <span>Facebook</span>
          </a>

          <a
            href={emailUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white p-2.5 text-xs font-bold transition shadow-sm active:scale-95"
            title="Send a pre-formatted email recommendation"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>Email</span>
          </a>
        </div>

        {/* Professionalism Guidelines */}
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 sm:p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0" />
            <span>Ambassador Professionalism &amp; Brand Etiquette</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-[11px] sm:text-xs text-slate-600">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-brand-600">1.</span>
              <span>
                <strong>Official Representation:</strong> Always introduce yourself as an authorized SCDS Ambassador to establish credibility.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-brand-600">2.</span>
              <span>
                <strong>Lead with Career Value:</strong> Highlight portfolio projects, hands-on lab training, and high-demand skills (UI/UX, CapCut, Web Dev).
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-brand-600">3.</span>
              <span>
                <strong>Respectful Sharing:</strong> Target student tech clubs, creative design groups, and interested peers. Never post unsolicited spam in unrelated groups.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ambassador Operations Playbook Callout */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-amber-50/50 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-gold-400 shrink-0 shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                New to the Program? Read the Ambassador Playbook
              </h2>
              <span className="rounded-md bg-gold-400 px-2 py-0.5 text-[10px] font-black uppercase text-navy-900">
                Essential Guide
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              Master how to share your links effectively, copy pre-written WhatsApp &amp; TikTok pitch scripts, understand course commission rates, and maximize your earnings.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/guide"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm shrink-0"
        >
          Open Ambassador Guide →
        </Link>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Referrals &amp; Clicks</span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {myReferrals.length} Leads
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {amb.clickCount} referral link clicks · {qualifiedLeads.length} qualified
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verified Enrolments</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {verifiedEnrolments.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {pendingVerifications.length} pending payment verification
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Commission Balance</span>
            <Coins className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatKes(amb.availableCommissionKes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Total earned: {formatKes(amb.totalCommissionKes)} · Paid:{" "}
            {formatKes(amb.paidCommissionKes)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Points &amp; Leaderboard</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-brand-600">
            {amb.totalPoints.toLocaleString()} pts
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Rank #{rank} of {sortedAmbassadors.length} · {amb.badgeIds.length} Badges
          </div>
        </div>
      </div>

      {/* Level Progression & Announcements */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Ambassador Tier Progression
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Current Level: {amb.level} ({levelProgress.commissionPct}% Base Commission)
              </h2>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>

          {levelProgress.nextLevel ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>
                  Progress to <strong>{levelProgress.nextLevel.level} Tier</strong> (
                  {levelProgress.nextLevel.commissionPct}% Commission)
                </span>
                <span>{levelProgress.progressPct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-brand-100 overflow-hidden">
                <div
                  className="h-full bg-gold-400 rounded-full transition-all"
                  style={{ width: `${levelProgress.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Target: {levelProgress.nextLevel.minPoints.toLocaleString()} pts &amp;{" "}
                {levelProgress.nextLevel.minEnrolments} verified enrolments.
              </p>
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-semibold">
              You have reached the highest SCDS Elite Ambassador tier!
            </p>
          )}

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Earned Recognition Badges ({amb.badgeIds.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {db.badges.map((badge) => {
                const earned = amb.badgeIds.includes(badge.id);
                return (
                  <span
                    key={badge.id}
                    title={badge.description}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold ${
                      earned
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    {badge.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Official SCDS Announcements
            </h2>
            <Megaphone className="h-5 w-5 text-brand-600" />
          </div>
          <div className="space-y-3">
            {db.announcements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {ann.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(ann.publishedAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Referral Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Referral Activity
            </h2>
            <p className="text-xs text-slate-500">
              Track your referred prospective learners from enquiry through verified tuition payment.
            </p>
          </div>
          <Link
            href="/dashboard/referrals"
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            View All ({myReferrals.length}) →
          </Link>
        </div>

        {myReferrals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              No referrals recorded yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Copy your unique referral link above or grab ready-to-share posters
              from the Resource Library to record your first learner enquiry!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">Learner</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Campaign</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {myReferrals.slice(0, 5).map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {ref.learnerName}
                      </div>
                      <div className="text-slate-500">{ref.learnerCounty}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {ref.courseTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {ref.campaignName || "Standard Referral"}
                    </td>
                    <td className="py-3 px-3">
                      <ReferralStatusBadge status={ref.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatDate(ref.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

