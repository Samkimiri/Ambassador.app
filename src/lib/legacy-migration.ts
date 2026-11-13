import { z } from "zod";
import { isPasswordHashed } from "@/lib/security";
import { validateEmailForDelivery } from "@/lib/utils";
import { AppDatabaseState } from "@/lib/seed-data";

export const DEFAULT_MIGRATION_ALLOWLIST = [
  "kinyuam047@gmail.com",
  "hnjoroge2005@gmail.com",
] as const;

export const migrateLegacyRequestSchema = z.object({
  source: z.enum(["app_state", "file"]).default("app_state"),
  allowlist: z
    .array(z.string().trim().toLowerCase().email("Invalid email in allowlist."))
    .max(10, "Allowlist cannot exceed 10 emails.")
    .default([...DEFAULT_MIGRATION_ALLOWLIST]),
  dry_run: z.boolean().default(true),
  confirm_token: z.string().optional(),
  fileData: z.unknown().optional(),
});

export const legacyFilePayloadSchema = z
  .object({
    profiles: z.array(z.record(z.unknown())).optional(),
    applications: z.array(z.record(z.unknown())).optional(),
    ambassadors: z.array(z.record(z.unknown())).optional(),
    courses: z.array(z.record(z.unknown())).optional(),
    campaigns: z.array(z.record(z.unknown())).optional(),
    referrals: z.array(z.record(z.unknown())).optional(),
    enrolments: z.array(z.record(z.unknown())).optional(),
    rewardRules: z.record(z.unknown()).optional(),
    pointsLedger: z.array(z.record(z.unknown())).optional(),
    commissions: z.array(z.record(z.unknown())).optional(),
    payoutRequests: z.array(z.record(z.unknown())).optional(),
    marketingAssets: z.array(z.record(z.unknown())).optional(),
    badges: z.array(z.record(z.unknown())).optional(),
    announcements: z.array(z.record(z.unknown())).optional(),
    notifications: z.array(z.record(z.unknown())).optional(),
    supportRequests: z.array(z.record(z.unknown())).optional(),
    auditLogs: z.array(z.record(z.unknown())).optional(),
  })
  .refine(
    (obj) =>
      Boolean(
        obj.profiles ||
          obj.applications ||
          obj.ambassadors ||
          obj.courses ||
          obj.campaigns ||
          obj.announcements ||
          obj.marketingAssets ||
          obj.badges ||
          obj.referrals ||
          obj.enrolments ||
          obj.pointsLedger ||
          obj.commissions ||
          obj.payoutRequests ||
          obj.supportRequests
      ),
    { message: "Uploaded JSON does not contain any recognized legacy collections." }
  );

const SECRET_KEY_PATTERN =
  /^(password|passwordhash|resetcodehash|resetcodeexpiresat|token|secret|apikey|accesstoken|refreshtoken)$/i;

/**
 * Removes all password hashes, plain-text passwords, reset codes, and tokens
 * before archiving any record into legacy_records.
 */
export function stripSecretsFromRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(k)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      cleaned[k] = stripSecretsFromRecord(v as Record<string, unknown>);
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

export interface LiveSupabaseSnapshot {
  applicationIds: Set<string>;
  applicationEmails: Set<string>;
  profileIds: Set<string>;
  profileEmailToId: Map<string, string>;
  authUserIds: Set<string>;
  authEmailToId: Map<string, string>;
  ambassadorIds: Set<string>;
  ambassadorUserIds: Set<string>;
  ambassadorReferralCodes: Set<string>;
  courseIds: Set<string>;
  courseSlugs: Set<string>;
  campaignIds: Set<string>;
  campaignSlugs: Set<string>;
  announcementIds: Set<string>;
  marketingAssetIds: Set<string>;
  badgeIds: Set<string>;
  badgeCodes: Set<string>;
  rewardRuleCodes: Set<string>;
  enrolmentIds: Set<string>;
  referralIds: Set<string>;
  supportRequestIds: Set<string>;
  legacyRecordIds: Set<string>;
  legacyQuarantineIds: Set<string>;
}

export interface LegacyMigrationAdapter {
  loadSnapshot: () => Promise<LiveSupabaseSnapshot>;
  insertBatch: (
    table: string,
    rows: Record<string, unknown>[],
    conflictColumn: string
  ) => Promise<{ insertedCount: number; error?: string }>;
}

