import { NextRequest, NextResponse } from "next/server";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";

export async function GET() {
  const db = getPersistentDb();
  return NextResponse.json(db, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
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
    savePersistentDb(nextState);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync state." },
      { status: 500 }
    );
  }
}
