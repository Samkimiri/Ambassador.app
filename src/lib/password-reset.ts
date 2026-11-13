import crypto from "crypto";

const DEFAULT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getResetSecret(): string {
  return (
    process.env.PASSWORD_RESET_SECRET ||
    process.env.RESEND_API_KEY ||
    "scds-ambassador-hub-password-reset-secret"
  );
}

export interface PasswordResetPayload {
  email: string;
  exp: number;
}

export function createPasswordResetToken(
  email: string,
  expiresInMs: number = DEFAULT_EXPIRY_MS
): string {
  const payload: PasswordResetPayload = {
    email: email.toLowerCase().trim(),
    exp: Date.now() + expiresInMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getResetSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyPasswordResetToken(
  token: string
): { valid: true; email: string } | { valid: false; error: string } {
  if (!token || !token.includes(".")) {
    return { valid: false, error: "Invalid password reset token." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed password reset token." };
  }

  const [encoded, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getResetSecret())
    .update(encoded)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { valid: false, error: "Invalid password reset signature." };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as PasswordResetPayload;

    if (!payload.email || typeof payload.exp !== "number") {
      return { valid: false, error: "Invalid password reset payload." };
    }

    if (Date.now() > payload.exp) {
      return {
        valid: false,
        error: "This password reset link has expired. Please request a new one.",
      };
    }

    return { valid: true, email: payload.email.toLowerCase().trim() };
  } catch {
    return { valid: false, error: "Could not decode password reset token." };
  }
}

export function generateResetCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashResetCode(code: string): string {
  return crypto
    .createHmac("sha256", getResetSecret())
    .update(code.trim())
    .digest("hex");
}

export function verifyResetCode(
  code: string,
  storedHash?: string,
  expiresAt?: string
): { valid: true } | { valid: false; error: string } {
  if (!storedHash || !expiresAt) {
    return { valid: false, error: "No active password reset code found. Please request a new one." };
  }
  if (Date.now() > Date.parse(expiresAt)) {
    return { valid: false, error: "Your password reset code has expired. Please request a new one." };
  }
  const candidateHash = hashResetCode(code);
  const a = Buffer.from(candidateHash, "utf-8");
  const b = Buffer.from(storedHash, "utf-8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, error: "Invalid 6-digit password reset code." };
  }
  return { valid: true };
}
