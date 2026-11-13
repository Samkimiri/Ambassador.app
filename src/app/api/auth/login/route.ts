import { NextResponse } from "next/server";
import { getSyncedServerDb, saveSyncedServerDb } from "@/lib/server-store";
import {
  createSessionToken,
  hashPassword,
  isPasswordHashed,
  sanitizeProfile,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`login:${ip}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many sign-in attempts. Please wait ${rate.retryAfterSeconds}s and try again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const db = await getSyncedServerDb();
    let profile = db.profiles.find((p) => p.email.toLowerCase() === email);

    if (!profile) {
      const matchingApp = db.applications.find(
        (a) => a.email.toLowerCase() === email
      );
      if (matchingApp) {
        profile = {
          id: matchingApp.userId,
          email,
          fullName: matchingApp.fullName,
          phone: matchingApp.phone,
          role: matchingApp.status === "approved" ? "ambassador" : "learner",
          status:
            matchingApp.status === "approved"
              ? "active"
              : matchingApp.status === "rejected"
              ? "rejected"
              : "pending",
          createdAt: matchingApp.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Please check your spelling or apply to become an ambassador.",
        },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, profile.password)) {
      return NextResponse.json(
        {
          error:
            "Incorrect password. Please enter the valid password for your account.",
        },
        { status: 401 }
      );
    }

    if (profile.status === "blocked") {
      return NextResponse.json(
        {
          error:
            "Your account has been blocked by the administrator. Please contact SCDS support.",
        },
        { status: 403 }
      );
    }

    if (profile.status === "suspended") {
      return NextResponse.json(
        {
          error:
            "This account has been temporarily suspended. Please contact SCDS support.",
        },
        { status: 403 }
      );
    }

    // Transparently upgrade legacy plaintext password to scrypt hash on login
    if (profile.password && !isPasswordHashed(profile.password)) {
      const hashed = hashPassword(password);
      await saveSyncedServerDb({
        ...db,
        profiles: db.profiles.map((p) =>
          p.id === profile!.id ? { ...p, password: hashed } : p
        ),
      });
    }

    const token = createSessionToken(profile);
    const res = NextResponse.json({
      ok: true,
      user: sanitizeProfile(profile),
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to complete sign-in.",
      },
      { status: 500 }
    );
  }
}
