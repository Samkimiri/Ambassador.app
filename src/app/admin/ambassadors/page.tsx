"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/status-badge";

export default function AdminAmbassadorsDirectoryPage() {
  const { db } = useApp();
  const [search, setSearch] = useState("");

  const filtered = db.ambassadors.filter(
    (a) =>
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(search.toLowerCase()) ||
      a.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Directory &amp; Performance
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Approved Ambassadors ({db.ambassadors.length})
          </h1>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, campus..."
            className="rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Ambassador</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Clicks / Leads / Verified</th>
                <th className="py-3.5 px-4">Points</th>
                <th className="py-3.5 px-4">Total Commission</th>
                <th className="py-3.5 px-4">Available Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((amb) => {
                const refs = db.referrals.filter(
                  (r) => r.ambassadorId === amb.id
                );
                const verified = refs.filter(
                  (r) => r.status === "payment_verified"
                ).length;

                return (
                  <tr key={amb.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {amb.fullName}
                      </div>
                      <div className="text-slate-500">
                        {amb.email} · {amb.phone} · {amb.institution}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {amb.referralCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <LevelBadge level={amb.level} />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {amb.clickCount} clicks · {refs.length} leads ·{" "}
                      <span className="text-emerald-700 font-bold">
                        {verified} verified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      {amb.totalPoints.toLocaleString()} pts
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatKes(amb.totalCommissionKes)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatKes(amb.availableCommissionKes)}
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

