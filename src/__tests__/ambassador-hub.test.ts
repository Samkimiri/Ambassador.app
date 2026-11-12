import { describe, expect, it } from "vitest";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
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
import { AmbassadorProfile, Profile } from "@/types";

describe("SCDS Ambassador Hub — Core Business Logic & Security Suite", () => {
  const adminActor = INITIAL_DATABASE_STATE.profiles.find(
    (p) => p.role === "super_admin"
  )!;

  const ambassadorActor: Profile = {
    id: "user-amb-test",
    email: "amina.wanjiku@students.jkuat.ac.ke",
    fullName: "Amina Wanjiku",
    phone: "0712345678",
    role: "ambassador",
    status: "active",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-01T08:00:00Z",
  };

  const testAmbassador: AmbassadorProfile = {
    id: "amb-1",
    userId: "user-amb-test",
    fullName: "Amina Wanjiku",
    email: "amina.wanjiku@students.jkuat.ac.ke",
    phone: "0712345678",
    referralCode: "SCDS-AMI-8K4P",
    level: "Silver",
    totalPoints: 1000,
    availablePoints: 800,
    totalCommissionKes: 6000,
    availableCommissionKes: 4500,
    paidCommissionKes: 1500,
    payoutMethod: "MPESA",
    payoutPhone: "0712345678",
    county: "Kiambu",
    institution: "JKUAT",
    occupation: "Student",
    bio: "Test ambassador",
    isActive: true,
    clickCount: 15,
    badgeIds: ["badge-1"],
    createdAt: "2026-10-01T08:00:00Z",
  };

  const testBaseState: AppDatabaseState = {
    ...INITIAL_DATABASE_STATE,
    profiles: [...INITIAL_DATABASE_STATE.profiles, ambassadorActor],
    ambassadors: [testAmbassador],
    referrals: [
      {
        id: "ref-101",
        referralCode: "SCDS-AMI-8K4P",
        ambassadorId: "amb-1",
        ambassadorName: "Amina Wanjiku",
        learnerName: "Daniel Kiprop",
        learnerEmail: "daniel.kiprop@students.jkuat.ac.ke",
        learnerPhone: "0711223344",
        learnerCounty: "Kiambu",
        courseId: "course-cad",
        courseTitle: "SolidWorks & AutoCAD for Engineers",
        status: "payment_verified",
        enquiryNotes: "",
        consentGiven: true,
        attributionSource: "direct_link",
        createdAt: "2026-10-10T10:00:00Z",
        updatedAt: "2026-10-10T10:00:00Z",
        events: [],
      },
      {
        id: "ref-103",
        referralCode: "SCDS-AMI-8K4P",
        ambassadorId: "amb-1",
        ambassadorName: "Amina Wanjiku",
        learnerName: "Sharon Wambui",
        learnerEmail: "sharon.wambui@gmail.com",
        learnerPhone: "0722998877",
        learnerCounty: "Nairobi",
        courseId: "course-ux",
        courseTitle: "Vibe Designing — UI/UX Masterclass",
        campaignId: "camp-vibe-builders",
        status: "payment_pending",
        enquiryNotes: "",
        consentGiven: true,
        attributionSource: "direct_link",
        createdAt: "2026-10-15T12:00:00Z",
        updatedAt: "2026-10-15T12:00:00Z",
        events: [],
      },
    ],
  };

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
      testBaseState,
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
      reviewAmbassadorApplicationOp(testBaseState, {
        actor: ambassadorActor,
        applicationId: "app-3",
        decision: "approved",
      })
    ).toThrow(/Unauthorized/i);
  });

  it("3. Allows Super Admin to approve an application and generates a unique SCDS referral code", () => {
    const { nextState: stateWithApp, application } = submitAmbassadorApplicationOp(
      testBaseState,
      {
        fullName: "Kelvin Mwangi",
        email: "kelvin.mwangi@tuk.ac.ke",
        phone: "0722334455",
        password: "Password123!",
        county: "Nairobi",
        institution: "Technical University of Kenya",
        occupation: "Student",
        motivation: "Empowering tech designers",
        experience: "Campus leader",
        acceptedTerms: true,
      }
    );

    const { nextState, ambassador } = reviewAmbassadorApplicationOp(
      stateWithApp,
      {
        actor: adminActor,
        applicationId: application.id,
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
    const ambBefore = testBaseState.ambassadors.find(
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
      testBaseState,
      enquiry
    );

    expect(referral.ambassadorId).toBe(ambBefore.id);
    expect(referral.status).toBe("lead_submitted");

    const ambAfter = nextState.ambassadors.find((a) => a.id === ambBefore.id)!;
    expect(ambAfter.totalPoints).toBe(
      ambBefore.totalPoints +
        testBaseState.rewardRules.pointsPerQualifiedLead
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
      submitLearnerEnquiryOp(testBaseState, {
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
      submitLearnerEnquiryOp(testBaseState, {
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
      updateReferralStatusOp(testBaseState, {
        actor: adminActor,
        referralId: "ref-101", // Already payment_verified
        newStatus: "lead_submitted",
      })
    ).toThrow(/Invalid status transition/i);
  });

  it("8. Verifies enrolment, calculates commission + campaign bonus accurately, and prevents duplicate reward issuance", () => {
    // ref-103 is Sharon Wambui for course-ux (KES 3,500) under camp-vibe-builders (+60 bonus pts, +2% bonus comm)
    const { nextState, commission, pointsIssued } =
      verifyEnrolmentAndIssueRewardsOp(testBaseState, {
        actor: adminActor,
        referralId: "ref-103",
        paymentReference: "QL18TR50KP",
      });

    expect(pointsIssued).toBe(610); // 550 course pts + 60 campaign bonus
    // Amina is Silver (20% base) + 2% campaign bonus = 22% of 5,500 = KES 1,210
    expect(commission.amountKes).toBe(1210);

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
      requestPayoutOp(testBaseState, {
        ambassadorId: "amb-1",
        amountKes: 500,
        paymentMethod: "MPESA",
        recipientPhone: "0712345678",
      })
    ).toThrow(/Minimum payout threshold/i);

    // Valid payout request
    const { nextState, payoutRequest } = requestPayoutOp(
      testBaseState,
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

