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
 * Emails whose pre-existing records (created before their respective purge cutoff)
 * are permanently purged so those users have zero access unless they create a new account.
 */
export const PURGE_EMAIL_CUTOFFS: Record<string, number> = {
  "kinyuam047@gmail.com": Date.parse("2026-11-12T22:46:00.000Z"),
  "mathewatambo629@gmail.com": Date.parse("2026-11-13T09:29:00.000Z"),
};
export const PURGE_PREEXISTING_EMAILS = new Set(Object.keys(PURGE_EMAIL_CUTOFFS));
export const PURGE_PREEXISTING_CUTOFF_MS = Date.parse("2026-11-12T22:46:00.000Z");

function isPreexistingPurgedEmail(email?: string, createdAt?: string): boolean {
  if (!email) return false;
  const cutoff = PURGE_EMAIL_CUTOFFS[email.toLowerCase().trim()];
  if (cutoff === undefined) return false;
  if (!createdAt) return true;
  const ts = Date.parse(createdAt);
  return Number.isNaN(ts) || ts < cutoff;
}

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
  const deletedEntitySet = new Set(state.deletedEntityIds || []);
  const deletedTrashSet = new Set(state.deletedTrashIds || []);

  // Automatically purge expired items from trash (items older than 48 hours / 2 days)
  const currentTime = Date.now();
  const cleanTrash = (state.trash || []).filter((t) => {
    if (deletedTrashSet.has(t.id) || deletedEntitySet.has(t.entityId)) return false;
    if (t.entityType === "application" && isPreexistingPurgedEmail(t.payload?.email, t.payload?.createdAt)) {
      return false;
    }
    if (t.entityType === "ambassador" && isPreexistingPurgedEmail(t.payload?.ambassador?.email, t.payload?.ambassador?.createdAt)) {
      return false;
    }
    if (new Date(t.expiresAt).getTime() <= currentTime) {
      deletedTrashSet.add(t.id);
      deletedEntitySet.add(t.entityId);
      if (t.entityType === "application") deletedAppSet.add(t.entityId);
      if (t.entityType === "ambassador") deletedUserSet.add(t.entityId);
      return false;
    }
    return true;
  });

  const trashedEntitySet = new Set(cleanTrash.map((t) => t.entityId));

  const rawProfiles: Profile[] = Array.isArray(state.profiles) ? state.profiles : [];
  const rawAmbassadors: AmbassadorProfile[] = Array.isArray(state.ambassadors) ? state.ambassadors : [];
  const rawApplications = Array.isArray(state.applications) ? state.applications : [];

  // Filter out demo seeds, deleted IDs, trashed IDs, and pre-existing purged emails
  const applications = rawApplications.filter(
    (a) =>
      !deletedAppSet.has(a.id) &&
      !deletedEntitySet.has(a.id) &&
      !trashedEntitySet.has(a.id) &&
      !SEEDED_DEMO_APP_IDS.has(a.id) &&
      !SEEDED_DEMO_EMAILS.has(a.email.toLowerCase().trim()) &&
      !isPreexistingPurgedEmail(a.email, a.createdAt)
  );

  const profiles: Profile[] = rawProfiles.filter(
    (p) =>
      !deletedUserSet.has(p.id) &&
      !SEEDED_DEMO_USER_IDS.has(p.id) &&
      (p.role === "super_admin" ||
        (!SEEDED_DEMO_EMAILS.has(p.email.toLowerCase().trim()) &&
          !isPreexistingPurgedEmail(p.email, p.createdAt)))
  );

  const ambassadors: AmbassadorProfile[] = rawAmbassadors.filter(
    (a) =>
      !deletedUserSet.has(a.userId) &&
      !deletedUserSet.has(a.id) &&
      !deletedEntitySet.has(a.id) &&
      !trashedEntitySet.has(a.id) &&
      !SEEDED_DEMO_AMB_IDS.has(a.id) &&
      !SEEDED_DEMO_EMAILS.has(a.email.toLowerCase().trim()) &&
      !isPreexistingPurgedEmail(a.email, a.createdAt)
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

  // 2. Synchronize approved real applications with profiles and ambassadors (O(N) via Maps/Sets)
  const now = new Date().toISOString();
  const profileById = new Map<string, Profile>();
  const profileByEmail = new Map<string, Profile>();
  for (const p of profiles) {
    if (p.id) profileById.set(p.id, p);
    if (p.email) profileByEmail.set(p.email.trim().toLowerCase(), p);
  }

  const ambByUserId = new Map<string, AmbassadorProfile>();
  const ambByEmail = new Map<string, AmbassadorProfile>();
  const existingCodeSet = new Set<string>();
  for (const a of ambassadors) {
    if (a.userId) ambByUserId.set(a.userId, a);
    if (a.email) ambByEmail.set(a.email.trim().toLowerCase(), a);
    if (a.referralCode) existingCodeSet.add(a.referralCode.toUpperCase());
  }

  for (const app of applications) {
    const cleanEmail = app.email.trim().toLowerCase();

    // Ensure matching user profile exists
    let userProfile =
      (app.userId ? profileById.get(app.userId) : undefined) ||
      profileByEmail.get(cleanEmail);

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
      profileById.set(userProfile.id, userProfile);
      profileByEmail.set(cleanEmail, userProfile);
    }

    const matchingAmb =
      ambByUserId.get(userProfile.id) || ambByEmail.get(cleanEmail);

    // Preserve blocked status
    const isUserBlocked =
      userProfile.status === "blocked" ||
      userProfile.status === "suspended" ||
      Boolean(matchingAmb && (matchingAmb.isBlocked || !matchingAmb.isActive));

    if (isUserBlocked) {
      userProfile.status = "blocked";
    } else {
      // If active ambassador or marked approved, lock in approved status
      const hasActiveAmb = Boolean(
        matchingAmb && matchingAmb.isActive && !matchingAmb.isBlocked
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

      if (!matchingAmb) {
        const referralCode = generateReferralCode(
          app.fullName,
          Array.from(existingCodeSet)
        );
        existingCodeSet.add(referralCode.toUpperCase());
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
        ambByUserId.set(userProfile.id, newAmb);
        ambByEmail.set(cleanEmail, newAmb);
      } else {
        if (!matchingAmb.isBlocked) {
          matchingAmb.isActive = true;
        }
        if (!matchingAmb.socialLinks && app.socialLinks) {
          matchingAmb.socialLinks = app.socialLinks;
        }
        if (!matchingAmb.promotionStrategy && app.promotionStrategy) {
          matchingAmb.promotionStrategy = app.promotionStrategy;
        }
        if (!matchingAmb.targetAudience && app.targetAudience) {
          matchingAmb.targetAudience = app.targetAudience;
        }
        if (!matchingAmb.credentialId) {
          matchingAmb.credentialId = generateCredentialId(app.id);
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
      const matchingAmb =
        (prof.id ? ambByUserId.get(prof.id) : undefined) ||
        ambByEmail.get(cleanEmail);
      if (!matchingAmb) {
        const referralCode = generateReferralCode(
          prof.fullName || "Ambassador",
          Array.from(existingCodeSet)
        );
        existingCodeSet.add(referralCode.toUpperCase());
        const newAmb: AmbassadorProfile = {
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
          credentialId: generateCredentialId(prof.id),
          codeOfConductAgreed: true,
          isActive: prof.status !== "blocked",
          isBlocked: prof.status === "blocked",
          clickCount: 0,
          badgeIds: [],
          createdAt: prof.createdAt || now,
        };
        ambassadors.unshift(newAmb);
        ambByUserId.set(prof.id, newAmb);
        ambByEmail.set(cleanEmail, newAmb);
      } else {
        if (prof.status === "blocked") {
          matchingAmb.isActive = false;
          matchingAmb.isBlocked = true;
        }
      }
    }
  }

  // Clean referrals, payouts, enrolments, courses, campaigns, assets, announcements & notifications
  const isActiveEntity = (id: string) =>
    !deletedEntitySet.has(id) && !trashedEntitySet.has(id);

  const cleanReferrals = (state.referrals || []).filter(
    (r) =>
      isActiveEntity(r.id) &&
      !SEEDED_DEMO_AMB_IDS.has(r.ambassadorId) &&
      !SEEDED_DEMO_EMAILS.has(r.learnerEmail.toLowerCase().trim())
  );

  const cleanPayoutRequests = (state.payoutRequests || []).filter(
    (p) =>
      isActiveEntity(p.id) &&
      !SEEDED_DEMO_AMB_IDS.has(p.ambassadorId) &&
      !deletedUserSet.has(p.ambassadorId) &&
      !isPreexistingPurgedEmail(p.ambassadorEmail, p.requestedAt)
  );

  const cleanEnrolments = (state.enrolments || []).filter((e) => isActiveEntity(e.id));
  const cleanCourses = (state.courses || []).filter((c) => isActiveEntity(c.id));
  const cleanCampaigns = (state.campaigns || []).filter((c) => isActiveEntity(c.id));
  const cleanMarketingAssets = (state.marketingAssets || []).filter((m) => isActiveEntity(m.id));
  const cleanAnnouncements = (state.announcements || []).filter((a) => isActiveEntity(a.id));

  const cleanNotifications = (state.notifications || [])
    .filter((n) => !SEEDED_DEMO_USER_IDS.has(n.userId))
    .slice(0, 200);
  const cleanAuditLogs = Array.isArray(state.auditLogs)
    ? state.auditLogs.slice(0, 500)
    : [];

  return {
    ...state,
    profiles,
    ambassadors,
    applications,
    referrals: cleanReferrals,
    payoutRequests: cleanPayoutRequests,
    enrolments: cleanEnrolments,
    courses: cleanCourses,
    campaigns: cleanCampaigns,
    marketingAssets: cleanMarketingAssets,
    announcements: cleanAnnouncements,
    notifications: cleanNotifications,
    auditLogs: cleanAuditLogs,
    trash: cleanTrash,
    deletedApplicationIds: Array.from(deletedAppSet),
    deletedUserIds: Array.from(deletedUserSet),
    deletedEntityIds: Array.from(deletedEntitySet),
    deletedTrashIds: Array.from(deletedTrashSet),
  };
}
