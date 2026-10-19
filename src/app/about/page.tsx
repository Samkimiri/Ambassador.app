"use client";

import React from "react";
import Link from "next/link";
import { Award, CheckCircle2, ExternalLink, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Sam Creative Design School (SCDS)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Exceptional, Strategic &amp; Realistic Digital Education
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Sam Creative Design School (SCDS) trains students, creatives, and engineers across Kenya in practical graphic design, UI/UX, full-stack web development, AI prompt systems, video editing, and 3D SolidWorks CAD. Every course is built around doing real work: guided weekly lessons, practical tasks, personal instructor feedback from <strong>Samuel Ndung&apos;u Kimiri</strong>, 24/7 LMS access, and verified completion certificates.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
            <CheckCircle2 className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Practical Portfolio Focus</h2>
            <p className="text-sm text-slate-600">
              We do not promise overnight riches. We help learners build real posters, brand identities, UI prototypes, web apps, and CAD assemblies they can proudly present to clients and employers.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
            <Users className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Community-Driven Growth</h2>
            <p className="text-sm text-slate-600">
              Our ambassadors are alumni, student leaders, and digital creators who guide prospective learners to the right skill track and earn transparent, verifiable rewards.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Auditable Attribution</h2>
            <p className="text-sm text-slate-600">
              Every referral link click, course enquiry, and verified M-Pesa tuition payment is tracked with a complete audit trail and zero duplicate reward manipulation.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 text-white p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Ready to represent SCDS on your campus or network?</h3>
            <p className="text-sm text-slate-300">
              Apply in 2 minutes or submit a course enquiry for our upcoming intake.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Apply as Ambassador
            </Link>
            <a
              href="https://samcreativedesignschool.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Main SCDS Website <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

