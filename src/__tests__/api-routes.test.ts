import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as syncGet, POST as syncPost } from "@/app/api/sync/route";
import { POST as referralsPost } from "@/app/api/referrals/route";
import { POST as stkPushPost } from "@/app/api/mpesa/stkpush/route";
import { POST as callbackPost } from "@/app/api/mpesa/callback/route";
import { POST as payoutPost } from "@/app/api/mpesa/payout/route";
import { getPersistentDb } from "@/lib/server-store";

describe("Backend API Route Handlers Integration", () => {
  describe("GET /api/health", () => {
    it("returns 200 OK with health status and service metadata", async () => {
      const res = await healthGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.appName).toBe("SCDS Ambassador Hub");
      expect(data.services.mpesa).toBeDefined();
      expect(data.services.email).toBeDefined();
    });
  });

  describe("GET & POST /api/sync", () => {
    it("GET returns 200 with persistent database state", async () => {
      const res = await syncGet();
      expect(res.status).toBe(200);
      const db = await res.json();
      expect(Array.isArray(db.ambassadors)).toBe(true);
      expect(Array.isArray(db.courses)).toBe(true);
      expect(Array.isArray(db.referrals)).toBe(true);
    });

    it("POST /api/sync updates state and returns ok: true", async () => {
      const current = getPersistentDb();
      const req = new NextRequest("http://localhost:3000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const res = await syncPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("POST /api/sync rejects non-object payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(null),
      });
      const res = await syncPost(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/referrals", () => {
    it("successfully creates a prospective learner enquiry attribution", async () => {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const payload = {
        learnerName: "Test Learner Kevin",
        learnerEmail: `kevin.${rand}@example.com`,
        learnerPhone: `0722${rand}`,
        learnerCounty: "Nairobi",
        courseId: "vibe-designing-uiux",
        referralCode: "SCDS-AMI-8K4P",
        enquiryNotes: "Interested in UI/UX evening cohort.",
        consentGiven: true,
      };

      const req = new NextRequest("http://localhost:3000/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `192.168.1.${rand % 250}`,
        },
        body: JSON.stringify(payload),
      });

      const res = await referralsPost(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.referral.learnerName).toBe("Test Learner Kevin");
      expect(data.referral.ambassadorId).toBe("amb-1");
    });

    it("rejects invalid email or empty payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.101",
        },
        body: JSON.stringify({ fullName: "A" }),
      });

      const res = await referralsPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/mpesa/stkpush", () => {
    it("initiates STK push with simulation fallback", async () => {
      const req = new NextRequest("http://localhost:3000/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "0712345678",
          amountKes: 15000,
          accountReference: "TUITION_UIUX",
          transactionDesc: "Deposit Payment",
        }),
      });

      const res = await stkPushPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.checkoutRequestId).toBeDefined();
      expect(data.customerMessage).toContain("Success");
    });

    it("rejects invalid phone number", async () => {
      const req = new NextRequest("http://localhost:3000/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "12345",
          amountKes: 1000,
        }),
      });

      const res = await stkPushPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid Kenyan phone number");
    });
  });

  describe("POST /api/mpesa/callback", () => {
    it("handles successful Safaricom Daraja callback payload", async () => {
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: "29115-34620561-1",
            CheckoutRequestID: "ws_CO_19122026102550",
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: 28500 },
                { Name: "MpesaReceiptNumber", Value: "QHD7823KL9" },
                { Name: "TransactionDate", Value: 20261106120000 },
                { Name: "PhoneNumber", Value: 254712345678 },
              ],
            },
          },
        },
      };

      const req = new NextRequest("http://localhost:3000/api/mpesa/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callbackPayload),
      });

      const res = await callbackPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ResultCode).toBe(0);
      expect(data.receipt).toBe("QHD7823KL9");
    });
  });

  describe("POST /api/mpesa/payout", () => {
    it("enforces minimum KES 500 withdrawal threshold", async () => {
      const req = new NextRequest("http://localhost:3000/api/mpesa/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "0712345678",
          amountKes: 200,
        }),
      });

      const res = await payoutPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Minimum payout withdrawal is KES 500");
    });

    it("processes valid payout request with simulation fallback", async () => {
      const req = new NextRequest("http://localhost:3000/api/mpesa/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "0712345678",
          amountKes: 4500,
          remarks: "October Commissions",
          payoutRequestId: "pay-test-1",
        }),
      });

      const res = await payoutPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.transactionReference).toMatch(/^SCDS/);
    });
  });
});
