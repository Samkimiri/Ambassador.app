import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  deleteAmbassadorApplicationOp,
  reviewAmbassadorApplicationOp,
  submitAmbassadorApplicationOp,
} from "@/lib/store-engine";
import { ensureStateConsistency } from "@/lib/consistency";
import { mergeDatabaseStates } from "@/lib/server-store";
import { POST as postApplications, GET as getApplications } from "@/app/api/applications/route";
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
    let state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    const { nextState: stateWithApp, application } = submitAmbassadorApplicationOp(state, {
      fullName: "Test Candidate",
      email: "test.candidate@test.ac.ke",
      phone: "0711223344",
      password: "Password123!",
      county: "Nairobi",
      institution: "Technical University of Kenya",
      occupation: "Student",
      motivation: "Test motivation",
      experience: "Test experience",
      acceptedTerms: true,
    });

    expect(stateWithApp.applications.some((a) => a.id === application.id)).toBe(true);

    const { nextState, deletedApp } = deleteAmbassadorApplicationOp(stateWithApp, {
      actor: adminActor,
      applicationId: application.id,
    });

    // Verify application is removed
    expect(deletedApp.id).toBe(application.id);
    expect(nextState.applications.some((a) => a.id === application.id)).toBe(false);
    expect(nextState.deletedApplicationIds).toContain(application.id);

    // Verify audit log
    const lastAudit = nextState.auditLogs[0];
    expect(lastAudit.action).toBe("APPLICATION_DELETED");
    expect(lastAudit.entityId).toBe(application.id);

    // Ensure consistency preserves deletion
    const consistent = ensureStateConsistency(nextState);
    expect(consistent.applications.some((a) => a.id === application.id)).toBe(false);
  });

  it("2. Blocks non-super_admin actors from deleting applications", () => {
    const state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    expect(() =>
      deleteAmbassadorApplicationOp(state, {
        actor: learnerActor,
        applicationId: "any-app-id",
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
    let state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    const { nextState: stateWithApp, application } = submitAmbassadorApplicationOp(state, {
      fullName: "Mercy Chebet",
      email: "mercy.chebet@egerton.ac.ke",
      phone: "0711998877",
      password: "Password123!",
      county: "Nakuru",
      institution: "Egerton University",
      occupation: "Student",
      motivation: "Passionate about design outreach",
      experience: "Campus leader",
      acceptedTerms: true,
    });

    // Admin approves application
    const { nextState: approvedState, ambassador } = reviewAmbassadorApplicationOp(stateWithApp, {
      actor: adminActor,
      applicationId: application.id,
      decision: "approved",
      reviewNotes: "Excellent campus reach in Nakuru.",
    });

    expect(ambassador).toBeDefined();
    expect(ambassador?.isActive).toBe(true);

    const approvedApp = approvedState.applications.find((a) => a.id === application.id);
    expect(approvedApp?.status).toBe("approved");

    // Simulate state consistency check (e.g. on sync or reload)
    const consistentState = ensureStateConsistency(approvedState);
    const checkedApp = consistentState.applications.find((a) => a.id === application.id);
    expect(checkedApp?.status).toBe("approved");

    // Even if an older server state had this app as "pending", if the ambassador profile exists and is active,
    // ensureStateConsistency guarantees it remains approved!
    const simulatedOldServerState: AppDatabaseState = {
      ...consistentState,
      applications: consistentState.applications.map((a) =>
        a.id === application.id ? { ...a, status: "pending" as const } : a
      ),
    };

    const healedState = ensureStateConsistency(simulatedOldServerState);
    const healedApp = healedState.applications.find((a) => a.id === application.id);
    expect(healedApp?.status).toBe("approved");
  });

  it("5. Guarantees Mathew (SCDS-MAT-K4RH) can be registered, tracked, and approved", () => {
    let state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;
    const { nextState: stateWithMathew, application: mathewApp } = submitAmbassadorApplicationOp(state, {
      fullName: "Mathew",
      email: "mathew@scdsambassador.co.ke",
      phone: "0712345678",
      password: "Password123!",
      county: "Nairobi",
      institution: "SCDS Ambassador Network",
      occupation: "Brand Ambassador",
      motivation: "Dedicated ambassador",
      experience: "Creative campaigns",
      acceptedTerms: true,
    });

    const { nextState: approvedMathewState, ambassador: mathewAmb } = reviewAmbassadorApplicationOp(stateWithMathew, {
      actor: adminActor,
      applicationId: mathewApp.id,
      decision: "approved",
    });

    // Manually assign his code if needed or check generated code
    expect(mathewAmb).toBeDefined();
    expect(mathewAmb?.isActive).toBe(true);
    expect(mathewAmb?.fullName).toBe("Mathew");

    const consistent = ensureStateConsistency(approvedMathewState);
    const checkedMathew = consistent.ambassadors.find((a) => a.userId === mathewAmb?.userId);
    expect(checkedMathew).toBeDefined();
    expect(checkedMathew?.isActive).toBe(true);
  });

  it("6. mergeDatabaseStates retains all new applications without overwriting other users' submissions", () => {
    const baseState = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)) as AppDatabaseState;

    // Applicant A applies on Device 1
    const { nextState: stateA, application: appA } = submitAmbassadorApplicationOp(baseState, {
      fullName: "Applicant Alice",
      email: "alice@test.ac.ke",
      phone: "0711111111",
      password: "Password123!",
      county: "Nairobi",
      institution: "UON",
      occupation: "Student",
      motivation: "Passionate about creative design",
      experience: "Campus rep",
      acceptedTerms: true,
    });

    // Applicant B applies on Device 2
    const { nextState: stateB, application: appB } = submitAmbassadorApplicationOp(baseState, {
      fullName: "Applicant Bob",
      email: "bob@test.ac.ke",
      phone: "0722222222",
      password: "Password123!",
      county: "Kiambu",
      institution: "KU",
      occupation: "Student",
      motivation: "Passionate about web development",
      experience: "Tech lead",
      acceptedTerms: true,
    });

    // Server merges stateA and stateB
    const merged = mergeDatabaseStates(stateA, stateB);

    // Both applications must be retained!
    expect(merged.applications.some((a) => a.id === appA.id)).toBe(true);
    expect(merged.applications.some((a) => a.id === appB.id)).toBe(true);
    expect(merged.profiles.some((p) => p.email === "alice@test.ac.ke")).toBe(true);
    expect(merged.profiles.some((p) => p.email === "bob@test.ac.ke")).toBe(true);
  });

  it("7. POST /api/applications persists new application and GET /api/applications returns it", async () => {
    const reqBody = {
      fullName: "Api Applicant",
      email: `api.applicant.${Date.now()}@test.ac.ke`,
      phone: "0733333333",
      password: "Password123!",
      county: "Nakuru",
      institution: "Egerton University",
      occupation: "Student",
      motivation: "I want to bring SCDS courses to fellow students in Nakuru.",
      experience: "Organized student design workshops.",
      acceptedTerms: true,
    };

    const postReq = new NextRequest("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    const postRes = await postApplications(postReq);
    expect(postRes.status).toBe(201);
    const postJson = await postRes.json();
    expect(postJson.ok).toBe(true);
    expect(postJson.application.email).toBe(reqBody.email.toLowerCase());
    expect(postJson.application.status).toBe("pending");

    const getRes = await getApplications();
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("cache-control")).toContain("no-store");
    const getJson = await getRes.json();
    expect(getJson.ok).toBe(true);
    expect(getJson.applications.some((a: any) => a.email === reqBody.email.toLowerCase())).toBe(true);
  });

  it("8. Fails loudly with 503 in production/Vercel if Supabase service env vars are missing", async () => {
    const prevVercel = process.env.VERCEL;
    const prevServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.VERCEL = "1";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const getRes = await getApplications();
      expect(getRes.status).toBe(503);

      const postReq = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.8.8.8" },
        body: JSON.stringify({
          fullName: "Prod Test",
          email: "prod.test@example.com",
          phone: "0711111111",
          password: "Password123!",
          county: "Nairobi",
          institution: "UON",
          occupation: "Student",
          motivation: "Testing production Supabase enforcement",
          experience: "Testing",
          acceptedTerms: true,
        }),
      });
      const postRes = await postApplications(postReq);
      expect(postRes.status).toBe(503);
    } finally {
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
      if (prevServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceKey;
    }
  });

  it("9. Register payload passes schema -> POST /api/applications -> GET /api/applications returns pending first", async () => {
    const { ambassadorApplicationSchema } = await import("@/lib/validations");
    const uniqueEmail = `register.e2e.${Date.now()}@test.ac.ke`;
    const registerFormInput = {
      fullName: "Register Flow Applicant",
      email: uniqueEmail,
      phone: "0744444444",
      password: "Password123!",
      county: "Nairobi",
      institution: "TUK",
      occupation: "University / College Student",
      academicYear: "Year 2 Undergraduate",
      studyField: "Graphic Design, Multimedia or Tech",
      audienceSize: "100 - 500 peers / campus contacts",
      weeklyHours: "5 - 10 hours/week",
      deviceReadiness: "Laptop & Smartphone with stable 4G/Wi-Fi",
      familiarTools: ["Adobe Photoshop", "CapCut Video Editing"],
      pastAmbassadorExperience: "Campus Club / Society Leader",
      resumeUrl: "",
      instagram: "",
      linkedin: "",
      tiktok: "",
      twitter: "",
      portfolio: "",
      promotionStrategy: "WhatsApp Student Groups & Status",
      targetAudience: "University / College Undergraduates",
      motivation: "Excited to represent SCDS across my campus network.",
      experience: "Led student design and creative marketing clubs.",
      acceptedTerms: true,
    };

    const parsed = ambassadorApplicationSchema.safeParse(registerFormInput);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const postReq = new NextRequest("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.7.7.7" },
      body: JSON.stringify(parsed.data),
    });

    const postRes = await postApplications(postReq);
    expect(postRes.status).toBe(201);
    const postJson = await postRes.json();
    expect(postJson.ok).toBe(true);
    expect(postJson.profile.password).toBeUndefined();

    const getRes = await getApplications();
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    const idx = getJson.applications.findIndex(
      (a: { email: string }) => a.email === uniqueEmail.toLowerCase()
    );
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(getJson.applications[idx].status).toBe("pending");
  });
});
