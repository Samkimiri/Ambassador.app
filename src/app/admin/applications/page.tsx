"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const { db, reviewApplication } = useApp();
  const [filter, setFilter] = useState("ALL");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = db.applications.filter(
    (a) => filter === "ALL" || a.status === filter
  );

  const handleReview = (
    id: string,
    decision: "approved" | "rejected" | "suspended",
    name: string
  ) => {
    reviewApplication(id, decision, notesMap[id]);
    setFeedback(
      `Application for ${name} marked as ${decision.toUpperCase()}. ${
        decision === "approved"
          ? "Unique referral code generated and ambassador dashboard unlocked."
          : ""
      }`
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Onboarding Governance
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Ambassador Applications ({db.applications.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicant motivation and experience before granting official
            SCDS Ambassador status and generating referral codes.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Applications</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {app.fullName}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      app.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : app.status === "pending"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {app.email} · {app.phone} · {app.county} ·{" "}
                  {app.institution || "Independent"} ({app.occupation})
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Applied {formatDate(app.createdAt)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block">Motivation:</strong>
                <p className="text-slate-600 leading-relaxed">
                  {app.motivation}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block">
                  Leadership / Marketing Experience:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  {app.experience}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <input
                type="text"
                placeholder="Optional review note (recorded in audit log)..."
                value={notesMap[app.id] ?? app.reviewNotes ?? ""}
                onChange={(e) =>
                  setNotesMap((prev) => ({ ...prev, [app.id]: e.target.value }))
                }
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
              <div className="flex flex-wrap items-center gap-2">
                {app.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(app.id, "approved", app.fullName)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve &amp; Issue
                    Code
                  </button>
                )}
                {app.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(app.id, "rejected", app.fullName)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
                {app.status === "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(app.id, "suspended", app.fullName)
                    }
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Suspend Account
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

