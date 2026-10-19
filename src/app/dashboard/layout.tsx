"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  Clock,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldAlert,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { cn, formatDate } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/status-badge";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/referrals", label: "My Referrals", icon: Users },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/resources", label: "Resource Library", icon: FolderKanban },
  { href: "/dashboard/rewards", label: "Points & Payouts", icon: Award },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/support", label: "Support Desk", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    currentUser,
    currentAmbassador,
    currentApplication,
    db,
    signOut,
  } = useApp();

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-brand-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">
            Authentication Required
          </h1>
          <p className="text-xs text-slate-600">
            Please sign in with your ambassador account or use the Quick Role
            Switcher in the top bar to preview the Ambassador Dashboard.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/auth/login"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enforce that pending/rejected applicants do NOT get approved ambassador privileges
  if (
    currentUser.role !== "super_admin" &&
    (!currentAmbassador || !currentAmbassador.isActive)
  ) {
    const appStatus = currentApplication?.status || currentUser.status;
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Application Status: {appStatus.toUpperCase()}
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                {appStatus === "pending"
                  ? "Your Ambassador Application is Under Review"
                  : "Ambassador Privileges Restricted"}
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {appStatus === "pending"
              ? "Thank you for applying to the SCDS Ambassador Hub! Our administration team reviews every application before issuing official referral links and marketing materials."
              : `Your ambassador account is currently marked as ${appStatus}. Please contact SCDS Support if you have questions.`}
          </p>

          {currentApplication && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 text-slate-600">
              <div>
                <strong>Applicant:</strong> {currentApplication.fullName} (
                {currentApplication.email})
              </div>
              <div>
                <strong>Institution / County:</strong>{" "}
                {currentApplication.institution || "—"} ·{" "}
                {currentApplication.county}
              </div>
              <div>
                <strong>Submitted:</strong>{" "}
                {formatDate(currentApplication.createdAt)}
              </div>
              {currentApplication.reviewNotes && (
                <div>
                  <strong>Admin Notes:</strong> {currentApplication.reviewNotes}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Return to Public Home
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeAmb = currentAmbassador || db.ambassadors[0];
  const unreadCount = db.notifications.filter(
    (n) => n.userId === activeAmb.userId && !n.isRead
  ).length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
        <div className="p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-brand-500 font-bold text-sm">
                SC
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  SCDS Ambassador
                </div>
                <div className="text-[11px] text-slate-500">
                  Code: <span className="font-mono font-semibold text-brand-700">{activeAmb.referralCode}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeAmb.fullName}
              </span>
              <LevelBadge level={activeAmb.level} />
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {activeAmb.institution}
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-brand-400" : "text-slate-400"
                      )}
                    />
                    {item.label}
                  </span>
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 py-0.2 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-200 space-y-2">
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            ← Public Website
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

