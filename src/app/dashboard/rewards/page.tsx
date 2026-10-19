"use client";

import React, { useState } from "react";
import { Award, CheckCircle2, Coins, Wallet } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes } from "@/lib/utils";
import { payoutRequestSchema } from "@/lib/validations";

export default function AmbassadorRewardsPage() {
  const { db, currentAmbassador, requestPayout } = useApp();
  const amb = currentAmbassador || db.ambassadors[0];

  const [amountKes, setAmountKes] = useState(
    String(Math.max(db.rewardRules.minPayoutKes, amb.availableCommissionKes))
  );
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "BANK_TRANSFER">(
    "MPESA"
  );
  const [recipientPhone, setRecipientPhone] = useState(amb.payoutPhone || amb.phone);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const myLedger = db.pointsLedger.filter((p) => p.ambassadorId === amb.id);
  const myCommissions = db.commissions.filter((c) => c.ambassadorId === amb.id);
  const myPayouts = db.payoutRequests.filter((p) => p.ambassadorId === amb.id);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsed = payoutRequestSchema.safeParse({
      amountKes,
      paymentMethod,
      recipientPhone,
    });
    if (!parsed.success) {
      setFeedback({
        type: "error",
        text: parsed.error.issues[0]?.message || "Invalid payout details.",
      });
      return;
    }

    try {
      requestPayout(parsed.data);
      setFeedback({
        type: "success",
        text: `Payout request for ${formatKes(
          parsed.data.amountKes
        )} submitted for SCDS Administrator verification.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Payout request failed.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Audited Ledger &amp; M-Pesa Disbursements
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Points, Commissions &amp; Payout Requests
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          All points and commissions are recorded as immutable ledger entries upon verified enrolment.
        </p>
      </div>

      {/* Balances */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">
            Available Commission for Payout
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {formatKes(amb.availableCommissionKes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Min threshold: {formatKes(db.rewardRules.minPayoutKes)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">
            Total Disbursed Commissions
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatKes(amb.paidCommissionKes)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Lifetime earned: {formatKes(amb.totalCommissionKes)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">
            Cumulative Impact Points
          </div>
          <div className="mt-2 text-2xl font-extrabold text-brand-600">
            {amb.totalPoints.toLocaleString()} pts
          </div>
          <div className="mt-1 text-xs text-slate-500">
            +{db.rewardRules.pointsPerQualifiedLead} pts/lead · +
            {db.rewardRules.pointsPerVerifiedEnrolment} pts/enrolment
          </div>
        </div>
      </div>

      {/* Payout Request Form & Payout History */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Request Commission Payout
            </h2>
          </div>

          {feedback && (
            <div
              className={`rounded-xl border p-3 text-xs font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount to Withdraw (KES) *
              </label>
              <input
                type="number"
                min={db.rewardRules.minPayoutKes}
                step="50"
                required
                value={amountKes}
                onChange={(e) => setAmountKes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "MPESA" | "BANK_TRANSFER")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
              >
                <option value="MPESA">M-Pesa Mobile Money (Kenya)</option>
                <option value="BANK_TRANSFER">Kenyan Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered M-Pesa Phone Number *
              </label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={amb.availableCommissionKes < db.rewardRules.minPayoutKes}
              className="w-full rounded-xl bg-brand-600 py-3 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {amb.availableCommissionKes < db.rewardRules.minPayoutKes
                ? `Minimum ${formatKes(db.rewardRules.minPayoutKes)} Required`
                : "Submit Payout Claim"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Payout Request History
          </h2>
          {myPayouts.length === 0 ? (
            <p className="text-xs text-slate-500">
              No payout requests submitted yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Requested</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method / Phone</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Receipt Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-3 text-slate-500">
                        {formatDate(p.requestedAt)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {formatKes(p.amountKes)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.paymentMethod} · {p.recipientPhone}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            p.status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "pending"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {p.transactionReference || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Auditable Commissions & Points Ledger */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Verified Commission Ledger ({myCommissions.length})
          </h2>
          <div className="space-y-2.5">
            {myCommissions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {c.learnerName} — {c.courseTitle}
                  </div>
                  <div className="text-slate-500">
                    {c.commissionRatePct}% of {formatKes(c.tuitionPaidKes)} ·{" "}
                    {formatDate(c.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-emerald-700">
                    +{formatKes(c.amountKes)}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    {c.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Points Transaction Ledger ({myLedger.length})
          </h2>
          <div className="space-y-2.5">
            {myLedger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {entry.reason}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Key: {entry.eventKey} · {formatDate(entry.createdAt)}
                  </div>
                </div>
                <div className="font-extrabold text-brand-600">
                  +{entry.pointsDelta} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

