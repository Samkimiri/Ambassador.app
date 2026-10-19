"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, Trophy } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { LevelBadge } from "@/components/ui/status-badge";

export default function PublicLeaderboardPage() {
  const { db } = useApp();
  const [period, setPeriod] = useState<"current_month" | "previous_month" | "all_time">("all_time");
  const [campaignFilter, setCampaignFilter] = useState("ALL");

  const activeAmbassadors = db.ambassadors.filter((a) => a.isActive);

  const rows = activeAmbassadors
    .map((amb) => {
      const ambReferrals = db.referrals.filter((r) => {
        if (r.ambassadorId !== amb.id) return false;
        if (campaignFilter !== "ALL" && r.campaignId !== campaignFilter) return false;
        if (period === "current_month") {
          return r.createdAt.startsWith("2026-10");
        }
        if (period === "previous_month") {
          return r.createdAt.startsWith("2026-09");
        }
        return true;
      });

      const verifiedEnrolments = ambReferrals.filter(
        (r) => r.status === "payment_verified"
      ).length;
      const qualifiedLeads = ambReferrals.filter(
        (r) => r.status !== "clicked" && r.status !== "rejected" && r.status !== "cancelled"
      ).length;

      const points =
        period === "all_time" && campaignFilter === "ALL"
          ? amb.totalPoints
          : verifiedEnrolments * db.rewardRules.pointsPerVerifiedEnrolment +
            qualifiedLeads * db.rewardRules.pointsPerQualifiedLead;

      // Privacy protection: only display first name + last initial and institution, never phone/email/payout details
      const nameParts = amb.fullName.trim().split(" ");
      const publicDisplayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : amb.fullName;

      return {
        id: amb.id,
        displayName: publicDisplayName,
        institution: amb.institution,
        level: amb.level,
        verifiedEnrolments,
        qualifiedLeads,
        points,
        badgeCount: amb.badgeIds.length,
      };
    })
    .sort((a, b) => b.points - a.points || b.verifiedEnrolments - a.verifiedEnrolments);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-12 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Verified Impact Rankings
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              SCDS Ambassador Leaderboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Ranked transparently by verified student enrolments and audited points. Private contact and payout data are strictly protected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="all_time">All-Time Performance</option>
              <option value="current_month">Current Month (Oct 2026)</option>
              <option value="previous_month">Previous Month (Sep 2026)</option>
            </select>

            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Campaigns</option>
              {db.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Ambassador</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4">Verified Enrolments</th>
                  <th className="py-3.5 px-4">Qualified Leads</th>
                  <th className="py-3.5 px-4">Earned Badges</th>
                  <th className="py-3.5 px-4 text-right">Eligible Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{row.displayName}</div>
                      <div className="text-xs text-slate-500">{row.institution}</div>
                    </td>
                    <td className="py-4 px-4">
                      <LevelBadge level={row.level} />
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-700">
                      {row.verifiedEnrolments}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{row.qualifiedLeads}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        <Award className="h-3.5 w-3.5" /> {row.badgeCount} Badges
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-brand-600">
                      {row.points.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

