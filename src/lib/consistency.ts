import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { generateReferralCode } from "@/lib/utils";
import { AmbassadorProfile, Profile } from "@/types";

/**
 * Ensures state consistency across profiles, applications, and ambassadors:
 * 1. Guarantees Super Admin credentials exist and remain active.
 * 2. Guarantees every approved application has an active ambassador profile
 *    with a generated referral code, preventing "Ambassador Privileges Restricted" lockouts.
 * 3. Keeps user profiles and ambassador records in sync across devices and cloud syncs.
 */
export function ensureStateConsistency(state: AppDatabaseState): AppDatabaseState {
  if (!state || typeof state !== "object") {
    return JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
  }

  const profiles: Profile[] = Array.isArray(state.profiles) ? [...state.profiles] : [];
  const ambassadors: AmbassadorProfile[] = Array.isArray(state.ambassadors) ? [...state.ambassadors] : [];
  const applications = Array.isArray(state.applications) ? [...state.applications] : [];

  // 1. Ensure Super Admin profile always exists and has valid credentials
  const adminIdx = profiles.findIndex(
    (p) =>
      p.role === "super_admin" ||
      p.email.toLowerCase() === "samcreativedesignschool@gmail.com"
  );

  if (adminIdx === -1) {
    const adminProfile = INITIAL_DATABASE_STATE.profiles.find(
      (p) => p.role === "super_admin"
    );
    if (adminProfile) {
      profiles.unshift(adminProfile);
    }
  } else {
    profiles[adminIdx].email = "Samcreativedesignschool@gmail.com";
    profiles[adminIdx].password = "Admin@SCDS2026!#Sam";
    profiles[adminIdx].role = "super_admin";
    profiles[adminIdx].status = "active";
  }

  // 2. Synchronize approved applications with profiles and ambassadors
  const now = new Date().toISOString();
  for (const app of applications) {
    const cleanEmail = app.email.trim().toLowerCase();

    // Ensure matching user profile exists
    let userProfile = profiles.find(
      (p) => (app.userId && p.id === app.userId) || p.email.toLowerCase() === cleanEmail
    );

    if (!userProfile) {
      userProfile = {
        id: app.userId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email: cleanEmail,
        fullName: app.fullName,
        phone: app.phone,
        role: app.status === "approved" ? "ambassador" : "learner",
        status: app.status === "approved" ? "active" : app.status === "rejected" ? "rejected" : "pending",
        createdAt: app.createdAt || now,
        updatedAt: now,
      };
      profiles.unshift(userProfile);
    }

    // If application is approved, make sure profile is active ambassador and ambassador profile exists
    if (app.status === "approved") {
      userProfile.role = "ambassador";
      userProfile.status = "active";

      const ambIdx = ambassadors.findIndex(
        (a) =>
          (userProfile && a.userId === userProfile.id) ||
          a.email.toLowerCase() === cleanEmail
      );

      if (ambIdx === -1) {
        const existingCodes = ambassadors.map((a) => a.referralCode);
        const referralCode = generateReferralCode(app.fullName, existingCodes);
        const newAmb: AmbassadorProfile = {
          id: `amb-${userProfile.id}`,
          userId: userProfile.id,
          fullName: app.fullName,
          email: cleanEmail,
          phone: app.phone,
          referralCode,
          level: "Starter",
          totalPoints: 0,
          availablePoints: 0,
          totalCommissionKes: 0,
          availableCommissionKes: 0,
          paidCommissionKes: 0,
          payoutMethod: "MPESA",
          payoutPhone: app.phone,
          county: app.county,
          institution: app.institution,
          occupation: app.occupation,
          bio: `${app.occupation} representing SCDS in ${app.county}.`,
          isActive: true,
          clickCount: 0,
          badgeIds: [],
          createdAt: app.createdAt || now,
        };
        ambassadors.unshift(newAmb);
      } else {
        ambassadors[ambIdx].isActive = true;
      }
    }
  }

  return {
    ...state,
    profiles,
    ambassadors,
    applications,
  };
}
