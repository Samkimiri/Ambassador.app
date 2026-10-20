import React from "react";
import { ReferralStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ReferralStatus,
  { label: string; className: string; dotClass: string }
> = {
  clicked: {
    label: "Link Clicked",
    className: "bg-brand-50 text-navy-900 border-brand-200",
    dotClass: "bg-slate-400",
  },
  lead_submitted: {
    label: "Lead Submitted",
    className: "bg-brand-50 text-brand-700 border-brand-200",
    dotClass: "bg-brand-600",
  },
  contacted: {
    label: "Contacted",
    className: "bg-brand-100/70 text-navy-900 border-brand-300",
    dotClass: "bg-brand-600",
  },
  application_submitted: {
    label: "Application Submitted",
    className: "bg-brand-100 text-brand-800 border-brand-300",
    dotClass: "bg-brand-700",
  },
  enrolled: {
    label: "Enrolled",
    className: "bg-gold-50 text-navy-900 border-gold-300",
    dotClass: "bg-gold-500",
  },
  payment_pending: {
    label: "Payment Pending",
    className: "bg-gold-100 text-navy-900 border-gold-400",
    dotClass: "bg-gold-600",
  },
  payment_verified: {
    label: "Payment Verified",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-600",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-600",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dotClass: "bg-gray-400",
  },
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.lead_submitted;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cfg.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Starter: "bg-brand-50 text-navy-900 border-brand-200",
    Bronze: "bg-amber-50 text-amber-900 border-amber-300",
    Silver: "bg-brand-100 text-brand-800 border-brand-300",
    Gold: "bg-gold-400 text-navy-900 border-gold-500 font-bold",
    Elite: "bg-brand-600 text-white border-brand-700 font-bold",
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
