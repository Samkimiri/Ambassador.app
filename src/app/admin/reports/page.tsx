"use client";

import React from "react";
import { Download } from "lucide-react";
import { useApp } from "@/context/app-context";

export default function AdminReportsPage() {
  const { db } = useApp();

  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReferralsCsv = () => {
    downloadCsv(
      `scds-referrals-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Referral ID",
        "Learner Name",
        "Learner Email",
        "Learner Phone",
        "Course",
        "Ambassador",
        "Referral Code",
        "Status",
        "Created At",
      ],
      db.referrals.map((r) => [
        r.id,
        r.learnerName,
        r.learnerEmail,
        r.learnerPhone,
        r.courseTitle,
        r.ambassadorName,
        r.referralCode,
        r.status,
        r.createdAt,
      ])
    );
  };

  const exportCommissionsCsv = () => {
    downloadCsv(
      `scds-commissions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Commission ID",
        "Ambassador",
        "Learner",
        "Course",
        "Tuition Paid (KES)",
        "Commission Rate (%)",
        "Commission Amount (KES)",
        "Status",
        "Date",
      ],
      db.commissions.map((c) => [
        c.id,
        c.ambassadorName,
        c.learnerName,
        c.courseTitle,
        String(c.tuitionPaidKes),
        String(c.commissionRatePct),
        String(c.amountKes),
        c.status,
        c.createdAt,
      ])
    );
  };

  const exportAmbassadorsCsv = () => {
    downloadCsv(
      `scds-ambassadors-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Ambassador ID",
        "Full Name",
        "Email",
        "Phone",
        "Referral Code",
        "Tier",
        "Total Points",
        "Total Commission (KES)",
        "Available Commission (KES)",
        "Paid Commission (KES)",
      ],
      db.ambassadors.map((a) => [
        a.id,
        a.fullName,
        a.email,
        a.phone,
        a.referralCode,
        a.level,
        String(a.totalPoints),
        String(a.totalCommissionKes),
        String(a.availableCommissionKes),
        String(a.paidCommissionKes),
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Protected Data Exports
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Reports &amp; CSV Exports
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Download structured CSV reports for accounting, M-Pesa reconciliation,
          and cohort admissions review. Restricted to Super Administrators.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Referrals &amp; Attribution Report
            </h2>
            <p className="text-xs text-slate-500">
              Exports all {db.referrals.length} learner enquiries, attributed
              ambassador codes, and current verification statuses.
            </p>
          </div>
          <button
            type="button"
            onClick={exportReferralsCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" /> Export Referrals CSV
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Commissions &amp; Financial Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Exports all {db.commissions.length} verified commission entries
              for M-Pesa reconciliation.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCommissionsCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Download className="h-4 w-4" /> Export Commissions CSV
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Ambassador Directory &amp; Balances
            </h2>
            <p className="text-xs text-slate-500">
              Exports all {db.ambassadors.length} approved ambassadors, tiers,
              points, and payout balances.
            </p>
          </div>
          <button
            type="button"
            onClick={exportAmbassadorsCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export Ambassadors CSV
          </button>
        </div>
      </div>
    </div>
  );
}

