"use client";

import React, { useState } from "react";
import { useApp } from "@/context/app-context";
import { ALLOWED_REFERRAL_TRANSITIONS, formatDate } from "@/lib/utils";
import { ReferralStatusBadge } from "@/components/ui/status-badge";
import { ReferralStatus } from "@/types";

export default function AdminReferralsPage() {
  const { db, updateReferralStatus, verifyEnrolment } = useApp();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [mpesaRefMap, setMpesaRefMap] = useState<Record<string, string>>({});

  const handleStatusChange = (referralId: string, newStatus: ReferralStatus) => {
    setFeedback(null);
    try {
      if (newStatus === "payment_verified") {
        const paymentReference =
          mpesaRefMap[referralId]?.trim() ||
          `MPESA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        verifyEnrolment({
          referralId,
          paymentReference,
        });
        setFeedback({
          type: "success",
          text: `Payment verified (${paymentReference}) and rewards credited to ambassador ledger.`,
        });
      } else {
        updateReferralStatus(referralId, newStatus);
        setFeedback({
          type: "success",
          text: `Referral status updated to ${newStatus}.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update referral.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Attribution &amp; Lifecycle Control
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Referral Management ({db.referrals.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review prospective learner enquiries, update lifecycle statuses, and
          verify tuition payments with full audit logging.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Learner</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Attributed Ambassador</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Transition / Verify Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.referrals.map((ref) => {
                const allowedNext =
                  ALLOWED_REFERRAL_TRANSITIONS[ref.status] || [];
                return (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {ref.learnerName}
                      </div>
                      <div className="text-slate-500">
                        {ref.learnerEmail} · {ref.learnerPhone}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Submitted {formatDate(ref.createdAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {ref.courseTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {ref.ambassadorName}
                      </div>
                      <div className="font-mono text-[11px] text-brand-700">
                        {ref.referralCode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <ReferralStatusBadge status={ref.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {ref.status !== "payment_verified" && (
                          <input
                            type="text"
                            placeholder="M-Pesa Ref (e.g. QL19XP)"
                            value={mpesaRefMap[ref.id] || ""}
                            onChange={(e) =>
                              setMpesaRefMap((prev) => ({
                                ...prev,
                                [ref.id]: e.target.value,
                              }))
                            }
                            className="w-36 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono uppercase"
                          />
                        )}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(
                                ref.id,
                                e.target.value as ReferralStatus
                              );
                            }
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          <option value="">Move status to...</option>
                          {allowedNext.map((st) => (
                            <option key={st} value={st}>
                              → {st.replace(/_/g, " ").toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

