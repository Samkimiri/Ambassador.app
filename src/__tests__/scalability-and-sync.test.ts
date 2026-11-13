import { describe, it, expect } from "vitest";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";
import { mergeDatabaseStates } from "@/lib/server-store";
import { AmbassadorApplication, AmbassadorProfile, Profile } from "@/types";

describe("Scalability & Non-Overwriting Merge", () => {
  it("never lets a stale unreviewed application overwrite a reviewed or approved application", () => {
    const now = new Date().toISOString();
    const reviewedApp: AmbassadorApplication = {
      id: "app-non-overwrite-1",
      userId: "usr-non-overwrite-1",
      fullName: "Alice Applicant",
      email: "alice.applicant@example.com",
      phone: "0712345678",
      county: "Nairobi",
      institution: "UON",
      occupation: "Student",
      motivation: "Excited to promote SCDS",
      experience: "Campus clubs",
      acceptedTerms: true,
      status: "approved",
      reviewedAt: now,
      createdAt: "2026-11-13T10:00:00.000Z",
    };

    const stalePendingApp: AmbassadorApplication = {
      ...reviewedApp,
      status: "pending",
      reviewedAt: undefined,
    };

    const currentDb: AppDatabaseState = {
      ...INITIAL_DATABASE_STATE,
      applications: [reviewedApp],
    };
    const staleIncomingDb: AppDatabaseState = {
      ...INITIAL_DATABASE_STATE,
      applications: [stalePendingApp],
    };

    const merged = mergeDatabaseStates(currentDb, staleIncomingDb);
    const resultApp = merged.applications.find((a) => a.id === reviewedApp.id);
    expect(resultApp?.status).toBe("approved");

    // Also verify rejected reviewed application is not overwritten by stale pending
    const rejectedApp: AmbassadorApplication = {
      ...reviewedApp,
      id: "app-non-overwrite-2",
      email: "bob.applicant@example.com",
      status: "rejected",
      reviewedAt: now,
    };
    const mergedRejected = mergeDatabaseStates(
      { ...INITIAL_DATABASE_STATE, applications: [rejectedApp] },
      {
        ...INITIAL_DATABASE_STATE,
        applications: [{ ...rejectedApp, status: "pending", reviewedAt: undefined }],
      }
    );
    expect(
      mergedRejected.applications.find((a) => a.id === rejectedApp.id)?.status
    ).toBe("rejected");
  });

  it("handles 1,500+ ambassadors and applications cleanly in O(N) time without crashing", () => {
    const count = 1500;
    const now = new Date().toISOString();
    const profiles: Profile[] = [...INITIAL_DATABASE_STATE.profiles];
    const applications: AmbassadorApplication[] = [];
    const ambassadors: AmbassadorProfile[] = [];

    for (let i = 0; i < count; i++) {
      const id = `scale-${i}`;
      const email = `ambassador.${i}@example.com`;
      profiles.push({
        id: `usr-${id}`,
        email,
        fullName: `Ambassador ${i}`,
        phone: `+254700${String(i).padStart(6, "0")}`,
        role: "ambassador",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      applications.push({
        id: `app-${id}`,
        userId: `usr-${id}`,
        fullName: `Ambassador ${i}`,
        email,
        phone: `+254700${String(i).padStart(6, "0")}`,
        county: "Nairobi",
        institution: "University",
        occupation: "Student",
        motivation: "Scale test motivation",
        experience: "Scale test experience",
        acceptedTerms: true,
        status: "approved",
        createdAt: now,
      });
      ambassadors.push({
        id: `amb-${id}`,
        userId: `usr-${id}`,
        fullName: `Ambassador ${i}`,
        email,
        phone: `+254700${String(i).padStart(6, "0")}`,
        referralCode: `SCDS-AMB-${String(i).padStart(4, "0")}`,
        level: "Starter",
        totalPoints: i,
        availablePoints: i,
        totalCommissionKes: 0,
        availableCommissionKes: 0,
        paidCommissionKes: 0,
        payoutMethod: "MPESA",
        payoutPhone: `+254700${String(i).padStart(6, "0")}`,
        county: "Nairobi",
        institution: "University",
        occupation: "Student",
        bio: "Ambassador",
        codeOfConductAgreed: true,
        isActive: true,
        clickCount: 0,
        badgeIds: [],
        createdAt: now,
      });
    }

    const start = Date.now();
    const consistent = ensureStateConsistency({
      ...INITIAL_DATABASE_STATE,
      profiles,
      applications,
      ambassadors,
    });
    const elapsedMs = Date.now() - start;

    expect(consistent.ambassadors.length).toBe(count);
    expect(consistent.applications.length).toBe(count);
    expect(elapsedMs).toBeLessThan(1500);
  });
});
