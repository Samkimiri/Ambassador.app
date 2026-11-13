import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  hashPassword,
  isPasswordHashed,
  sanitizeStateForClient,
  SESSION_COOKIE_NAME,
  verifyPassword,
  verifySessionToken,
} from "@/lib/security";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { getPersistentDb, mergeDatabaseStates, savePersistentDb } from "@/lib/server-store";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { GET as syncGetRoute } from "@/app/api/sync/route";

describe("Security & Data Protection", () => {
  it("hashes passwords with scrypt and verifies securely", () => {
    const hash = hashPassword("StrongPass@2026");
    expect(isPasswordHashed(hash)).toBe(true);
    expect(hash).not.toContain("StrongPass@2026");
    expect(verifyPassword("StrongPass@2026", hash)).toBe(true);
    expect(verifyPassword("WrongPass", hash)).toBe(false);
  });

  it("redacts all password fields from client sync responses and preserves server passwords on merge", async () => {
    const db = getPersistentDb();
    const testEmail = "sec.redaction.test@example.com";
    const now = new Date().toISOString();
    const hashed = hashPassword("SecretPass123!");

    savePersistentDb({
      ...db,
      profiles: [
        ...db.profiles.filter((p) => p.email !== testEmail),
        {
          id: "usr-sec-1",
          email: testEmail,
          fullName: "Security Test",
          role: "ambassador",
          status: "active",
          password: hashed,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const res = await syncGetRoute();
    const clientDb = await res.json();
    const leaked = clientDb.profiles.some(
      (p: { password?: string }) => Boolean(p.password)
    );
    expect(leaked).toBe(false);

    // Merging sanitized client state back must NOT erase the server's stored password
    const merged = mergeDatabaseStates(getPersistentDb(), sanitizeStateForClient(getPersistentDb()));
    const serverProfile = merged.profiles.find((p) => p.email === testEmail);
    expect(serverProfile?.password).toBe(hashed);
  });

  it("creates and verifies signed session tokens and rejects tampered tokens", () => {
    const token = createSessionToken({
      id: "usr-1",
      email: "User@Example.com",
      role: "ambassador",
    });
    const verified = verifySessionToken(token);
    expect(verified?.userId).toBe("usr-1");
    expect(verified?.email).toBe("user@example.com");

    const tampered = `${token.slice(0, -3)}abc`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("authenticates valid credentials on /api/auth/login, sets HttpOnly cookie, and rejects wrong passwords", async () => {
    const db = getPersistentDb();
    const testEmail = "login.sec.test@example.com";
    const now = new Date().toISOString();

    savePersistentDb({
      ...db,
      profiles: [
        ...db.profiles.filter((p) => p.email !== testEmail),
        {
          id: "usr-login-sec",
          email: testEmail,
          fullName: "Login Sec User",
          role: "ambassador",
          status: "active",
          password: hashPassword("CorrectPass99!"),
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const badRes = await loginRoute(
      new Request("https://scds.test/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
        body: JSON.stringify({ email: testEmail, password: "WrongPassword" }),
      })
    );
    expect(badRes.status).toBe(401);

    const okRes = await loginRoute(
      new Request("https://scds.test/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
        body: JSON.stringify({ email: testEmail, password: "CorrectPass99!" }),
      })
    );
    expect(okRes.status).toBe(200);
    const body = await okRes.json();
    expect(body.ok).toBe(true);
    expect(body.user.password).toBeUndefined();
    expect(okRes.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(okRes.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
