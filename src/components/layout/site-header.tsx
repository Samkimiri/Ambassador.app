"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  ExternalLink,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
    <div className="border-b border-navy-800 bg-navy-900 text-white text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold",
              isSupabaseLive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-brand-600 text-white border border-brand-400/40"
            )}
          >
            <Database className="h-3 w-3 text-gold-400" />
            {isSupabaseLive
              ? "Production Mode (Supabase Connected)"
              : "Development / Demo Mode (Local Stateful Persistence)"}
          </span>
          {capturedReferralCode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-400 text-navy-900 px-2.5 py-0.5 font-bold">
              <Sparkles className="h-3 w-3" />
              Referral Attribution: <strong>{capturedReferralCode}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-brand-200 hidden sm:inline font-medium">
            Quick Role Switcher:
          </span>
          <button
            type="button"
            onClick={() => switchDemoPersona("ambassador")}
            className={cn(
              "rounded-md px-2.5 py-1 transition font-semibold",
              currentUser?.role === "ambassador"
                ? "bg-gold-400 text-navy-900 shadow-sm"
                : "bg-navy-800 text-brand-100 hover:bg-brand-600 hover:text-white"
            )}
          >
            Ambassador (Amina)
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("super_admin")}
            className={cn(
              "rounded-md px-2.5 py-1 transition font-semibold",
              currentUser?.role === "super_admin"
                ? "bg-gold-400 text-navy-900 shadow-sm"
                : "bg-navy-800 text-brand-100 hover:bg-brand-600 hover:text-white"
            )}
          >
            Super Admin (Samuel Kimiri)
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("pending_applicant")}
            className={cn(
              "rounded-md px-2.5 py-1 transition font-semibold",
              currentUser?.status === "pending"
                ? "bg-gold-400 text-navy-900 shadow-sm"
                : "bg-navy-800 text-brand-100 hover:bg-brand-600 hover:text-white"
            )}
          >
            Pending Applicant
          </button>
          <button
            type="button"
            onClick={() => switchDemoPersona("guest")}
            className={cn(
              "rounded-md px-2.5 py-1 transition font-semibold",
              !currentUser
                ? "bg-gold-400 text-navy-900 shadow-sm"
                : "bg-navy-800 text-brand-100 hover:bg-brand-600 hover:text-white"
            )}
          >
            Prospective Learner
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset local demo database to initial seeded state"
            className="inline-flex items-center gap-1 rounded-md border border-brand-400/30 bg-navy-800 px-2.5 py-1 text-brand-100 hover:bg-brand-600 hover:text-white"
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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-lg shadow-sm border-2 border-gold-400">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-navy-900 text-base group-hover:text-brand-600 transition">
                SCDS.Design School
              </span>
              <span className="rounded-md bg-gold-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy-900">
                Ambassador Hub
              </span>
            </div>
            <p className="text-[11px] text-charcoal/70 font-medium">
              Exceptional, Strategic &amp; Realistic
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-charcoal">
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
                  "rounded-lg px-3.5 py-2 transition",
                  active
                    ? "bg-brand-50 text-brand-600 font-bold"
                    : "text-charcoal hover:bg-brand-50/60 hover:text-brand-600"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {currentUser ? (
            <>
              {currentUser.role === "super_admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-gold-400" />
                  Admin Console
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition shadow-sm"
                >
                  <UserCheck className="h-4 w-4 text-gold-400" />
                  Ambassador Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-brand-50 hover:border-brand-200 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-brand-50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-bold text-navy-900 shadow-sm hover:bg-gold-500 transition"
              >
                Become an Ambassador
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-lg p-2 text-navy-900 hover:bg-brand-50"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden space-y-3">
          <div className="flex flex-col space-y-1.5">
            {navLinks.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-3.5 py-2.5 text-sm font-semibold",
                    active
                      ? "bg-brand-600 text-white"
                      : "text-charcoal hover:bg-brand-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  href={currentUser.role === "super_admin" ? "/admin" : "/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-bold text-white"
                >
                  Open {currentUser.role === "super_admin" ? "Admin Console" : "Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl bg-gold-400 px-4 py-2.5 text-center text-sm font-bold text-navy-900"
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
    <footer className="border-t border-navy-800 bg-navy-900 text-brand-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-extrabold text-sm border border-gold-400">
                SC
              </div>
              <span className="font-bold text-white">
                Sam Creative Design School
              </span>
            </div>
            <p className="text-xs leading-relaxed text-brand-100/80">
              Empowering Kenyan creatives and engineers with practical,
              income-generating digital skills. Exceptional, Strategic &amp; Realistic.
            </p>
            <p className="text-xs text-gold-400 font-semibold">
              Lead Instructor: Samuel Ndung&apos;u Kimiri
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">
              Skill Tracks
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/courses/photoshop-masterclass" className="hover:text-white transition">Adobe Photoshop Masterclass</Link></li>
              <li><Link href="/courses/illustrator-training" className="hover:text-white transition">Adobe Illustrator Training</Link></li>
              <li><Link href="/courses/vibe-designing-uiux" className="hover:text-white transition">Vibe Designing — UI/UX</Link></li>
              <li><Link href="/courses/vibe-coding-web-dev" className="hover:text-white transition">Vibe Coding — Web Development</Link></li>
              <li><Link href="/courses/ai-prompt-engineering" className="hover:text-white transition">AI &amp; Prompt Engineering</Link></li>
              <li><Link href="/courses/solidworks-engineers" className="hover:text-white transition">SolidWorks for Engineers</Link></li>
              <li><Link href="/courses/capcut-masterclass" className="hover:text-white transition">CapCut Video Editing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">
              Ambassador Program
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auth/register" className="hover:text-white transition">Apply to Become an Ambassador</Link></li>
              <li><Link href="/ambassadors" className="hover:text-white transition">Public Leaderboard</Link></li>
              <li><Link href="/join" className="hover:text-white transition">Course Enquiry &amp; Referral Form</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Ambassador Portal</Link></li>
              <li><Link href="/admin" className="hover:text-white transition">SCDS Administrator Console</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">
              Official Contact &amp; Verification
            </h3>
            <ul className="space-y-2 text-xs">
              <li>Phone / WhatsApp: <a href="https://wa.me/254748201131" className="text-gold-400 font-semibold hover:underline">+254 748 201 131</a></li>
              <li>Email: <a href="mailto:samcreativegraphics7@gmail.com" className="hover:text-white transition">samcreativegraphics7@gmail.com</a></li>
              <li>Official M-Pesa Till / Phone: <span className="text-white font-semibold">0743475247 (Samuel Kimiri)</span></li>
              <li className="pt-1">
                <a
                  href="https://samcreativedesignschool.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gold-400 font-semibold hover:underline"
                >
                  samcreativedesignschool.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-navy-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-200/70 gap-4">
          <p>© {new Date().getFullYear()} Sam Creative Design School (SCDS). All rights reserved.</p>
          <p>Empowering Creatives. Building Professionals.</p>
        </div>
      </div>
    </footer>
  );
}
