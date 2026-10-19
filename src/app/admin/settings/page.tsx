"use client";

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDateTime } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { db, respondSupportRequest } = useApp();
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          System Governance &amp; Support
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Program Settings &amp; Ambassador Support Desk
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-brand-600" /> Administrator
            Permissions
          </div>
          <div className="space-y-2.5 text-xs">
            {db.profiles
              .filter((p) => p.role === "super_admin")
              .map((admin) => (
                <div
                  key={admin.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {admin.fullName}
                    </div>
                    <div className="text-slate-500">
                      {admin.email} · {admin.phone}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-bold uppercase text-brand-400">
                    Super Admin
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Ambassador Support Requests ({db.supportRequests.length})
          </h2>
          <div className="space-y-3">
            {db.supportRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {req.subject} — {req.ambassadorName}
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase">
                    {req.status}
                  </span>
                </div>
                <p className="text-slate-600">{req.message}</p>
                <div className="text-[11px] text-slate-400">
                  {req.category} · {formatDateTime(req.createdAt)}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write official response..."
                    value={replyMap[req.id] ?? req.adminResponse ?? ""}
                    onChange={(e) =>
                      setReplyMap((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      respondSupportRequest(
                        req.id,
                        replyMap[req.id] || "Resolved by SCDS Administration.",
                        "resolved"
                      )
                    }
                    className="rounded-lg bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Send &amp; Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

