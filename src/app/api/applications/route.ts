import { NextRequest, NextResponse } from "next/server";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import { fetchSupabaseState, saveSupabaseState } from "@/lib/supabase-store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { submitAmbassadorApplicationOp } from "@/lib/store-engine";
import { ambassadorApplicationSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isSupabaseConfigured()) {
    const supabaseState = await fetchSupabaseState();
    if (supabaseState && Array.isArray(supabaseState.applications)) {
      savePersistentDb(supabaseState);
      return NextResponse.json(
        { ok: true, applications: supabaseState.applications },
        {
          status: 200,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }
  }

  const db = getPersistentDb();
  return NextResponse.json(
    { ok: true, applications: db.applications },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ambassadorApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid application payload." },
        { status: 400 }
      );
    }

    // Sync latest cloud state first so cold serverless instances never overwrite Supabase
    if (isSupabaseConfigured()) {
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

    // Persist and merge state on server
    const merged = savePersistentDb(nextState);

    // Sync merged state to Supabase if configured
    if (isSupabaseConfigured()) {
      await saveSupabaseState(merged);
    }

    return NextResponse.json(
      { ok: true, application, profile },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit application." },
      { status: 500 }
    );
  }
}
