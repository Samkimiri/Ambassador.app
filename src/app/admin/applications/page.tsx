"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Instagram,
  Laptop,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, getSocialLinkUrl } from "@/lib/utils";
import { AmbassadorApplication } from "@/types";

function computeReadiness(app: AmbassadorApplication) {
  let score = 50; // base score for completing application
  const highlights: string[] = [];

  if (app.deviceReadiness?.toLowerCase().includes("laptop")) {
    score += 15;
    highlights.push("Laptop Equipped");
  } else if (app.deviceReadiness) {
    score += 8;
    highlights.push("Smartphone Equipped");
  }

  if (
    app.audienceSize?.includes("500") ||
    app.audienceSize?.includes("2,000") ||
    app.audienceSize?.includes("8,500") ||
    app.audienceSize?.includes("1,500") ||
    app.audienceSize?.includes("1,100")
  ) {
    score += 15;
    highlights.push("High Campus Reach");
  } else if (app.audienceSize) {
    score += 8;
    highlights.push("Moderate Reach");
  }

  if (app.familiarTools && app.familiarTools.length >= 2) {
    score += 10;
    highlights.push(`${app.familiarTools.length} SCDS Tools`);
  } else if (app.familiarTools && app.familiarTools.length === 1) {
    score += 5;
    highlights.push("1 SCDS Tool");
  }

  if (
    app.pastAmbassadorExperience &&
    !app.pastAmbassadorExperience.toLowerCase().includes("first-time")
  ) {
    score += 10;
    highlights.push("Prior Leadership");
  }

  if (
    app.socialLinks?.instagram ||
    app.socialLinks?.tiktok ||
    app.socialLinks?.linkedin ||
    app.socialLinks?.portfolio
  ) {
    score += 10;
    highlights.push("Active Socials");
  }

  if (app.resumeUrl) {
    score += 5;
    highlights.push("CV Linked");
  }

  const normalized = Math.min(score, 100);
  const tier =
    normalized >= 85
      ? "Excellent Match"
      : normalized >= 70
      ? "Well Equipped"
      : "Foundational Candidate";

  return { score: normalized, tier, highlights };
}

