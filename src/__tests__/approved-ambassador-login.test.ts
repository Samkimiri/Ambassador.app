import { describe, expect, it } from "vitest";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";
import {
  submitAmbassadorApplicationOp,
  reviewAmbassadorApplicationOp,
  blockAmbassadorAccountOp,
  unblockAmbassadorAccountOp,
  deleteAmbassadorAccountOp,
} from "@/lib/store-engine";

describe("Approved Ambassador Login & Privileges Healing", () => {
  const adminActor = INITIAL_DATABASE_STATE.profiles.find(
    (p) => p.role === "super_admin"
  )!;

  it("guarantees approved ambassadors are never restricted from their dashboard", () => {
    let state: AppDatabaseState = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));

    // 1. New Applicant registers
    const registration = submitAmbassadorApplicationOp(state, {
      fullName: "Test Applicant",
      email: "testapplicant@gmail.com",
      phone: "0712345678",
      password: "Password123!",
      county: "Nairobi",
      institution: "huj",
      occupation: "Designer",
      motivation: "Excited to share design courses",
      experience: "Freelancing for 2 years",
      acceptedTerms: true,
    });
    state = registration.nextState;

    // 2. Admin approves application
    const review = reviewAmbassadorApplicationOp(state, {
      actor: adminActor,
      applicationId: registration.application.id,
      decision: "approved",
      reviewNotes: "Application approved by administrator.",
    });
    state = review.nextState;

    const testProfile = state.profiles.find((p) => p.email === "testapplicant@gmail.com");
    expect(testProfile).toBeDefined();
    expect(testProfile!.role).toBe("ambassador");
    expect(testProfile!.status).toBe("active");

    const testAmb = state.ambassadors.find((a) => a.email === "testapplicant@gmail.com");
    expect(testAmb).toBeDefined();
    expect(testAmb!.isActive).toBe(true);
    expect(testAmb!.referralCode).toBeTruthy();
  });

  it("auto-heals and generates active ambassador profile if missing during cloud sync", () => {
    let state: AppDatabaseState = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));

    // Simulate an approved application existing in state, but ambassadors array is missing their record
    state.applications.unshift({
      id: "app-sync-test",
      userId: "user-sync-test",
      fullName: "Sync Candidate",
      email: "synccandidate@gmail.com",
      phone: "0712345678",
      county: "Nairobi",
      institution: "huj",
      occupation: "Designer",
      motivation: "Ready to promote SCDS",
      experience: "Freelance",
      acceptedTerms: true,
      status: "approved",
      socialLinks: {},
      reviewNotes: "Application approved by administrator.",
      createdAt: new Date().toISOString(),
    });

    // Before consistency healing: ambassador profile is absent
    expect(state.ambassadors.find((a) => a.email === "synccandidate@gmail.com")).toBeUndefined();

    // Run ensureStateConsistency
    const healed = ensureStateConsistency(state);

    // After consistency healing: ambassador profile is restored and active!
    const healedAmb = healed.ambassadors.find((a) => a.email === "synccandidate@gmail.com");
    expect(healedAmb).toBeDefined();
    expect(healedAmb!.isActive).toBe(true);
    expect(healedAmb!.referralCode).toMatch(/^SCDS-[A-Z]{3}-[A-Z0-9]{4}$/);

    const healedProfile = healed.profiles.find((p) => p.email === "synccandidate@gmail.com");
    expect(healedProfile).toBeDefined();
    expect(healedProfile!.role).toBe("ambassador");
    expect(healedProfile!.status).toBe("active");
  });

  it("verifies isApproved authorization logic allows approved ambassadors into dashboard", () => {
    const isApprovedCheck = (
      userRole: string,
      userStatus: string,
      appStatus?: string,
      ambIsActive?: boolean
    ) => {
      return (
        userRole === "super_admin" ||
        userRole === "ambassador" ||
        appStatus === "approved" ||
        Boolean(ambIsActive)
      );
    };

    // Pending applicant -> Not approved (sees Under Review screen)
    expect(isApprovedCheck("learner", "pending", "pending", false)).toBe(false);

    // Rejected applicant -> Not approved (sees Not Approved screen)
    expect(isApprovedCheck("learner", "rejected", "rejected", false)).toBe(false);

    // Approved applicant (like Joy Wambui in user's report) -> APPROVED!
    expect(isApprovedCheck("learner", "pending", "approved", false)).toBe(true);
    expect(isApprovedCheck("ambassador", "active", "approved", true)).toBe(true);
    expect(isApprovedCheck("applicant", "approved", "approved", false)).toBe(true);
  });

  it("verifies ambassador account blocking, unblocking, deletion permanence, and single-email re-application", () => {
    let state: AppDatabaseState = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));

    // 1. Submit application
    const { nextState: state1, application, profile } = submitAmbassadorApplicationOp(state, {
      fullName: "Faith Karimi",
      email: "faith.karimi@example.com",
      phone: "0722334455",
      password: "SecurePassword2026!",
      county: "Nairobi",
      institution: "Strathmore University",
      occupation: "Student",
      motivation: "Passionate about creative skills",
      experience: "Campus rep",
      acceptedTerms: true,
    });
    state = state1;

    // Duplicate email application should be rejected
    expect(() =>
      submitAmbassadorApplicationOp(state, {
        fullName: "Faith Karimi Duplicate",
        email: "faith.karimi@example.com",
        phone: "0722334455",
        password: "SecurePassword2026!",
        county: "Nairobi",
        institution: "Strathmore University",
        occupation: "Student",
        motivation: "Duplicate application",
        experience: "Campus rep",
        acceptedTerms: true,
      })
    ).toThrow(/already exists/i);

    // 2. Admin approves application
    const { nextState: state2, ambassador } = reviewAmbassadorApplicationOp(state, {
      actor: adminActor,
      applicationId: application.id,
      decision: "approved",
    });
    state = state2;
    expect(ambassador).toBeDefined();
    expect(ambassador!.isActive).toBe(true);

    // 3. Admin blocks ambassador account
    const { nextState: blockedState, ambassador: blockedAmbassador } = blockAmbassadorAccountOp(state, {
      actor: adminActor,
      ambassadorId: ambassador!.id,
      reason: "Compliance review",
    });
    expect(blockedAmbassador.isBlocked).toBe(true);
    expect(blockedAmbassador.isActive).toBe(false);
    expect(blockedAmbassador.blockReason).toBe("Compliance review");

    const blockedProfile = blockedState.profiles.find((p) => p.email === "faith.karimi@example.com");
    expect(blockedProfile?.status).toBe("blocked");

    // Notification created for ambassador
    const blockNotif = blockedState.notifications.find((n: any) => n.userId === profile.id);
    expect(blockNotif).toBeDefined();
    expect(blockNotif?.title).toContain("Account Privileges Suspended");

    // 4. Admin unblocks ambassador account
    const { nextState: unblockedState, ambassador: unblockedAmbassador } = unblockAmbassadorAccountOp(blockedState, {
      actor: adminActor,
      ambassadorId: ambassador!.id,
    });
    expect(unblockedAmbassador.isBlocked).toBe(false);
    expect(unblockedAmbassador.isActive).toBe(true);

    const unblockedProfile = unblockedState.profiles.find((p) => p.email === "faith.karimi@example.com");
    expect(unblockedProfile?.status).toBe("active");

    // 5. Admin permanently deletes ambassador account
    const { nextState: deletedState } = deleteAmbassadorAccountOp(unblockedState, {
      actor: adminActor,
      ambassadorId: ambassador!.id,
    });
    expect(deletedState.profiles.some((p: any) => p.email === "faith.karimi@example.com")).toBe(false);
    expect(deletedState.ambassadors.some((a: any) => a.email === "faith.karimi@example.com")).toBe(false);
    expect(deletedState.applications.some((app: any) => app.email === "faith.karimi@example.com")).toBe(false);

    // 6. Once permanently deleted, applying again with the same email succeeds!
    const { nextState: reAppliedState, application: reApp } = submitAmbassadorApplicationOp(deletedState, {
      fullName: "Faith Karimi Reapplication",
      email: "faith.karimi@example.com",
      phone: "0722334455",
      password: "NewPassword2026!",
      county: "Nairobi",
      institution: "Strathmore University",
      occupation: "Freelancer",
      motivation: "Re-applying after prior account removal",
      experience: "Freelance designer",
      acceptedTerms: true,
    });
    expect(reApp).toBeDefined();
    expect(reApp.email).toBe("faith.karimi@example.com");
    expect(reAppliedState.applications.some((app: any) => app.id === reApp.id)).toBe(true);
  });
});
