import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as migrateGetRoute,
  POST as migratePostRoute,
} from "@/app/api/admin/migrate-legacy/route";
import {
  LegacyMigrationAdapter,
  LiveSupabaseSnapshot,
  runLegacyMigration,
  stripSecretsFromRecord,
} from "@/lib/legacy-migration";
import { createSessionToken, hashPassword, SESSION_COOKIE_NAME } from "@/lib/security";
import { AppDatabaseState } from "@/lib/seed-data";

function makeAdminCookie() {
  const token = createSessionToken({
    id: "admin-1",
    email: "admin@samcreativedesignschool.com",
    role: "super_admin",
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function makeAmbassadorCookie() {
  const token = createSessionToken({
    id: "amb-1",
    email: "amb@example.com",
    role: "ambassador",
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function createInMemoryAdapter(initial?: Partial<LiveSupabaseSnapshot>) {
  const tables: Record<string, Map<string, Record<string, unknown>>> = {
    profiles: new Map(),
    applications: new Map(),
    ambassador_profiles: new Map(),
    enrolments: new Map(),
    support_requests: new Map(),
    courses: new Map(),
    campaigns: new Map(),
    announcements: new Map(),
    marketing_assets: new Map(),
    badges: new Map(),
    reward_rules: new Map(),
    legacy_records: new Map(),
    legacy_quarantine: new Map(),
    legacy_import_log: new Map(),
  };

  if (initial?.applicationIds) {
    for (const id of initial.applicationIds) {
      tables.applications.set(id, { id, email: "existing@example.com", status: "approved" });
    }
  }

  const snapshot: LiveSupabaseSnapshot = {
    applicationIds: initial?.applicationIds || new Set(),
    applicationEmails: initial?.applicationEmails || new Set(),
    profileIds: initial?.profileIds || new Set(),
    profileEmailToId: initial?.profileEmailToId || new Map(),
    authUserIds: initial?.authUserIds || new Set(),
    authEmailToId: initial?.authEmailToId || new Map(),
    ambassadorIds: initial?.ambassadorIds || new Set(),
    ambassadorUserIds: initial?.ambassadorUserIds || new Set(),
    ambassadorReferralCodes: initial?.ambassadorReferralCodes || new Set(),
    courseIds: initial?.courseIds || new Set(),
    courseSlugs: initial?.courseSlugs || new Set(),
    campaignIds: initial?.campaignIds || new Set(),
    campaignSlugs: initial?.campaignSlugs || new Set(),
    announcementIds: initial?.announcementIds || new Set(),
    marketingAssetIds: initial?.marketingAssetIds || new Set(),
    badgeIds: initial?.badgeIds || new Set(),
    badgeCodes: initial?.badgeCodes || new Set(),
    rewardRuleCodes: initial?.rewardRuleCodes || new Set(),
    enrolmentIds: initial?.enrolmentIds || new Set(),
    referralIds: initial?.referralIds || new Set(),
    supportRequestIds: initial?.supportRequestIds || new Set(),
    legacyRecordIds: initial?.legacyRecordIds || new Set(),
    legacyQuarantineIds: initial?.legacyQuarantineIds || new Set(),
  };

  const insertCalls: Array<{ table: string; count: number }> = [];

  const adapter: LegacyMigrationAdapter = {
    async loadSnapshot() {
      return {
        ...snapshot,
        applicationIds: new Set([...snapshot.applicationIds, ...tables.applications.keys()]),
        legacyRecordIds: new Set([...snapshot.legacyRecordIds, ...tables.legacy_records.keys()]),
        legacyQuarantineIds: new Set([
          ...snapshot.legacyQuarantineIds,
          ...tables.legacy_quarantine.keys(),
        ]),
      };
    },
    async insertBatch(table, rows, conflictColumn) {
      insertCalls.push({ table, count: rows.length });
      const map = tables[table] || (tables[table] = new Map());
      let insertedCount = 0;
      for (const row of rows) {
        const key = String(row[conflictColumn] || row.id);
        // INSERT ... ON CONFLICT DO NOTHING: never overwrite existing rows
        if (!map.has(key)) {
          map.set(key, structuredClone(row));
          insertedCount += 1;
        }
      }
      return { insertedCount };
    },
  };

  return { adapter, tables, insertCalls };
}

function buildSampleLegacyState(): Partial<AppDatabaseState> {
  return {
    profiles: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        email: "kinyuam047@gmail.com",
        password: hashPassword("MartinSecret123!"),
        fullName: "Martin Kinyua",
        phone: "0711000111",
        role: "ambassador",
        status: "active",
        createdAt: "2026-11-12T10:00:00Z",
        updatedAt: "2026-11-12T10:00:00Z",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        email: "hnjoroge2005@gmail.com",
        password: "LegacyPlaintextPassword",
        fullName: "Hudson Njoroge",
        phone: "0722000222",
        role: "ambassador",
        status: "active",
        createdAt: "2026-11-12T11:00:00Z",
        updatedAt: "2026-11-12T11:00:00Z",
      },
      {
        id: "user-legacy-other",
        email: "legacy.person@gmail.com",
        password: "PlaintextOtherUser",
        resetCodeHash: "secret-reset-hash",
        fullName: "Legacy Only Person",
        phone: "0733000333",
        role: "ambassador",
        status: "active",
        createdAt: "2026-11-01T10:00:00Z",
        updatedAt: "2026-11-01T10:00:00Z",
      },
      {
        id: "user-legacy-admin",
        email: "rogue.admin@gmail.com",
        password: "PlaintextAdminPassword",
        fullName: "Legacy Claiming Admin",
        phone: "0744000444",
        role: "super_admin",
        status: "active",
        createdAt: "2026-11-01T10:00:00Z",
        updatedAt: "2026-11-01T10:00:00Z",
      },
    ],
    applications: [
      {
        id: "app-martin",
        userId: "11111111-1111-4111-8111-111111111111",
        fullName: "Martin Kinyua",
        email: "kinyuam047@gmail.com",
        phone: "0711000111",
        county: "Nairobi",
        institution: "UON",
        occupation: "Student",
        socialLinks: {},
        motivation: "Grow SCDS",
        experience: "Design",
        acceptedTerms: true,
        status: "approved",
        reviewedBy: "Samuel Kimiri",
        reviewedAt: "2026-11-12T23:58:25Z",
        createdAt: "2026-11-12T10:00:00Z",
      },
      {
        id: "app-hudson",
        userId: "22222222-2222-4222-8222-222222222222",
        fullName: "Hudson Njoroge",
        email: "hnjoroge2005@gmail.com",
        phone: "0722000222",
        county: "Kiambu",
        institution: "JKUAT",
        occupation: "Student",
        socialLinks: {},
        motivation: "Grow SCDS",
        experience: "Design",
        acceptedTerms: true,
        status: "approved",
        reviewedBy: "Samuel Kimiri",
        reviewedAt: "2026-11-12T19:11:32Z",
        createdAt: "2026-11-12T11:00:00Z",
      },
      {
        id: "app-legacy-only",
        userId: "user-legacy-other",
        fullName: "Legacy Only Person",
        email: "legacy.person@gmail.com",
        phone: "0733000333",
        county: "Nakuru",
        institution: "Egerton",
        occupation: "Student",
        socialLinks: {},
        motivation: "Old motivation",
        experience: "Old exp",
        acceptedTerms: true,
        status: "approved",
        createdAt: "2026-11-01T10:00:00Z",
      },
    ],
    ambassadors: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        userId: "22222222-2222-4222-8222-222222222222",
        fullName: "Hudson Njoroge",
        email: "hnjoroge2005@gmail.com",
        phone: "0722000222",
        referralCode: "SCDS-HUD-2026",
        level: "Starter",
        totalPoints: 250,
        availablePoints: 250,
        totalCommissionKes: 1500,
        availableCommissionKes: 1500,
        paidCommissionKes: 0,
        payoutMethod: "MPESA",
        payoutPhone: "0722000222",
        county: "Kiambu",
        institution: "JKUAT",
        occupation: "Student",
        bio: "",
        isActive: true,
        clickCount: 5,
        createdAt: "2026-11-12T19:11:32Z",
        updatedAt: "2026-11-12T19:11:32Z",
      },
    ],
    enrolments: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        referralId: "55555555-5555-4555-8555-555555555555",
        courseId: "66666666-6666-4666-8666-666666666666",
        ambassadorId: "33333333-3333-4333-8333-333333333333",
        learnerName: "Missing Learner",
        learnerEmail: "nonexistent.learner@gmail.com",
        cohort: "Cohort 11",
        tuitionAmountKes: 10000,
        amountPaidKes: 10000,
        currency: "KES",
        paymentMethod: "MPESA",
        paymentReference: "MPESA123",
        verificationStatus: "verified",
        createdAt: "2026-11-12T20:00:00Z",
        updatedAt: "2026-11-12T20:00:00Z",
      },
    ],
    pointsLedger: [
      {
        id: "pts-1",
        ambassadorId: "33333333-3333-4333-8333-333333333333",
        eventKey: "enr-1",
        pointsDelta: 250,
        reason: "Verified enrolment",
        createdAt: "2026-11-12T20:00:00Z",
      },
    ],
    commissions: [
      {
        id: "comm-1",
        ambassadorId: "33333333-3333-4333-8333-333333333333",
        enrolmentId: "44444444-4444-4444-8444-444444444444",
        referralId: "55555555-5555-4555-8555-555555555555",
        courseTitle: "Graphic Design",
        learnerName: "Missing Learner",
        tuitionPaidKes: 10000,
        commissionRatePct: 15,
        amountKes: 1500,
        currency: "KES",
        status: "approved",
        createdAt: "2026-11-12T20:00:00Z",
      },
    ],
  };
}

