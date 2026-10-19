"use client";

import React, { useState } from "react";
import { Search, Users } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ReferralStatusBadge } from "@/components/ui/status-badge";

export default function AmbassadorReferralsPage() {
  const { db, currentAmbassador } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const amb = currentAmbassador || db.ambassadors[0];
  const myReferrals = db.referrals.filter((r) => r.ambassadorId === amb.id);

  const filtered = myReferrals.filter((r) => {
    const matchesSearch =
      r.learnerName.toLowerCase().includes(search.toLowerCase()) ||
      r.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedReferral =
    myReferrals.find((r) => r.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Referral Attribution &amp; Lifecycle
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            My Referred Learners ({myReferrals.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View the real-time status and audit history for every prospective
            learner attributed to your referral code{" "}
            <strong className="font-mono text-brand-700">
              {amb.referralCode}
            </strong>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learner or course..."
              className="rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="lead_submitted">Lead Submitted</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="payment_verified">Payment Verified</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <Users className="h-8 w-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            No matching referrals found
          </h2>
          <p className="text-xs text-slate-500">
            Share your referral link <code className="font-mono">/join?ref={amb.referralCode}</code> to attribute prospective learners.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((ref) => (
                    <tr
                      key={ref.id}
                      onClick={() => setSelectedId(ref.id)}
                      className={`cursor-pointer transition ${
                        selectedReferral?.id === ref.id
                          ? "bg-brand-50/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {ref.learnerName}
                        </div>
                        <div className="text-slate-500">{ref.learnerCounty}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {ref.courseTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <ReferralStatusBadge status={ref.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(ref.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5">
            {selectedReferral && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {selectedReferral.id}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedReferral.learnerName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedReferral.courseTitle}
                    </p>
                  </div>
                  <ReferralStatusBadge status={selectedReferral.status} />
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <div>
                    <strong>Campaign:</strong>{" "}
                    {selectedReferral.campaignName || "General Referral"}
                  </div>
                  <div>
                    <strong>County:</strong> {selectedReferral.learnerCounty}
                  </div>
                  {selectedReferral.enquiryNotes && (
                    <div>
                      <strong>Learner Note:</strong> &ldquo;
                      {selectedReferral.enquiryNotes}&rdquo;
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lifecycle Audit Timeline
                  </div>
                  <ol className="space-y-3 border-l-2 border-slate-200 pl-4 ml-1">
                    {selectedReferral.events.map((ev) => (
                      <li key={ev.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <ReferralStatusBadge status={ev.newStatus} />
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(ev.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium pt-0.5">
                          {ev.note}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Actor: {ev.actorName}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

