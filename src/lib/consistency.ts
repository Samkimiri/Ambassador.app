import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { generateCredentialId, generateReferralCode } from "@/lib/utils";
import { AmbassadorProfile, Profile } from "@/types";

/**
 * Seeded Demo Entities to be completely removed from production database.
 */
export const SEEDED_DEMO_EMAILS = new Set([
  "amina.wanjiku@students.jkuat.ac.ke",
  "brian.otieno@uonbi.ac.ke",
  "faith.mutua@creatives.co.ke",
  "kelvin.mwangi@tuk.ac.ke",
  "mathew.ambassador@scds.ac.ke",
]);

export const SEEDED_DEMO_USER_IDS = new Set([
  "user-amb-1",
  "user-amb-2",
  "user-amb-3",
  "user-pending-1",
  "user-mathew-k4rh",
]);

export const SEEDED_DEMO_APP_IDS = new Set([
  "app-1",
  "app-2",
  "app-3",
  "app-pending-1",
  "app-mathew-k4rh",
]);

export const SEEDED_DEMO_AMB_IDS = new Set([
  "amb-1",
  "amb-2",
  "amb-3",
  "amb-mathew-k4rh",
]);

/**
 * Ensures state consistency across profiles, applications, and ambassadors:
 * 1. Guarantees Super Admin credentials exist and remain active.
 * 2. Purges any lingering seeded demo records so only real user applications exist.
 * 3. Enforces permanent deletion: deleted applications and deleted accounts are never restored.
 * 4. Preserves blocked status so an account blocked by the admin remains blocked until unblocked.
 * 5. Guarantees every real approved application has an active ambassador profile and referral code.
 */