describe("Legacy Migration (Admin-only, Insert-only, Dry Run, Allowlist & Quarantine)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects non-admins (401/403) and malformed files or oversized allowlists (400)", async () => {
    const unauthPost = new NextRequest("https://scds.test/api/admin/migrate-legacy", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect((await migratePostRoute(unauthPost)).status).toBe(401);

    const nonAdminGet = new NextRequest("https://scds.test/api/admin/migrate-legacy", {
      method: "GET",
      headers: { cookie: makeAmbassadorCookie() },
    });
    expect((await migrateGetRoute(nonAdminGet)).status).toBe(403);

    const malformedPost = new NextRequest("https://scds.test/api/admin/migrate-legacy", {
      method: "POST",
      headers: {
        cookie: makeAdminCookie(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "file",
        fileData: { randomUnknownField: true },
      }),
    });
    const malformedRes = await migratePostRoute(malformedPost);
    expect([400, 503]).toContain(malformedRes.status);

    const oversizedAllowlist = Array.from({ length: 11 }, (_, i) => `user${i}@example.com`);
    const tooManyPost = new NextRequest("https://scds.test/api/admin/migrate-legacy", {
      method: "POST",
      headers: {
        cookie: makeAdminCookie(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "file",
        allowlist: oversizedAllowlist,
        fileData: { applications: [] },
      }),
    });
    const tooManyRes = await migratePostRoute(tooManyPost);
    expect([400, 503]).toContain(tooManyRes.status);
  });

  it("dry run performs zero writes, does not send emails, and flags plain-text passwords", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { adapter, tables, insertCalls } = createInMemoryAdapter();
    const state = buildSampleLegacyState();
    const stateSnapshotBefore = JSON.stringify(state);

    const report = await runLegacyMigration(
      {
        source: "app_state",
        allowlist: ["kinyuam047@gmail.com", "hnjoroge2005@gmail.com"],
        dryRun: true,
        legacyState: state,
      },
      adapter
    );

    expect(report.ok).toBe(true);
    expect(report.dryRun).toBe(true);
    expect(insertCalls.length).toBe(0);
    expect(tables.legacy_import_log.size).toBe(0);
    expect(tables.applications.size).toBe(0);
    expect(tables.legacy_records.size).toBe(0);
    expect(tables.legacy_quarantine.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(state)).toBe(stateSnapshotBefore);

    // Plain-text password count & allowlist flags
    expect(report.plaintextPasswordCount).toBe(3);
    expect(report.scryptPasswordCount).toBe(1);
    expect(report.skippedAdminRecords.length).toBe(1);
    expect(report.skippedAdminRecords[0].email).toBe("rogue.admin@gmail.com");
    expect(report.legacyOnlyEmailsCount).toBe(1);
  });

  it("real run is insert-only, idempotent, preserves existing rows, quarantines money/points, strips secrets, and skips missing-learner enrolments", async () => {
    const existingAppId = "app-martin";
    const { adapter, tables } = createInMemoryAdapter({
      applicationIds: new Set([existingAppId]),
      applicationEmails: new Set(["kinyuam047@gmail.com"]),
      authUserIds: new Set(["22222222-2222-4222-8222-222222222222"]),
      authEmailToId: new Map([
        ["hnjoroge2005@gmail.com", "22222222-2222-4222-8222-222222222222"],
      ]),
    });

    const beforeExistingApp = structuredClone(tables.applications.get(existingAppId));
    const state = buildSampleLegacyState();

    // Missing confirm_token -> rejected
    const blocked = await runLegacyMigration(
      {
        source: "file",
        allowlist: ["kinyuam047@gmail.com", "hnjoroge2005@gmail.com"],
        dryRun: false,
        confirmToken: "WRONG",
        legacyState: state,
      },
      adapter
    );
    expect(blocked.ok).toBe(false);

    // Real run with confirm_token = "MIGRATE"
    const run1 = await runLegacyMigration(
      {
        source: "file",
        allowlist: ["kinyuam047@gmail.com", "hnjoroge2005@gmail.com"],
        dryRun: false,
        confirmToken: "MIGRATE",
        legacyState: state,
      },
      adapter
    );
    expect(run1.ok).toBe(true);

    // Existing row for Martin was NEVER modified
    expect(tables.applications.get(existingAppId)).toEqual(beforeExistingApp);

    // Hudson's application was inserted with stored approved status & review fields
    expect(tables.applications.has("app-hudson")).toBe(true);
    expect(tables.applications.get("app-hudson")?.status).toBe("approved");

    // Non-allowlisted legacy.person@gmail.com is NOT in live applications or profiles
    expect(tables.applications.has("app-legacy-only")).toBe(false);
    expect(tables.profiles.has("user-legacy-other")).toBe(false);

    // Secrets & password hashes are NOT in legacy_records
    const archivedOtherProfile = tables.legacy_records.get("legacy-profiles-user-legacy-other");
    expect(archivedOtherProfile).toBeDefined();
    expect(JSON.stringify(archivedOtherProfile)).not.toContain("PlaintextOtherUser");
    expect(JSON.stringify(archivedOtherProfile)).not.toContain("secret-reset-hash");

    // Money/points/payout went ONLY to legacy_quarantine; payout_phone not written
    expect(tables.legacy_quarantine.has("quarantine-pointsLedger-pts-1")).toBe(true);
    expect(tables.legacy_quarantine.has("quarantine-commissions-comm-1")).toBe(true);
    expect(
      tables.legacy_quarantine.has("quarantine-ambassador-money-33333333-3333-4333-8333-333333333333")
    ).toBe(true);
    expect(run1.payoutReconfirmFlagged.some((p) => p.email === "hnjoroge2005@gmail.com")).toBe(true);

    // Enrolment whose learner does not exist in Supabase was skipped & reported
    expect(tables.enrolments.size).toBe(0);
    expect(run1.skippedMissingReferent.some((s) => s.collection === "enrolments")).toBe(true);

    const logCountAfterRun1 = tables.legacy_import_log.size;
    expect(logCountAfterRun1).toBeGreaterThan(0);

    // Running a second time inserts NOTHING new (idempotent)
    const run2 = await runLegacyMigration(
      {
        source: "file",
        allowlist: ["kinyuam047@gmail.com", "hnjoroge2005@gmail.com"],
        dryRun: false,
        confirmToken: "MIGRATE",
        legacyState: state,
      },
      adapter
    );
    expect(run2.ok).toBe(true);
    expect(tables.legacy_import_log.size).toBe(logCountAfterRun1);
  });

  it("stops and reports if an allowlist email has no matching legacy record", async () => {
    const { adapter } = createInMemoryAdapter();
    const res = await runLegacyMigration(
      {
        source: "app_state",
        allowlist: ["missing.allowlist@gmail.com"],
        dryRun: true,
        legacyState: buildSampleLegacyState(),
      },
      adapter
    );
    expect(res.ok).toBe(false);
    expect(res.missingAllowlistEmails).toEqual(["missing.allowlist@gmail.com"]);
  });

  it("stripSecretsFromRecord strips passwords, hashes, and tokens", () => {
    const cleaned = stripSecretsFromRecord({
      id: "u1",
      email: "a@b.com",
      password: "scrypt$abc$def",
      resetCodeHash: "hash",
      token: "tok",
    });
    expect(cleaned).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("fails closed with 401 in production when no session secret env var is set", async () => {
    const cookie = makeAdminCookie();
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAuthSecret = process.env.AUTH_SESSION_SECRET;
    const prevResetSecret = process.env.PASSWORD_RESET_SECRET;
    const prevServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const prevResendKey = process.env.RESEND_API_KEY;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.AUTH_SESSION_SECRET;
      delete process.env.PASSWORD_RESET_SECRET;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.RESEND_API_KEY;

      const req = new NextRequest("https://scds.test/api/admin/migrate-legacy", {
        method: "POST",
        headers: { cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: true }),
      });
      const res = await migratePostRoute(req);
      expect(res.status).toBe(401);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevAuthSecret !== undefined) process.env.AUTH_SESSION_SECRET = prevAuthSecret;
      if (prevResetSecret !== undefined) process.env.PASSWORD_RESET_SECRET = prevResetSecret;
      if (prevServiceKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceKey;
      if (prevResendKey !== undefined) process.env.RESEND_API_KEY = prevResendKey;
    }
  });
});
