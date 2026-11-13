import { NextRequest, NextResponse } from "next/server";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import {
  fetchSupabaseApplications,
  fetchSupabaseState,
  isSupabaseServiceConfigured,
  saveSupabaseState,
  upsertSupabaseApplication,
} from "@/lib/supabase-store";
import { submitAmbassadorApplicationOp } from "@/lib/store-engine";
import { ambassadorApplicationSchema } from "@/lib/validations";
import { hashPassword, sanitizeProfile } from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AmbassadorApplication } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isProductionServer(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

function sortApplicationsPendingFirst(
  apps: AmbassadorApplication[]
): AmbassadorApplication[] {
  return [...apps].sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1;
    const bPending = b.status === "pending" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return (
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  });
}

export async function GET() {
  if (isProductionServer() && !isSupabaseServiceConfigured()) {
    console.error(
      "[CRITICAL] Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing in production."
    );
    return NextResponse.json(
      {
        error:
          "Server database is not configured. Missing Supabase environment variables.",
      },
      { status: 503 }
    );
  }

  if (isSupabaseServiceConfigured()) {
    const [tableApps, supabaseState] = await Promise.all([
      fetchSupabaseApplications(),
      fetchSupabaseState(),
    ]);

    const mergedMap = new Map<string, AmbassadorApplication>();
    for (const app of supabaseState?.applications || []) {
      mergedMap.set(app.id, app);
    }
    for (const app of tableApps || []) {
      if (!mergedMap.has(app.id)) {
        mergedMap.set(app.id, app);
      }
    }

    if (supabaseState) {
      savePersistentDb({
        ...supabaseState,
        applications: Array.from(mergedMap.values()),
      });
    }

    const sorted = sortApplicationsPendingFirst(Array.from(mergedMap.values()));
    return NextResponse.json(
      { ok: true, applications: sorted },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  const db = getPersistentDb();
  return NextResponse.json(
    { ok: true, applications: sortApplicationsPendingFirst(db.applications) },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`apply:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many application submissions. Please wait ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  if (isProductionServer() && !isSupabaseServiceConfigured()) {
    console.error(
      "[CRITICAL] Refusing application submission in production: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing."
    );
    return NextResponse.json(
      {
        error:
          "Unable to submit application right now: server database is not configured.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const parsed = ambassadorApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid application payload.",
        },
        { status: 400 }
      );
    }

    // Sync latest cloud state first so cold serverless instances never overwrite Supabase
    if (isSupabaseServiceConfigured()) {
      const supabaseState = await fetchSupabaseState();
      if (supabaseState) {
        savePersistentDb(supabaseState);
      }
    }

    // Retrieve fresh persistent state
    const currentDb = getPersistentDb();

    // Execute atomic application creation
    const { nextState, application, profile } = submitAmbassadorApplicationOp(
      currentDb,
      parsed.data
    );

    // Hash the applicant's password before persisting on server / Supabase
    const securedState = {
      ...nextState,
      profiles: nextState.profiles.map((p) =>
        p.id === profile.id && p.password
          ? { ...p, password: hashPassword(p.password) }
          : p
      ),
    };

    // Persist and merge state on server
    const merged = savePersistentDb(securedState);

    // Persist to Supabase (both app_state and applications table)
    if (isSupabaseServiceConfigured()) {
      const [stateSaved] = await Promise.all([
        saveSupabaseState(merged),
        upsertSupabaseApplication(application),
      ]);
      if (!stateSaved) {
        console.error(
          `[CRITICAL] Failed to persist application ${application.id} to Supabase.`
        );
        return NextResponse.json(
          {
            error:
              "Failed to save your application to the database. Please try again.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { ok: true, application, profile: sanitizeProfile(profile) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/applications] Submission error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to submit application.",
      },
      { status: 400 }
    );
  }
}
