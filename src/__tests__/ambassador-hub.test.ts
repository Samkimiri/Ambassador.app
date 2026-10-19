import { describe, expect, it } from "vitest";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  processPayoutRequestOp,
  requestPayoutOp,
  reviewAmbassadorApplicationOp,
  submitAmbassadorApplicationOp,
  submitLearnerEnquiryOp,
  updateReferralStatusOp,
  verifyEnrolmentAndIssueRewardsOp,
} from "@/lib/store-engine";
import {
  computeAmbassadorLevel,
  generateReferralCode,
  isSelfReferral,
  isValidReferralTransition,
} from "@/lib/utils";
import { ambassadorApplicationSchema, learnerEnquirySchema } from "@/lib/validations";

describe("SCDS Ambassador Hub — Core Business Logic & Security Suite", () => {
  const adminActor = INITIAL_DATABASE_STATE.profiles.find(
    (p) => p.role === "super_admin"
  )!;
  const ambassadorActor = INITIAL_DATABASE_STATE.profiles.find(
    (p) => p.role === "ambassador"
  )!;

  it("1. Validates Ambassador Application inputs and creates a pending applicant without premature privileges", () => {
    const validInput = {
      fullName: "Peter Njoroge",
      email: "peter.njoroge@students.ku.ac.ke",
      phone: "0715998877",
      password: "StrongPassword123!",
      county: "Nairobi",
      institution: "Kenyatta University",
      occupation: "University Student",
      instagram: "",
      linkedin: "",
      tiktok: "",
      portfolio: "",
      motivation:
        "I want to help design and engineering students at Kenyatta University access practical SCDS mentorship.",
      experience:
        "Student club leader for 2 years organizing digital skills bootcamps.",
      acceptedTerms: true as const,
    };

    const parsed = ambassadorApplicationSchema.safeParse(validInput);
    expect(parsed.success).toBe(true);

    const { nextState, application, profile } = submitAmbassadorApplicationOp(
      INITIAL_DATABASE_STATE,
      validInput
    );

    expect(application.status).toBe("pending");
    expect(profile.role).toBe("learner");
    expect(profile.status).toBe("pending");
    // Must not exist in approved ambassadors yet
    expect(
      nextState.ambassadors.some((a) => a.email === validInput.email)
    ).toBe(false);
  });

  it("2. Enforces Role-Based Access Control (RBAC): non-admins cannot approve applications", () => {
    expect(() =>
      reviewAmbassadorApplicationOp(INITIAL_DATABASE_STATE, {
        actor: ambassadorActor,
        applicationId: "app-3",
        decision: "approved",
      })
    ).toThrow(/Unauthorized/i);
  });

  it("3. Allows Super Admin to approve an application and generates a unique SCDS referral code", () => {
    const { nextState, ambassador } = reviewAmbassadorApplicationOp(
      INITIAL_DATABASE_STATE,
      {
        actor: adminActor,
        applicationId: "app-3",
        decision: "approved",
        reviewNotes: "Verified TUK student representative.",
      }
    );

    expect(ambassador).toBeDefined();
    expect(ambassador?.referralCode).toMatch(/^SCDS-[A-Z]{3}-[A-Z0-9]{4}$/);
    expect(ambassador?.isActive).toBe(true);
    const updatedProfile = nextState.profiles.find(
      (p) => p.email === "kelvin.mwangi@tuk.ac.ke"
    );
    expect(updatedProfile?.role).toBe("ambassador");
  });

  it("4. Generates non-colliding referral codes even for identical names", () => {
    const existing: string[] = [];
    for (let i = 0; i < 20; i++) {
      const code = generateReferralCode("Amina Wanjiku", existing);
      expect(existing.includes(code)).toBe(false);
      existing.push(code);
    }
  });

  it("5. Records referral attribution on learner enquiry and awards qualified lead points", () => {
    const ambBefore = INITIAL_DATABASE_STATE.ambassadors.find(
      (a) => a.referralCode === "SCDS-AMI-8K4P"
    )!;

    const enquiry = {
      learnerName: "Wycliffe Omondi",
      learnerEmail: "wycliffe.omondi@gmail.com",
      learnerPhone: "0728112233",
      learnerCounty: "Kisumu",
      courseId: "course-ps",
      referralCode: "SCDS-AMI-8K4P",
      enquiryNotes: "Joining Cohort 11 Photoshop.",
      consentGiven: true as const,
    };

    const parsed = learnerEnquirySchema.safeParse(enquiry);
    expect(parsed.success).toBe(true);

    const { nextState, referral } = submitLearnerEnquiryOp(
      INITIAL_DATABASE_STATE,
      enquiry
    );

    expect(referral.ambassadorId).toBe(ambBefore.id);
    expect(referral.status).toBe("lead_submitted");

    const ambAfter = nextState.ambassadors.find((a) => a.id === ambBefore.id)!;
    expect(ambAfter.totalPoints).toBe(
      ambBefore.totalPoints +
        INITIAL_DATABASE_STATE.rewardRules.pointsPerQualifiedLead
    );
  });

  it("6. Blocks duplicate active referrals and blocks fraudulent self-referrals", () => {
    // Self-referral check (Amina trying to refer her own email or phone)
    expect(
      isSelfReferral(
        {
          email: "amina.wanjiku@students.jkuat.ac.ke",
          phone: "+254712345678",
        },
        {
          email: "other@gmail.com",
          phone: "0712345678",
        }
      )
    ).toBe(true);

    expect(() =>
      submitLearnerEnquiryOp(INITIAL_DATABASE_STATE, {
        learnerName: "Amina Self",
        learnerEmail: "amina.wanjiku@students.jkuat.ac.ke",
        learnerPhone: "0712345678",
        learnerCounty: "Kiambu",
        courseId: "course-ps",
        referralCode: "SCDS-AMI-8K4P",
        consentGiven: true,
      })
    ).toThrow(/Self-referral is not permitted/i);

    // Duplicate learner + course check (Daniel Kiprop is already enrolled in course-cad)
    expect(() =>
      submitLearnerEnquiryOp(INITIAL_DATABASE_STATE, {
        learnerName: "Daniel Kiprop",
        learnerEmail: "daniel.kiprop@students.jkuat.ac.ke",
        learnerPhone: "0711223344",
        learnerCounty: "Kiambu",
        courseId: "course-cad",
        referralCode: "SCDS-AMI-8K4P",
        consentGiven: true,
      })
    ).toThrow(/already been recorded/i);
  });

  it("7. Enforces referral lifecycle state transitions and prevents invalid jumps", () => {
    expect(isValidReferralTransition("clicked", "lead_submitted")).toBe(true);
    expect(isValidReferralTransition("payment_Pending" as never, "clicked")).toBe(
      false
    );

    expect(() =>
      updateReferralStatusOp(INITIAL_DATABASE_STATE, {
        actor: adminActor,
        referralId: "ref-101", // Already payment_verified
        newStatus: "lead_submitted",
      })
    ).toThrow(/Invalid status transition/i);
  });

  it("8. Verifies enrolment, calculates commission + campaign bonus accurately, and prevents duplicate reward issuance", () => {
    // ref-103 is Sharon Wambui for course-ux (KES 3,500) under camp-vibe-builders (+60 bonus pts, +2% bonus comm)
    const { nextState, commission, pointsIssued } =
      verifyEnrolmentAndIssueRewardsOp(INITIAL_DATABASE_STATE, {
        actor: adminActor,
        referralId: "ref-103",
        paymentReference: "QL18TR50KP",
      });

    expect(pointsIssued).toBe(360); // 300 course pts + 60 campaign bonus
    // Amina is Silver (20% base) + 2% campaign bonus = 22% of 3,500 = KES 770
    expect(commission.amountKes).toBe(770);

    // Attempting to verify the same referral a second time MUST throw Duplicate Reward Prevention error
    expect(() =>
      verifyEnrolmentAndIssueRewardsOp(nextState, {
        actor: adminActor,
        referralId: "ref-103",
        paymentReference: "QL18TR50KP-DUP",
      })
    ).toThrow(/Duplicate Reward Prevention/i);
  });

  it("9. Enforces minimum payout threshold and requires transaction reference before marking payout as paid", () => {
    // Below minimum threshold (KES 1,000)
    expect(() =>
      requestPayoutOp(INITIAL_DATABASE_STATE, {
        ambassadorId: "amb-1",
        amountKes: 500,
        paymentMethod: "MPESA",
        recipientPhone: "0712345678",
      })
    ).toThrow(/Minimum payout threshold/i);

    // Valid payout request
    const { nextState, payoutRequest } = requestPayoutOp(
      INITIAL_DATABASE_STATE,
      {
        ambassadorId: "amb-1",
        amountKes: 1500,
        paymentMethod: "MPESA",
        recipientPhone: "0712345678",
      }
    );
    expect(payoutRequest.status).toBe("pending");

    // Admin cannot mark as paid without transaction reference
    expect(() =>
      processPayoutRequestOp(nextState, {
        actor: adminActor,
        payoutRequestId: payoutRequest.id,
        decision: "paid",
        transactionReference: "",
      })
    ).toThrow(/transaction reference is required/i);

    // Admin marks as paid with valid M-Pesa reference
    const finalState = processPayoutRequestOp(nextState, {
      actor: adminActor,
      payoutRequestId: payoutRequest.id,
      decision: "paid",
      transactionReference: "QL99MPESA1",
    });

    const updatedReq = finalState.payoutRequests.find(
      (p) => p.id === payoutRequest.id
    );
    expect(updatedReq?.status).toBe("paid");
    expect(updatedReq?.transactionReference).toBe("QL99MPESA1");
  });

  it("10. Computes Ambassador Level progression accurately", () => {
    const res = computeAmbassadorLevel(
      1600,
      9,
      INITIAL_DATABASE_STATE.rewardRules.levelThresholds
    );
    expect(res.currentLevel).toBe("Silver");
    expect(res.nextLevel?.level).toBe("Gold");
  });
});

