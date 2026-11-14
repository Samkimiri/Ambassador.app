"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  Clock,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShieldAlert,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { cn, formatDate, generateReferralCode } from "@/lib/utils";
import { AmbassadorProfile } from "@/types";
import { LevelBadge } from "@/components/ui/status-badge";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/guide", label: "Ambassador Guide", icon: BookOpen },
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
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);
  const {
    currentUser,
    currentAmbassador,
    currentApplication,
    db,
    signOut,
  } = useApp();

  const handleSignOut = () => {
    signOut();
    router.push("/auth/login");
  };

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-brand-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">
            Authentication Required
          </h1>
          <p className="text-xs text-slate-600">
            Please sign in with your authorized ambassador account or submit a new application to join the team.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/auth/login"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. Check if the ambassador account is blocked by admin
  const isBlocked =
    currentUser.status === "blocked" ||
    currentUser.status === "suspended" ||
    Boolean(currentAmbassador?.isBlocked);

  if (isBlocked && currentUser.role !== "super_admin") {
    const blockReason =
      currentAmbassador?.blockReason ||
      "Administrative review / Policy compliance check";

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-2xl border border-rose-200 bg-white p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                Account Status: BLOCKED
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Ambassador Privileges Suspended
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Your ambassador account privileges have been suspended by the administration. While your account is blocked, access to your referral link, marketing tools, and payout requests is disabled.
          </p>

          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-xs space-y-2 text-rose-950">
            <div>
              <strong>Reason for Suspension:</strong> {blockReason}
            </div>
            <div>
              <strong>Ambassador:</strong> {currentAmbassador?.fullName || currentUser.fullName} ({currentUser.email})
            </div>
            <div>
              <strong>Support Notice:</strong> If you believe this action was taken in error or have addressed compliance requirements, please reach out to the SCDS administration team.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <a
              href="mailto:Samcreativedesignschool@gmail.com?subject=Ambassador%20Account%20Reinstatement%20Request"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Contact SCDS Support →
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // An ambassador is approved if their application is approved, their role is ambassador/super_admin, their profile status is active/approved, or an active ambassador record exists
  const rawAppStatus = currentApplication?.status || currentUser.status || "pending";
  const appStatus = rawAppStatus.trim().toLowerCase();
  const isApproved =
    currentUser.role === "super_admin" ||
    (currentUser.role === "ambassador" && currentUser.status !== "blocked") ||
    currentUser.status?.toLowerCase() === "active" ||
    currentUser.status?.toLowerCase() === "approved" ||
    currentApplication?.status?.toLowerCase() === "approved" ||
    appStatus === "approved" ||
    appStatus === "active" ||
    Boolean(currentAmbassador && currentAmbassador.isActive && !currentAmbassador.isBlocked);

  // If the applicant is not approved (pending, rejected, suspended), show the review status screen
  if (!isApproved) {
    const isPending = appStatus === "pending" || appStatus === "under_review";
    const isRejected = appStatus === "rejected";
    const isSuspended = appStatus === "suspended";

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isPending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isPending ? "text-amber-700" : "text-rose-700"
                }`}
              >
                Application Status: {appStatus.toUpperCase()}
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                {isPending
                  ? "Your Ambassador Application is Under Review"
                  : isRejected
                  ? "Ambassador Application Not Approved"
                  : isSuspended
                  ? "Ambassador Account Suspended"
                  : "Ambassador Account Under Review"}
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {isPending
              ? "Thank you for applying to the SCDS Ambassador Hub! Our administration team reviews every application before issuing official referral links and marketing materials."
              : isRejected
              ? "Thank you for your interest in SCDS. Your application was reviewed and could not be approved at this time. Please contact SCDS Support if you have questions."
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
              onClick={handleSignOut}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeAmb: AmbassadorProfile =
    currentAmbassador ||
    db.ambassadors.find(
      (a) =>
        (currentUser.id && a.userId === currentUser.id) ||
        a.email.toLowerCase() === currentUser.email.toLowerCase()
    ) || {
      id: `amb-${currentUser.id}`,
      userId: currentUser.id,
      fullName: currentUser.fullName || currentApplication?.fullName || "Ambassador",
      email: currentUser.email,
      phone: currentUser.phone || currentApplication?.phone || "",
      referralCode: generateReferralCode(
        currentUser.fullName || currentApplication?.fullName || "Ambassador",
        db.ambassadors.map((a) => a.referralCode)
      ),
      level: "Starter",
      totalPoints: 0,
      availablePoints: 0,
      totalCommissionKes: 0,
      availableCommissionKes: 0,
      paidCommissionKes: 0,
      payoutMethod: "MPESA",
      payoutPhone: currentUser.phone || currentApplication?.phone || "",
      county: currentApplication?.county || "Nairobi",
      institution: currentApplication?.institution || "",
      occupation: currentApplication?.occupation || "Ambassador",
      bio: `${currentApplication?.occupation || "Ambassador"} representing SCDS in ${currentApplication?.county || "Kenya"}.`,
      isActive: true,
      clickCount: 0,
      badgeIds: [],
      createdAt: currentApplication?.createdAt || new Date().toISOString(),
    };
  const unreadCount = db.notifications.filter(
    (n) => n.userId === activeAmb.userId && !n.isRead
  ).length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
        <div className="p-3 sm:p-5 lg:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-gold-400 font-extrabold text-sm shadow-sm">
                SC
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-navy-900 truncate">
                  SCDS Ambassador
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Code: <span className="font-mono font-bold text-brand-600">{activeAmb.referralCode}</span>
                </div>
              </div>
            </Link>
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Site
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 text-navy-900 hover:bg-slate-100"
                aria-label="Open Dashboard Menu"
                aria-expanded={mobileNavOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="hidden lg:block rounded-xl border border-brand-100 bg-surface p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 truncate">
                {activeAmb.fullName}
              </span>
              <LevelBadge level={activeAmb.level} />
            </div>
            <div className="text-[11px] text-slate-600 truncate">
              {activeAmb.institution}
            </div>
          </div>

          <nav className="hidden lg:flex lg:flex-col gap-1">
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
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-charcoal hover:bg-surface hover:text-brand-600"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-gold-400" : "text-slate-400"
                      )}
                    />
                    {item.label}
                  </span>
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-gold-400 px-1.5 py-0.2 text-[10px] font-bold text-navy-900">
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
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            type="button"
            aria-label="Close Dashboard Menu"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-navy-900 truncate">
                    {activeAmb.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Code: <span className="font-mono font-bold text-brand-600">{activeAmb.referralCode}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close Dashboard Menu"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl border border-brand-100 bg-surface p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-navy-900 truncate">
                    {activeAmb.institution || "SCDS Ambassador"}
                  </span>
                  <LevelBadge level={activeAmb.level} />
                </div>
              </div>

              <nav className="flex flex-col gap-1">
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
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-charcoal hover:bg-surface hover:text-brand-600"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-gold-400" : "text-slate-400"
                          )}
                        />
                        {item.label}
                      </span>
                      {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                        <span className="rounded-full bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                ← Public Website
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleSignOut();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

