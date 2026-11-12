"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileCheck2,
  FolderKanban,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatDate } from "@/lib/utils";
import { TrashEntityType, TrashItem } from "@/types";

function getTimeRemaining(expiresAt: string): {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { label: "Expired (pending purge)", isUrgent: true, isExpired: true };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days > 0) {
    return {
      label: `${days}d ${remainingHours}h remaining`,
      isUrgent: false,
      isExpired: false,
    };
  }

  return {
    label: `${totalHours} hours remaining`,
    isUrgent: totalHours < 24,
    isExpired: false,
  };
}

function getEntityIcon(type: TrashEntityType) {
  switch (type) {
    case "ambassador":
      return Users;
    case "application":
      return CheckSquare;
    case "referral":
      return Award;
    case "enrolment":
      return FileCheck2;
    case "course":
      return BookOpen;
    case "campaign":
      return Megaphone;
    case "payout_request":
      return Wallet;
    case "marketing_asset":
      return FolderKanban;
    case "announcement":
      return Megaphone;
    default:
      return Trash2;
  }
}

function getEntityBadgeColor(type: TrashEntityType) {
  switch (type) {
    case "ambassador":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "application":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "referral":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "enrolment":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "course":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "campaign":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "payout_request":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "marketing_asset":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "announcement":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function AdminTrashPlatformPage() {
  const {
    db,
    restoreFromTrash,
    deletePermanentlyFromTrash,
    emptyTrash,
    purgeExpiredTrash,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);

  const trashItems = db.trash || [];

  const filtered = trashItems.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      item.deletedBy.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterType === "ALL" || item.entityType === filterType;

    return matchesSearch && matchesFilter;
  });

  const now = Date.now();
  const expiringWithin24h = trashItems.filter(
    (t) => new Date(t.expiresAt).getTime() - now < 24 * 60 * 60 * 1000 && new Date(t.expiresAt).getTime() > now
  ).length;

  const expiredCount = trashItems.filter(
    (t) => new Date(t.expiresAt).getTime() <= now
  ).length;

  const handleRestore = async (item: TrashItem) => {
    try {
      await restoreFromTrash(item.id);
      setFeedback(`Successfully restored "${item.title}" to active database.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Restore failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (deleteConfirmId !== item.id) {
      setDeleteConfirmId(item.id);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === item.id ? null : curr));
      }, 5000);
      return;
    }

    try {
      await deletePermanentlyFromTrash(item.id);
      setDeleteConfirmId(null);
      setFeedback(`Permanently erased "${item.title}" from the system.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Deletion failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handlePurgeExpired = async () => {
    try {
      await purgeExpiredTrash();
      setFeedback("Cleaned up all expired records from trash.");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Purge failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleEmptyTrash = async () => {
    if (!emptyTrashConfirm) {
      setEmptyTrashConfirm(true);
      setTimeout(() => setEmptyTrashConfirm(false), 5000);
      return;
    }

    try {
      const typeToEmpty = filterType === "ALL" ? undefined : (filterType as TrashEntityType);
      await emptyTrash(typeToEmpty);
      setEmptyTrashConfirm(false);
      setFeedback(
        typeToEmpty
          ? `All ${typeToEmpty} records emptied from trash.`
          : "Trash has been completely emptied."
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Empty trash failed: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Professional Data Lifecycle &amp; Retention
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-rose-600" />
            Trash Platform &amp; Recovery Console ({trashItems.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Critical deleted records stay in this recovery environment for <strong>48 hours (2 days)</strong> before automatic permanent deletion. You can restore records to active status or permanently erase them immediately.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {expiredCount > 0 && (
            <button
              type="button"
              onClick={handlePurgeExpired}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Purge Expired ({expiredCount})</span>
            </button>
          )}

          {trashItems.length > 0 && (
            <button
              type="button"
              onClick={handleEmptyTrash}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-xs ${
                emptyTrashConfirm
                  ? "bg-rose-700 text-white animate-pulse"
                  : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{emptyTrashConfirm ? "Confirm Empty Trash?" : "Empty Trash"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
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

      {/* Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              In Retention Window
            </span>
            <Trash2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {trashItems.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Restorable records across all modules
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Expiring Soon (&lt; 24h)
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {expiringWithin24h}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Will be automatically purged soon
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Retention Policy
            </span>
            <RotateCcw className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            48 Hours
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Automatic permanent purge after 2 days
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trashed items by title, name, email, or deleted by..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Entities ({trashItems.length})</option>
            <option value="ambassador">Ambassadors ({trashItems.filter((t) => t.entityType === "ambassador").length})</option>
            <option value="application">Applications ({trashItems.filter((t) => t.entityType === "application").length})</option>
            <option value="referral">Referrals ({trashItems.filter((t) => t.entityType === "referral").length})</option>
            <option value="enrolment">Enrolments ({trashItems.filter((t) => t.entityType === "enrolment").length})</option>
            <option value="course">Courses ({trashItems.filter((t) => t.entityType === "course").length})</option>
            <option value="campaign">Campaigns ({trashItems.filter((t) => t.entityType === "campaign").length})</option>
            <option value="payout_request">Payout Requests ({trashItems.filter((t) => t.entityType === "payout_request").length})</option>
            <option value="marketing_asset">Marketing Assets ({trashItems.filter((t) => t.entityType === "marketing_asset").length})</option>
            <option value="announcement">Announcements ({trashItems.filter((t) => t.entityType === "announcement").length})</option>
          </select>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Trash is Clean &amp; Empty
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {trashItems.length === 0
                ? "There are no deleted records currently stored in the 48-hour recovery window. All active platform data is in place."
                : "No deleted records match your active search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Deleted Info</th>
                  <th className="py-3.5 px-4">Time Remaining</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const Icon = getEntityIcon(item.entityType);
                  const badgeColor = getEntityBadgeColor(item.entityType);
                  const countdown = getTimeRemaining(item.expiresAt);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      {/* Entity Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{item.entityType.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      {/* Item Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID: {item.entityId}
                        </div>
                      </td>

                      {/* Deleted Info */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div>
                          <strong>By:</strong> {item.deletedBy}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.deletedAt)}</span>
                        </div>
                      </td>

                      {/* Time Remaining */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                            countdown.isExpired
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : countdown.isUrgent
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{countdown.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            title="Restore back to active database"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            title={
                              deleteConfirmId === item.id
                                ? "Click again to confirm permanent deletion"
                                : "Permanently erase now"
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
                              deleteConfirmId === item.id
                                ? "bg-rose-700 text-white animate-pulse"
                                : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>
                              {deleteConfirmId === item.id ? "Confirm Delete?" : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
