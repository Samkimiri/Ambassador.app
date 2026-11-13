import { NextRequest, NextResponse } from "next/server";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import { fetchSupabaseState, saveSupabaseState } from "@/lib/supabase-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isSupabaseConfigured()) {
    const supabaseState = await fetchSupabaseState();
    if (supabaseState && Array.isArray(supabaseState.applications)) {
      // Also update local persistent cache
      savePersistentDb(supabaseState);
      return NextResponse.json(supabaseState, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  }

  const db = getPersistentDb();
  return NextResponse.json(db, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const nextState = await req.json();
    if (!nextState || typeof nextState !== "object") {
      return NextResponse.json(
        { error: "Invalid database state payload." },
        { status: 400 }
      );
    }

    // 1. Pull latest cloud state first so concurrent devices never overwrite each other
    if (isSupabaseConfigured()) {
      const supabaseState = await fetchSupabaseState();
      if (supabaseState) {
        savePersistentDb(supabaseState);
      }
    }

    // 2. Merge incoming client state with server/cloud state
    const merged = savePersistentDb(nextState);

    // 3. Save merged state in Supabase cloud database if configured
    if (isSupabaseConfigured()) {
      await saveSupabaseState(merged);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync state." },
      { status: 500 }
    );
  }
}
