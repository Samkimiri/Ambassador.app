import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AmbassadorLevel, LevelThreshold, ReferralStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKes(amount: number, currency = "KES"): string {
  return `${currency} ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    return new Intl.DateTimeFormat("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Africa/Nairobi",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    return new Intl.DateTimeFormat("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Generates a unique, non-guessable referral code for an approved ambassador.
 * Format: SCDS-XXXX-YYYY (e.g. SCDS-AMN7-9K2P)
 */
export function generateReferralCode(fullName: string, existingCodes: string[] = []): string {
  const cleanAlpha = fullName
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Avoid ambiguous 0/O, 1/I

  for (let attempt = 0; attempt < 50; attempt++) {
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const candidate = `SCDS-${cleanAlpha}-${randomPart}`;
    if (!existingCodes.includes(candidate)) {
      return candidate;
    }
  }
  return `SCDS-${cleanAlpha}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/**
 * Valid Referral Status Lifecycle Transitions
 * Ensures integrity: e.g., clicks are not counted as enrolments, and rejected/cancelled referrals
 * require explicit administrative override to reopen.
 */
export const ALLOWED_REFERRAL_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  clicked: ["lead_submitted", "rejected", "cancelled"],
  lead_submitted: ["contacted", "application_submitted", "enrolled", "rejected", "cancelled"],
  contacted: ["application_submitted", "enrolled", "payment_pending", "rejected", "cancelled"],
  application_submitted: ["enrolled", "payment_pending", "rejected", "cancelled"],
  enrolled: ["payment_pending", "payment_verified", "cancelled"],
  payment_pending: ["payment_verified", "cancelled", "rejected"],
  payment_verified: ["cancelled"], // Only reversible via admin audit
  rejected: ["lead_submitted", "contacted"],
  cancelled: ["lead_submitted", "contacted"],
};

export function isValidReferralTransition(
  from: ReferralStatus,
  to: ReferralStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_REFERRAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isQualifiedLeadStatus(status: ReferralStatus): boolean {
  return [
    "lead_submitted",
    "contacted",
    "application_submitted",
    "enrolled",
    "payment_pending",
    "payment_verified",
  ].includes(status);
}

/**
 * Determines Ambassador Level based on cumulative points and verified enrolments
 */
export function computeAmbassadorLevel(
  totalPoints: number,
  verifiedEnrolmentsCount: number,
  thresholds: LevelThreshold[]
): {
  currentLevel: AmbassadorLevel;
  nextLevel: LevelThreshold | null;
  progressPct: number;
  commissionPct: number;
} {
  const sorted = [...thresholds].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0];
  let next: LevelThreshold | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    if (
      totalPoints >= tier.minPoints &&
      verifiedEnrolmentsCount >= tier.minEnrolments
    ) {
      current = tier;
      next = sorted[i + 1] ?? null;
    }
  }

  if (!next) {
    return {
      currentLevel: current.level,
      nextLevel: null,
      progressPct: 100,
      commissionPct: current.commissionPct,
    };
  }

  const pointsProgress = Math.min(
    100,
    Math.round(
      ((totalPoints - current.minPoints) /
        Math.max(1, next.minPoints - current.minPoints)) *
        100
    )
  );
  const enrolmentProgress = Math.min(
    100,
    Math.round(
      ((verifiedEnrolmentsCount - current.minEnrolments) /
        Math.max(1, next.minEnrolments - current.minEnrolments)) *
        100
    )
  );

  return {
    currentLevel: current.level,
    nextLevel: next,
    progressPct: Math.max(0, Math.min(100, Math.round((pointsProgress + enrolmentProgress) / 2))),
    commissionPct: current.commissionPct,
  };
}

/**
 * Normalizes Kenyan phone numbers for comparison to prevent self-referral & duplicates
 */
export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("7") && digits.length === 9) {
    return `0${digits}`;
  }
  if (digits.startsWith("1") && digits.length === 9) {
    return `0${digits}`;
  }
  return digits;
}

/**
 * Checks if a prospective learner submission is a fraudulent self-referral
 */
export function isSelfReferral(
  ambassador: { email: string; phone: string },
  learner: { email: string; phone: string }
): boolean {
  const sameEmail =
    ambassador.email.trim().toLowerCase() === learner.email.trim().toLowerCase();
  const samePhone =
    normalizeKenyanPhone(ambassador.phone) === normalizeKenyanPhone(learner.phone);
  return sameEmail || samePhone;
}