export function ensureStateConsistency(state: AppDatabaseState): AppDatabaseState {
  if (!state || typeof state !== "object") {
    return JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
  }

  const deletedAppSet = new Set(state.deletedApplicationIds || []);
  const deletedUserSet = new Set(state.deletedUserIds || []);

  const rawProfiles: Profile[] = Array.isArray(state.profiles) ? state.profiles : [];
  const rawAmbassadors: AmbassadorProfile[] = Array.isArray(state.ambassadors) ? state.ambassadors : [];
  const rawApplications = Array.isArray(state.applications) ? state.applications : [];

  // Filter out demo seeds, deleted IDs, and deleted applications
  const applications = rawApplications.filter(
    (a) =>
      !deletedAppSet.has(a.id) &&
      !SEEDED_DEMO_APP_IDS.has(a.id) &&
      !SEEDED_DEMO_EMAILS.has(a.email.toLowerCase().trim())
  );

  const profiles: Profile[] = rawProfiles.filter(
    (p) =>
      !deletedUserSet.has(p.id) &&
      !SEEDED_DEMO_USER_IDS.has(p.id) &&
      (p.role === "super_admin" || !SEEDED_DEMO_EMAILS.has(p.email.toLowerCase().trim()))
  );

  const ambassadors: AmbassadorProfile[] = rawAmbassadors.filter(
    (a) =>
      !deletedUserSet.has(a.userId) &&
      !deletedUserSet.has(a.id) &&
      !SEEDED_DEMO_AMB_IDS.has(a.id) &&
      !SEEDED_DEMO_EMAILS.has(a.email.toLowerCase().trim())
  );

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

  // 2. Synchronize approved real applications with profiles and ambassadors
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
        status:
          app.status === "approved"
            ? "active"
            : app.status === "rejected"
            ? "rejected"
            : "pending",
        createdAt: app.createdAt || now,
        updatedAt: now,
      };
      profiles.unshift(userProfile);
    }

    // Preserve blocked status
    const isUserBlocked =
      userProfile.status === "blocked" ||
      userProfile.status === "suspended" ||
      ambassadors.some(
        (a) =>
          ((a.userId && a.userId === userProfile!.id) ||
            a.email.toLowerCase() === cleanEmail) &&
          (a.isBlocked || !a.isActive)
      );

    if (isUserBlocked) {
      userProfile.status = "blocked";
    } else {
      // If active ambassador or marked approved, lock in approved status
      const hasActiveAmb = ambassadors.some(
        (a) =>
          ((a.userId && a.userId === userProfile!.id) ||
            a.email.toLowerCase() === cleanEmail) &&
          a.isActive &&
          !a.isBlocked
      );
      if (
        (hasActiveAmb ||
          userProfile.role === "ambassador" ||
          userProfile.status?.toLowerCase() === "approved" ||
          userProfile.status?.toLowerCase() === "active") &&
        app.status !== "rejected" &&
        app.status !== "suspended"
      ) {
        app.status = "approved";
      }
    }

    // If application is approved and not blocked, guarantee active ambassador profile
    if (app.status?.toLowerCase() === "approved" && !isUserBlocked) {
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
          socialLinks: app.socialLinks,
          promotionStrategy: app.promotionStrategy,
          targetAudience: app.targetAudience,
          credentialId: generateCredentialId(app.id),
          codeOfConductAgreed: true,
          isActive: true,
          clickCount: 0,
          badgeIds: [],
          createdAt: app.createdAt || now,
        };
        ambassadors.unshift(newAmb);
      } else {
        if (!ambassadors[ambIdx].isBlocked) {
          ambassadors[ambIdx].isActive = true;
        }
        if (!ambassadors[ambIdx].socialLinks && app.socialLinks) {
          ambassadors[ambIdx].socialLinks = app.socialLinks;
        }
        if (!ambassadors[ambIdx].promotionStrategy && app.promotionStrategy) {
          ambassadors[ambIdx].promotionStrategy = app.promotionStrategy;
        }
        if (!ambassadors[ambIdx].targetAudience && app.targetAudience) {
          ambassadors[ambIdx].targetAudience = app.targetAudience;
        }
        if (!ambassadors[ambIdx].credentialId) {
          ambassadors[ambIdx].credentialId = generateCredentialId(app.id);
        }
      }
    }
  }

  // 3. Ensure any profile marked as an ambassador (and not blocked) has an active directory record
  for (const prof of profiles) {
    if (
      prof.role === "ambassador" ||
      (prof.status === "active" && prof.role !== "super_admin" && prof.role !== "learner")
    ) {
      const cleanEmail = prof.email.trim().toLowerCase();
      const ambIdx = ambassadors.findIndex(
        (a) =>
          (prof.id && a.userId === prof.id) ||
          a.email.toLowerCase() === cleanEmail
      );
      if (ambIdx === -1) {
        const existingCodes = ambassadors.map((a) => a.referralCode);
        const referralCode = generateReferralCode(prof.fullName || "Ambassador", existingCodes);
        ambassadors.unshift({
          id: `amb-${prof.id}`,
          userId: prof.id,
          fullName: prof.fullName,
          email: cleanEmail,
          phone: prof.phone || "",
          referralCode,
          level: "Starter",
          totalPoints: 0,
          availablePoints: 0,
          totalCommissionKes: 0,
          availableCommissionKes: 0,
          paidCommissionKes: 0,
          payoutMethod: "MPESA",
          payoutPhone: prof.phone || "",
          county: "Nairobi",
          institution: "",
          occupation: "Ambassador",
          bio: "Official SCDS Ambassador.",
          credentialId: `SCDS-AMB-${Date.now().toString().slice(-4)}`,
          codeOfConductAgreed: true,
          isActive: prof.status !== "blocked",
          isBlocked: prof.status === "blocked",
          clickCount: 0,
          badgeIds: [],
          createdAt: prof.createdAt || now,
        });
      } else {
        if (prof.status === "blocked") {
          ambassadors[ambIdx].isActive = false;
          ambassadors[ambIdx].isBlocked = true;
        }
      }
    }
  }

  // Clean referrals and notifications from demo seeds
  const cleanReferrals = (state.referrals || []).filter(
    (r) =>
      !SEEDED_DEMO_AMB_IDS.has(r.ambassadorId) &&
      !SEEDED_DEMO_EMAILS.has(r.learnerEmail.toLowerCase().trim())
  );

  const cleanNotifications = (state.notifications || []).filter(
    (n) => !SEEDED_DEMO_USER_IDS.has(n.userId)
  );

  // Automatically purge expired items from trash (items older than 48 hours / 2 days)
  const currentTime = Date.now();
  const cleanTrash = (state.trash || []).filter(
    (t) => new Date(t.expiresAt).getTime() > currentTime
  );

  return {
    ...state,
    profiles,
    ambassadors,
    applications,
    referrals: cleanReferrals,
    notifications: cleanNotifications,
    trash: cleanTrash,
    deletedApplicationIds: Array.from(deletedAppSet),
    deletedUserIds: Array.from(deletedUserSet),
  };
}
