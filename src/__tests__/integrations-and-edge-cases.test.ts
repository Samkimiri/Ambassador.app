import { describe, expect, it } from "vitest";
import {
  formatDarajaPhone,
  generateDarajaPassword,
  generateDarajaTimestamp,
  initiateB2cPayout,
  initiateStkPush,
  parseStkCallback,
} from "@/lib/mpesa";
import {
  buildApplicationApprovedEmail,
  buildEnrolmentVerifiedEmail,
  buildPayoutDisbursedEmail,
  sendEmail,
} from "@/lib/email";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  processPayoutRequestOp,
  requestPayoutOp,
  submitLearnerEnquiryOp,
  verifyEnrolmentAndIssueRewardsOp,
} from "@/lib/store-engine";
import { isSelfReferral, normalizeKenyanPhone } from "@/lib/utils";

describe("SCDS Integrations & Security Edge Cases Suite", () => {
  describe("1. Safaricom Daraja M-Pesa Integration", () => {
    it("normalizes Kenyan phone numbers correctly to Daraja 254 standard", () => {
      expect(formatDarajaPhone("0712345678")).toBe("254712345678");
      expect(formatDarajaPhone("0112345678")).toBe("254112345678");
      expect(formatDarajaPhone("+254 712 345 678")).toBe("254712345678");
      expect(formatDarajaPhone("254712345678")).toBe("254712345678");
      expect(formatDarajaPhone("712345678")).toBe("254712345678");
    });

    it("generates valid Daraja timestamp and Base64 password", () => {
      const fixedDate = new Date("2026-10-21T12:30:45Z");
      const timestamp = generateDarajaTimestamp(fixedDate);
      expect(timestamp).toMatch(/^\d{14}$/);

      const password = generateDarajaPassword("174379", "test_passkey", "20261021123045");
      const decoded = Buffer.from(password, "base64").toString("utf-8");
      expect(decoded).toBe("174379test_passkey20261021123045");
    });

    it("initiates STK push in simulation mode without crashing when credentials are mock", async () => {
      const res = await initiateStkPush({
        phoneNumber: "0712345678",
        amountKes: 15000,
        accountReference: "COURSE-GDES",
        transactionDesc: "Tuition Enrolment",
      });

      expect(res.responseCode).toBe("0");
      expect(res.isMock).toBe(true);
      expect(res.checkoutRequestId).toContain("ws_CO_");
      expect(res.customerMessage).toContain("254712345678");
    });

    it("rejects invalid phone numbers or zero amounts in STK push", async () => {
      await expect(
        initiateStkPush({
          phoneNumber: "12345",
          amountKes: 5000,
          accountReference: "REF",
          transactionDesc: "Test",
        })
      ).rejects.toThrow("Invalid Kenyan phone number");

      await expect(
        initiateStkPush({
          phoneNumber: "0712345678",
          amountKes: 0,
          accountReference: "REF",
          transactionDesc: "Test",
        })
      ).rejects.toThrow("Amount must be greater than zero");
    });

    it("parses successful Daraja STK callback payload correctly", () => {
      const mockCallback = {
        Body: {
          stkCallback: {
            MerchantRequestID: "29115-34620561-1",
            CheckoutRequestID: "ws_CO_1912202610255312345",
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: 25000 },
                { Name: "MpesaReceiptNumber", Value: "QHD715X42K" },
                { Name: "TransactionDate", Value: 20261021102555 },
                { Name: "PhoneNumber", Value: 254712345678 },
              ],
            },
          },
        },
      };

      const parsed = parseStkCallback(mockCallback);
      expect(parsed.success).toBe(true);
      expect(parsed.resultCode).toBe(0);
      expect(parsed.amount).toBe(25000);
      expect(parsed.mpesaReceiptNumber).toBe("QHD715X42K");
      expect(parsed.phoneNumber).toBe("254712345678");
    });

    it("parses user-cancelled Daraja STK callback payload correctly", () => {
      const cancelledCallback = {
        Body: {
          stkCallback: {
            MerchantRequestID: "29115-34620561-2",
            CheckoutRequestID: "ws_CO_1912202610255399999",
            ResultCode: 1032,
            ResultDesc: "Request cancelled by user.",
          },
        },
      };

      const parsed = parseStkCallback(cancelledCallback);
      expect(parsed.success).toBe(false);
      expect(parsed.resultCode).toBe(1032);
      expect(parsed.resultDesc).toBe("Request cancelled by user.");
      expect(parsed.mpesaReceiptNumber).toBeUndefined();
    });

    it("handles B2C payout initiation and enforces KES 500 minimum withdrawal", async () => {
      await expect(
        initiateB2cPayout({
          phoneNumber: "0712345678",
          amountKes: 300,
          remarks: "Below minimum",
        })
      ).rejects.toThrow("Minimum payout withdrawal is KES 500");

      const payout = await initiateB2cPayout({
        phoneNumber: "0712345678",
        amountKes: 2500,
        remarks: "Commission payout",
      });

      expect(payout.responseCode).toBe("0");
      expect(payout.isMock).toBe(true);
      expect(payout.transactionReference).toBeDefined();
    });
  });

  describe("2. SCDS Transactional Email Templates", () => {
    it("generates brand-compliant application approved email", () => {
      const email = buildApplicationApprovedEmail({
        fullName: "Faith Muthoni",
        referralCode: "SCDS-FAI-7K2X",
      });

      expect(email.subject).toContain("Application Approved");
      expect(email.html).toContain("Faith Muthoni");
      expect(email.html).toContain("SCDS-FAI-7K2X");
      expect(email.html).toContain("#0048E8"); // Official Electric Blue
      expect(email.html).toContain("#F8B820"); // Official Golden Yellow
      expect(email.html).toContain("samcreativedesignschool.com");
    });

    it("generates enrolment verified email with accurate commission summary", () => {
      const email = buildEnrolmentVerifiedEmail({
        ambassadorName: "James Otieno",
        learnerName: "Brian Kiprop",
        courseTitle: "Full-Stack Web & AI Product Development",
        pointsEarned: 250,
        commissionKes: 4200,
        newAvailableCommissionKes: 9800,
      });

      expect(email.subject).toContain("KES 4,200");
      expect(email.html).toContain("James Otieno");
      expect(email.html).toContain("Brian Kiprop");
      expect(email.html).toContain("+250 Pts");
      expect(email.html).toContain("KES 9,800");
    });

    it("generates payout confirmation email with M-Pesa receipt", () => {
      const email = buildPayoutDisbursedEmail({
        ambassadorName: "Esther Wanjiku",
        amountKes: 7500,
        recipientPhone: "0712345678",
        transactionReference: "NLM4899X10",
        paymentMethod: "MPESA",
      });

      expect(email.subject).toContain("KES 7,500");
      expect(email.html).toContain("NLM4899X10");
      expect(email.html).toContain("0712345678");
    });

    it("gracefully runs email dispatch in mock simulation mode", async () => {
      const result = await sendEmail({
        to: "test@students.uonbi.ac.ke",
        subject: "Test Notification",
        html: "<p>Hello</p>",
      });

      expect(result.success).toBe(true);
      expect(result.isMock).toBe(true);
      expect(result.messageId).toContain("mock-email-");
    });
  });

  describe("3. Financial Ledger, Payouts & Fraud Edge Cases", () => {
    const adminActor = INITIAL_DATABASE_STATE.profiles.find(
      (p) => p.role === "super_admin"
    )!;
    const ambassador = INITIAL_DATABASE_STATE.ambassadors[0];

    it("blocks payout requests exceeding ambassador's available balance", () => {
      expect(() =>
        requestPayoutOp(INITIAL_DATABASE_STATE, {
          ambassadorId: ambassador.id,
          amountKes: ambassador.availableCommissionKes + 50_000,
          paymentMethod: "MPESA",
          recipientPhone: ambassador.payoutPhone,
        })
      ).toThrow("exceeds available commission balance");
    });

    it("deducts available commission on payout request and restores it if rejected by admin", () => {
      const initialBalance = ambassador.availableCommissionKes;
      const requestAmount = 1000;

      // 1. Ambassador requests payout
      const { nextState: stateWithRequest, payoutRequest } = requestPayoutOp(
        INITIAL_DATABASE_STATE,
        {
          ambassadorId: ambassador.id,
          amountKes: requestAmount,
          paymentMethod: "MPESA",
          recipientPhone: ambassador.payoutPhone,
        }
      );

      const ambAfterReq = stateWithRequest.ambassadors.find(
        (a) => a.id === ambassador.id
      )!;
      expect(ambAfterReq.availableCommissionKes).toBe(initialBalance - requestAmount);

      // 2. Admin rejects payout request -> balance must be refunded immediately
      const stateAfterRejection = processPayoutRequestOp(stateWithRequest, {
        actor: adminActor,
        payoutRequestId: payoutRequest.id,
        decision: "rejected",
        adminNotes: "Phone number M-Pesa name mismatch.",
      });

      const ambAfterReject = stateAfterRejection.ambassadors.find(
        (a) => a.id === ambassador.id
      )!;
      expect(ambAfterReject.availableCommissionKes).toBe(initialBalance);
    });

    it("detects and prevents self-referral attempts across phone and email formats", () => {
      const ambProfile = {
        email: "ambassador@students.ku.ac.ke",
        phone: "+254 712 345 678",
      };

      // Identical email
      expect(
        isSelfReferral(ambProfile, {
          email: "Ambassador@students.ku.ac.ke",
          phone: "0799999999",
        })
      ).toBe(true);

      // Same phone formatted as 0712345678
      expect(
        isSelfReferral(ambProfile, {
          email: "another.learner@gmail.com",
          phone: "0712345678",
        })
      ).toBe(true);

      // Genuine third-party learner
      expect(
        isSelfReferral(ambProfile, {
          email: "genuine.student@gmail.com",
          phone: "0722001122",
        })
      ).toBe(false);
    });

    it("strictly prevents double reward issuance for the same enrolment (Idempotency)", () => {
      const pendingReferral = INITIAL_DATABASE_STATE.referrals.find(
        (r) => r.status === "enrolled" || r.status === "payment_pending"
      );

      if (pendingReferral) {
        // 1st verification succeeds
        const { nextState } = verifyEnrolmentAndIssueRewardsOp(
          INITIAL_DATABASE_STATE,
          {
            actor: adminActor,
            referralId: pendingReferral.id,
            paymentReference: "MPESA-TST-101",
          }
        );

        // 2nd verification attempt on the exact same referral MUST fail
        expect(() =>
          verifyEnrolmentAndIssueRewardsOp(nextState, {
            actor: adminActor,
            referralId: pendingReferral.id,
            paymentReference: "MPESA-TST-102",
          })
        ).toThrow("Duplicate Reward Prevention");
      }
    });
  });
});