export interface CollectionPlanCounts {
  wouldInsertLive: number;
  wouldArchive: number;
  wouldSkipExisting: number;
  wouldSkipInvalid: number;
  wouldQuarantine: number;
  conflicts: number;
  insertedLive: number;
  archived: number;
  quarantined: number;
}

export interface MigrationReport {
  ok: boolean;
  dryRun: boolean;
  source: "app_state" | "file";
  allowlist: string[];
  error?: string;
  missingAllowlistEmails: string[];
  skippedAdminRecords: Array<{ email: string; collection: string; recordId: string }>;
  plaintextPasswordCount: number;
  scryptPasswordCount: number;
  missingPasswordCount: number;
  allowlistPasswordFlags: Array<{
    email: string;
    passwordStatus: "scrypt_valid" | "needs_forgot_password";
  }>;
  payoutReconfirmFlagged: Array<{ email: string; reason: string }>;
  skippedMissingReferent: Array<{ collection: string; recordId: string; reason: string }>;
  legacyOnlyEmailsCount: number;
  legacyOnlyByStatus: Record<string, number>;
  legacyOnlyEmailsSample: string[];
  invalidEmails: Array<{ collection: string; recordId: string; email: string; reason: string }>;
  collections: Record<string, CollectionPlanCounts>;
  affectedIds: {
    wouldInsertLive: Array<{ table: string; id: string; email?: string }>;
    wouldSkipExisting: Array<{ table: string; id: string; email?: string }>;
    wouldArchive: Array<{ collection: string; id: string }>;
    wouldQuarantine: Array<{ collection: string; id: string; reason: string }>;
  };
  batchErrors: string[];
}

function emptyCounts(): CollectionPlanCounts {
  return {
    wouldInsertLive: 0,
    wouldArchive: 0,
    wouldSkipExisting: 0,
    wouldSkipInvalid: 0,
    wouldQuarantine: 0,
    conflicts: 0,
    insertedLive: 0,
    archived: 0,
    quarantined: 0,
  };
}

function isUuid(val?: string | null): boolean {
  return Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        val
      )
  );
}

const BATCH_SIZE = 25;

