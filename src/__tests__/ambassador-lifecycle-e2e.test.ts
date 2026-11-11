import { describe, expect, it } from "vitest";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
import {
  submitAmbassadorApplicationOp,
  reviewAmbassadorApplicationOp,
  submitLearnerEnquiryOp,
  verifyEnrolmentAndIssueRewardsOp,
  requestPayoutOp,
  processPayoutRequestOp,
} from "@/lib/store-engine";

describe("Ambassador Complete Lifecycle, Authentication & Payout Verification", () => {
  const adminActor = INITIAL_DATABASE_STATE.profiles.find(
    (p) => p.role === "super_admin"
  )!;

  it("End-to-End: Registration -> Admin Approval -> Login -> Service Access -> Referrals -> Points -> Commissions -> Payouts -> Logout", () => {
    let state: AppDatabaseState = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));

    // 1. Candidate submits an application on /auth/register
    const applicantData = {
      fullName: "Eunice Njoki",
      email: "eunice.njoki@strathmore.edu",
      phone: "0722334455",
      password: "SecurePassword2026!",
      county: "Nairobi",
      institution: "Strathmore University",
      occupation: "Informatics Student",
      motivation: "Passionate about spreading UI/UX and web development skills on campus.",
      experience: "Organized 3 tech meetups for Strathmore design club.",
      acceptedTerms: true,
    };

    const registration = submitAmbassadorApplicationOp(state, applicantData);
    state = registration.nextState;

    expect(registration.application.status).toBe("pending");
    expect(registration.profile.role).toBe("learner");
    expect(registration.profile.status).toBe("pending");
    expect(registration.profile.password).toBe("SecurePassword2026!");

    // Verification: Before approval, they have NO active ambassador privileges
    const unapprovedAmb = state.ambassadors.find((a) => a.email === applicantData.email);
    expect(unapprovedAmb).toBeUndefined();

    // 2. Admin reviews and approves the application on /admin/applications
    const reviewResult = reviewAmbassadorApplicationOp(state, {
      actor: adminActor,
      applicationId: registration.application.id,
      decision: "approved",
      reviewNotes: "Strong candidate from Strathmore University. Approved.",
    });
    state = reviewResult.nextState;

    const approvedAmb = reviewResult.ambassador;
    expect(approvedAmb).toBeDefined();
    expect(approvedAmb!.isActive).toBe(true);
    expect(approvedAmb!.referralCode).toMatch(/^SCDS-[A-Z]{3}-[A-Z0-9]{4}$/);
    expect(approvedAmb!.email).toBe(applicantData.email);
    expect(approvedAmb!.availableCommissionKes).toBe(0);
    expect(approvedAmb!.totalPoints).toBe(0);

    // Profile must now be an active ambassador
    const updatedProfile = state.profiles.find((p) => p.id === registration.profile.id);
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile!.role).toBe("ambassador");
    expect(updatedProfile!.status).toBe("active");

    // Notification must be delivered to the ambassador
    const welcomeNotif = state.notifications.find((n) => n.userId === registration.profile.id);
    expect(welcomeNotif).toBeDefined();
    expect(welcomeNotif!.title).toContain("Welcome to SCDS Ambassador Hub");

    // 3. Newly approved ambassador logs in (simulating auth system)
    const emailLogin = applicantData.email.toLowerCase();
    const loginProfile = state.profiles.find((p) => p.email.toLowerCase() === emailLogin);
    expect(loginProfile).toBeDefined();
    expect(loginProfile!.password).toBe(applicantData.password);
    expect(loginProfile!.status).toBe("active");

    // Resolving ambassador access:
    const activeAmbProfile = state.ambassadors.find(
      (a) => a.userId === loginProfile!.id || a.email.toLowerCase() === loginProfile!.email.toLowerCase()
    );
    expect(activeAmbProfile).toBeDefined();
    expect(activeAmbProfile!.isActive).toBe(true);

    // 4. Student discovers SCDS through Eunice's referral link and submits an inquiry
    const learnerData = {
      learnerName: "Brian Kiprono",
      learnerEmail: "brian.kiprono.unique@gmail.com",
      learnerPhone: "0799887766",
      learnerCounty: "Nairobi",
      courseId: "course-ux",
      referralCode: activeAmbProfile!.referralCode,
      enquiryNotes: "Interested in the weekend UI/UX Figma masterclass.",
      consentGiven: true,
    };

    const enquiryResult = submitLearnerEnquiryOp(state, learnerData);
    state = enquiryResult.nextState;

    expect(enquiryResult.referral.ambassadorId).toBe(activeAmbProfile!.id);
    expect(enquiryResult.referral.status).toBe("lead_submitted");

    // Eunice earns qualified lead points immediately
    const ambAfterLead = state.ambassadors.find((a) => a.id === activeAmbProfile!.id)!;
    expect(ambAfterLead.totalPoints).toBe(state.rewardRules.pointsPerQualifiedLead);

    // 5. Student pays tuition and Admin verifies enrolment on /admin/enrolments
    const tuitionPayment = verifyEnrolmentAndIssueRewardsOp(state, {
      actor: adminActor,
      referralId: enquiryResult.referral.id,
      amountPaidKes: 25000, // Full course tuition
      paymentReference: "MPESA-QK892X01P",
    });
    state = tuitionPayment.nextState;

    expect(tuitionPayment.enrolment).toBeDefined();
    // Course commission for course-ux is 20%: 20% of 25,000 = KES 5,000
    expect(tuitionPayment.commission.amountKes).toBe(5000);
    expect(tuitionPayment.pointsIssued).toBeGreaterThan(0);

    const ambAfterTuition = state.ambassadors.find((a) => a.id === activeAmbProfile!.id)!;
    expect(ambAfterTuition.availableCommissionKes).toBe(tuitionPayment.commission.amountKes);
    expect(ambAfterTuition.totalCommissionKes).toBe(tuitionPayment.commission.amountKes);
    expect(ambAfterTuition.totalPoints).toBe(
      state.rewardRules.pointsPerQualifiedLead + tuitionPayment.pointsIssued
    );

    // Duplicate Reward Prevention: Cannot issue reward twice for the same enrolment
    expect(() =>
      verifyEnrolmentAndIssueRewardsOp(state, {
        actor: adminActor,
        referralId: enquiryResult.referral.id,
        paymentReference: "MPESA-QK892X01P-DUP",
      })
    ).toThrow(/Duplicate Reward Prevention/i);

    // 6. Ambassador requests an M-Pesa payout on /dashboard/rewards
    const payoutAmount = ambAfterTuition.availableCommissionKes;
    const payoutRequestResult = requestPayoutOp(state, {
      ambassadorId: ambAfterTuition.id,
      amountKes: payoutAmount,
      paymentMethod: "MPESA",
      recipientPhone: "0722334455",
    });
    state = payoutRequestResult.nextState;

    expect(payoutRequestResult.payoutRequest.status).toBe("pending");
    expect(payoutRequestResult.payoutRequest.amountKes).toBe(payoutAmount);

    // Commission must be reserved immediately to prevent double spending
    const ambAfterPayoutReq = state.ambassadors.find((a) => a.id === activeAmbProfile!.id)!;
    expect(ambAfterPayoutReq.availableCommissionKes).toBe(0);

    // 7. Super Admin processes and approves the payout on /admin/payouts
    const paidState = processPayoutRequestOp(state, {
      actor: adminActor,
      payoutRequestId: payoutRequestResult.payoutRequest.id,
      decision: "paid",
      transactionReference: "MPESA-B2C-998811AA",
      adminNotes: "Disbursed via Daraja M-Pesa B2C.",
    });
    state = paidState;

    const finalPayoutReq = state.payoutRequests.find(
      (p) => p.id === payoutRequestResult.payoutRequest.id
    );
    expect(finalPayoutReq?.status).toBe("paid");
    expect(finalPayoutReq?.transactionReference).toBe("MPESA-B2C-998811AA");

    const finalAmbassador = state.ambassadors.find((a) => a.id === activeAmbProfile!.id)!;
    expect(finalAmbassador.paidCommissionKes).toBe(payoutAmount);
    expect(finalAmbassador.availableCommissionKes).toBe(0);

    // 8. Test rejection and refund flow
    // If another payout is requested and rejected by admin, funds must be refunded
    // First give ambassador bonus commission
    state.ambassadors = state.ambassadors.map((a) =>
      a.id === finalAmbassador.id ? { ...a, availableCommissionKes: 2000 } : a
    );
    const req2 = requestPayoutOp(state, {
      ambassadorId: finalAmbassador.id,
      amountKes: 1500,
      paymentMethod: "MPESA",
      recipientPhone: "0722334455",
    });
    state = req2.nextState;
    expect(state.ambassadors.find((a) => a.id === finalAmbassador.id)!.availableCommissionKes).toBe(500);

    // Admin rejects request (e.g. incorrect phone number)
    const rejectedState = processPayoutRequestOp(state, {
      actor: adminActor,
      payoutRequestId: req2.payoutRequest.id,
      decision: "rejected",
      adminNotes: "Phone number unreachable. Refunded to balance.",
    });
    state = rejectedState;

    // The KES 1,500 must be refunded back to availableCommissionKes: 500 + 1500 = 2000
    const refundedAmb = state.ambassadors.find((a) => a.id === finalAmbassador.id)!;
    expect(refundedAmb.availableCommissionKes).toBe(2000);
  });
});
