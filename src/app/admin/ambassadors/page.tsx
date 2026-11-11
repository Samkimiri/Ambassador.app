"use client";

import React, { useState } from "react";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  ChevronRight,
  ExternalLink,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate, formatKes, getSocialLinkUrl } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/status-badge";
import { AmbassadorProfile } from "@/types";

export default function AdminAmbassadorsDirectoryPage() {
  const { db, broadcastDbChange } = useApp();
  const [search, setSearch] = useState("");
  const [selectedAmbassador, setSelectedAmbassador] =
    useState<AmbassadorProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  const filtered = db.ambassadors.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(search.toLowerCase()) ||
      a.institution.toLowerCase().includes(search.toLowerCase()) ||
      a.county.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && a.isActive) ||
      (statusFilter === "SUSPENDED" && !a.isActive);

    return matchesSearch && matchesStatus;
  });

  const getWhatsAppLink = (phone: string, name: string, code: string) => {
    const digits = phone.replace(/\D/g, "");
    const international = digits.startsWith("0")
      ? `254${digits.slice(1)}`
      : digits.startsWith("254")
      ? digits
      : `254${digits}`;
    return `https://wa.me/${international}?text=${encodeURIComponent(
      `Hello ${name}, this is Samuel Kimiri from Sam Creative Design School management regarding your SCDS Ambassador activities (Ref: ${code}).`
    )}`;
  };

  const handleToggleActive = async (amb: AmbassadorProfile) => {
    const nextStatus = !amb.isActive;
    const nextDb = {
      ...db,
      ambassadors: db.ambassadors.map((a) =>
        a.id === amb.id ? { ...a, isActive: nextStatus } : a
      ),
      profiles: db.profiles.map((p) =>
        p.id === amb.userId
          ? {
              ...p,
              status: (nextStatus ? "active" : "suspended") as "active" | "suspended",
            }
          : p
      ),
    };
    await broadcastDbChange(nextDb);
    setSelectedAmbassador((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Ambassador Operations &amp; Intelligence
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Approved Ambassador Directory ({db.ambassadors.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect full ambassador credentials, verified social links, campus reach, outreach strategies, and live earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, campus, email..."
              className="rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "SUSPENDED")}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses ({db.ambassadors.length})</option>
            <option value="ACTIVE">Active ({db.ambassadors.filter((a) => a.isActive).length})</option>
            <option value="SUSPENDED">Suspended ({db.ambassadors.filter((a) => !a.isActive).length})</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Ambassador Profile</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Clicks / Leads / Enrolled</th>
                <th className="py-3.5 px-4">Points</th>
                <th className="py-3.5 px-4">Available Commission</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((amb) => {
                const refs = db.referrals.filter((r) => r.ambassadorId === amb.id);
                const verified = refs.filter((r) => r.status === "payment_verified").length;

                return (
                  <tr
                    key={amb.id}
                    onClick={() => setSelectedAmbassador(amb)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{amb.fullName}</span>
                        {amb.credentialId && (
                          <span title="Verified SCDS Ambassador">
                            <BadgeCheck className="h-3.5 w-3.5 text-brand-600 inline" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {amb.email} · {amb.phone}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {amb.institution || "Independent"} · {amb.county}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {amb.referralCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <LevelBadge level={amb.level} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          amb.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {amb.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {amb.clickCount} clicks · {refs.length} leads ·{" "}
                      <span className="text-emerald-700 font-bold">
                        {verified} verified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      {amb.totalPoints.toLocaleString()} pts
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatKes(amb.availableCommissionKes)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAmbassador(amb);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ambassador Full Professional Dossier Modal */}
      {selectedAmbassador && (() => {
        const matchingApp = db.applications.find(
          (app) =>
            (app.userId && app.userId === selectedAmbassador.userId) ||
            app.email.toLowerCase() === selectedAmbassador.email.toLowerCase()
        );

        const socialLinks = selectedAmbassador.socialLinks || matchingApp?.socialLinks || {};
        const igUrl = getSocialLinkUrl("instagram", socialLinks.instagram);
        const liUrl = getSocialLinkUrl("linkedin", socialLinks.linkedin);
        const ttUrl = getSocialLinkUrl("tiktok", socialLinks.tiktok);
        const twUrl = getSocialLinkUrl("twitter", socialLinks.twitter);
        const pfUrl = getSocialLinkUrl("portfolio", socialLinks.portfolio);

        const hasSocials = Boolean(igUrl || liUrl || ttUrl || twUrl || pfUrl);
        const waUrl = getWhatsAppLink(
          selectedAmbassador.phone,
          selectedAmbassador.fullName,
          selectedAmbassador.referralCode
        );

        const refs = db.referrals.filter((r) => r.ambassadorId === selectedAmbassador.id);
        const verifiedCount = refs.filter((r) => r.status === "payment_verified").length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedAmbassador(null)}
                className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header & Credential Card */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950 text-white p-6 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 border border-brand-500/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-300">
                      <Sparkles className="h-3 w-3" /> Official SCDS Ambassador Credential
                    </span>
                    <h2 className="text-2xl font-black text-white">
                      {selectedAmbassador.fullName}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedAmbassador.occupation} · {selectedAmbassador.institution || "Independent"} · {selectedAmbassador.county}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Verifiable Credential ID
                    </div>
                    <div className="font-mono text-sm font-bold text-brand-400">
                      {selectedAmbassador.credentialId || `SCDS-AMB-2026-${selectedAmbassador.id.slice(-4).toUpperCase()}`}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <LevelBadge level={selectedAmbassador.level} />
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          selectedAmbassador.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {selectedAmbassador.isActive ? "Active Status" : "Suspended"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 pt-1">
                  <div>
                    <div className="text-slate-500 text-[11px]">Referral Code</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {selectedAmbassador.referralCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px]">M-Pesa Payout Line</div>
                    <div className="font-bold text-white text-sm">
                      {selectedAmbassador.payoutPhone || selectedAmbassador.phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px]">Total Points</div>
                    <div className="font-bold text-brand-400 text-sm">
                      {selectedAmbassador.totalPoints.toLocaleString()} pts
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px]">Available Balance</div>
                    <div className="font-bold text-emerald-400 text-sm">
                      {formatKes(selectedAmbassador.availableCommissionKes)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Communication Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
                <a
                  href={`mailto:${selectedAmbassador.email}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  {selectedAmbassador.email}
                </a>
                <a
                  href={`tel:${selectedAmbassador.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Phone className="h-4 w-4 text-slate-500" />
                  {selectedAmbassador.phone}
                </a>
              </div>

              {/* Social Presence Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Globe className="h-4 w-4 text-brand-600" />
                  <span>Public &amp; Professional Social Profiles</span>
                </div>
                {hasSocials ? (
                  <div className="flex flex-wrap gap-2.5">
                    {liUrl && (
                      <a
                        href={liUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition shadow-xs"
                      >
                        <Linkedin className="h-4 w-4 text-blue-600" />
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                    {igUrl && (
                      <a
                        href={igUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50 transition shadow-xs"
                      >
                        <Instagram className="h-4 w-4 text-pink-600" />
                        Instagram Handle
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                    {ttUrl && (
                      <a
                        href={ttUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
                      >
                        TikTok Profile
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                    {twUrl && (
                      <a
                        href={twUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition shadow-xs"
                      >
                        X / Twitter
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                    {pfUrl && (
                      <a
                        href={pfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition shadow-xs"
                      >
                        <Globe className="h-4 w-4 text-emerald-600" />
                        Design Portfolio / Site
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No social profiles submitted during onboarding.
                  </p>
                )}
              </div>

              {/* Outreach Strategy & Background */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-brand-600" /> Campus &amp; Geography
                  </span>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Institution:</strong> {selectedAmbassador.institution || "Independent"}
                    </div>
                    <div>
                      <strong>County / Base:</strong> {selectedAmbassador.county}
                    </div>
                    <div>
                      <strong>Occupation:</strong> {selectedAmbassador.occupation}
                    </div>
                    <div>
                      <strong>Onboarded:</strong> {formatDate(selectedAmbassador.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-brand-600" /> Campaign &amp; Strategy
                  </span>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Strategy:</strong>{" "}
                      {selectedAmbassador.promotionStrategy ||
                        matchingApp?.promotionStrategy ||
                        "Campus & WhatsApp Group Outreach"}
                    </div>
                    <div>
                      <strong>Target Audience:</strong>{" "}
                      {selectedAmbassador.targetAudience ||
                        matchingApp?.targetAudience ||
                        "Undergraduates & Tech Beginners"}
                    </div>
                    <div>
                      <strong>Total Leads Generated:</strong> {refs.length} ({verifiedCount} enrolled)
                    </div>
                    <div>
                      <strong>Paid Commission:</strong> {formatKes(selectedAmbassador.paidCommissionKes)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ambassador Bio / Motivation */}
              {selectedAmbassador.bio && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Ambassador Bio &amp; Goals:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedAmbassador.bio}</p>
                </div>
              )}

              {/* Modal Footer & Account Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleActive(selectedAmbassador)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    selectedAmbassador.isActive
                      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {selectedAmbassador.isActive ? (
                    <>
                      <ShieldAlert className="h-4 w-4" /> Suspend Ambassador Privileges
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Reactivate Ambassador Privileges
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAmbassador(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
