"use client";

import React from "react";
import { Bell, CheckCircle2, Megaphone } from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDateTime } from "@/lib/utils";

export default function AmbassadorNotificationsPage() {
  const { db, currentAmbassador, markNotificationsRead } = useApp();
  const amb = currentAmbassador || db.ambassadors[0];

  const myNotifications = db.notifications.filter(
    (n) => n.userId === amb.userId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Updates &amp; Alerts
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Notifications &amp; Announcements
          </h1>
        </div>
        <button
          type="button"
          onClick={markNotificationsRead}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Mark All Read
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Personal Alerts ({myNotifications.length})
          </h2>
          {myNotifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 space-y-1 ${
                n.isRead
                  ? "border-slate-200 bg-white"
                  : "border-brand-300 bg-brand-50/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {n.title}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
              <p className="text-xs text-slate-600">{n.message}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Official SCDS Broadcasts
          </h2>
          {db.announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Megaphone className="h-4 w-4 text-brand-600" />
                {ann.title}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ann.body}
              </p>
              <div className="text-[11px] text-slate-400">
                Published by {ann.publishedBy} · {formatDateTime(ann.publishedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

