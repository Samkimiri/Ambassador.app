import { describe, it, expect } from "vitest";
import {
  deleteAmbassadorApplicationOp,
  reviewAmbassadorApplicationOp,
  submitAmbassadorApplicationOp,
} from "@/lib/store-engine";
import { ensureStateConsistency } from "@/lib/consistency";
import { INITIAL_DATABASE_STATE, AppDatabaseState } from "@/lib/seed-data";
import { Profile } from "@/types";

describe("Ambassador Application Management, Deletion & Candidate Readiness Suite", () => {
  const adminActor: Profile = {
    id: "user-admin-1",
    email: "Samcreativedesignschool@gmail.com",
    fullName: "Samuel Ndung'u Kimiri",
    phone: "0748201131",
    role: "super_admin",
    status: "active",
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-01T08:00:00Z",
  };

  const learnerActor: Profile = {
    id: "user-learner-99",
    email: "student@strathmore.edu",
    fullName: "John Doe",
    phone: "0711223344",
    role: "learner",
    status: "active",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-01T08:00:00Z",
  };

  it("1. Allows admin to permanently delete an application and records audit log", () => {
    // Start with initial state which has app-3 and app-4
    const state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    expect(state.applications.some((a) => a.id === "app-3")).toBe(true);

    const { nextState, deletedApp } = deleteAmbassadorApplicationOp(state, {
      actor: adminActor,
      applicationId: "app-3",
    });

    // Verify application is removed
    expect(deletedApp.id).toBe("app-3");
    expect(nextState.applications.some((a) => a.id === "app-3")).toBe(false);
    expect(nextState.deletedApplicationIds).toContain("app-3");

    // Verify audit log
    const lastAudit = nextState.auditLogs[0];
    expect(lastAudit.action).toBe("APPLICATION_DELETED");
    expect(lastAudit.entityId).toBe("app-3");

    // Ensure consistency preserves deletion
    const consistent = ensureStateConsistency(nextState);
    expect(consistent.applications.some((a) => a.id === "app-3")).toBe(false);
  });

  it("2. Blocks non-super_admin actors from deleting applications", () => {
    const state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    expect(() =>
      deleteAmbassadorApplicationOp(state, {
        actor: learnerActor,
        applicationId: "app-4",
      })
    ).toThrow(/Unauthorized/i);
  });

  it("3. Displays newest applications on top when sorted by createdAt DESC", () => {
    const state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;

    // Add a brand new application submitted right now
    const nowIso = new Date().toISOString();
    const { nextState: withNewApp } = submitAmbassadorApplicationOp(state, {
      fullName: "Zara Hassan",
      email: "zara.hassan@mku.ac.ke",
      phone: "0799887766",
      password: "StrongPassword123!",
      county: "Mombasa",
      institution: "Mount Kenya University",
      occupation: "University Student (Multimedia)",
      academicYear: "Year 2 Undergraduate",
      studyField: "Digital Arts & Design",
      audienceSize: "2,000+ campus & online network",
      weeklyHours: "10 - 20 hrs/week",
      deviceReadiness: "Laptop & Smartphone with stable 4G/Wi-Fi",
      familiarTools: ["Adobe Photoshop", "CapCut Video Editing"],
      pastAmbassadorExperience: "MKU Creative Society Coordinator",
      resumeUrl: "https://drive.google.com/zara-cv.pdf",
      motivation: "Excited to bring creative design education to coastal students in Mombasa.",
      experience: "Coordinator for student media club with 300 active campus members.",
      acceptedTerms: true,
    });

    const sorted = [...withNewApp.applications].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // The newest application must be the very first in the list
    expect(sorted[0].email).toBe("zara.hassan@mku.ac.ke");
    expect(sorted[0].studyField).toBe("Digital Arts & Design");
    expect(sorted[0].deviceReadiness).toBe("Laptop & Smartphone with stable 4G/Wi-Fi");
    expect(sorted[0].familiarTools).toContain("Adobe Photoshop");
  });

  it("4. Once approved, application status remains permanently approved and does not revert to pending", () => {
    const state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;

    // Admin approves app-4 (Mercy Chebet)
    const { nextState: approvedState, ambassador } = reviewAmbassadorApplicationOp(state, {
      actor: adminActor,
      applicationId: "app-4",
      decision: "approved",
      reviewNotes: "Excellent campus reach in Nakuru.",
    });

    expect(ambassador).toBeDefined();
    expect(ambassador?.isActive).toBe(true);

    const approvedApp = approvedState.applications.find((a) => a.id === "app-4");
    expect(approvedApp?.status).toBe("approved");

    // Simulate state consistency check (e.g. on sync or reload)
    const consistentState = ensureStateConsistency(approvedState);
    const checkedApp = consistentState.applications.find((a) => a.id === "app-4");
    expect(checkedApp?.status).toBe("approved");

    // Even if an older server state has app-4 as "pending", if the ambassador profile exists and is active,
    // ensureStateConsistency guarantees app-4 remains approved!
    const simulatedOldServerState: AppDatabaseState = {
      ...consistentState,
      applications: consistentState.applications.map((a) =>
        a.id === "app-4" ? { ...a, status: "pending" as const } : a
      ),
    };

    const healedState = ensureStateConsistency(simulatedOldServerState);
    const healedApp = healedState.applications.find((a) => a.id === "app-4");
    expect(healedApp?.status).toBe("approved");
  });
});
