"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Megaphone,
  Share2,
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

  return (
    <div className="space-y-8">
      {/* Header & Referral Share Banner */}
      <div className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 shadow-sm border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active SCDS Ambassador
              </span>
              <LevelBadge level={amb.level} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-1">
              Welcome back, {amb.fullName.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Share your official SCDS referral link to attribute course enquiries
              and earn verified rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
            >
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                whatsappText
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Share on X
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-12 pt-2 border-t border-slate-800/80">
          <div className="md:col-span-4 rounded-xl bg-slate-900 border border-slate-800 p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                Unique Referral Code
              </div>
              <div className="text-base font-mono font-bold text-brand-400 mt-0.5">
                {amb.referralCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(amb.referralCode, "code")}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          <div className="md:col-span-8 rounded-xl bg-slate-900 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-[11px] text-slate-400">
                Shareable Referral Attribution Link
              </div>
              <div className="text-xs sm:text-sm font-mono text-slate-200 truncate mt-0.5">
                {referralUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(referralUrl, "link")}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Link Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Referral Link
                </>
              )}
            </button>
          </div>
        </div>
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
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all"
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
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
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

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
            <table className="w-full text-left border-collapse">
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

