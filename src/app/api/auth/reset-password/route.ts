import { NextResponse } from "next/server";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import { verifyPasswordResetToken } from "@/lib/password-reset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const verification = verifyPasswordResetToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      );
    }

    const db = getPersistentDb();
    const targetEmail = verification.email.toLowerCase().trim();
    const existing = db.profiles.find(
      (p) => p.email.toLowerCase().trim() === targetEmail
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const nextState = {
      ...db,
      profiles: db.profiles.map((p) =>
        p.email.toLowerCase().trim() === targetEmail
          ? { ...p, password: newPassword, updatedAt: now }
          : p
      ),
    };

    savePersistentDb(nextState);

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
