import { NextRequest, NextResponse } from "next/server";
import { buildApplicationApprovedEmail, sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/security";
import { getSyncedServerDb, saveSyncedServerDb } from "@/lib/server-store";
import {
  fetchSupabaseApplicationById,
  isSupabaseServiceConfigured,
  upsertSupabaseApplication,
} from "@/lib/supabase-store";
import { getAppUrl, validateEmailForDelivery } from "@/lib/utils";
import { AmbassadorApplication } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Application ID is required." },
      { status: 400 }
    );
  }

  let body: { updatedEmail?: string } = {};
  try {
    const raw = await req.text();
    if (raw) {
      body = JSON.parse(raw) as { updatedEmail?: string };
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const db = await getSyncedServerDb();
  const tableApp = isSupabaseServiceConfigured()
    ? await fetchSupabaseApplicationById(id)
    : null;
  const stateApp = db.applications.find((a) => a.id === id) || null;
  const serverApp: AmbassadorApplication | null = tableApp || stateApp;

  if (!serverApp) {
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 }
    );
  }

  if (serverApp.status !== "approved") {
    return NextResponse.json(
      {
        error: `Cannot send approval email: application status is "${serverApp.status}" (must be "approved").`,
      },
      { status: 400 }
    );
  }

  // Server-side per-application rate limit: max 1 send per 60 seconds
  const rate = checkRateLimit(`resend-approval:${id}`, 1, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit: please wait ${rate.retryAfterSeconds}s before resending to this application.`,
      },
      { status: 429 }
    );
  }

  // Only allow updating email when explicitly provided by the authenticated admin
  const requestedEmail =
    typeof body.updatedEmail === "string" && body.updatedEmail.trim()
      ? body.updatedEmail.trim().toLowerCase()
      : null;
  const targetEmail = requestedEmail || serverApp.email.trim().toLowerCase();

  const emailCheck = validateEmailForDelivery(targetEmail);
  if (!emailCheck.valid) {
    return NextResponse.json(
      { error: emailCheck.reason || "Invalid recipient email address." },
      { status: 400 }
    );
  }

  const matchingAmbassador = db.ambassadors.find(
    (a) =>
      a.userId === serverApp.userId ||
      a.email.toLowerCase() === serverApp.email.toLowerCase()
  );
  const referralCode = matchingAmbassador?.referralCode || "SCDS-AMB";

  const origin = req.headers.get("origin") || getAppUrl();
  const message = buildApplicationApprovedEmail({
    fullName: serverApp.fullName,
    referralCode,
    dashboardUrl: `${origin}/dashboard`,
  });

  const result = await sendEmail({
    ...message,
    to: targetEmail,
  });

  const now = new Date().toISOString();
  const updatedApp: AmbassadorApplication = {
    ...serverApp,
    email: targetEmail,
    approvalEmailSentAt: result.success
      ? now
      : serverApp.approvalEmailSentAt,
    approvalEmailLastError: result.success
      ? null
      : result.error || "Failed to dispatch approval email.",
  };

  const nextApplications = db.applications.some((a) => a.id === id)
    ? db.applications.map((a) => (a.id === id ? updatedApp : a))
    : [updatedApp, ...db.applications];

  const nextProfiles =
    requestedEmail && requestedEmail !== serverApp.email.toLowerCase()
      ? db.profiles.map((p) =>
          p.id === serverApp.userId ? { ...p, email: targetEmail, updatedAt: now } : p
        )
      : db.profiles;

  const nextAmbassadors =
    requestedEmail && requestedEmail !== serverApp.email.toLowerCase()
      ? db.ambassadors.map((amb) =>
          amb.userId === serverApp.userId
            ? { ...amb, email: targetEmail, updatedAt: now }
            : amb
        )
      : db.ambassadors;

  await saveSyncedServerDb({
    ...db,
    applications: nextApplications,
    profiles: nextProfiles,
    ambassadors: nextAmbassadors,
  });

  if (isSupabaseServiceConfigured()) {
    await upsertSupabaseApplication(updatedApp);
  }

  if (!result.success) {
    console.error(
      `[POST /api/applications/${id}/resend-approval] Failed to send to ${targetEmail}:`,
      result.error
    );
    return NextResponse.json(
      {
        error: result.error || "Failed to send approval email.",
        application: updatedApp,
      },
      { status: 502 }
    );
  }

  console.info(
    `[POST /api/applications/${id}/resend-approval] Sent approval email to ${targetEmail} (messageId=${result.messageId || "n/a"})`
  );

  return NextResponse.json(
    {
      ok: true,
      email: targetEmail,
      approvalEmailSentAt: now,
      messageId: result.messageId,
      isMock: result.isMock,
      application: updatedApp,
    },
    { status: 200 }
  );
}
