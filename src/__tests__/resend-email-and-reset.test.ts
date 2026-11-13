import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildApplicationApprovedEmail,
  buildPasswordResetEmail,
  sendEmail,
} from "@/lib/email";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/password-reset";
import { POST as sendEmailRoute } from "@/app/api/email/send/route";
import { POST as forgotPasswordRoute } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordRoute } from "@/app/api/auth/reset-password/route";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import { verifyPassword, isPasswordHashed } from "@/lib/security";

describe("Resend Email & Password Reset", () => {
  const originalEnv = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it("builds application approved and password reset email templates", () => {
    const approved = buildApplicationApprovedEmail({
      fullName: "Jane Doe",
      referralCode: "SCDS-JAN-1234",
      dashboardUrl: "https://example.com/dashboard",
    });
    expect(approved.subject).toContain("Application Approved");
    expect(approved.html).toContain("Jane Doe");
    expect(approved.html).toContain("SCDS-JAN-1234");
    expect(approved.html).toContain("https://example.com/dashboard");

    const reset = buildPasswordResetEmail({
      fullName: "Jane Doe",
      resetUrl: "https://example.com/auth/reset-password?token=abc",
      expiresInMinutes: 30,
    });
    expect(reset.subject).toContain("Reset");
    expect(reset.html).toContain("Jane Doe");
    expect(reset.html).toContain("https://example.com/auth/reset-password?token=abc");
    expect(reset.html).toContain("30 minutes");
  });

  it("dispatches via Resend API when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "re_msg_999" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await sendEmailRoute(
      new Request("https://scds.test/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "application_approved",
          to: "jane@example.com",
          fullName: "Jane Doe",
          referralCode: "SCDS-JAN-1234",
        }),
      })
    );

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.messageId).toBe("re_msg_999");
    expect(data.isMock).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key_123",
        }),
      })
    );
  });

  it("creates, verifies, and rejects tampered or expired password reset tokens", () => {
    const token = createPasswordResetToken("User@Example.com", 60_000);
    const valid = verifyPasswordResetToken(token);
    expect(valid).toEqual({ valid: true, email: "user@example.com" });

    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifyPasswordResetToken(tampered).valid).toBe(false);

    const expired = createPasswordResetToken("user@example.com", -1000);
    const expiredResult = verifyPasswordResetToken(expired);
    expect(expiredResult.valid).toBe(false);
  });

  it("completes forgot-password -> reset-password flow and updates user password", async () => {
    delete process.env.RESEND_API_KEY;
    const db = getPersistentDb();
    const testEmail = "reset.flow.test@example.com";
    const now = new Date().toISOString();

    savePersistentDb({
      ...db,
      profiles: [
        ...db.profiles.filter((p) => p.email !== testEmail),
        {
          id: "usr-reset-test",
          email: testEmail,
          fullName: "Reset Test User",
          phone: "+254700000001",
          role: "ambassador",
          status: "active",
          password: "OldPassword123",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const forgotRes = await forgotPasswordRoute(
      new Request("https://scds.test/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://scds.test",
        },
        body: JSON.stringify({ email: testEmail }),
      })
    );
    const forgotData = await forgotRes.json();
    expect(forgotRes.status).toBe(200);
    expect(forgotData.ok).toBe(true);
    expect(typeof forgotData.devResetUrl).toBe("string");

    const parsedUrl = new URL(forgotData.devResetUrl);
    const token = parsedUrl.searchParams.get("token");
    expect(token).toBeTruthy();

    const resetRes = await resetPasswordRoute(
      new Request("https://scds.test/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: "NewSecurePassword456",
        }),
      })
    );
    const resetData = await resetRes.json();
    expect(resetRes.status).toBe(200);
    expect(resetData.ok).toBe(true);

    const updatedDb = getPersistentDb();
    const updatedUser = updatedDb.profiles.find((p) => p.email === testEmail);
    expect(isPasswordHashed(updatedUser?.password)).toBe(true);
    expect(verifyPassword("NewSecurePassword456", updatedUser?.password)).toBe(true);

    // Also test 6-digit reset code flow
    expect(typeof forgotData.devResetCode).toBe("string");
    expect(forgotData.devResetCode).toMatch(/^\d{6}$/);

    const forgotRes2 = await forgotPasswordRoute(
      new Request("https://scds.test/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://scds.test",
          "x-forwarded-for": "10.9.9.9",
        },
        body: JSON.stringify({ email: testEmail }),
      })
    );
    const forgotData2 = await forgotRes2.json();
    expect(forgotData2.devResetCode).toMatch(/^\d{6}$/);

    const wrongCodeRes = await resetPasswordRoute(
      new Request("https://scds.test/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.9.9.9" },
        body: JSON.stringify({
          email: testEmail,
          code: "000000",
          newPassword: "AnotherPassword789",
        }),
      })
    );
    expect(wrongCodeRes.status).toBe(400);

    const codeResetRes = await resetPasswordRoute(
      new Request("https://scds.test/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.9.9.9" },
        body: JSON.stringify({
          email: testEmail,
          code: forgotData2.devResetCode,
          newPassword: "CodeResetPassword789",
        }),
      })
    );
    expect(codeResetRes.status).toBe(200);
    const afterCodeUser = getPersistentDb().profiles.find((p) => p.email === testEmail);
    expect(verifyPassword("CodeResetPassword789", afterCodeUser?.password)).toBe(true);

    // Fallback check when RESEND_API_KEY is unset
    const mockSend = await sendEmail({
      to: testEmail,
      subject: "Test",
      html: "<p>Test</p>",
    });
    expect(mockSend.success).toBe(true);
    expect(mockSend.isMock).toBe(true);
  });

  it("retries with onboarding@resend.dev if primary EMAIL_FROM domain is unverified", async () => {
    process.env.RESEND_API_KEY = "re_test_key_domain_fallback";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: "The domain is not verified." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "re_fallback_123" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const res = await sendEmail({
      to: "user@example.com",
      subject: "Reset Code",
      html: "<p>Code</p>",
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe("re_fallback_123");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
