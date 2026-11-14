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
  Menu,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
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
  { href: "/admin/trash", label: "Trash Platform", icon: Trash2 },
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
  const { currentUser, db } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
            <Link
              href="/auth/login"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              Sign In as Administrator
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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
        <div className="p-3 sm:p-4 lg:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-gold-400 font-extrabold text-sm">
                SC
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  SCDS Admin Console
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentUser.fullName}
                </div>
              </div>
            </Link>
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                Site
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-700 text-white hover:bg-slate-900"
                aria-label="Open Admin Menu"
                aria-expanded={mobileNavOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex lg:flex-col gap-1">
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
                  {item.href === "/admin/trash" && (db.trash?.length || 0) > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {db.trash?.length}
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

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            type="button"
            aria-label="Close Admin Menu"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-slate-950 text-slate-300 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    SCDS Admin Console
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {currentUser.fullName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close Admin Menu"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
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
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={cn("h-4 w-4", isActive ? "text-gold-400" : "text-slate-400")} />
                        {item.label}
                      </span>
                      {item.href === "/admin/applications" && pendingApps > 0 && (
                        <span className="rounded-full bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                          {pendingApps}
                        </span>
                      )}
                      {item.href === "/admin/payouts" && pendingPayouts > 0 && (
                        <span className="rounded-full bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                          {pendingPayouts}
                        </span>
                      )}
                      {item.href === "/admin/trash" && (db.trash?.length || 0) > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {db.trash?.length}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 text-sm space-y-2">
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                ← Public Website
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

