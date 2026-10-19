"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Sparkles } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { formatKes } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { db, capturedReferralCode } = useApp();

  const course = db.courses.find(
    (c) => c.slug === params?.slug || c.id === params?.slug
  );

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Course Not Found</h1>
          <p className="text-sm text-slate-600">
            The course you are looking for is not available.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-12 sm:px-6 space-y-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> All SCDS Courses
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-bold text-brand-400">
                {course.shortCode}
              </span>
              <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-0.5 text-xs font-semibold text-brand-700">
                {course.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" /> {course.duration}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900">
              {course.title}
            </h1>

            <p className="text-base text-slate-600 leading-relaxed">
              {course.description}
            </p>

            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Practical Skills &amp; Portfolio Deliverables
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {course.highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">
                How Learning Works at SCDS:
              </div>
              <p>
                24/7 Online LMS lessons + Weekly Practical Assignments + Direct
                WhatsApp Mentorship by Samuel Kimiri + Live Google Meet Review
                Sessions + Verified Completion Certificate.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-6 space-y-5">
              <div>
                <div className="text-xs text-slate-400">Published Tuition Fee</div>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {formatKes(course.publishedFeeKes)}
                </div>
                <div className="text-xs text-emerald-400 mt-1">
                  {course.nextIntake} · Open for Enrolment
                </div>
              </div>

              {capturedReferralCode && (
                <div className="rounded-xl bg-brand-500/15 border border-brand-500/30 p-3 text-xs text-brand-200">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-brand-400" />
                  Referred with ambassador code{" "}
                  <strong>{capturedReferralCode}</strong>
                </div>
              )}

              <div className="space-y-2.5">
                <Link
                  href={`/join?course=${course.slug}${
                    capturedReferralCode ? `&ref=${capturedReferralCode}` : ""
                  }`}
                  className="block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-500 transition"
                >
                  Submit Course Enquiry / Enroll
                </Link>
                <a
                  href={course.enrollmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  View on Main SCDS Portal <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="border-t border-slate-800 pt-4 text-[11px] text-slate-400 space-y-1">
                <div>Official M-Pesa Payment: 0743475247 (Samuel Kimiri)</div>
                <div>Support WhatsApp: +254 748 201 131</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

