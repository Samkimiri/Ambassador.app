"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Database,
  ExternalLink,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

export function EnvironmentBanner() {
  const {
    isSupabaseLive,
    currentUser,
    switchDemoPersona,
    resetDemoData,
    capturedReferralCode,
  } = useApp();

  return (
    <div className="border-b border-slate-800 bg-slate-950 text-slate-200 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
              isSupabaseLive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-brand-500/20 text-brand-300 border border-brand-500/30"
            )}
          >
            <Database className="h-3 w-3" />
            {isSupabaseLive
              ? "Production Mode (Supabase Connected)"
              : "Development / Demo Mode (Local Stateful Persistence)"}
          </span>
          {capturedReferralCode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 text-sky-300 font-medium">
              <Sparkles className="h-3 w-3" />
              Active Referral Attribution: <strong>{capturedReferralCode}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Quick Role Switcher:</span>
          <button
            type="button"
            onClick={() => switchDemoPersona("ambassador")}
            className={cn(
              "rounded px-2 py-1 transition font-medium",
              currentUser?.role === "ambassador"
                ? "bg-brand-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Ambassador (Amina)
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("super_admin")}
            className={cn(
              "rounded px-2 py-1 transition font-medium",
              currentUser?.role === "super_admin"
                ? "bg-brand-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Super Admin (Samuel Kimiri)
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("pending_applicant")}
            className={cn(
              "rounded px-2 py-1 transition font-medium",
              currentUser?.status === "pending"
                ? "bg-brand-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Pending Applicant
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("guest")}
            className={cn(
              "rounded px-2 py-1 transition font-medium",
              !currentUser
                ? "bg-brand-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            Prospective Learner
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset local demo database to initial seeded state"
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const { currentUser, signOut } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/courses", label: "Courses" },
    { href: "/ambassadors", label: "Leaderboard" },
    { href: "/about", label: "About SCDS" },
    { href: "/join", label: "Course Enquiry" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-brand-500 font-bold text-lg shadow-sm border border-brand-500/30">
            SC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-base">
                SCDS.Design School
              </span>
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 border border-brand-200">
                Ambassador Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Exceptional, Strategic &amp; Realistic
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition hover:text-slate-950",
                  active && "text-brand-600 font-semibold"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <>
              {currentUser.role === "super_admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-brand-400" />
                  Admin Console
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
                >
                  <UserCheck className="h-4 w-4" />
                  Ambassador Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
              >
                Become an Ambassador
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  href={currentUser.role === "super_admin" ? "/admin" : "/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Open {currentUser.role === "super_admin" ? "Admin Console" : "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Apply as Ambassador
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
                SC
              </div>
              <span className="font-bold text-white">
                Sam Creative Design School
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Empowering Kenyan creatives and engineers with practical,
              income-generating digital skills. Exceptional, Strategic &amp; Realistic.
            </p>
            <p className="text-xs text-slate-500">
              Lead Instructor: Samuel Ndung&apos;u Kimiri
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Skill Tracks
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/courses/photoshop-masterclass" className="hover:text-white">Adobe Photoshop Masterclass</Link></li>
              <li><Link href="/courses/illustrator-training" className="hover:text-white">Adobe Illustrator Training</Link></li>
              <li><Link href="/courses/vibe-designing-uiux" className="hover:text-white">Vibe Designing — UI/UX</Link></li>
              <li><Link href="/courses/vibe-coding-web-dev" className="hover:text-white">Vibe Coding — Web Development</Link></li>
              <li><Link href="/courses/ai-prompt-engineering" className="hover:text-white">AI &amp; Prompt Engineering</Link></li>
              <li><Link href="/courses/solidworks-engineers" className="hover:text-white">SolidWorks for Engineers</Link></li>
              <li><Link href="/courses/capcut-masterclass" className="hover:text-white">CapCut Video Editing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Ambassador Program
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auth/register" className="hover:text-white">Apply to Become an Ambassador</Link></li>
              <li><Link href="/ambassadors" className="hover:text-white">Public Leaderboard</Link></li>
              <li><Link href="/join" className="hover:text-white">Course Enquiry &amp; Referral Form</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Ambassador Portal</Link></li>
              <li><Link href="/admin" className="hover:text-white">SCDS Administrator Console</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Official Contact &amp; Verification
            </h3>
            <ul className="space-y-2 text-xs">
              <li>Phone / WhatsApp: <a href="https://wa.me/254748201131" className="text-brand-400 hover:underline">+254 748 201 131</a></li>
              <li>Email: <a href="mailto:samcreativegraphics7@gmail.com" className="hover:text-white">samcreativegraphics7@gmail.com</a></li>
              <li>Official M-Pesa Till / Phone: <span className="text-slate-200 font-medium">0743475247 (Samuel Kimiri)</span></li>
              <li className="pt-1">
                <a
                  href="https://samcreativedesignschool.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-400 hover:underline"
                >
                  samcreativedesignschool.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Sam Creative Design School (SCDS). All rights reserved.</p>
          <p>Empowering Creatives. Building Professionals.</p>
        </div>
      </div>
    </footer>
  );
}

