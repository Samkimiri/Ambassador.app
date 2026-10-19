"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/layout/site-header";
import { useApp } from "@/context/app-context";
import { learnerEnquirySchema } from "@/lib/validations";
import { formatKes } from "@/lib/utils";
import { Referral } from "@/types";

function JoinEnquiryFormContent() {
  const searchParams = useSearchParams();
  const { db, capturedReferralCode, captureReferralCode, submitLearnerEnquiry } =
    useApp();

  const refParam = searchParams.get("ref") || "";
  const courseParam = searchParams.get("course") || "";

  const [learnerName, setLearnerName] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [learnerPhone, setLearnerPhone] = useState("");
  const [learnerCounty, setLearnerCounty] = useState("Nairobi");
  const [courseId, setCourseId] = useState(
    db.courses.find((c) => c.slug === courseParam || c.id === courseParam)?.id ||
      db.courses[0]?.id ||
      ""
  );
  const [referralCode, setReferralCode] = useState(
    refParam || capturedReferralCode || ""
  );
  const [enquiryNotes, setEnquiryNotes] = useState("");
  const [consentGiven, setConsentGiven] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittedReferral, setSubmittedReferral] = useState<Referral | null>(
    null
  );

  useEffect(() => {
    if (refParam) {
      captureReferralCode(refParam);
      setReferralCode(refParam.toUpperCase());
    } else if (capturedReferralCode && !referralCode) {
      setReferralCode(capturedReferralCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam, capturedReferralCode]);

  useEffect(() => {
    if (courseParam) {
      const matched = db.courses.find(
        (c) => c.slug === courseParam || c.id === courseParam
      );
      if (matched) setCourseId(matched.id);
    }
  }, [courseParam, db.courses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = learnerEnquirySchema.safeParse({
      learnerName,
      learnerEmail,
      learnerPhone,
      learnerCounty,
      courseId,
      referralCode,
      enquiryNotes,
      consentGiven,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please check your inputs.");
      return;
    }

    try {
      const created = submitLearnerEnquiry(parsed.data);
      setSubmittedReferral(created);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your enquiry."
      );
    }
  };

  const selectedCourse = db.courses.find((c) => c.id === courseId);

  if (submittedReferral) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Enquiry Recorded · Reference #{submittedReferral.id.slice(-6).toUpperCase()}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Thank You, {submittedReferral.learnerName}!
          </h1>
          <p className="text-sm text-slate-600">
            Your enquiry for <strong>{submittedReferral.courseTitle}</strong> has
            been received by Sam Creative Design School Admissions.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-1.5 text-slate-600">
          <div>
            <strong>Selected Course:</strong> {submittedReferral.courseTitle}
          </div>
          <div>
            <strong>Attribution Code Recorded:</strong>{" "}
            <span className="font-mono font-semibold text-brand-700">
              {submittedReferral.referralCode}
            </span>
          </div>
          <div>
            <strong>Next Step:</strong> SCDS Admissions (+254 748 201 131) will
            reach out via WhatsApp/Phone with your Cohort 11 onboarding details.
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/courses"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Browse Other Courses
          </Link>
          <a
            href={`https://wa.me/254748201131?text=${encodeURIComponent(
              `Hello Samuel, I have submitted an enquiry for ${submittedReferral.courseTitle} (Ref: ${submittedReferral.referralCode}). My name is ${submittedReferral.learnerName}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Chat With Admissions on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Prospective Learner Application &amp; Enquiry
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Reserve Your Seat in the Next SCDS Cohort
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              No ambassador account is required to enquire or enroll. Fill out
              your details below.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="e.g. Daniel Kiprop"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={learnerEmail}
                onChange={(e) => setLearnerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Phone Number (Kenya) *
              </label>
              <input
                type="tel"
                required
                value={learnerPhone}
                onChange={(e) => setLearnerPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                County / City *
              </label>
              <input
                type="text"
                required
                value={learnerCounty}
                onChange={(e) => setLearnerCounty(e.target.value)}
                placeholder="e.g. Nairobi, Kiambu, Nakuru"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select SCDS Course *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
              >
                {db.courses
                  .filter((c) => c.status === "published")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({formatKes(c.publishedFeeKes)})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambassador Referral Code (Auto-captured)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. SCDS-AMI-8K4P"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono uppercase focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Learning Goals or Questions (Optional)
            </label>
            <textarea
              rows={3}
              value={enquiryNotes}
              onChange={(e) => setEnquiryNotes(e.target.value)}
              placeholder="Tell us about your current skill level or what you want to build..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              I consent to Sam Creative Design School contacting me via WhatsApp,
              phone, or email regarding course enrolment and cohort schedules.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
          >
            Submit Course Enquiry &amp; Reserve Seat
          </button>
        </form>
      </div>

      <div className="lg:col-span-5 space-y-5">
        {selectedCourse && (
          <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-6 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-0.5 text-xs font-semibold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> Selected Track Summary
            </span>
            <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedCourse.description}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <div className="text-slate-400">Duration</div>
                <div className="font-semibold text-white mt-0.5">
                  {selectedCourse.duration}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Published Tuition</div>
                <div className="font-bold text-brand-400 text-sm mt-0.5">
                  {formatKes(selectedCourse.publishedFeeKes)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Privacy &amp; Referral Protection
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you visit using an ambassador&apos;s referral link (such as{" "}
            <code className="text-brand-700 font-mono">/join?ref=SCDS-AMI-8K4P</code>
            ), your attribution is preserved for 30 days. Private ambassador
            account details are never exposed to prospective learners.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading course enquiry form...</div>}>
          <JoinEnquiryFormContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}

