"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes } from "@/lib/utils";

export default function AdminRewardsPage() {
  const { db, updateRewardRules } = useApp();
  const [pointsLead, setPointsLead] = useState(
    String(db.rewardRules.pointsPerQualifiedLead)
  );
  const [pointsEnrolment, setPointsEnrolment] = useState(
    String(db.rewardRules.pointsPerVerifiedEnrolment)
  );
  const [defaultComm, setDefaultComm] = useState(
    String(db.rewardRules.defaultCommissionPct)
  );
  const [minPayout, setMinPayout] = useState(
    String(db.rewardRules.minPayoutKes)
  );
  const [windowDays, setWindowDays] = useState(
    String(db.rewardRules.attributionWindowDays)
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRewardRules({
      pointsPerQualifiedLead: Number(pointsLead),
      pointsPerVerifiedEnrolment: Number(pointsEnrolment),
      defaultCommissionPct: Number(defaultComm),
      minPayoutKes: Number(minPayout),
      attributionWindowDays: Number(windowDays),
      isBusinessPolicyConfirmed: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Configurable Rewards Engine
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Rewards, Commissions &amp; Points Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure SCDS reward rules and inspect the immutable points and
          commission transaction ledgers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            Configure Reward &amp; Commission Policy
          </h2>
          {saved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Policy rules updated and
              logged in audit trail.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Points / Qualified Lead
              </label>
              <input
                type="number"
                value={pointsLead}
                onChange={(e) => setPointsLead(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Points / Verified Enrolment
              </label>
              <input
                type="number"
                value={pointsEnrolment}
                onChange={(e) => setPointsEnrolment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Commission (%)
              </label>
              <input
                type="number"
                value={defaultComm}
                onChange={(e) => setDefaultComm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Payout Threshold (KES)
              </label>
              <input
                type="number"
                value={minPayout}
                onChange={(e) => setMinPayout(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referral Attribution Window (Days)
            </label>
            <input
              type="number"
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Save Reward Policy
          </button>
        </form>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Auditable Commission Ledger ({db.commissions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-2.5 px-3">Ambassador</th>
                  <th className="py-2.5 px-3">Learner / Course</th>
                  <th className="py-2.5 px-3">Rate / Tuition</th>
                  <th className="py-2.5 px-3">Commission</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {c.ambassadorName}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {c.learnerName}
                      </div>
                      <div className="text-slate-500">{c.courseTitle}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {c.commissionRatePct}% of {formatKes(c.tuitionPaidKes)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-700">
                      {formatKes(c.amountKes)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

