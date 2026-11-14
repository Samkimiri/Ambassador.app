"use client";

import React, { useState } from "react";
import { Award, Trophy } from "lucide-react";
import { useApp } from "@/context/app-context";
import { LevelBadge } from "@/components/ui/status-badge";

export default function DashboardLeaderboardPage() {
  const { db, currentAmbassador } = useApp();
  const [period, setPeriod] = useState<"all_time" | "current_month">("all_time");
  const [visibleLimit, setVisibleLimit] = useState(50);

  const amb = currentAmbassador || db.ambassadors[0];
  const verifiedByAmb = new Map<string, number>();
  for (const r of db.referrals) {
    if (r.status === "payment_verified") {
      verifiedByAmb.set(r.ambassadorId, (verifiedByAmb.get(r.ambassadorId) || 0) + 1);
    }
  }
  const ranked = [...db.ambassadors]
    .filter((a) => a.isActive)
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const visibleRanked = ranked.slice(0, visibleLimit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Community Standings
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Ambassador Leaderboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by verified student enrolments and audited impact points.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
          className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-xs font-semibold text-slate-700"
        >
          <option value="all_time">All-Time Performance</option>
          <option value="current_month">Current Month</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="sm:hidden px-4 py-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100">
          Swipe horizontally to view full table →
        </div>
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[520px] text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Rank</th>
              <th className="py-3.5 px-4">Ambassador</th>
              <th className="py-3.5 px-4">Tier</th>
              <th className="py-3.5 px-4">Verified Enrolments</th>
              <th className="py-3.5 px-4">Badges</th>
              <th className="py-3.5 px-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRanked.map((item, idx) => {
              const verified = verifiedByAmb.get(item.id) || 0;
              const isMe = item.id === amb.id;
              return (
                <tr
                  key={item.id}
                  className={isMe ? "bg-brand-50/70" : "hover:bg-slate-50"}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {item.fullName}{" "}
                      {isMe && (
                        <span className="ml-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500">{item.institution}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <LevelBadge level={item.level} />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    {verified}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-semibold text-amber-800">
                      <Award className="h-3 w-3" /> {item.badgeIds.length}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-brand-600">
                    {item.totalPoints.toLocaleString()} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      {ranked.length > visibleLimit && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleLimit((n) => n + 50)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Show more ambassadors ({visibleRanked.length} of {ranked.length})
          </button>
        </div>
      )}
    </div>
  );
}

