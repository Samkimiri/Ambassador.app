import { NextRequest, NextResponse } from "next/server";
import { getSyncedServerDb, savePersistentDb, saveSyncedServerDb } from "@/lib/server-store";
import { AppDatabaseState } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/**
 * Webhook handler for instant real-time triggers from Supabase Database Webhooks,
 * M-Pesa IPN notifications, or external partner integrations.
 * 
 * When configured as a Supabase Database Webhook:
 * 1. Go to Supabase Dashboard -> Database -> Webhooks.
 * 2. Create a webhook for table "app_state" on "UPDATE".
 * 3. Point to https://<your-domain>/api/webhooks/app-state
 */
export async function POST(req: NextRequest) {
  const expectedSecret =
    process.env.WEBHOOK_SECRET || process.env.SUPABASE_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
    }
  }

  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid webhook payload." },
        { status: 400 }
      );
    }

    // 1. Handle Supabase Database Webhook on app_state table
    if (
      payload.table === "app_state" &&
      payload.record &&
      payload.record.state
    ) {
      const state = payload.record.state as AppDatabaseState;
      if (Array.isArray(state.applications)) {
        savePersistentDb(state);
        return NextResponse.json({
          success: true,
          type: "supabase_app_state_synced",
          applicationsCount: state.applications.length,
          receivedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Handle direct webhook event dispatch (e.g. from mobile or external form)
    if (payload.event === "application_submitted" && payload.application) {
      const current = await getSyncedServerDb();
      const existing = current.applications.some(
        (a) => a.id === payload.application.id
      );

      if (!existing) {
        const nextState: AppDatabaseState = {
          ...current,
          applications: [payload.application, ...current.applications],
        };
        await saveSyncedServerDb(nextState);
      }

      return NextResponse.json({
        success: true,
        type: "application_received",
        applicationId: payload.application.id,
      });
    }

    // 3. Fallback: If raw state was directly posted to the webhook endpoint
    if (payload.applications && Array.isArray(payload.applications)) {
      await saveSyncedServerDb(payload as AppDatabaseState);
      return NextResponse.json({
        success: true,
        type: "state_webhook_applied",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook event acknowledged.",
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/app-state",
    supportedEvents: [
      "supabase_database_webhook (table: app_state)",
      "application_submitted",
      "payout_requested",
    ],
    timestamp: new Date().toISOString(),
  });
}
