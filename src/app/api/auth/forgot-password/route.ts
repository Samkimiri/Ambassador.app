import { NextResponse } from "next/server";
import { getSyncedServerDb, saveSyncedServerDb } from "@/lib/server-store";
import { buildPasswordResetEmail, sendEmail } from "@/lib/email";
import {
  createPasswordResetToken,
  generateResetCode,
  hashResetCode,
} from "@/lib/password-reset";
import { getAppUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { Profile } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`forgot:${ip}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many password reset requests. Please wait ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const db = await getSyncedServerDb();
    let profile = db.profiles.find(
      (p) => p.email.toLowerCase().trim() === email
    );

    // Fallback: recover profile from applications or ambassadors directory if missing
    if (!profile) {
      const app = db.applications.find(
        (a) => a.email.toLowerCase().trim() === email
      );
      const amb = db.ambassadors.find(
        (a) => a.email.toLowerCase().trim() === email
      );
      if (app || amb) {
        const now = new Date().toISOString();
        profile = {
          id: app?.userId || amb?.userId || `user-${Date.now()}`,
          email,
          fullName: app?.fullName || amb?.fullName || "SCDS Applicant",
          phone: app?.phone || amb?.phone || "",
          role:
            app?.status === "approved" || amb
              ? "ambassador"
              : "learner",
          status:
            amb?.isBlocked
              ? "blocked"
              : app?.status === "approved" || amb
              ? "active"
              : app?.status === "rejected"
              ? "rejected"
              : "pending",
          createdAt: app?.createdAt || amb?.createdAt || now,
          updatedAt: now,
        };
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No account found with that email address. Please check your spelling or apply to become an ambassador first.",
        },
        { status: 404 }
      );
    }

    if (profile.status === "blocked") {
      return NextResponse.json(
        {
          error:
            "This account has been blocked by the administrator. Please contact SCDS support.",
        },
        { status: 403 }
      );
    }

    const resetCode = generateResetCode();
    const resetCodeHash = hashResetCode(resetCode);
    const resetCodeExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

    const updatedProfiles: Profile[] = db.profiles.some(
      (p) => p.email.toLowerCase().trim() === email
    )
      ? db.profiles.map((p) =>
          p.email.toLowerCase().trim() === email
            ? { ...p, resetCodeHash, resetCodeExpiresAt }
            : p
        )
      : [{ ...profile, resetCodeHash, resetCodeExpiresAt }, ...db.profiles];

    await saveSyncedServerDb({ ...db, profiles: updatedProfiles });

    const token = createPasswordResetToken(profile.email);
    const origin = request.headers.get("origin") || getAppUrl();
    const resetUrl = `${origin.replace(/\/+$/, "")}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const emailMessage = buildPasswordResetEmail({
      fullName: profile.fullName,
      resetUrl,
      resetCode,
      expiresInMinutes: 30,
    });

    const sendResult = await sendEmail({
      ...emailMessage,
      to: profile.email,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error:
            sendResult.error ||
            "Failed to send password reset email via Resend.",
        },
        { status: 502 }
      );
    }

    if (sendResult.isMock && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Resend email service is not configured on the server (missing RESEND_API_KEY). Please contact the administrator.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "A 6-digit password reset code and recovery link have been sent to your email via Resend.",
      messageId: sendResult.messageId,
      isMock: sendResult.isMock,
      ...(sendResult.isMock && process.env.NODE_ENV !== "production"
        ? { devResetUrl: resetUrl, devResetCode: resetCode }
        : {}),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to process password reset request.",
      },
      { status: 500 }
    );
  }
}
