"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, getSocialLinkUrl } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const { db, reviewApplication, isRealtimeConnected, refreshLiveState } = useApp();
  const [filter, setFilter] = useState("ALL");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = db.applications.filter(
    (a) => filter === "ALL" || a.status === filter
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshLiveState();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleReview = async (
    id: string,
    decision: "approved" | "rejected" | "suspended",
    name: string
  ) => {
    await reviewApplication(id, decision, notesMap[id]);
    setFeedback(
      `Application for ${name} marked as ${decision.toUpperCase()}. ${
        decision === "approved"
          ? "Unique referral code generated and ambassador dashboard unlocked."
          : ""
      }`
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const digits = phone.replace(/\D/g, "");
    const international = digits.startsWith("0")
      ? `254${digits.slice(1)}`
      : digits.startsWith("254")
      ? digits
      : `254${digits}`;
    return `https://wa.me/${international}?text=${encodeURIComponent(
      `Hello ${name}, this is Samuel Kimiri from Sam Creative Design School regarding your Ambassador application.`
    )}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Onboarding Governance &amp; Candidate Review
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isRealtimeConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isRealtimeConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-blue-500"
                }`}
              />
              {isRealtimeConnected
                ? "Live WebSockets (Push Active)"
                : "Live Event Sync Active"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Ambassador Applications ({db.applications.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicant credentials, social media presence, campus reach, and outreach strategy before granting official SCDS Ambassador status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            title="Force refresh live database state"
          >
            <RotateCw
              className={`h-3.5 w-3.5 text-slate-500 ${
                isRefreshing ? "animate-spin text-brand-600" : ""
              }`}
            />
            {isRefreshing ? "Syncing..." : "Refresh"}
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Applications ({db.applications.length})</option>
            <option value="pending">
              Pending Review ({db.applications.filter((a) => a.status === "pending").length})
            </option>
            <option value="approved">
              Approved ({db.applications.filter((a) => a.status === "approved").length})
            </option>
            <option value="rejected">
              Rejected ({db.applications.filter((a) => a.status === "rejected").length})
            </option>
            <option value="suspended">
              Suspended ({db.applications.filter((a) => a.status === "suspended").length})
            </option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid gap-5">
        {filtered.map((app) => {
          const igUrl = getSocialLinkUrl("instagram", app.socialLinks?.instagram);
          const liUrl = getSocialLinkUrl("linkedin", app.socialLinks?.linkedin);
          const ttUrl = getSocialLinkUrl("tiktok", app.socialLinks?.tiktok);
          const twUrl = getSocialLinkUrl("twitter", app.socialLinks?.twitter);
          const pfUrl = getSocialLinkUrl("portfolio", app.socialLinks?.portfolio);

          const hasSocials = Boolean(igUrl || liUrl || ttUrl || twUrl || pfUrl);
          const waUrl = getWhatsAppLink(app.phone, app.fullName);

          return (
            <div
              key={app.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
            >
              {/* Header Profile Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {app.fullName}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        app.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : app.status === "pending"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: #{app.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <a href={`mailto:${app.email}`} className="text-brand-600 hover:underline">
                        {app.email}
                      </a>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <a href={`tel:${app.phone}`} className="text-slate-700 hover:underline">
                        {app.phone}
                      </a>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {app.county}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {app.institution || "Independent / Self-Employed"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {app.occupation}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                    title="Open instant WhatsApp chat with applicant"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${app.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    Email
                  </a>
                  <div className="text-xs text-slate-400 pl-1">
                    Applied {formatDate(app.createdAt)}
                  </div>
                </div>
              </div>

              {/* Social Media Presence & Outreach Strategy */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Social Media Profiles
                  </span>
                  {hasSocials ? (
                    <div className="flex flex-wrap gap-2">
                      {liUrl && (
                        <a
                          href={liUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                          LinkedIn
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                      {igUrl && (
                        <a
                          href={igUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50/70 px-2.5 py-1 text-xs font-semibold text-pink-700 hover:bg-pink-100 transition"
                        >
                          <Instagram className="h-3.5 w-3.5 text-pink-600" />
                          Instagram
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                      {ttUrl && (
                        <a
                          href={ttUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 transition"
                        >
                          TikTok
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                      {twUrl && (
                        <a
                          href={twUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                        >
                          X (Twitter)
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                      {pfUrl && (
                        <a
                          href={pfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          <Globe className="h-3.5 w-3.5 text-emerald-600" />
                          Portfolio / Site
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No social links submitted
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Campus / Community Reach
                  </span>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      <strong>Campus:</strong> {app.institution || "Not attached to a university"}
                    </div>
                    <div>
                      <strong>County:</strong> {app.county}
                    </div>
                    <div>
                      <strong>Occupation:</strong> {app.occupation}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Strategy &amp; Compliance
                  </span>
                  <div className="text-xs text-slate-700 space-y-1">
                    {app.promotionStrategy && (
                      <div>
                        <strong>Strategy:</strong> {app.promotionStrategy}
                      </div>
                    )}
                    {app.targetAudience && (
                      <div>
                        <strong>Target:</strong> {app.targetAudience}
                      </div>
                    )}
                    <div className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Terms &amp; Code of Conduct Accepted
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation & Experience Details */}
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-1.5">
                  <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Statement of Motivation:
                  </strong>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {app.motivation}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-1.5">
                  <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-brand-600" /> Leadership &amp; Marketing Experience:
                  </strong>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {app.experience}
                  </p>
                </div>
              </div>

              {/* Review History if available */}
              {app.reviewNotes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600 space-y-0.5">
                  <div>
                    <strong>Administrative Review History:</strong> {app.reviewNotes}
                  </div>
                  {app.reviewedBy && (
                    <div className="text-[11px] text-slate-400">
                      Reviewed by {app.reviewedBy} on {app.reviewedAt ? formatDate(app.reviewedAt) : "Recently"}
                    </div>
                  )}
                </div>
              )}

              {/* Review Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Optional administrator review note (persisted to audit log)..."
                  value={notesMap[app.id] ?? app.reviewNotes ?? ""}
                  onChange={(e) =>
                    setNotesMap((prev) => ({ ...prev, [app.id]: e.target.value }))
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-600 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {app.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleReview(app.id, "approved", app.fullName)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve &amp; Issue Referral Code
                    </button>
                  )}
                  {app.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleReview(app.id, "rejected", app.fullName)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  {app.status === "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleReview(app.id, "suspended", app.fullName)
                      }
                      className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
