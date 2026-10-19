"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes } from "@/lib/utils";

export default function AdminPayoutsPage() {
  const { db, processPayout } = useApp();
  const [txRefMap, setTxRefMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAction = (
    payoutRequestId: string,
    decision: "approved" | "paid" | "rejected"
  ) => {
    setFeedback(null);
    try {
      processPayout({
        payoutRequestId,
        decision,
        transactionReference: txRefMap[payoutRequestId],
      });
      setFeedback({
        type: "success",
        text: `Payout request marked as ${decision.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not process payout request.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          M-Pesa &amp; Bank Disbursements
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Payout Request Management ({db.payoutRequests.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Payouts cannot be marked as completed without entering a verified
          M-Pesa or bank transaction receipt reference.
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
                <th className="py-3.5 px-4">Ambassador</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method &amp; Recipient</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">M-Pesa Receipt &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.payoutRequests.map((req) => (
                <tr key={req.id}>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {req.ambassadorName}
                    </div>
                    <div className="text-slate-500">
                      {req.ambassadorEmail} · {formatDate(req.requestedAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {formatKes(req.amountKes)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {req.paymentMethod} · {req.recipientPhone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        req.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : req.status === "pending"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {req.status === "paid" ? (
                      <span className="font-mono font-bold text-emerald-700">
                        Paid Ref: {req.transactionReference}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="M-Pesa Code (e.g. QL20MP99)"
                          value={txRefMap[req.id] || ""}
                          onChange={(e) =>
                            setTxRefMap((prev) => ({
                              ...prev,
                              [req.id]: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleAction(req.id, "paid")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Paid
                        </button>
                        {req.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleAction(req.id, "rejected")}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    )}
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

