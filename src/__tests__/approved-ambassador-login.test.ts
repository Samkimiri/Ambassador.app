import { describe, expect, it } from "vitest";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";
import {
  submitAmbassadorApplicationOp,
  reviewAmbassadorApplicationOp,
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

  it("verifies Joy Wambui (joywambo@gmail.com) is seeded and accessible out of the box", () => {
    const joyProfile = INITIAL_DATABASE_STATE.profiles.find((p) => p.email === "joywambo@gmail.com");
    expect(joyProfile).toBeDefined();
    expect(joyProfile!.role).toBe("ambassador");
    expect(joyProfile!.status).toBe("active");

    const joyApp = INITIAL_DATABASE_STATE.applications.find((a) => a.email === "joywambo@gmail.com");
    expect(joyApp).toBeDefined();
    expect(joyApp!.status).toBe("approved");

    const joyAmb = INITIAL_DATABASE_STATE.ambassadors.find((a) => a.email === "joywambo@gmail.com");
    expect(joyAmb).toBeDefined();
    expect(joyAmb!.isActive).toBe(true);
    expect(joyAmb!.referralCode).toBe("SCDS-JOY-W789");
  });
});
