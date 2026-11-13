import crypto from "crypto";
import { AppDatabaseState } from "@/lib/seed-data";
import { Profile } from "@/types";

export const SESSION_COOKIE_NAME = "scds_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string | null {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.PASSWORD_RESET_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === "test") {
    return "scds-vitest-ephemeral-session-secret";
  }
  return null;
}

/**
 * Hash a plaintext password using scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verify a candidate password against either an scrypt hash or legacy plaintext.
 */
export function verifyPassword(candidate: string, stored?: string): boolean {
  if (!stored) return true;
  if (!candidate) return false;

  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    const actualBuf = crypto.scryptSync(candidate, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (actualBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  }

  // Constant-time comparison for legacy plaintext records
  const candBuf = Buffer.from(candidate, "utf-8");
  const storedBuf = Buffer.from(stored, "utf-8");
  if (candBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candBuf, storedBuf);
}

export function isPasswordHashed(stored?: string): boolean {
  return Boolean(stored && stored.startsWith("scrypt$"));
}

/**
 * Strip password fields before sending any Profile to the browser.
 */
export function sanitizeProfile(
  profile: Profile
): Omit<Profile, "password" | "resetCodeHash" | "resetCodeExpiresAt"> {
  const {
    password: _removed,
    resetCodeHash: _removedHash,
    resetCodeExpiresAt: _removedExp,
    ...safe
  } = profile;
  return safe;
}

/**
 * Strip all password secrets from AppDatabaseState before returning over HTTP APIs.
 */
export function sanitizeStateForClient(state: AppDatabaseState): AppDatabaseState {
  return {
    ...state,
    profiles: (state.profiles || []).map((p) => sanitizeProfile(p) as Profile),
    trash: (state.trash || []).map((t) => {
      if (t?.payload && typeof t.payload === "object" && "password" in t.payload) {
        const { password: _removed, ...restPayload } = t.payload as Record<string, unknown>;
        return { ...t, payload: restPayload };
      }
      return t;
    }),
  };
}

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: Profile["role"];
  exp: number;
}

export function createSessionToken(profile: Pick<Profile, "id" | "email" | "role">): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Session signing secret (AUTH_SESSION_SECRET) is not configured.");
  }
  const payload: SessionTokenPayload = {
    userId: profile.id,
    email: profile.email.toLowerCase().trim(),
    role: profile.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token?: string | null): SessionTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionTokenPayload;
    if (!payload.userId || !payload.email || typeof payload.exp !== "number") {
      return null;
    }
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): SessionTokenPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const part of cookies) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) continue;
    const name = part.slice(0, eqIndex).trim();
    if (name === SESSION_COOKIE_NAME) {
      const rawVal = part.slice(eqIndex + 1).trim();
      try {
        return verifySessionToken(decodeURIComponent(rawVal));
      } catch {
        return verifySessionToken(rawVal);
      }
    }
  }
  return null;
}
