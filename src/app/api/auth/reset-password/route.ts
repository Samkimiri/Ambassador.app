import { NextResponse } from "next/server";
import { getSyncedServerDb, saveSyncedServerDb } from "@/lib/server-store";
import {
  verifyPasswordResetToken,
  verifyResetCode,
} from "@/lib/password-reset";
import { hashPassword } from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`reset:${ip}`, 8, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many reset attempts. Please wait ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const emailInput =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token && (!emailInput || !code)) {
      return NextResponse.json(
        {
          error:
            "Please provide either a reset link token or your email and 6-digit reset code.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const db = await getSyncedServerDb();
    let targetEmail = emailInput;

    if (token) {
      const verification = verifyPasswordResetToken(token);
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error },
          { status: 400 }
        );
      }
      targetEmail = verification.email.toLowerCase().trim();
    }

    const existing = db.profiles.find(
      (p) => p.email.toLowerCase().trim() === targetEmail
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    if (!token) {
      const codeCheck = verifyResetCode(
        code,
        existing.resetCodeHash,
        existing.resetCodeExpiresAt
      );
      if (!codeCheck.valid) {
        return NextResponse.json(
          { error: codeCheck.error },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const hashedPassword = hashPassword(newPassword);
    const nextState = {
      ...db,
      profiles: db.profiles.map((p) =>
        p.email.toLowerCase().trim() === targetEmail
          ? {
              ...p,
              password: hashedPassword,
              resetCodeHash: undefined,
              resetCodeExpiresAt: undefined,
              updatedAt: now,
            }
          : p
      ),
    };

    await saveSyncedServerDb(nextState);

    return NextResponse.json({
      ok: true,
      email: existing.email,
      message: "Your password has been updated. You can now sign in.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to reset password.",
      },
      { status: 500 }
    );
  }
}
