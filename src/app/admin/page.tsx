"use client";

import React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ClipboardList,
  Coins,
  MousePointerClick,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes, isQualifiedLeadStatus } from "@/lib/utils";
import { ReferralStatusBadge } from "@/components/ui/status-badge";

export default function AdminOverviewPage() {
  const { db } = useApp();

  const totalAmbassadors = db.ambassadors.length;
  const activeAmbassadors = db.ambassadors.filter((a) => a.isActive).length;
  const pendingApplications = db.applications.filter(
    (a) => a.status === "pending"
  ).length;
  const totalClicks = db.ambassadors.reduce((acc, a) => acc + a.clickCount, 0);
  const qualifiedLeads = db.referrals.filter((r) =>
    isQualifiedLeadStatus(r.status)
  ).length;
  const verifiedEnrolments = db.referrals.filter(
    (r) => r.status === "payment_verified"
  ).length;
  const conversionRate =
    qualifiedLeads > 0
      ? Math.round((verifiedEnrolments / qualifiedLeads) * 100)
      : 0;

  const approvedCommissions = db.commissions
    .filter((c) => c.status === "approved")
    .reduce((acc, c) => acc + c.amountKes, 0);
  const paidCommissions = db.payoutRequests
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amountKes, 0);
  const pendingPayoutClaims = db.payoutRequests
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amountKes, 0);

  const campaignPerformance = db.campaigns.map((camp) => {
    const campRefs = db.referrals.filter((r) => r.campaignId === camp.id);
    const verified = campRefs.filter(
      (r) => r.status === "payment_verified"
    ).length;
    return {
      name: camp.name.split(" ").slice(0, 3).join(" "),
      leads: campRefs.length,
      verified,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            SCDS Executive Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Administrator Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry across ambassador applications, referral
            attribution, verified enrolments, and M-Pesa commission payouts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/applications"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Review Applications ({pendingApplications})
          </Link>
          <Link
            href="/admin/enrolments"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Verify Enrolments
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ambassadors &amp; Applicants</span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {activeAmbassadors} Active / {totalAmbassadors} Total
          </div>
          <div className="mt-1 text-xs text-amber-700 font-medium">
            {pendingApplications} pending applications
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Referral Clicks &amp; Leads</span>
            <MousePointerClick className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalClicks} Clicks · {qualifiedLeads} Leads
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Clicks are tracked separately from leads
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verified Enrolments</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {verifiedEnrolments} Enrolments ({conversionRate}%)
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Lead-to-verified conversion rate
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Commissions &amp; Payouts</span>
            <Wallet className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatKes(approvedCommissions)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Paid: {formatKes(paidCommissions)} · Pending Claims:{" "}
            {formatKes(pendingPayoutClaims)}
          </div>
        </div>
      </div>

      {/* Campaign Analytics Chart & Recent Audit Log */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Campaign Performance (Leads vs Verified Enrolments)
              </h2>
              <p className="text-xs text-slate-500">
                Live comparison across active SCDS growth campaigns
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="leads"
                  name="Qualified Leads"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="verified"
                  name="Verified Enrolments"
                  fill="#ea580c"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent Security &amp; Ledger Audit Trail
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {db.auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-brand-700 text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Referrals Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Latest Referral Submissions
          </h2>
          <Link
            href="/admin/referrals"
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Manage All Referrals →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-3">Learner</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Attributed Ambassador</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.referrals.slice(0, 6).map((ref) => (
                <tr key={ref.id}>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {ref.learnerName}
                    </div>
                    <div className="text-slate-500">
                      {ref.learnerEmail} · {ref.learnerPhone}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {ref.courseTitle}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {ref.ambassadorName}
                    </div>
                    <div className="font-mono text-[11px] text-brand-700">
                      {ref.referralCode}
                    </div>
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
      </div>
    </div>
  );
}

