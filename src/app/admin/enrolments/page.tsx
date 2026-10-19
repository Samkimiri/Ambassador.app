"use client";

import React, { useState } from "react";
import { CheckCircle2, FileCheck2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes } from "@/lib/utils";

export default function AdminEnrolmentsPage() {
  const { db, verifyEnrolment } = useApp();
  const [selectedRefId, setSelectedRefId] = useState(
    db.referrals.find((r) => r.status !== "payment_verified")?.id || ""
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [amountPaidKes, setAmountPaidKes] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const unverifiedReferrals = db.referrals.filter(
    (r) =>
      r.status !== "payment_verified" &&
      r.status !== "rejected" &&
      r.status !== "cancelled"
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedRefId || !paymentReference.trim()) {
      setFeedback({
        type: "error",
        text: "Please select a referral and provide a valid M-Pesa/Bank payment reference.",
      });
      return;
    }

    try {
      verifyEnrolment({
        referralId: selectedRefId,
        paymentReference,
        amountPaidKes: amountPaidKes ? Number(amountPaidKes) : undefined,
        notes,
      });
      setPaymentReference("");
      setAmountPaidKes("");
      setNotes("");
      setFeedback({
        type: "success",
        text: "Enrolment payment verified! Ambassador points and commission have been credited to the ledger.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Enrolment verification failed.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Admissions &amp; Tuition Verification
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Enrolment &amp; M-Pesa Payment Verification
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify prospective learner tuition payments to trigger idempotent
          points and commission rewards.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-brand-600" /> Verify Learner
            Enrolment
          </h2>

          {feedback && (
            <div
              className={`rounded-xl border p-3.5 text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Unverified Referral *
              </label>
              <select
                value={selectedRefId}
                onChange={(e) => setSelectedRefId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs"
              >
                <option value="">-- Select Referred Learner --</option>
                {unverifiedReferrals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.learnerName} — {r.courseTitle} ({r.referralCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M-Pesa / Bank Transaction Reference *
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) =>
                  setPaymentReference(e.target.value.toUpperCase())
                }
                placeholder="e.g. QL18TR50KP"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Tuition Paid (KES, leave blank for published fee)
              </label>
              <input
                type="number"
                value={amountPaidKes}
                onChange={(e) => setAmountPaidKes(e.target.value)}
                placeholder="e.g. 3500"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Confirmed on SCDS M-Pesa 0743475247"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Verify Payment &amp; Issue Ambassador Rewards
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Enrolment Verification Records ({db.enrolments.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-2.5 px-3">Learner / Course</th>
                  <th className="py-2.5 px-3">Ambassador</th>
                  <th className="py-2.5 px-3">Amount &amp; Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.enrolments.map((enr) => (
                  <tr key={enr.id}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {enr.learnerName}
                      </div>
                      <div className="text-slate-500">{enr.courseTitle}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {enr.ambassadorName}
                      </div>
                      <div className="font-mono text-[11px] text-brand-700">
                        {enr.referralCode}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {formatKes(enr.amountPaidKes)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {enr.paymentReference}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {enr.verificationStatus === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRefId(enr.referralId);
                            setPaymentReference(enr.paymentReference);
                            setAmountPaidKes(String(enr.amountPaidKes));
                          }}
                          className="rounded-lg bg-amber-50 border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          Select to Verify →
                        </button>
                      )}
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

