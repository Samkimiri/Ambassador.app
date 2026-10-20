"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckSquare,
  ClipboardList,
  Download,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/ambassadors", label: "Ambassadors", icon: Users },
  { href: "/admin/referrals", label: "Referrals", icon: CheckSquare },
  { href: "/admin/enrolments", label: "Enrolments", icon: FileCheck2 },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/rewards", label: "Rewards & Rules", icon: Award },
  { href: "/admin/payouts", label: "Payout Requests", icon: Wallet },
  { href: "/admin/resources", label: "Marketing Assets", icon: FolderKanban },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/reports", label: "Reports & CSV", icon: Download },
  { href: "/admin/settings", label: "Program Settings", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, switchDemoPersona, db } = useApp();

  if (!currentUser || currentUser.role !== "super_admin") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            403 — Super Administrator Access Only
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This console is restricted to authorized Sam Creative Design School
            administrators. Ambassadors and learners cannot access administrative
            records or modify roles.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => switchDemoPersona("super_admin")}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Switch to Super Admin (Demo)
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Return to Ambassador Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingApps = db.applications.filter(
    (a) => a.status === "pending"
  ).length;
  const pendingPayouts = db.payoutRequests.filter(
    (p) => p.status === "pending"
  ).length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-950 text-slate-300 flex flex-col justify-between">
        <div className="p-4 space-y-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-gold-400 font-extrabold text-sm">
              SC
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                SCDS Admin Console
              </div>
              <div className="text-[11px] text-slate-400">
                {currentUser.fullName}
              </div>
            </div>
          </Link>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", isActive ? "text-gold-400" : "text-slate-400")} />
                    {item.label}
                  </span>
                  {item.href === "/admin/applications" && pendingApps > 0 && (
                    <span className="rounded-full bg-gold-400 px-1.5 py-0.2 text-[10px] font-bold text-navy-900">
                      {pendingApps}
                    </span>
                  )}
                  {item.href === "/admin/payouts" && pendingPayouts > 0 && (
                    <span className="rounded-full bg-gold-400 px-1.5 py-0.2 text-[10px] font-bold text-navy-900">
                      {pendingPayouts}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-800 text-xs space-y-2">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            ← Public Website
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

