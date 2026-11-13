import { NextResponse } from "next/server";
import { getPersistentDb } from "@/lib/server-store";
import { buildPasswordResetEmail, sendEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { getAppUrl } from "@/lib/utils";

export async function POST(request: Request) {
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

    const db = getPersistentDb();
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase().trim() === email
    );

    if (profile && profile.status !== "blocked") {
      const token = createPasswordResetToken(profile.email);
      const origin = request.headers.get("origin") || getAppUrl();
      const resetUrl = `${origin.replace(/\/+$/, "")}/auth/reset-password?token=${encodeURIComponent(token)}`;

      const emailMessage = buildPasswordResetEmail({
        fullName: profile.fullName,
        resetUrl,
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

      return NextResponse.json({
        ok: true,
        message:
          "If an SCDS Ambassador Hub account exists for that email, a password reset link has been sent.",
        isMock: sendResult.isMock,
        ...(sendResult.isMock && process.env.NODE_ENV !== "production"
          ? { devResetUrl: resetUrl }
          : {}),
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an SCDS Ambassador Hub account exists for that email, a password reset link has been sent.",
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