export default function AdminApplicationsPage() {
  const {
    db,
    reviewApplication,
    deleteApplication,
    moveToTrash,
    isRealtimeConnected,
    refreshLiveState,
  } = useApp();
  const [filter, setFilter] = useState("ALL");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    refreshLiveState();
    const interval = setInterval(() => {
      refreshLiveState();
    }, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exclude deleted applications and sort with pending first, then newest on top
  const deletedSet = new Set(db.deletedApplicationIds || []);
  const sortedApplications = [...db.applications]
    .filter((a) => !deletedSet.has(a.id))
    .sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA; // Newest on top!
    });

  const filtered = sortedApplications.filter(
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
          ? "Unique referral code generated and ambassador dashboard unlocked permanently."
          : ""
      }`
    );
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === id ? null : curr));
      }, 5000);
      return;
    }

    try {
      const app = db.applications.find((a) => a.id === id);
      await moveToTrash(
        "application",
        id,
        name,
        `${app?.institution || "SCDS Applicant"} · ${app?.county || "Kenya"}`
      );
      setDeleteConfirmId(null);
      setFeedback(`Application for ${name} moved to Trash (retained for 48 hours with restore/purge options).`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback(
        `Failed to move application to Trash: ${
          err instanceof Error ? err.message : "Error"
        }`
      );
    }
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Onboarding Governance &amp; Candidate Evaluation
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
            Ambassador Applications ({sortedApplications.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Newest applications are placed at the top. Review applicant equipment readiness, campus reach, and qualifications before granting official SCDS Ambassador status.
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
            <option value="ALL">All Applications ({sortedApplications.length})</option>
            <option value="pending">
              Pending Review ({sortedApplications.filter((a) => a.status === "pending").length})
            </option>
            <option value="approved">
              Approved ({sortedApplications.filter((a) => a.status === "approved").length})
            </option>
            <option value="rejected">
              Rejected ({sortedApplications.filter((a) => a.status === "rejected").length})
            </option>
            <option value="suspended">
              Suspended ({sortedApplications.filter((a) => a.status === "suspended").length})
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No applications match this filter
          </h3>
          <p className="text-xs text-slate-500">
            {filter === "ALL"
              ? "No ambassador applications have been submitted yet."
              : `There are currently no applications with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((app, index) => {
            const igUrl = getSocialLinkUrl("instagram", app.socialLinks?.instagram);
            const liUrl = getSocialLinkUrl("linkedin", app.socialLinks?.linkedin);
            const ttUrl = getSocialLinkUrl("tiktok", app.socialLinks?.tiktok);
            const twUrl = getSocialLinkUrl("twitter", app.socialLinks?.twitter);
            const pfUrl = getSocialLinkUrl("portfolio", app.socialLinks?.portfolio);

            const hasSocials = Boolean(igUrl || liUrl || ttUrl || twUrl || pfUrl);
            const waUrl = getWhatsAppLink(app.phone, app.fullName);
            const readiness = computeReadiness(app);

            // Find matching active ambassador record if approved
            const matchingAmb = db.ambassadors.find(
              (amb) =>
                (app.userId && amb.userId === app.userId) ||
                amb.email.toLowerCase() === app.email.toLowerCase()
            );

            const isPending = app.status === "pending";
            const isApproved = app.status === "approved";
            const isDeletingThis = deleteConfirmId === app.id;

            // Mark as "NEW" if it's the very first pending application or submitted within last 48 hours
            const isRecentlySubmitted =
              Date.now() - new Date(app.createdAt || 0).getTime() <
              48 * 60 * 60 * 1000;

            return (
              <div
                key={app.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm space-y-5 transition ${
                  isApproved
                    ? "border-emerald-200 ring-1 ring-emerald-100"
                    : isPending
                    ? "border-amber-200"
                    : "border-slate-200"
                }`}
              >
                {/* Header Profile Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900">
                        {app.fullName}
                      </h2>

                      {/* Status Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {app.status}
                      </span>

                      {/* New Application Badge */}
                      {isRecentlySubmitted && isPending && (
                        <span className="rounded-full bg-blue-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                          New Application
                        </span>
                      )}

                      {/* Position in list */}
                      <span className="text-[11px] text-slate-400 font-medium">
                        #{index + 1} · ID: #{app.id.slice(-6).toUpperCase()}
                      </span>

                      {/* Active Referral Code if approved */}
                      {isApproved && matchingAmb?.referralCode && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                          Code: {matchingAmb.referralCode}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <a
                          href={`mailto:${app.email}`}
                          className="text-brand-600 hover:underline"
                        >
                          {app.email}
                        </a>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <a
                          href={`tel:${app.phone}`}
                          className="text-slate-700 hover:underline"
                        >
                          {app.phone}
                        </a>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {app.county}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {app.institution || "Independent / Non-Affiliated"}
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
                      Submitted {formatDate(app.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Job Readiness & Equipment Dossier */}
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                          Job Qualification &amp; Equipment Dossier
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Equipped Score:{" "}
                          <strong className="text-blue-950 font-bold">
                            {readiness.score}%
                          </strong>{" "}
                          · {readiness.tier}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {readiness.highlights.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800"
                        >
                          ✓ {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                    {/* Academic Profile */}
                    <div className="rounded-lg bg-white p-2.5 border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-blue-600" /> Academic Background
                      </span>
                      <div className="font-semibold text-slate-800">
                        {app.academicYear || "Undergraduate Student"}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {app.studyField || app.occupation}
                      </div>
                    </div>

                    {/* Equipment & Connectivity */}
                    <div className="rounded-lg bg-white p-2.5 border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                        <Laptop className="h-3 w-3 text-blue-600" /> Hardware &amp; Internet
                      </span>
                      <div className="font-semibold text-slate-800">
                        {app.deviceReadiness || "Laptop & Smartphone"}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Weekly Bandwidth: {app.weeklyHours || "5 - 10 hrs/week"}
                      </div>
                    </div>

                    {/* Campus & Community Reach */}
                    <div className="rounded-lg bg-white p-2.5 border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" /> Audience Reach
                      </span>
                      <div className="font-semibold text-slate-800">
                        {app.audienceSize || "100 - 500 peers"}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        Target: {app.targetAudience || "Undergraduates"}
                      </div>
                    </div>

                    {/* Leadership Experience & CV */}
                    <div className="rounded-lg bg-white p-2.5 border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                        <FileText className="h-3 w-3 text-blue-600" /> Leadership &amp; CV
                      </span>
                      <div className="font-semibold text-slate-800 truncate">
                        {app.pastAmbassadorExperience || "Campus Club / Society Rep"}
                      </div>
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          View CV / Work Samples <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <div className="text-slate-400 text-[11px]">No external CV URL</div>
                      )}
                    </div>
                  </div>

                  {/* Familiar SCDS Skills & Tools */}
                  {app.familiarTools && app.familiarTools.length > 0 && (
                    <div className="pt-1 border-t border-blue-100/80 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-600 mr-1">
                        Familiar SCDS Course Skills:
                      </span>
                      {app.familiarTools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-md bg-white border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Profiles & Strategy */}
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
                      Campus &amp; Location
                    </span>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div>
                        <strong>Campus:</strong> {app.institution || "Independent"}
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
                      Promotion Plan
                    </span>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div>
                        <strong>Strategy:</strong>{" "}
                        {app.promotionStrategy || "WhatsApp & Word of Mouth"}
                      </div>
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

                {/* Review History */}
                {app.reviewNotes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600 space-y-0.5">
                    <div>
                      <strong>Administrative Review History:</strong> {app.reviewNotes}
                    </div>
                    {app.reviewedBy && (
                      <div className="text-[11px] text-slate-400">
                        Reviewed by {app.reviewedBy} on{" "}
                        {app.reviewedAt ? formatDate(app.reviewedAt) : "Recently"}
                      </div>
                    )}
                  </div>
                )}

                {/* Review & Management Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Administrator review note (persisted to audit log)..."
                    value={notesMap[app.id] ?? app.reviewNotes ?? ""}
                    onChange={(e) =>
                      setNotesMap((prev) => ({ ...prev, [app.id]: e.target.value }))
                    }
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-600 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve Button (Only visible if not yet approved) */}
                    {!isApproved && (
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

                    {/* Approved & Active indicator */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved &amp; Active
                      </span>
                    )}

                    {/* Reject Button (Only if not rejected and not approved) */}
                    {app.status !== "rejected" && !isApproved && (
                      <button
                        type="button"
                        onClick={() =>
                          handleReview(app.id, "rejected", app.fullName)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}

                    {/* Suspend Button (If currently approved) */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() =>
                          handleReview(app.id, "suspended", app.fullName)
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Suspend
                      </button>
                    )}

                    {/* Delete Application Button with 2-step confirmation */}
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id, app.fullName)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        isDeletingThis
                          ? "bg-rose-600 text-white hover:bg-rose-700 font-bold animate-pulse shadow-sm"
                          : "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                      }`}
                      title="Permanently remove this application from the system"
                    >
                      {isDeletingThis ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Confirm Delete?
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}