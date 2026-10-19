import React from "react";
import { ReferralStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ReferralStatus,
  { label: string; className: string }
> = {
  clicked: {
    label: "Link Clicked",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  lead_submitted: {
    label: "Lead Submitted",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  contacted: {
    label: "Contacted",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  application_submitted: {
    label: "Application Submitted",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  enrolled: {
    label: "Enrolled",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  payment_pending: {
    label: "Payment Pending",
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
  payment_verified: {
    label: "Payment Verified",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.lead_submitted;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Starter: "bg-slate-100 text-slate-800 border-slate-300",
    Bronze: "bg-amber-100/80 text-amber-900 border-amber-300",
    Silver: "bg-slate-200 text-slate-900 border-slate-400",
    Gold: "bg-yellow-100 text-yellow-900 border-yellow-400",
    Elite: "bg-brand-600 text-white border-brand-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        styles[level] || styles.Starter
      )}
    >
      {level} Tier
    </span>
  );
}

