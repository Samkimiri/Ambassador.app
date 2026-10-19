"use client";

import React, { useState } from "react";
import { Check, Copy, Megaphone, Sparkles } from "lucide-react";
import { useApp } from "@/context/app-context";

export default function AmbassadorCampaignsPage() {
  const { db, currentAmbassador } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const amb = currentAmbassador || db.ambassadors[0];
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const copyCampaignLink = (campId: string, courseSlug?: string) => {
    const url = `${origin}/join?ref=${amb.referralCode}${
      courseSlug ? `&course=${courseSlug}` : ""
    }`;
    navigator.clipboard.writeText(url);
    setCopiedId(campId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Growth &amp; Intake Sprints
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Official SCDS Campaigns
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Participate in active cohort campaigns to earn bonus impact points and
          commission boosts on verified enrolments.
        </p>
      </div>

      <div className="grid gap-6">
        {db.campaigns
          .filter((c) => c.status === "active" || c.status === "completed")
          .map((camp) => {
            const relatedCourses = db.courses.filter((c) =>
              camp.courseIds.includes(c.id)
            );
            const myCampReferrals = db.referrals.filter(
              (r) => r.ambassadorId === amb.id && r.campaignId === camp.id
            );
            const myVerified = myCampReferrals.filter(
              (r) => r.status === "payment_verified"
            ).length;

            return (
              <div
                key={camp.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <Megaphone className="h-3 w-3" /> {camp.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {camp.startDate} → {camp.endDate}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {camp.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700">
                      <Sparkles className="h-3.5 w-3.5 inline mr-1" />+
                      {camp.bonusPointsPerEnrolment} Bonus Pts · +
                      {camp.bonusCommissionPct}% Commission
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-12 text-xs">
                  <div className="md:col-span-8 space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {camp.description}
                    </p>
                    <div>
                      <strong className="text-slate-900">Objective:</strong>{" "}
                      <span className="text-slate-600">{camp.objective}</span>
                    </div>
                    <div>
                      <strong className="text-slate-900">
                        Target Audience:
                      </strong>{" "}
                      <span className="text-slate-600">
                        {camp.targetAudience}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-slate-600">
                      <strong className="text-slate-900 block mb-1">
                        Campaign Messaging &amp; Compliance Guidelines:
                      </strong>
                      {camp.guidelines}
                    </div>
                  </div>

                  <div className="md:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900">
                        Your Campaign Stats
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                          <div className="text-lg font-extrabold text-slate-900">
                            {myCampReferrals.length}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Attributed Leads
                          </div>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                          <div className="text-lg font-extrabold text-emerald-700">
                            {myVerified}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Verified Enrolments
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-slate-500 mb-1">
                          Eligible Courses ({relatedCourses.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {relatedCourses.map((c) => (
                            <span
                              key={c.id}
                              className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              {c.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyCampaignLink(camp.id, relatedCourses[0]?.slug)
                      }
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      {copiedId === camp.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Campaign Referral Link Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Campaign Referral Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