async function insertInBatches(
  adapter: LegacyMigrationAdapter,
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn: string,
  logRows: Record<string, unknown>[],
  source: string,
  batchErrors: string[]
): Promise<number> {
  let totalInserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const res = await adapter.insertBatch(table, chunk, conflictColumn);
    if (res.error) {
      batchErrors.push(`${table} batch ${i / BATCH_SIZE + 1}: ${res.error}`);
      continue;
    }
    totalInserted += res.insertedCount;
    for (const row of chunk) {
      const recId = String(row[conflictColumn] || row.id || "");
      logRows.push({
        id: `mig-${table}-${recId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source,
        collection: table,
        record_id: recId,
        action: "INSERT_ONLY",
        note: `Inserted into ${table}`,
        created_at: new Date().toISOString(),
      });
    }
  }
  return totalInserted;
}

export async function runLegacyMigration(
  params: {
    source: "app_state" | "file";
    allowlist: string[];
    dryRun: boolean;
    confirmToken?: string;
    legacyState: Partial<AppDatabaseState>;
  },
  adapter: LegacyMigrationAdapter
): Promise<MigrationReport> {
  const allowlist = Array.from(
    new Set(params.allowlist.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );

  const report: MigrationReport = {
    ok: true,
    dryRun: params.dryRun,
    source: params.source,
    allowlist,
    missingAllowlistEmails: [],
    skippedAdminRecords: [],
    plaintextPasswordCount: 0,
    scryptPasswordCount: 0,
    missingPasswordCount: 0,
    allowlistPasswordFlags: [],
    payoutReconfirmFlagged: [],
    skippedMissingReferent: [],
    legacyOnlyEmailsCount: 0,
    legacyOnlyByStatus: {},
    legacyOnlyEmailsSample: [],
    invalidEmails: [],
    collections: {},
    affectedIds: {
      wouldInsertLive: [],
      wouldSkipExisting: [],
      wouldArchive: [],
      wouldQuarantine: [],
    },
    batchErrors: [],
  };

  if (!params.dryRun && params.confirmToken !== "MIGRATE") {
    return {
      ...report,
      ok: false,
      error: "Real migration requires confirm_token='MIGRATE'.",
    };
  }

  const state = params.legacyState || {};
  const profiles = Array.isArray(state.profiles) ? state.profiles : [];
  const applications = Array.isArray(state.applications) ? state.applications : [];
  const ambassadors = Array.isArray(state.ambassadors) ? state.ambassadors : [];
  const enrolments = Array.isArray(state.enrolments) ? state.enrolments : [];
  const referrals = Array.isArray(state.referrals) ? state.referrals : [];
  const supportRequests = Array.isArray(state.supportRequests)
    ? state.supportRequests
    : [];
  const pointsLedger = Array.isArray(state.pointsLedger) ? state.pointsLedger : [];
  const commissions = Array.isArray(state.commissions) ? state.commissions : [];
  const payoutRequests = Array.isArray(state.payoutRequests)
    ? state.payoutRequests
    : [];

  // 1. Verify every allowlist email matches at least one legacy record
  const legacyEmailPool = new Set<string>();
  for (const p of profiles) {
    if (p.email) legacyEmailPool.add(p.email.trim().toLowerCase());
  }
  for (const a of applications) {
    if (a.email) legacyEmailPool.add(a.email.trim().toLowerCase());
  }
  for (const amb of ambassadors) {
    if (amb.email) legacyEmailPool.add(amb.email.trim().toLowerCase());
  }

  for (const allowed of allowlist) {
    if (!legacyEmailPool.has(allowed)) {
      report.missingAllowlistEmails.push(allowed);
    }
  }
  if (report.missingAllowlistEmails.length > 0) {
    return {
      ...report,
      ok: false,
      error: `Allowlist email(s) have no matching legacy record: ${report.missingAllowlistEmails.join(", ")}`,
    };
  }

  // 2. Count password formats across legacy profiles (never log hashes/passwords)
  for (const p of profiles) {
    if (!p.password) {
      report.missingPasswordCount += 1;
    } else if (isPasswordHashed(p.password)) {
      report.scryptPasswordCount += 1;
    } else {
      report.plaintextPasswordCount += 1;
    }
  }

  const snapshot = await adapter.loadSnapshot();
  const allowlistSet = new Set(allowlist);

  // Build planned inserts (used both for Dry Run counts and Real Run execution)
  const plannedApplications: Record<string, unknown>[] = [];
  const plannedProfiles: Record<string, unknown>[] = [];
  const plannedAmbassadors: Record<string, unknown>[] = [];
  const plannedEnrolments: Record<string, unknown>[] = [];
  const plannedSupportRequests: Record<string, unknown>[] = [];
  const plannedCourses: Record<string, unknown>[] = [];
  const plannedCampaigns: Record<string, unknown>[] = [];
  const plannedAnnouncements: Record<string, unknown>[] = [];
  const plannedMarketingAssets: Record<string, unknown>[] = [];
  const plannedBadges: Record<string, unknown>[] = [];
  const plannedRewardRules: Record<string, unknown>[] = [];
  const plannedLegacyRecords: Record<string, unknown>[] = [];
  const plannedQuarantine: Record<string, unknown>[] = [];

  const getCol = (name: string) => {
    if (!report.collections[name]) report.collections[name] = emptyCounts();
    return report.collections[name];
  };

  // Track emails and invalid emails for legacy-only count
  const legacyOnlyEmailStatusMap = new Map<string, string>();
  const seenInvalid = new Set<string>();

  const checkInvalidEmail = (collection: string, recordId: string, email?: string) => {
    const trimmed = (email || "").trim();
    if (!trimmed) return;
    const res = validateEmailForDelivery(trimmed);
    if (!res.valid) {
      const key = `${collection}:${recordId}`;
      if (!seenInvalid.has(key)) {
        seenInvalid.add(key);
        report.invalidEmails.push({
          collection,
          recordId,
          email: trimmed,
          reason: res.reason || "Invalid email",
        });
      }
    }
  };

  // 3. Profiles: allowlisted -> live (only if UUID + not existing + non-admin), others -> legacy_records
  const allowlistedResolvedUserIds = new Map<string, string>();
  for (const p of profiles) {
    const email = (p.email || "").trim().toLowerCase();
    const col = getCol("profiles");
    checkInvalidEmail("profiles", p.id, p.email);

    if (p.role === "super_admin" || (p.role as string) === "admin") {
      report.skippedAdminRecords.push({
        email,
        collection: "profiles",
        recordId: p.id,
      });
      col.wouldSkipInvalid += 1;
      continue;
    }

    if (allowlistSet.has(email)) {
      report.allowlistPasswordFlags.push({
        email,
        passwordStatus: isPasswordHashed(p.password)
          ? "scrypt_valid"
          : "needs_forgot_password",
      });

      const existingProfileId =
        snapshot.profileEmailToId.get(email) || snapshot.authEmailToId.get(email);
      if (existingProfileId) {
        allowlistedResolvedUserIds.set(email, existingProfileId);
        col.wouldSkipExisting += 1;
        report.affectedIds.wouldSkipExisting.push({
          table: "profiles",
          id: existingProfileId,
          email,
        });
      } else if (snapshot.profileIds.has(p.id)) {
        allowlistedResolvedUserIds.set(email, p.id);
        col.wouldSkipExisting += 1;
        report.affectedIds.wouldSkipExisting.push({
          table: "profiles",
          id: p.id,
          email,
        });
      } else if (isUuid(p.id) && snapshot.authUserIds.has(p.id)) {
        allowlistedResolvedUserIds.set(email, p.id);
        plannedProfiles.push({
          id: p.id,
          email,
          full_name: p.fullName,
          phone: p.phone || null,
          avatar_url: p.avatarUrl || null,
          role: p.role === "ambassador" ? "ambassador" : "learner",
          status: p.status === "active" || p.status === "pending" || p.status === "suspended" || p.status === "rejected" ? p.status : "pending",
          created_at: p.createdAt || new Date().toISOString(),
          updated_at: p.updatedAt || new Date().toISOString(),
        });
        col.wouldInsertLive += 1;
        report.affectedIds.wouldInsertLive.push({ table: "profiles", id: p.id, email });
      } else {
        // public.profiles.id references auth.users(id) UUID; cannot invent auth.users row
        report.skippedMissingReferent.push({
          collection: "profiles",
          recordId: p.id,
          reason: `No matching auth.users UUID found for ${email}; profile skipped (applications table still receives record).`,
        });
        col.conflicts += 1;
      }
    } else {
      const inLive =
        snapshot.profileEmailToId.has(email) ||
        snapshot.applicationEmails.has(email) ||
        snapshot.authEmailToId.has(email);
      if (!inLive && email) {
        legacyOnlyEmailStatusMap.set(email, p.status || "unknown");
      }
      const archiveId = `legacy-profiles-${p.id}`;
      if (snapshot.legacyRecordIds.has(archiveId)) {
        col.wouldSkipExisting += 1;
      } else {
        plannedLegacyRecords.push({
          id: archiveId,
          source: params.source,
          collection: "profiles",
          record_id: p.id,
          email_normalized: email || null,
          raw: stripSecretsFromRecord(p as unknown as Record<string, unknown>),
        });
        col.wouldArchive += 1;
        report.affectedIds.wouldArchive.push({ collection: "profiles", id: p.id });
      }
    }
  }

  // 4. Applications: allowlisted -> public.applications (skip if id or email exists), others -> legacy_records
  for (const app of applications) {
    const email = (app.email || "").trim().toLowerCase();
    const col = getCol("applications");
    checkInvalidEmail("applications", app.id, app.email);

    if (allowlistSet.has(email)) {
      if (snapshot.applicationIds.has(app.id) || snapshot.applicationEmails.has(email)) {
        col.wouldSkipExisting += 1;
        report.affectedIds.wouldSkipExisting.push({
          table: "applications",
          id: app.id,
          email,
        });
      } else {
        const resolvedUserId =
          allowlistedResolvedUserIds.get(email) || app.userId;
        plannedApplications.push({
          id: app.id,
          user_id: resolvedUserId,
          full_name: app.fullName,
          email,
          phone: app.phone,
          county: app.county || null,
          institution: app.institution || null,
          occupation: app.occupation || null,
          status: app.status,
          payload: app,
          created_at: app.createdAt || new Date().toISOString(),
          reviewed_at: app.reviewedAt || null,
          updated_at: new Date().toISOString(),
        });
        col.wouldInsertLive += 1;
        report.affectedIds.wouldInsertLive.push({
          table: "applications",
          id: app.id,
          email,
        });
      }
    } else {
      const inLive =
        snapshot.profileEmailToId.has(email) ||
        snapshot.applicationEmails.has(email) ||
        snapshot.authEmailToId.has(email);
      if (!inLive && email) {
        legacyOnlyEmailStatusMap.set(email, app.status || "unknown");
      }
      const archiveId = `legacy-applications-${app.id}`;
      if (snapshot.legacyRecordIds.has(archiveId)) {
        col.wouldSkipExisting += 1;
      } else {
        plannedLegacyRecords.push({
          id: archiveId,
          source: params.source,
          collection: "applications",
          record_id: app.id,
          email_normalized: email || null,
          raw: stripSecretsFromRecord(app as unknown as Record<string, unknown>),
        });
        col.wouldArchive += 1;
        report.affectedIds.wouldArchive.push({ collection: "applications", id: app.id });
      }
    }
  }

  // Compute legacy-only emails summary
  report.legacyOnlyEmailsCount = legacyOnlyEmailStatusMap.size;
  for (const [em, st] of Array.from(legacyOnlyEmailStatusMap.entries())) {
    report.legacyOnlyByStatus[st] = (report.legacyOnlyByStatus[st] || 0) + 1;
    if (report.legacyOnlyEmailsSample.length < 50) {
      report.legacyOnlyEmailsSample.push(em);
    }
  }

  // 5. Ambassadors: allowlisted -> public.ambassador_profiles (WITHOUT payout_phone or money/points!) + money snapshot -> legacy_quarantine
  for (const amb of ambassadors) {
    const email = (amb.email || "").trim().toLowerCase();
    const col = getCol("ambassadors");
    const qCol = getCol("legacy_quarantine");

    // Money/points/payout snapshot for EVERYONE (including allowlisted) goes to legacy_quarantine
    const qId = `quarantine-ambassador-money-${amb.id}`;
    if (!snapshot.legacyQuarantineIds.has(qId)) {
      plannedQuarantine.push({
        id: qId,
        collection: "ambassadors_money_points",
        raw: {
          ambassadorId: amb.id,
          email,
          totalPoints: amb.totalPoints,
          availablePoints: amb.availablePoints,
          totalCommissionKes: amb.totalCommissionKes,
          availableCommissionKes: amb.availableCommissionKes,
          paidCommissionKes: amb.paidCommissionKes,
          payoutMethod: amb.payoutMethod,
          payoutPhone: amb.payoutPhone,
        },
        reason:
          "Browser/legacy points, balances, and payout line quarantined; never imported into live tables.",
      });
      qCol.wouldQuarantine += 1;
      report.affectedIds.wouldQuarantine.push({
        collection: "ambassadors_money_points",
        id: amb.id,
        reason: "Points/commission/payout quarantined",
      });
    }

    if (allowlistSet.has(email)) {
      if (amb.payoutPhone) {
        report.payoutReconfirmFlagged.push({
          email,
          reason: "Payout phone not written to live table; flagged for re-confirmation by ambassador.",
        });
      }
      const targetUserId = allowlistedResolvedUserIds.get(email) || amb.userId;
      if (
        snapshot.ambassadorIds.has(amb.id) ||
        snapshot.ambassadorUserIds.has(targetUserId) ||
        snapshot.ambassadorReferralCodes.has(amb.referralCode)
      ) {
        col.wouldSkipExisting += 1;
        report.affectedIds.wouldSkipExisting.push({
          table: "ambassador_profiles",
          id: amb.id,
          email,
        });
      } else if (isUuid(targetUserId) && snapshot.profileIds.has(targetUserId)) {
        plannedAmbassadors.push({
          id: isUuid(amb.id) ? amb.id : undefined,
          user_id: targetUserId,
          referral_code: amb.referralCode,
          level: amb.level || "Starter",
          total_points: 0,
          available_points: 0,
          total_commission_kes: 0,
          available_commission_kes: 0,
          paid_commission_kes: 0,
          payout_method: "MPESA",
          payout_phone: null,
          county: amb.county || null,
          institution: amb.institution || null,
          bio: amb.bio || null,
          is_active: amb.isActive ?? true,
        });
        col.wouldInsertLive += 1;
        report.affectedIds.wouldInsertLive.push({
          table: "ambassador_profiles",
          id: amb.id,
          email,
        });
      } else {
        report.skippedMissingReferent.push({
          collection: "ambassador_profiles",
          recordId: amb.id,
          reason: `No live public.profiles UUID exists for ${email}; ambassador_profiles skipped.`,
        });
        col.conflicts += 1;
      }
    } else {
      const archiveId = `legacy-ambassadors-${amb.id}`;
      if (snapshot.legacyRecordIds.has(archiveId)) {
        col.wouldSkipExisting += 1;
      } else {
        plannedLegacyRecords.push({
          id: archiveId,
          source: params.source,
          collection: "ambassadors",
          record_id: amb.id,
          email_normalized: email || null,
          raw: stripSecretsFromRecord(amb as unknown as Record<string, unknown>),
        });
        col.wouldArchive += 1;
        report.affectedIds.wouldArchive.push({ collection: "ambassadors", id: amb.id });
      }
    }
  }

  // 6. Enrolments & Support Requests (allowlisted only if referents exist; others -> legacy_records)
  const allowlistedAmbIds = new Set(
    ambassadors
      .filter((a) => allowlistSet.has((a.email || "").trim().toLowerCase()))
      .map((a) => a.id)
  );
  for (const enr of enrolments) {
    const col = getCol("enrolments");
    if (allowlistedAmbIds.has(enr.ambassadorId)) {
      const learnerEmail = (enr.learnerEmail || "").trim().toLowerCase();
      const learnerExists =
        snapshot.profileEmailToId.has(learnerEmail) ||
        snapshot.authEmailToId.has(learnerEmail);
      const ambExists = snapshot.ambassadorIds.has(enr.ambassadorId);
      const refExists = snapshot.referralIds.has(enr.referralId);
      if (snapshot.enrolmentIds.has(enr.id)) {
        col.wouldSkipExisting += 1;
      } else if (!learnerExists || !ambExists || !refExists) {
        report.skippedMissingReferent.push({
          collection: "enrolments",
          recordId: enr.id,
          reason: `Missing referent in live Supabase (learner=${learnerExists}, ambassador=${ambExists}, referral=${refExists}).`,
        });
        col.conflicts += 1;
      } else {
        plannedEnrolments.push({
          id: enr.id,
          referral_id: enr.referralId,
          course_id: enr.courseId,
          ambassador_id: enr.ambassadorId,
          learner_name: enr.learnerName,
          learner_email: learnerEmail,
          cohort: enr.cohort,
          tuition_amount_kes: enr.tuitionAmountKes,
          amount_paid_kes: enr.amountPaidKes,
          currency: enr.currency || "KES",
          payment_method: enr.paymentMethod || "MPESA",
          payment_reference: enr.paymentReference,
          verification_status: enr.verificationStatus,
        });
        col.wouldInsertLive += 1;
      }
    } else {
      const archiveId = `legacy-enrolments-${enr.id}`;
      if (snapshot.legacyRecordIds.has(archiveId)) {
        col.wouldSkipExisting += 1;
      } else {
        plannedLegacyRecords.push({
          id: archiveId,
          source: params.source,
          collection: "enrolments",
          record_id: enr.id,
          email_normalized: (enr.learnerEmail || "").trim().toLowerCase() || null,
          raw: stripSecretsFromRecord(enr as unknown as Record<string, unknown>),
        });
        col.wouldArchive += 1;
      }
    }
  }

  for (const sr of supportRequests) {
    const email = (sr.ambassadorEmail || "").trim().toLowerCase();
    const col = getCol("supportRequests");
    if (allowlistSet.has(email)) {
      const resolvedUserId = allowlistedResolvedUserIds.get(email) || sr.userId;
      if (snapshot.supportRequestIds.has(sr.id)) {
        col.wouldSkipExisting += 1;
      } else if (isUuid(resolvedUserId) && snapshot.profileIds.has(resolvedUserId)) {
        plannedSupportRequests.push({
          id: sr.id,
          user_id: resolvedUserId,
          ambassador_name: sr.ambassadorName,
          ambassador_email: email,
          subject: sr.subject,
          category: sr.category,
          message: sr.message,
          status: sr.status,
          admin_response: sr.adminResponse || null,
        });
        col.wouldInsertLive += 1;
      } else {
        report.skippedMissingReferent.push({
          collection: "support_requests",
          recordId: sr.id,
          reason: `No live public.profiles UUID for ${email}.`,
        });
        col.conflicts += 1;
      }
    } else {
      const archiveId = `legacy-supportRequests-${sr.id}`;
      if (!snapshot.legacyRecordIds.has(archiveId)) {
        plannedLegacyRecords.push({
          id: archiveId,
          source: params.source,
          collection: "supportRequests",
          record_id: sr.id,
          email_normalized: email || null,
          raw: stripSecretsFromRecord(sr as unknown as Record<string, unknown>),
        });
        col.wouldArchive += 1;
      } else {
        col.wouldSkipExisting += 1;
      }
    }
  }

  // 7. Referrals -> legacy_records
  for (const r of referrals) {
    const col = getCol("referrals");
    const archiveId = `legacy-referrals-${r.id}`;
    if (snapshot.legacyRecordIds.has(archiveId)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedLegacyRecords.push({
        id: archiveId,
        source: params.source,
        collection: "referrals",
        record_id: r.id,
        email_normalized: (r.learnerEmail || "").trim().toLowerCase() || null,
        raw: stripSecretsFromRecord(r as unknown as Record<string, unknown>),
      });
      col.wouldArchive += 1;
    }
  }

  // 8. Money/Points collections -> legacy_quarantine ONLY
  const quarantineCollections: Array<[string, Record<string, unknown>[], string]> = [
    ["pointsLedger", pointsLedger as unknown as Record<string, unknown>[], "Points ledger quarantined; never imported into live tables."],
    ["commissions", commissions as unknown as Record<string, unknown>[], "Commissions quarantined; never imported into live tables."],
    ["payoutRequests", payoutRequests as unknown as Record<string, unknown>[], "Payout requests quarantined; never imported into live tables."],
  ];
  for (const [colName, items, reason] of quarantineCollections) {
    const col = getCol(colName);
    for (const item of items) {
      const recId = String(item.id || `${colName}-${Math.random().toString(36).slice(2, 8)}`);
      const qId = `quarantine-${colName}-${recId}`;
      if (snapshot.legacyQuarantineIds.has(qId)) {
        col.wouldSkipExisting += 1;
      } else {
        plannedQuarantine.push({
          id: qId,
          collection: colName,
          raw: stripSecretsFromRecord(item),
          reason,
        });
        col.wouldQuarantine += 1;
        report.affectedIds.wouldQuarantine.push({
          collection: colName,
          id: recId,
          reason,
        });
      }
    }
  }

  // 9. Shared user-independent collections (insert-only, skip existing)
  for (const c of state.courses || []) {
    const col = getCol("courses");
    if (snapshot.courseIds.has(c.id) || snapshot.courseSlugs.has(c.slug) || !isUuid(c.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedCourses.push({
        id: c.id,
        slug: c.slug,
        title: c.title,
        short_code: c.shortCode,
        description: c.description,
        category: c.category,
        duration: c.duration,
        published_fee_kes: c.publishedFeeKes,
        currency: c.currency || "KES",
        commission_rate_pct: c.commissionRatePct,
        points_reward: c.pointsReward,
        enrollment_url: c.enrollmentUrl,
        image_url: c.imageUrl || null,
        highlights: c.highlights || [],
        status: c.status || "published",
      });
      col.wouldInsertLive += 1;
    }
  }

  for (const camp of state.campaigns || []) {
    const col = getCol("campaigns");
    if (snapshot.campaignIds.has(camp.id) || snapshot.campaignSlugs.has(camp.slug) || !isUuid(camp.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedCampaigns.push({
        id: camp.id,
        name: camp.name,
        slug: camp.slug,
        description: camp.description,
        objective: camp.objective,
        target_audience: camp.targetAudience,
        start_date: camp.startDate,
        end_date: camp.endDate,
        bonus_points_per_enrolment: camp.bonusPointsPerEnrolment || 0,
        bonus_commission_pct: camp.bonusCommissionPct || 0,
        status: camp.status || "active",
      });
      col.wouldInsertLive += 1;
    }
  }

  for (const ann of state.announcements || []) {
    const col = getCol("announcements");
    if (snapshot.announcementIds.has(ann.id) || !isUuid(ann.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedAnnouncements.push({
        id: ann.id,
        title: ann.title,
        body: ann.body,
        audience: ann.audience || "all",
        is_pinned: Boolean(ann.isPinned),
        published_at: ann.publishedAt || new Date().toISOString(),
      });
      col.wouldInsertLive += 1;
    }
  }

  for (const asset of state.marketingAssets || []) {
    const col = getCol("marketingAssets");
    if (snapshot.marketingAssetIds.has(asset.id) || !isUuid(asset.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedMarketingAssets.push({
        id: asset.id,
        title: asset.title,
        description: asset.description,
        category: asset.category,
        file_url: asset.fileUrl || null,
        preview_url: (asset as unknown as { previewUrl?: string }).previewUrl || null,
        caption_template: asset.captionTemplate,
        usage_instructions: asset.usageInstructions,
        status: asset.status || "published",
      });
      col.wouldInsertLive += 1;
    }
  }

  for (const badge of state.badges || []) {
    const col = getCol("badges");
    if (snapshot.badgeIds.has(badge.id) || snapshot.badgeCodes.has(badge.code) || !isUuid(badge.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedBadges.push({
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon_name: badge.iconName,
        criteria_type: badge.criteriaType,
        criteria_threshold: badge.criteriaThreshold,
      });
      col.wouldInsertLive += 1;
    }
  }

  if (state.rewardRules && state.rewardRules.code) {
    const col = getCol("rewardRules");
    if (snapshot.rewardRuleCodes.has(state.rewardRules.code) || !isUuid(state.rewardRules.id)) {
      col.wouldSkipExisting += 1;
    } else {
      plannedRewardRules.push({
        id: state.rewardRules.id,
        code: state.rewardRules.code,
        name: state.rewardRules.name,
        description: state.rewardRules.description,
        currency: state.rewardRules.currency || "KES",
        points_per_click: 0,
        points_per_qualified_lead: state.rewardRules.pointsPerQualifiedLead,
        points_per_verified_enrolment: state.rewardRules.pointsPerVerifiedEnrolment,
        default_commission_pct: state.rewardRules.defaultCommissionPct,
        min_payout_kes: state.rewardRules.minPayoutKes,
        attribution_window_days: state.rewardRules.attributionWindowDays,
        level_thresholds: state.rewardRules.levelThresholds,
        is_business_policy_confirmed: state.rewardRules.isBusinessPolicyConfirmed,
      });
      col.wouldInsertLive += 1;
    }
  }

  // DRY RUN: Return plan with ZERO writes (not even to legacy_import_log)
  if (params.dryRun) {
    return report;
  }

  // REAL RUN: Insert-only in batches, writing legacy_import_log for every inserted record
  const logRows: Record<string, unknown>[] = [];

  if (plannedProfiles.length > 0) {
    getCol("profiles").insertedLive = await insertInBatches(
      adapter,
      "profiles",
      plannedProfiles,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedApplications.length > 0) {
    getCol("applications").insertedLive = await insertInBatches(
      adapter,
      "applications",
      plannedApplications,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedAmbassadors.length > 0) {
    getCol("ambassadors").insertedLive = await insertInBatches(
      adapter,
      "ambassador_profiles",
      plannedAmbassadors,
      "user_id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedEnrolments.length > 0) {
    getCol("enrolments").insertedLive = await insertInBatches(
      adapter,
      "enrolments",
      plannedEnrolments,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedSupportRequests.length > 0) {
    getCol("supportRequests").insertedLive = await insertInBatches(
      adapter,
      "support_requests",
      plannedSupportRequests,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedCourses.length > 0) {
    getCol("courses").insertedLive = await insertInBatches(
      adapter,
      "courses",
      plannedCourses,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedCampaigns.length > 0) {
    getCol("campaigns").insertedLive = await insertInBatches(
      adapter,
      "campaigns",
      plannedCampaigns,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedAnnouncements.length > 0) {
    getCol("announcements").insertedLive = await insertInBatches(
      adapter,
      "announcements",
      plannedAnnouncements,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedMarketingAssets.length > 0) {
    getCol("marketingAssets").insertedLive = await insertInBatches(
      adapter,
      "marketing_assets",
      plannedMarketingAssets,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedBadges.length > 0) {
    getCol("badges").insertedLive = await insertInBatches(
      adapter,
      "badges",
      plannedBadges,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedRewardRules.length > 0) {
    getCol("rewardRules").insertedLive = await insertInBatches(
      adapter,
      "reward_rules",
      plannedRewardRules,
      "code",
      logRows,
      params.source,
      report.batchErrors
    );
  }
  if (plannedLegacyRecords.length > 0) {
    const insertedArchive = await insertInBatches(
      adapter,
      "legacy_records",
      plannedLegacyRecords,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
    getCol("legacy_records").archived = insertedArchive;
  }
  if (plannedQuarantine.length > 0) {
    const insertedQ = await insertInBatches(
      adapter,
      "legacy_quarantine",
      plannedQuarantine,
      "id",
      logRows,
      params.source,
      report.batchErrors
    );
    getCol("legacy_quarantine").quarantined = insertedQ;
  }

  for (let i = 0; i < logRows.length; i += BATCH_SIZE) {
    const chunk = logRows.slice(i, i + BATCH_SIZE);
    const res = await adapter.insertBatch("legacy_import_log", chunk, "id");
    if (res.error) {
      report.batchErrors.push(`legacy_import_log batch: ${res.error}`);
    }
  }

  report.ok = report.batchErrors.length === 0;
  return report;
}
