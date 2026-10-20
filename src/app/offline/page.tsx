"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, FolderKanban, Home, RefreshCw, Users, WifiOff } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";

export default function OfflinePage() {
  const { currentAmbassador, db } = useApp();
  const amb = currentAmbassador || db.ambassadors[0];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <WifiOff className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
              Offline-Ready PWA Mode Active
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              You Are Currently Working Offline
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              SCDS Ambassador Hub is engineered to work without an active internet
              connection. You can still view your referral code, copy marketing
              captions, inspect your cached dashboard, and record prospective
              learner enquiries locally.
            </p>
          </div>

          {amb && (
            <div className="rounded-xl border border-slate-200 bg-slate-950 text-white p-4 text-left flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">
                  Your Cached Ambassador Referral Code
                </div>
                <div className="text-base font-mono font-bold text-brand-400 mt-0.5">
                  {amb.referralCode}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/join?ref=${amb.referralCode}`
                  )
                }
                className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-500"
              >
                Copy Referral Link
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-3 text-slate-800 hover:bg-slate-100"
            >
              <Home className="h-4 w-4 text-brand-600" /> Dashboard
            </Link>
            <Link
              href="/dashboard/resources"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-3 text-slate-800 hover:bg-slate-100"
            >
              <FolderKanban className="h-4 w-4 text-brand-600" /> Captions
            </Link>
            <Link
              href="/join"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-white hover:bg-brand-700"
            >
              <Users className="h-4 w-4" /> Record Lead
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Local data persistence active
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-950"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
            </button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

