import { NextRequest, NextResponse } from "next/server";
import {
  legacyFilePayloadSchema,
  LegacyMigrationAdapter,
  LiveSupabaseSnapshot,
  migrateLegacyRequestSchema,
  runLegacyMigration,
  stripSecretsFromRecord,
} from "@/lib/legacy-migration";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/security";
import { AppDatabaseState } from "@/lib/seed-data";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { fetchSupabaseState, isSupabaseServiceConfigured } from "@/lib/supabase-store";

export const dynamic = "force-dynamic";

function createSupabaseMigrationAdapter(): LegacyMigrationAdapter {
  const client = getSupabaseServiceClient();
  if (!client) {
    throw new Error("Supabase service client is unavailable.");
  }

  const safeIds = async (table: string, col = "id"): Promise<Record<string, unknown>[]> => {
    const { data, error } = await client.from(table).select(col);
    if (error || !data) return [];
    return data as unknown as Record<string, unknown>[];
  };

  return {
    async loadSnapshot(): Promise<LiveSupabaseSnapshot> {
      const [
        apps,
        profs,
        ambs,
        courses,
        campaigns,
        announcements,
        assets,
        badges,
        rules,
        enrolments,
        referrals,
        supports,
        legRecords,
        legQuarantine,
      ] = await Promise.all([
        safeIds("applications", "id, email"),
        safeIds("profiles", "id, email"),
        safeIds("ambassador_profiles", "id, user_id, referral_code"),
        safeIds("courses", "id, slug"),
        safeIds("campaigns", "id, slug"),
        safeIds("announcements", "id"),
        safeIds("marketing_assets", "id"),
        safeIds("badges", "id, code"),
        safeIds("reward_rules", "code"),
        safeIds("enrolments", "id"),
        safeIds("referrals", "id"),
        safeIds("support_requests", "id"),
        safeIds("legacy_records", "id"),
        safeIds("legacy_quarantine", "id"),
      ]);

      let authUsers: Array<{ id: string; email?: string }> = [];
      try {
        const { data } = await client.auth.admin.listUsers({ perPage: 1000 });
        authUsers = data?.users || [];
      } catch {
        authUsers = [];
      }

      const profileEmailToId = new Map<string, string>();
      for (const p of profs) {
        if (p.email && p.id) {
          profileEmailToId.set(String(p.email).trim().toLowerCase(), String(p.id));
        }
      }

      const authEmailToId = new Map<string, string>();
      for (const u of authUsers) {
        if (u.email && u.id) {
          authEmailToId.set(u.email.trim().toLowerCase(), u.id);
        }
      }

      return {
        applicationIds: new Set(apps.map((r) => String(r.id))),
        applicationEmails: new Set(
          apps.map((r) => String(r.email || "").trim().toLowerCase()).filter(Boolean)
        ),
        profileIds: new Set(profs.map((r) => String(r.id))),
        profileEmailToId,
        authUserIds: new Set(authUsers.map((u) => u.id)),
        authEmailToId,
        ambassadorIds: new Set(ambs.map((r) => String(r.id))),
        ambassadorUserIds: new Set(ambs.map((r) => String(r.user_id))),
        ambassadorReferralCodes: new Set(ambs.map((r) => String(r.referral_code))),
        courseIds: new Set(courses.map((r) => String(r.id))),
        courseSlugs: new Set(courses.map((r) => String(r.slug))),
        campaignIds: new Set(campaigns.map((r) => String(r.id))),
        campaignSlugs: new Set(campaigns.map((r) => String(r.slug))),
        announcementIds: new Set(announcements.map((r) => String(r.id))),
        marketingAssetIds: new Set(assets.map((r) => String(r.id))),
        badgeIds: new Set(badges.map((r) => String(r.id))),
        badgeCodes: new Set(badges.map((r) => String(r.code))),
        rewardRuleCodes: new Set(rules.map((r) => String(r.code))),
        enrolmentIds: new Set(enrolments.map((r) => String(r.id))),
        referralIds: new Set(referrals.map((r) => String(r.id))),
        supportRequestIds: new Set(supports.map((r) => String(r.id))),
        legacyRecordIds: new Set(legRecords.map((r) => String(r.id))),
        legacyQuarantineIds: new Set(legQuarantine.map((r) => String(r.id))),
      };
    },

    async insertBatch(
      table: string,
      rows: Record<string, unknown>[],
      conflictColumn: string
    ) {
      if (rows.length === 0) return { insertedCount: 0 };
      const { error } = await client
        .from(table)
        .upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: true });
      if (error) {
        return { insertedCount: 0, error: error.message };
      }
      return { insertedCount: rows.length };
    },
  };
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }
  if (session.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: administrator privileges required." },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(`legacy-lookup:${session.userId}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Supabase service credentials are not configured on this server." },
      { status: 503 }
    );
  }

  const client = getSupabaseServiceClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase service client is unavailable." },
      { status: 503 }
    );
  }
  const lookupEmail = req.nextUrl.searchParams.get("lookupEmail")?.trim().toLowerCase();

  // Read live public.app_state and legacy_records (read-only)
  const [appState, legacyRowsRes, liveAppsRes] = await Promise.all([
    fetchSupabaseState(),
    client
      .from("legacy_records")
      .select("id, source, collection, record_id, email_normalized, raw, created_at"),
    client.from("applications").select("id, email, status, created_at"),
  ]);

  const legacyRows = (legacyRowsRes.data || []) as Array<{
    id: string;
    source: string;
    collection: string;
    record_id: string;
    email_normalized: string | null;
    raw: Record<string, unknown>;
    created_at: string;
  }>;

  const liveApps = (liveAppsRes.data || []) as Array<{
    id: string;
    email: string;
    status: string;
    created_at: string;
  }>;
  const liveEmailSet = new Set(
    liveApps.map((a) => (a.email || "").trim().toLowerCase()).filter(Boolean)
  );

  // Build legacy-only email list from legacy_records (or public.app_state if legacy_records not yet populated)
  const legacyEmailSet = new Set<string>();
  for (const r of legacyRows) {
    if (r.email_normalized) legacyEmailSet.add(r.email_normalized.trim().toLowerCase());
  }
  if (legacyEmailSet.size === 0 && appState) {
    for (const a of appState.applications || []) {
      if (a.email) legacyEmailSet.add(a.email.trim().toLowerCase());
    }
    for (const p of appState.profiles || []) {
      if (p.email && p.role !== "super_admin") {
        legacyEmailSet.add(p.email.trim().toLowerCase());
      }
    }
  }

  const reappliedEmails: string[] = [];
  const notYetReappliedEmails: string[] = [];
  for (const em of Array.from(legacyEmailSet)) {
    if (liveEmailSet.has(em)) {
      reappliedEmails.push(em);
    } else {
      notYetReappliedEmails.push(em);
    }
  }

  let lookupMatches: Array<{
    source: string;
    collection: string;
    recordId: string;
    status?: string;
    raw: Record<string, unknown>;
  }> = [];

  if (lookupEmail) {
    for (const r of legacyRows) {
      if (r.email_normalized?.toLowerCase() === lookupEmail) {
        lookupMatches.push({
          source: r.source,
          collection: r.collection,
          recordId: r.record_id,
          status: typeof r.raw?.status === "string" ? r.raw.status : undefined,
          raw: stripSecretsFromRecord(r.raw || {}),
        });
      }
    }
    if (lookupMatches.length === 0 && appState) {
      for (const a of appState.applications || []) {
        if (a.email.trim().toLowerCase() === lookupEmail) {
          lookupMatches.push({
            source: "public.app_state",
            collection: "applications",
            recordId: a.id,
            status: a.status,
            raw: stripSecretsFromRecord(a as unknown as Record<string, unknown>),
          });
        }
      }
      for (const p of appState.profiles || []) {
        if (p.email.trim().toLowerCase() === lookupEmail) {
          lookupMatches.push({
            source: "public.app_state",
            collection: "profiles",
            recordId: p.id,
            status: p.status,
            raw: stripSecretsFromRecord(p as unknown as Record<string, unknown>),
          });
        }
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      reapplyStats: {
        totalLegacyEmails: legacyEmailSet.size,
        reappliedCount: reappliedEmails.length,
        notYetReappliedCount: notYetReappliedEmails.length,
        notYetReappliedEmails: notYetReappliedEmails.sort(),
      },
      ...(lookupEmail ? { lookupEmail, lookupMatches } : {}),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in as an administrator." },
      { status: 401 }
    );
  }
  if (session.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: administrator privileges required." },
      { status: 403 }
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Supabase service credentials are not configured on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parsedReq = migrateLegacyRequestSchema.safeParse(body);
  if (!parsedReq.success) {
    return NextResponse.json(
      {
        error:
          parsedReq.error.issues[0]?.message || "Invalid migration request parameters.",
      },
      { status: 400 }
    );
  }

  const { source, allowlist, dry_run: dryRun, confirm_token: confirmToken, fileData } =
    parsedReq.data;

  let legacyState: Partial<AppDatabaseState> | null = null;

  if (source === "file") {
    const parsedFile = legacyFilePayloadSchema.safeParse(fileData);
    if (!parsedFile.success) {
      return NextResponse.json(
        {
          error:
            parsedFile.error.issues[0]?.message ||
            "Malformed legacy export JSON file.",
        },
        { status: 400 }
      );
    }
    legacyState = parsedFile.data as unknown as Partial<AppDatabaseState>;
  } else {
    // Strictly read live public.app_state — never data/scds-app-db.json
    legacyState = await fetchSupabaseState();
    if (!legacyState) {
      return NextResponse.json(
        { error: "Live public.app_state is empty or could not be fetched." },
        { status: 404 }
      );
    }
  }

  const adapter = createSupabaseMigrationAdapter();
  const report = await runLegacyMigration(
    {
      source,
      allowlist,
      dryRun,
      confirmToken,
      legacyState,
    },
    adapter
  );

  if (!report.ok) {
    return NextResponse.json(report, { status: 400 });
  }

  return NextResponse.json(report, { status: 200 });
}
