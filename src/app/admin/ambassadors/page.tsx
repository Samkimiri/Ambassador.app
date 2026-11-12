"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  Ban,
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
  Trash2,
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
  const {
    db,
    blockAmbassadorAccount,
    unblockAmbassadorAccount,
    deleteAmbassadorAccount,
    broadcastDbChange,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedAmbassador, setSelectedAmbassador] =
    useState<AmbassadorProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [blockModalAmbassador, setBlockModalAmbassador] =
    useState<AmbassadorProfile | null>(null);
  const [blockReasonText, setBlockReasonText] = useState("");

  const cleanSearch = search.includes("ref=")
    ? search.split("ref=")[1].split("&")[0].trim().toLowerCase()
    : search.trim().toLowerCase();

  const filtered = db.ambassadors.filter((a) => {
    const matchesSearch =
      !cleanSearch ||
      a.fullName.toLowerCase().includes(cleanSearch) ||
      a.referralCode.toLowerCase().includes(cleanSearch) ||
      a.institution.toLowerCase().includes(cleanSearch) ||
      a.county.toLowerCase().includes(cleanSearch) ||
      a.email.toLowerCase().includes(cleanSearch);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && a.isActive && !a.isBlocked) ||
      (statusFilter === "BLOCKED" && (a.isBlocked || !a.isActive));

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

  const handleOpenBlockModal = (amb: AmbassadorProfile) => {
    setBlockModalAmbassador(amb);
    setBlockReasonText("Administrative review / Policy compliance check");
  };

  const handleConfirmBlock = async () => {
    if (!blockModalAmbassador) return;
    try {
      await blockAmbassadorAccount(blockModalAmbassador.id, blockReasonText);
      setFeedback(`Ambassador ${blockModalAmbassador.fullName} has been blocked and notified.`);
      setBlockModalAmbassador(null);
      setBlockReasonText("");
      setSelectedAmbassador(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Failed to block ambassador: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleUnblock = async (amb: AmbassadorProfile) => {
    try {
      await unblockAmbassadorAccount(amb.id);
      setFeedback(`Ambassador ${amb.fullName} has been unblocked. Privileges restored.`);
      setSelectedAmbassador((prev) => (prev?.id === amb.id ? { ...prev, isActive: true, isBlocked: false } : prev));
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Failed to unblock ambassador: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleDelete = async (amb: AmbassadorProfile) => {
    if (deleteConfirmId !== amb.id) {
      setDeleteConfirmId(amb.id);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === amb.id ? null : curr));
      }, 5000);
      return;
    }

    try {
      await deleteAmbassadorAccount(amb.id);
      setDeleteConfirmId(null);
      setSelectedAmbassador(null);
      setFeedback(`Ambassador ${amb.fullName} (${amb.email}) was permanently deleted from the database.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback(`Failed to delete account: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleQuickTrackCode = async (rawCode: string) => {
    const code = rawCode.includes("ref=")
      ? rawCode.split("ref=")[1].split("&")[0].trim().toUpperCase()
      : rawCode.trim().toUpperCase();
    if (!code) return;

    const existing = db.ambassadors.find(
      (a) => a.referralCode.toUpperCase() === code
    );
    if (existing) {
      setSelectedAmbassador(existing);
      setSearch(existing.referralCode);
      return;
    }

    const parts = code.split("-");
    const namePart = parts[1] || "Ambassador";
    const autoId = `amb-${code.toLowerCase()}`;
    const autoUserId = `user-${code.toLowerCase()}`;
    const capitalized =
      namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();

    const newAmb: AmbassadorProfile = {
      id: autoId,
      userId: autoUserId,
      fullName: capitalized,
      email: `${code.toLowerCase()}@scdsambassador.co.ke`,
      phone: "0700000000",
      referralCode: code,
      level: "Starter",
      totalPoints: 100,
      availablePoints: 100,
      totalCommissionKes: 0,
      availableCommissionKes: 0,
      paidCommissionKes: 0,
      payoutMethod: "MPESA",
      payoutPhone: "0700000000",
      county: "Kenya",
      institution: "SCDS Ambassador Network",
      occupation: "Brand Ambassador",
      bio: `Official SCDS ambassador representing referral code ${code}.`,
      credentialId: `SCDS-AMB-${code}`,
      codeOfConductAgreed: true,
      isActive: true,
      clickCount: 1,
      badgeIds: ["badge-1"],
      createdAt: new Date().toISOString(),
    };

    const nextDb = {
      ...db,
      ambassadors: [newAmb, ...db.ambassadors],
      profiles: [
        {
          id: autoUserId,
          email: newAmb.email,
          fullName: newAmb.fullName,
          phone: newAmb.phone,
          role: "ambassador" as const,
          status: "active" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...db.profiles,
      ],
    };

    await broadcastDbChange(nextDb);
    setSelectedAmbassador(newAmb);
    setSearch(code);
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
              placeholder="Search name, code, campus, email or paste referral link..."
              className="w-64 sm:w-80 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "BLOCKED")}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses ({db.ambassadors.length})</option>
            <option value="ACTIVE">Active ({db.ambassadors.filter((a) => a.isActive && !a.isBlocked).length})</option>
            <option value="BLOCKED">Blocked ({db.ambassadors.filter((a) => a.isBlocked || !a.isActive).length})</option>
          </select>
        </div>
      </div>

      {/* Admin Operations Feedback Banner */}
      {feedback && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-xs font-semibold text-brand-900 flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-brand-600 hover:text-brand-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Ambassador Code Tracker & Jump Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Quick Access:
        </span>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
          className={`rounded-lg px-2.5 py-1 font-semibold transition ${
            !search && statusFilter === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All ({db.ambassadors.length})
        </button>

        {/* Specific quick button for Mathew (SCDS-MAT-K4RH) */}
        <button
          type="button"
          onClick={() => {
            setSearch("SCDS-MAT-K4RH");
            const mat = db.ambassadors.find(
              (a) => a.referralCode.toUpperCase() === "SCDS-MAT-K4RH"
            );
            if (mat) setSelectedAmbassador(mat);
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
            search.toUpperCase().includes("MAT-K4RH")
              ? "bg-brand-600 text-white"
              : "bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100"
          }`}
        >
          <Sparkles className="h-3 w-3" /> Mathew (SCDS-MAT-K4RH)
        </button>

        {db.ambassadors
          .filter((a) => a.referralCode !== "SCDS-MAT-K4RH")
          .slice(0, 4)
          .map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setSearch(a.referralCode);
                setSelectedAmbassador(a);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                search.toUpperCase().includes(a.referralCode.toUpperCase())
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {a.fullName.split(" ")[0]} ({a.referralCode})
            </button>
          ))}
      </div>

      {/* If searched code not found, allow 1-click tracking */}
      {cleanSearch && filtered.length === 0 && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-slate-700">
            <span className="font-bold text-brand-900 block">
              Ambassador with code &quot;{search}&quot; not in current directory view?
            </span>
            <span className="text-slate-600">
              Click below to immediately register and activate tracking for this referral code.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleQuickTrackCode(search)}
            className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 transition shrink-0"
          >
            Track &amp; Activate Ambassador
          </button>
        </div>
      )}

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
                          amb.isActive && !amb.isBlocked
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {amb.isActive && !amb.isBlocked ? "Active" : "Blocked"}
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
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedAmbassador(amb)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                        {amb.isActive && !amb.isBlocked ? (
                          <button
                            type="button"
                            onClick={() => handleOpenBlockModal(amb)}
                            title="Block ambassador account and privileges"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Block</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUnblock(amb)}
                            title="Unblock ambassador and restore privileges"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Unblock</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(amb)}
                          title={deleteConfirmId === amb.id ? "Click again to permanently delete" : "Permanently delete account"}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            deleteConfirmId === amb.id
                              ? "bg-rose-700 text-white animate-pulse"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{deleteConfirmId === amb.id ? "Confirm Delete?" : "Delete"}</span>
                        </button>
                      </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  {selectedAmbassador.isActive && !selectedAmbassador.isBlocked ? (
                    <button
                      type="button"
                      onClick={() => handleOpenBlockModal(selectedAmbassador)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                    >
                      <Ban className="h-4 w-4" /> Block Ambassador Account
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUnblock(selectedAmbassador)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      <ShieldCheck className="h-4 w-4" /> Unblock &amp; Restore Privileges
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedAmbassador)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                      deleteConfirmId === selectedAmbassador.id
                        ? "bg-rose-700 text-white animate-pulse"
                        : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>
                      {deleteConfirmId === selectedAmbassador.id
                        ? "Confirm Delete Account Permanently?"
                        : "Delete Account Permanently"}
                    </span>
                  </button>
                </div>

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

      {/* Block Ambassador Reason Modal */}
      {blockModalAmbassador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Block Ambassador Account
                </h3>
                <p className="text-xs text-slate-500">
                  {blockModalAmbassador.fullName} ({blockModalAmbassador.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Blocking suspends this ambassador&apos;s referral links, campaigns, and payout privileges immediately. They will receive an urgent in-app notification with the reason you specify below.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason for Suspension:
              </label>
              <textarea
                value={blockReasonText}
                onChange={(e) => setBlockReasonText(e.target.value)}
                rows={3}
                placeholder="e.g. Incomplete verification, code of conduct review, or administrative inquiry..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setBlockModalAmbassador(null);
                  setBlockReasonText("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
              >
                Confirm Block &amp; Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
