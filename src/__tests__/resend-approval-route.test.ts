import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as resendApprovalRoute } from "@/app/api/applications/[id]/resend-approval/route";
import { getPersistentDb, savePersistentDb } from "@/lib/server-store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/security";
import { AmbassadorApplication } from "@/types";

describe("POST /api/applications/[id]/resend-approval", () => {
  const originalResendKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalResendKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalResendKey;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function makeAdminCookie() {
    const token = createSessionToken({
      id: "admin-1",
      email: "admin@samcreativedesignschool.com",
      role: "super_admin",
    });
    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  function makeAmbassadorCookie() {
    const token = createSessionToken({
      id: "amb-user-1",
      email: "ambassador@example.com",
      role: "ambassador",
    });
    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  it("rejects unauthenticated requests with 401 and non-admins with 403", async () => {
    const unauthReq = new NextRequest(
      "https://scds.test/api/applications/app-1/resend-approval",
      { method: "POST" }
    );
    const unauthRes = await resendApprovalRoute(unauthReq, {
      params: Promise.resolve({ id: "app-1" }),
    });
    expect(unauthRes.status).toBe(401);

    const nonAdminReq = new NextRequest(
      "https://scds.test/api/applications/app-1/resend-approval",
      {
        method: "POST",
        headers: { cookie: makeAmbassadorCookie() },
      }
    );
    const nonAdminRes = await resendApprovalRoute(nonAdminReq, {
      params: Promise.resolve({ id: "app-1" }),
    });
    expect(nonAdminRes.status).toBe(403);
  });

  it("rejects non-approved applications with 400", async () => {
    const db = getPersistentDb();
    const pendingId = `app-pending-${Date.now()}`;
    const pendingApp: AmbassadorApplication = {
      id: pendingId,
      userId: `user-${pendingId}`,
      fullName: "Pending Applicant",
      email: "pending@gmail.com",
      phone: "0712345678",
      county: "Nairobi",
      institution: "TUK",
      occupation: "Student",
      socialLinks: {},
      motivation: "Excited to represent SCDS",
      experience: "Campus clubs",
      acceptedTerms: true,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    savePersistentDb({
      ...db,
      applications: [pendingApp, ...db.applications],
    });

    const req = new NextRequest(
      `https://scds.test/api/applications/${pendingId}/resend-approval`,
      {
        method: "POST",
        headers: { cookie: makeAdminCookie() },
      }
    );
    const res = await resendApprovalRoute(req, {
      params: Promise.resolve({ id: pendingId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("pending");
  });

  it("sends approval email via Resend for approved applications, sets approvalEmailSentAt, and enforces 60s rate limit", async () => {
    const db = getPersistentDb();
    const appId = `app-approved-${Date.now()}`;
    const userId = `user-${appId}`;
    const approvedApp: AmbassadorApplication = {
      id: appId,
      userId,
      fullName: "Approved Ambassador",
      email: "approved.ambassador@gmail.com",
      phone: "0712345678",
      county: "Nairobi",
      institution: "UON",
      occupation: "Designer",
      socialLinks: {},
      motivation: "Love SCDS",
      experience: "Design lead",
      acceptedTerms: true,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    savePersistentDb({
      ...db,
      applications: [approvedApp, ...db.applications],
      ambassadors: [
        {
          id: `amb-${appId}`,
          userId,
          fullName: "Approved Ambassador",
          email: "approved.ambassador@gmail.com",
          phone: "0712345678",
          referralCode: "SCDS-APP-9999",
          level: "Starter",
          totalPoints: 0,
          availablePoints: 0,
          totalCommissionKes: 0,
          availableCommissionKes: 0,
          paidCommissionKes: 0,
          payoutMethod: "MPESA",
          payoutPhone: "0712345678",
          county: "Nairobi",
          institution: "UON",
          occupation: "Designer",
          bio: "",
          isActive: true,
          clickCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...db.ambassadors,
      ],
    });

    process.env.RESEND_API_KEY = "re_test_mock_key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "resend_msg_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    // Even if a client sends a spoofed email/fullName, server uses the stored application record
    const req = new NextRequest(
      `https://scds.test/api/applications/${appId}/resend-approval`,
      {
        method: "POST",
        headers: {
          cookie: makeAdminCookie(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "spoofed@evil.com",
          fullName: "Spoofed Name",
        }),
      }
    );

    const res = await resendApprovalRoute(req, {
      params: Promise.resolve({ id: appId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.email).toBe("approved.ambassador@gmail.com");
    expect(json.approvalEmailSentAt).toBeTruthy();
    expect(json.messageId).toBe("resend_msg_123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const resendPayload = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(resendPayload.to).toEqual(["approved.ambassador@gmail.com"]);
    expect(resendPayload.html).toContain("Approved Ambassador");
    expect(resendPayload.html).toContain("SCDS-APP-9999");

    // Second immediate attempt hits the 60s server rate limit
    const rateLimitedReq = new NextRequest(
      `https://scds.test/api/applications/${appId}/resend-approval`,
      {
        method: "POST",
        headers: { cookie: makeAdminCookie() },
      }
    );
    const rateLimitedRes = await resendApprovalRoute(rateLimitedReq, {
      params: Promise.resolve({ id: appId }),
    });
    expect(rateLimitedRes.status).toBe(429);
  });
});
