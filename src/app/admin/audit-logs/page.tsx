"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDateTime } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const { db } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Immutable Security &amp; Financial Trail
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          System Audit Logs ({db.auditLogs.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Every administrative decision, enrolment verification, reward rule
          update, and payout confirmation is recorded chronologically.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Audit Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-400">
                      <ShieldCheck className="h-3 w-3" /> {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {log.actorEmail}
                    </div>
                    <div className="text-[10px] uppercase text-slate-400">
                      {log.actorRole}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {log.entityType}:{log.entityId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

