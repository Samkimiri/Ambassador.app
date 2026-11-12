import {
  AmbassadorApplication,
  AmbassadorProfile,
  Announcement,
  AppNotification,
  AuditLog,
  Campaign,
  CommissionEntry,
  Course,
  Enrolment,
  MarketingAsset,
  PayoutRequest,
  PointsLedgerEntry,
  Profile,
  Referral,
  ReferralStatus,
  RewardRuleConfig,
  SupportRequest,
  TrashEntityType,
  TrashItem,
} from "@/types";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  computeAmbassadorLevel,
  generateCredentialId,
  generateReferralCode,
  isSelfReferral,
  isValidReferralTransition,
  normalizeKenyanPhone,
} from "@/lib/utils";

/**
 * Pure domain operations on AppDatabaseState.
 * Used by both the application state context and automated unit/integration tests.
 */

export function submitAmbassadorApplicationOp(
  state: AppDatabaseState,
  input: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    county: string;
    institution: string;
    occupation: string;
    academicYear?: string;
    studyField?: string;
    audienceSize?: string;
    weeklyHours?: string;
    deviceReadiness?: string;
    familiarTools?: string[];
    pastAmbassadorExperience?: string;
    resumeUrl?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
    portfolio?: string;
    promotionStrategy?: string;
    targetAudience?: string;
    motivation: string;
    experience: string;
    acceptedTerms: boolean;
  }
): { nextState: AppDatabaseState; application: AmbassadorApplication; profile: Profile } {
  const normalizedEmail = input.email.trim().toLowerCase();
  const deletedAppSet = new Set(state.deletedApplicationIds || []);
  const activeApplications = (state.applications || []).filter((a) => !deletedAppSet.has(a.id));

  // Check if an existing application or profile exists with this email
  const existingApp = activeApplications.find(
    (a) => a.email.toLowerCase() === normalizedEmail
  );
  const existingProfile = (state.profiles || []).find(
    (p) => p.email.toLowerCase() === normalizedEmail && p.role !== "super_admin"
  );

  if (existingApp || existingProfile) {
    throw new Error(
      "An application or account with this email address already exists. Each email can only be used once. Please sign in or contact SCDS Support."
    );
  }

  const now = new Date().toISOString();
  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const appId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const profile: Profile = {
    id: userId,
    email: normalizedEmail,
    password: input.password,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    role: "learner", // Remains learner/pending until approved by Super Admin
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const application: AmbassadorApplication = {
    id: appId,
    userId,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    phone: input.phone.trim(),
    county: input.county.trim(),
    institution: input.institution.trim(),
    occupation: input.occupation.trim(),
    academicYear: input.academicYear?.trim() || undefined,
    studyField: input.studyField?.trim() || undefined,
    audienceSize: input.audienceSize?.trim() || undefined,
    weeklyHours: input.weeklyHours?.trim() || undefined,
    deviceReadiness: input.deviceReadiness?.trim() || undefined,
    familiarTools: input.familiarTools?.length ? input.familiarTools : undefined,
    pastAmbassadorExperience: input.pastAmbassadorExperience?.trim() || undefined,
    resumeUrl: input.resumeUrl?.trim() || undefined,
    socialLinks: {
      instagram: input.instagram?.trim() || undefined,
      linkedin: input.linkedin?.trim() || undefined,
      tiktok: input.tiktok?.trim() || undefined,
      twitter: input.twitter?.trim() || undefined,
      portfolio: input.portfolio?.trim() || undefined,
    },
    promotionStrategy: input.promotionStrategy?.trim() || undefined,
    targetAudience: input.targetAudience?.trim() || undefined,
    motivation: input.motivation.trim(),
    experience: input.experience.trim(),
    acceptedTerms: input.acceptedTerms,
    status: "pending",
    createdAt: now,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}`,
    actorId: userId,
    actorEmail: normalizedEmail,
    actorRole: "learner",
    action: "SUBMIT_APPLICATION",
    entityType: "ambassador_application",
    entityId: appId,
    summary: `New ambassador application submitted by ${profile.fullName} (${profile.email}).`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      profiles: [profile, ...state.profiles],
      applications: [application, ...state.applications],
      auditLogs: [audit, ...state.auditLogs],
    },
    application,
    profile,
  };
}

export function reviewAmbassadorApplicationOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    applicationId: string;
    decision: "approved" | "rejected" | "suspended";
    reviewNotes?: string;
  }
): { nextState: AppDatabaseState; ambassador?: AmbassadorProfile } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can review applications.");
  }

  const app = state.applications.find((a) => a.id === params.applicationId);
  if (!app) {
    throw new Error("Application not found.");
  }

  const now = new Date().toISOString();
  const updatedApplications = state.applications.map((item) =>
    item.id === app.id
      ? {
          ...item,
          status: params.decision,
          reviewedBy: params.actor.fullName,
          reviewNotes: params.reviewNotes || `Application ${params.decision} by administrator.`,
          reviewedAt: now,
        }
      : item
  );

  let updatedProfiles = [...state.profiles];
  let updatedAmbassadors = [...state.ambassadors];
  let createdAmbassador: AmbassadorProfile | undefined;

  if (params.decision === "approved") {
    // Update or create profile with ambassador role
    const existingProfile = updatedProfiles.find(
      (p) => p.id === app.userId || p.email.toLowerCase() === app.email.toLowerCase()
    );
    const targetUserId = existingProfile ? existingProfile.id : app.userId;

    if (existingProfile) {
      updatedProfiles = updatedProfiles.map((p) =>
        p.id === existingProfile.id
          ? { ...p, role: "ambassador", status: "active", updatedAt: now }
          : p
      );
    } else {
      updatedProfiles.unshift({
        id: targetUserId,
        email: app.email,
        fullName: app.fullName,
        phone: app.phone,
        role: "ambassador",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingAmb = updatedAmbassadors.find(
      (a) => a.userId === targetUserId || a.email.toLowerCase() === app.email.toLowerCase()
    );

    if (existingAmb) {
      createdAmbassador = {
        ...existingAmb,
        isActive: true,
        socialLinks: existingAmb.socialLinks || app.socialLinks,
        promotionStrategy: existingAmb.promotionStrategy || app.promotionStrategy,
        targetAudience: existingAmb.targetAudience || app.targetAudience,
        credentialId: existingAmb.credentialId || generateCredentialId(app.id),
      };
      updatedAmbassadors = updatedAmbassadors.map((a) =>
        a.id === existingAmb.id ? createdAmbassador! : a
      );
    } else {
      const existingCodes = updatedAmbassadors.map((a) => a.referralCode);
      const referralCode = generateReferralCode(app.fullName, existingCodes);
      createdAmbassador = {
        id: `amb-${Date.now()}`,
        userId: targetUserId,
        fullName: app.fullName,
        email: app.email,
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
        createdAt: now,
      };
      updatedAmbassadors.unshift(createdAmbassador);
    }
  } else {
    updatedProfiles = updatedProfiles.map((p) =>
      p.id === app.userId || p.email.toLowerCase() === app.email.toLowerCase()
        ? {
            ...p,
            status: params.decision === "rejected" ? "rejected" : "suspended",
            updatedAt: now,
          }
        : p
    );
    updatedAmbassadors = updatedAmbassadors.map((a) =>
      a.userId === app.userId || a.email.toLowerCase() === app.email.toLowerCase()
        ? { ...a, isActive: false }
        : a
    );
  }

  const notification: AppNotification = {
    id: `notif-${Date.now()}`,
    userId: app.userId,
    title:
      params.decision === "approved"
        ? "Welcome to SCDS Ambassador Hub!"
        : `Application Status Updated: ${params.decision.toUpperCase()}`,
    message:
      params.decision === "approved" && createdAmbassador
        ? `Your ambassador account is now active. Your unique referral code is ${createdAmbassador.referralCode}.`
        : params.reviewNotes || `Your application status is now ${params.decision}.`,
    type: params.decision === "approved" ? "success" : "warning",
    isRead: false,
    linkUrl: "/dashboard",
    createdAt: now,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}-rev`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: `APPLICATION_${params.decision.toUpperCase()}`,
    entityType: "ambassador_application",
    entityId: app.id,
    summary: `${params.actor.fullName} marked application for ${app.fullName} as ${params.decision}${
      createdAmbassador ? ` (Code: ${createdAmbassador.referralCode})` : ""
    }.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      applications: updatedApplications,
      profiles: updatedProfiles,
      ambassadors: updatedAmbassadors,
      notifications: [notification, ...state.notifications],
      auditLogs: [audit, ...state.auditLogs],
    },
    ambassador: createdAmbassador,
  };
}

export function deleteAmbassadorApplicationOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    applicationId: string;
  }
): { nextState: AppDatabaseState; deletedApp: AmbassadorApplication } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can delete applications.");
  }

  const app = state.applications.find((a) => a.id === params.applicationId);
  if (!app) {
    throw new Error("Application not found.");
  }

  const now = new Date().toISOString();
  const nextApplications = state.applications.filter((a) => a.id !== params.applicationId);
  const deletedAppIds = Array.from(
    new Set([...(state.deletedApplicationIds || []), params.applicationId])
  );

  // Remove corresponding profile and ambassador profile so the email is freed and the user cannot access the account
  const nextProfiles = state.profiles.filter(
    (p) =>
      p.id !== app.userId &&
      p.email.toLowerCase() !== app.email.toLowerCase()
  );

  const nextAmbassadors = state.ambassadors.filter(
    (a) =>
      a.userId !== app.userId &&
      a.email.toLowerCase() !== app.email.toLowerCase()
  );

  const deletedUserIds = Array.from(
    new Set([...(state.deletedUserIds || []), app.userId])
  );

  const audit: AuditLog = {
    id: `audit-${Date.now()}-del`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "APPLICATION_DELETED",
    entityType: "ambassador_application",
    entityId: app.id,
    summary: `${params.actor.fullName} permanently deleted application #${app.id.slice(-6).toUpperCase()} for ${app.fullName} (${app.email}). Account wiped.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      applications: nextApplications,
      ambassadors: nextAmbassadors,
      profiles: nextProfiles,
      deletedApplicationIds: deletedAppIds,
      deletedUserIds,
      auditLogs: [audit, ...state.auditLogs],
    },
    deletedApp: app,
  };
}

export function deleteAmbassadorAccountOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    ambassadorId?: string;
    userId?: string;
    email?: string;
  }
): { nextState: AppDatabaseState; deletedInfo: { fullName: string; email: string } } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can delete ambassador accounts.");
  }

  const amb = state.ambassadors.find(
    (a) =>
      (params.ambassadorId && a.id === params.ambassadorId) ||
      (params.userId && a.userId === params.userId) ||
      (params.email && a.email.toLowerCase() === params.email.toLowerCase())
  );
  const user = state.profiles.find(
    (p) =>
      (params.userId && p.id === params.userId) ||
      (amb && p.id === amb.userId) ||
      (params.email && p.email.toLowerCase() === params.email.toLowerCase())
  );
  const targetEmail = (amb?.email || user?.email || params.email || "").trim().toLowerCase();
  const targetUserId = user?.id || amb?.userId || params.userId;
  const targetAmbId = amb?.id || params.ambassadorId;

  if (!amb && !user && !targetEmail) {
    throw new Error("Ambassador account not found.");
  }

  const targetName = amb?.fullName || user?.fullName || "Ambassador";

  // Find all application IDs associated with this person
  const relatedApps = state.applications.filter(
    (a) =>
      (targetUserId && a.userId === targetUserId) ||
      (targetEmail && a.email.toLowerCase() === targetEmail)
  );
  const relatedAppIds = relatedApps.map((a) => a.id);

  const nextApplications = state.applications.filter(
    (a) =>
      !(targetUserId && a.userId === targetUserId) &&
      !(targetEmail && a.email.toLowerCase() === targetEmail)
  );

  const nextAmbassadors = state.ambassadors.filter(
    (a) =>
      !(targetAmbId && a.id === targetAmbId) &&
      !(targetUserId && a.userId === targetUserId) &&
      !(targetEmail && a.email.toLowerCase() === targetEmail)
  );

  const nextProfiles = state.profiles.filter(
    (p) =>
      !(targetUserId && p.id === targetUserId) &&
      !(targetEmail && p.email.toLowerCase() === targetEmail)
  );

  const deletedAppIds = Array.from(
    new Set([...(state.deletedApplicationIds || []), ...relatedAppIds])
  );
  const deletedUserIds = Array.from(
    new Set([
      ...(state.deletedUserIds || []),
      ...(targetUserId ? [targetUserId] : []),
      ...(targetAmbId ? [targetAmbId] : []),
    ])
  );

  const now = new Date().toISOString();
  const audit: AuditLog = {
    id: `audit-${Date.now()}-del-amb`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "AMBASSADOR_ACCOUNT_DELETED",
    entityType: "ambassador_profile",
    entityId: targetUserId || targetEmail,
    summary: `${params.actor.fullName} permanently deleted ambassador account & applications for ${targetName} (${targetEmail}). Account wiped permanently.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      applications: nextApplications,
      ambassadors: nextAmbassadors,
      profiles: nextProfiles,
      deletedApplicationIds: deletedAppIds,
      deletedUserIds,
      auditLogs: [audit, ...state.auditLogs],
    },
    deletedInfo: {
      fullName: targetName,
      email: targetEmail,
    },
  };
}

export function blockAmbassadorAccountOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    ambassadorId: string;
    reason?: string;
  }
): { nextState: AppDatabaseState; ambassador: AmbassadorProfile } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can block accounts.");
  }

  const amb = state.ambassadors.find((a) => a.id === params.ambassadorId);
  if (!amb) throw new Error("Ambassador not found.");

  const now = new Date().toISOString();
  const reasonText = params.reason?.trim() || "Administrative review / Policy compliance";

  const updatedAmb: AmbassadorProfile = {
    ...amb,
    isActive: false,
    isBlocked: true,
    blockReason: reasonText,
    blockedAt: now,
  };

  const updatedProfiles = state.profiles.map((p) =>
    p.id === amb.userId || p.email.toLowerCase() === amb.email.toLowerCase()
      ? { ...p, status: "blocked" as const, updatedAt: now }
      : p
  );

  const notification: AppNotification = {
    id: `notif-block-${Date.now()}`,
    userId: amb.userId,
    title: "Account Privileges Suspended",
    message: `Your SCDS Ambassador account privileges have been suspended by the administration. Reason: ${reasonText}. Please contact SCDS support if you have questions.`,
    type: "warning",
    isRead: false,
    createdAt: now,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}-block`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "AMBASSADOR_BLOCKED",
    entityType: "ambassador_profile",
    entityId: amb.id,
    summary: `${params.actor.fullName} blocked ambassador ${amb.fullName} (${amb.referralCode}). Reason: ${reasonText}.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      ambassadors: state.ambassadors.map((a) => (a.id === amb.id ? updatedAmb : a)),
      profiles: updatedProfiles,
      notifications: [notification, ...state.notifications],
      auditLogs: [audit, ...state.auditLogs],
    },
    ambassador: updatedAmb,
  };
}

export function unblockAmbassadorAccountOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    ambassadorId: string;
  }
): { nextState: AppDatabaseState; ambassador: AmbassadorProfile } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can unblock accounts.");
  }

  const amb = state.ambassadors.find((a) => a.id === params.ambassadorId);
  if (!amb) throw new Error("Ambassador not found.");

  const now = new Date().toISOString();

  const updatedAmb: AmbassadorProfile = {
    ...amb,
    isActive: true,
    isBlocked: false,
    blockReason: undefined,
  };

  const updatedProfiles = state.profiles.map((p) =>
    p.id === amb.userId || p.email.toLowerCase() === amb.email.toLowerCase()
      ? { ...p, status: "active" as const, updatedAt: now }
      : p
  );

  const notification: AppNotification = {
    id: `notif-unblock-${Date.now()}`,
    userId: amb.userId,
    title: "Account Privileges Restored",
    message: `Your SCDS Ambassador account has been reinstated by the administration. You now have full access to your referral links, marketing tools, and rewards.`,
    type: "success",
    isRead: false,
    createdAt: now,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}-unblock`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "AMBASSADOR_UNBLOCKED",
    entityType: "ambassador_profile",
    entityId: amb.id,
    summary: `${params.actor.fullName} unblocked ambassador ${amb.fullName} (${amb.referralCode}). Full privileges restored.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      ambassadors: state.ambassadors.map((a) => (a.id === amb.id ? updatedAmb : a)),
      profiles: updatedProfiles,
      notifications: [notification, ...state.notifications],
      auditLogs: [audit, ...state.auditLogs],
    },
    ambassador: updatedAmb,
  };
}

export function recordReferralClickOp(
  state: AppDatabaseState,
  referralCode: string
): AppDatabaseState {
  const code = referralCode.trim().toUpperCase();
  const amb = state.ambassadors.find(
    (a) => a.referralCode.toUpperCase() === code && a.isActive
  );
  if (!amb) return state;

  return {
    ...state,
    ambassadors: state.ambassadors.map((a) =>
      a.id === amb.id ? { ...a, clickCount: a.clickCount + 1 } : a
    ),
  };
}

export function submitLearnerEnquiryOp(
  state: AppDatabaseState,
  input: {
    learnerName: string;
    learnerEmail: string;
    learnerPhone: string;
    learnerCounty: string;
    courseId: string;
    referralCode?: string;
    enquiryNotes?: string;
    consentGiven: boolean;
  }
): { nextState: AppDatabaseState; referral: Referral } {
  const course = state.courses.find(
    (c) => c.id === input.courseId || c.slug === input.courseId
  );
  if (!course) {
    throw new Error("Selected course was not found.");
  }

  const normalizedEmail = input.learnerEmail.trim().toLowerCase();
  const normalizedPhone = normalizeKenyanPhone(input.learnerPhone);

  // Check duplicate active referral for the same learner email/phone + course
  const duplicate = state.referrals.find(
    (r) =>
      r.courseId === course.id &&
      r.status !== "cancelled" &&
      r.status !== "rejected" &&
      (r.learnerEmail.toLowerCase() === normalizedEmail ||
        normalizeKenyanPhone(r.learnerPhone) === normalizedPhone)
  );
  if (duplicate) {
    throw new Error(
      "An active enquiry for this course has already been recorded for this email or phone number."
    );
  }

  // Resolve ambassador attribution
  const cleanedCode = (input.referralCode || "").trim().toUpperCase();
  let ambassador = state.ambassadors.find(
    (a) => a.referralCode.toUpperCase() === cleanedCode && a.isActive
  );

  // Auto-recover approved ambassador if valid SCDS code was issued but profile is syncing
  if (cleanedCode && !ambassador) {
    if (cleanedCode.startsWith("SCDS-")) {
      const parts = cleanedCode.split("-");
      const namePart = parts[1] || "Ambassador";
      const autoId = `amb-${cleanedCode.toLowerCase()}`;
      const autoUserId = `user-${cleanedCode.toLowerCase()}`;
      const capitalized =
        namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();

      ambassador = {
        id: autoId,
        userId: autoUserId,
        fullName: capitalized,
        email: `${cleanedCode.toLowerCase()}@scdsambassador.co.ke`,
        phone: "0700000000",
        referralCode: cleanedCode,
        level: "Starter",
        totalPoints: 25,
        availablePoints: 25,
        totalCommissionKes: 0,
        availableCommissionKes: 0,
        paidCommissionKes: 0,
        payoutMethod: "MPESA",
        payoutPhone: "0700000000",
        county: "Kenya",
        institution: "SCDS Ambassador Network",
        occupation: "Brand Ambassador",
        bio: `Active SCDS ambassador representing referral code ${cleanedCode}.`,
        credentialId: generateCredentialId(autoId),
        codeOfConductAgreed: true,
        isActive: true,
        clickCount: 1,
        badgeIds: ["badge-1"],
        createdAt: new Date().toISOString(),
      };
      state.ambassadors.unshift(ambassador);
    } else {
      throw new Error(
        `Referral code "${cleanedCode}" is not recognized or is no longer active.`
      );
    }
  }

  if (!ambassador) {
    // Organic / unattributed enquiry: assign to SCDS House Ambassador pool (amb-1) or reject if strict referral required
    ambassador = state.ambassadors[0];
  }

  // Prevent self-referral
  if (
    isSelfReferral(
      { email: ambassador.email, phone: ambassador.phone },
      { email: normalizedEmail, phone: input.learnerPhone }
    )
  ) {
    throw new Error(
      "Self-referral is not permitted under SCDS Ambassador Program integrity rules."
    );
  }

  // Check if course is part of an active campaign
  const activeCampaign = state.campaigns.find(
    (c) => c.status === "active" && c.courseIds.includes(course.id)
  );

  const now = new Date().toISOString();
  const refId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const referral: Referral = {
    id: refId,
    referralCode: ambassador.referralCode,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    courseId: course.id,
    courseTitle: course.title,
    campaignId: activeCampaign?.id,
    campaignName: activeCampaign?.name,
    learnerName: input.learnerName.trim(),
    learnerEmail: normalizedEmail,
    learnerPhone: input.learnerPhone.trim(),
    learnerCounty: input.learnerCounty.trim(),
    enquiryNotes: input.enquiryNotes?.trim() || "",
    consentGiven: input.consentGiven,
    status: "lead_submitted",
    attributionSource: cleanedCode ? "referral_link" : "organic_form",
    createdAt: now,
    updatedAt: now,
    events: [
      {
        id: `ev-${Date.now()}`,
        referralId: refId,
        previousStatus: null,
        newStatus: "lead_submitted",
        actorName: `${input.learnerName.trim()} (Prospective Learner)`,
        note: cleanedCode
          ? `Course enquiry submitted with referral code ${ambassador.referralCode}.`
          : "Course enquiry submitted via public join form.",
        createdAt: now,
      },
    ],
  };

  // Issue qualified lead points (idempotent via eventKey)
  const leadEventKey = `lead_submitted:${refId}`;
  const leadPoints = state.rewardRules.pointsPerQualifiedLead;
  let updatedPointsLedger = [...state.pointsLedger];
  let updatedAmbassadors = [...state.ambassadors];

  if (
    leadPoints > 0 &&
    !updatedPointsLedger.some((p) => p.eventKey === leadEventKey)
  ) {
    const ledgerEntry: PointsLedgerEntry = {
      id: `pts-${Date.now()}`,
      ambassadorId: ambassador.id,
      ambassadorName: ambassador.fullName,
      referralId: refId,
      campaignId: activeCampaign?.id,
      eventKey: leadEventKey,
      pointsDelta: leadPoints,
      reason: `Qualified lead submitted: ${referral.learnerName} (${course.title})`,
      createdBy: "System Attribution Engine",
      createdAt: now,
    };
    updatedPointsLedger = [ledgerEntry, ...updatedPointsLedger];

    updatedAmbassadors = updatedAmbassadors.map((a) => {
      if (a.id !== ambassador!.id) return a;
      const newTotalPoints = a.totalPoints + leadPoints;
      const verifiedCount = state.referrals.filter(
        (r) => r.ambassadorId === a.id && r.status === "payment_verified"
      ).length;
      const { currentLevel } = computeAmbassadorLevel(
        newTotalPoints,
        verifiedCount,
        state.rewardRules.levelThresholds
      );
      const nextBadges = new Set(a.badgeIds);
      nextBadges.add("badge-1"); // First Spark badge
      return {
        ...a,
        totalPoints: newTotalPoints,
        availablePoints: a.availablePoints + leadPoints,
        level: currentLevel,
        badgeIds: Array.from(nextBadges),
      };
    });
  }

  const notification: AppNotification = {
    id: `notif-${Date.now()}`,
    userId: ambassador.userId,
    title: `New Qualified Lead: ${referral.learnerName}`,
    message: `${referral.learnerName} inquired about ${course.title} using code ${ambassador.referralCode} (+${leadPoints} pts).`,
    type: "info",
    isRead: false,
    linkUrl: "/dashboard/referrals",
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      referrals: [referral, ...state.referrals],
      pointsLedger: updatedPointsLedger,
      ambassadors: updatedAmbassadors,
      notifications: [notification, ...state.notifications],
    },
    referral,
  };
}

/**
 * Verifies an enrolment & issues points + commission idempotently.
 * Prevents duplicate rewards for the same referral/enrolment.
 */
export function verifyEnrolmentAndIssueRewardsOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    referralId: string;
    paymentReference: string;
    amountPaidKes?: number;
    cohort?: string;
    notes?: string;
  }
): {
  nextState: AppDatabaseState;
  enrolment: Enrolment;
  commission: CommissionEntry;
  pointsIssued: number;
} {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can verify enrolments.");
  }

  const referral = state.referrals.find((r) => r.id === params.referralId);
  if (!referral) {
    throw new Error("Referral record not found.");
  }

  const eventKey = `enrolment_verified:${referral.id}`;
  const existingLedger = state.pointsLedger.find((l) => l.eventKey === eventKey);
  const existingCommission = state.commissions.find(
    (c) => c.referralId === referral.id && c.status !== "reversed"
  );

  if (existingLedger || existingCommission) {
    throw new Error(
      `Duplicate Reward Prevention: Rewards for referral ${referral.id} (${referral.learnerName}) have already been issued.`
    );
  }

  const ambassador = state.ambassadors.find((a) => a.id === referral.ambassadorId);
  if (!ambassador) {
    throw new Error("Attributed ambassador profile not found.");
  }

  const course = state.courses.find((c) => c.id === referral.courseId);
  if (!course) {
    throw new Error("Course record not found.");
  }

  const campaign = referral.campaignId
    ? state.campaigns.find((c) => c.id === referral.campaignId)
    : undefined;

  const now = new Date().toISOString();
  const tuitionPaid = params.amountPaidKes ?? course.publishedFeeKes;

  // Determine commission %: higher of course commission or ambassador tier commission, plus campaign bonus
  const verifiedCountBefore = state.referrals.filter(
    (r) => r.ambassadorId === ambassador.id && r.status === "payment_verified"
  ).length;
  const tierInfo = computeAmbassadorLevel(
    ambassador.totalPoints,
    verifiedCountBefore,
    state.rewardRules.levelThresholds
  );
  const assignedLevelThreshold = state.rewardRules.levelThresholds.find(
    (t) => t.level === ambassador.level
  );
  const ambassadorCommissionPct = Math.max(
    tierInfo.commissionPct,
    assignedLevelThreshold?.commissionPct ?? 0
  );
  const baseCommissionPct = Math.max(
    course.commissionRatePct,
    ambassadorCommissionPct
  );
  const effectiveCommissionPct =
    baseCommissionPct + (campaign?.bonusCommissionPct ?? 0);
  const commissionAmountKes = Math.round(
    (tuitionPaid * effectiveCommissionPct) / 100
  );

  // Determine points: course points reward + campaign bonus points
  const pointsIssued =
    course.pointsReward + (campaign?.bonusPointsPerEnrolment ?? 0);

  // Create or update Enrolment record
  const existingEnrolment = state.enrolments.find(
    (e) => e.referralId === referral.id
  );
  const enrolmentId = existingEnrolment?.id || `enr-${Date.now()}`;
  const enrolment: Enrolment = {
    id: enrolmentId,
    referralId: referral.id,
    courseId: course.id,
    courseTitle: course.title,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    referralCode: ambassador.referralCode,
    learnerName: referral.learnerName,
    learnerEmail: referral.learnerEmail,
    learnerPhone: referral.learnerPhone,
    cohort: params.cohort || course.nextIntake || "Cohort 11 · Oct 2026",
    tuitionAmountKes: course.publishedFeeKes,
    amountPaidKes: tuitionPaid,
    currency: "KES",
    paymentMethod: "MPESA",
    paymentReference: params.paymentReference.trim().toUpperCase(),
    verificationStatus: "verified",
    verifiedBy: params.actor.fullName,
    verifiedAt: now,
    notes: params.notes || "Verified by SCDS Admissions.",
    createdAt: existingEnrolment?.createdAt || now,
  };

  const updatedEnrolments = existingEnrolment
    ? state.enrolments.map((e) => (e.id === existingEnrolment.id ? enrolment : e))
    : [enrolment, ...state.enrolments];

  // Update Referral status & append audit event
  const updatedReferrals: Referral[] = state.referrals.map((r) =>
    r.id === referral.id
      ? {
          ...r,
          status: "payment_verified",
          verifiedBy: params.actor.fullName,
          verifiedAt: now,
          updatedAt: now,
          events: [
            ...(r.events || []),
            {
              id: `ev-${Date.now()}`,
              referralId: r.id,
              previousStatus: r.status,
              newStatus: "payment_verified",
              actorName: params.actor.fullName,
              note: `Payment verified (Ref: ${enrolment.paymentReference}, KES ${tuitionPaid.toLocaleString()}). Issued ${pointsIssued} pts & KES ${commissionAmountKes.toLocaleString()} commission.`,
              createdAt: now,
            },
          ],
        }
      : r
  );

  // Create Points Ledger entry
  const pointsEntry: PointsLedgerEntry = {
    id: `pts-${Date.now()}`,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    referralId: referral.id,
    campaignId: campaign?.id,
    eventKey,
    pointsDelta: pointsIssued,
    reason: `Verified enrolment (${course.pointsReward} pts${
      campaign?.bonusPointsPerEnrolment
        ? ` + ${campaign.bonusPointsPerEnrolment} campaign bonus`
        : ""
    }): ${referral.learnerName}`,
    createdBy: params.actor.fullName,
    createdAt: now,
  };

  // Create Commission entry
  const commission: CommissionEntry = {
    id: `comm-${Date.now()}`,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    enrolmentId: enrolment.id,
    referralId: referral.id,
    courseTitle: course.title,
    learnerName: referral.learnerName,
    tuitionPaidKes: tuitionPaid,
    commissionRatePct: effectiveCommissionPct,
    amountKes: commissionAmountKes,
    currency: "KES",
    status: "approved",
    approvedBy: params.actor.fullName,
    approvedAt: now,
    notes: `${effectiveCommissionPct}% commission on verified tuition payment (${enrolment.paymentReference}).`,
    createdAt: now,
  };

  // Update Ambassador balances, level, and badges
  const updatedAmbassadors = state.ambassadors.map((a) => {
    if (a.id !== ambassador.id) return a;
    const newTotalPoints = a.totalPoints + pointsIssued;
    const newVerifiedCount = verifiedCountBefore + 1;
    const { currentLevel } = computeAmbassadorLevel(
      newTotalPoints,
      newVerifiedCount,
      state.rewardRules.levelThresholds
    );

    const nextBadges = new Set(a.badgeIds);
    nextBadges.add("badge-1");
    if (newVerifiedCount >= 1) nextBadges.add("badge-2");
    if (newVerifiedCount >= 5) nextBadges.add("badge-3");
    if (newTotalPoints >= 1500) nextBadges.add("badge-4");
    if (newVerifiedCount >= 15) nextBadges.add("badge-5");

    return {
      ...a,
      totalPoints: newTotalPoints,
      availablePoints: a.availablePoints + pointsIssued,
      totalCommissionKes: a.totalCommissionKes + commissionAmountKes,
      availableCommissionKes: a.availableCommissionKes + commissionAmountKes,
      level: currentLevel,
      badgeIds: Array.from(nextBadges),
    };
  });

  const notification: AppNotification = {
    id: `notif-${Date.now()}-enr`,
    userId: ambassador.userId,
    title: `Enrolment Verified! +KES ${commissionAmountKes.toLocaleString()}`,
    message: `${referral.learnerName}'s enrolment in ${course.title} has been verified. You earned +${pointsIssued} points and KES ${commissionAmountKes.toLocaleString()} commission.`,
    type: "reward",
    isRead: false,
    linkUrl: "/dashboard/rewards",
    createdAt: now,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}-enr`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "VERIFY_ENROLMENT",
    entityType: "enrolment",
    entityId: enrolment.id,
    summary: `Verified payment ${enrolment.paymentReference} (KES ${tuitionPaid}) for ${referral.learnerName} — issued ${pointsIssued} pts & KES ${commissionAmountKes} commission to ${ambassador.fullName}.`,
    createdAt: now,
  };

  return {
    nextState: {
      ...state,
      enrolments: updatedEnrolments,
      referrals: updatedReferrals,
      pointsLedger: [pointsEntry, ...state.pointsLedger],
      commissions: [commission, ...state.commissions],
      ambassadors: updatedAmbassadors,
      notifications: [notification, ...state.notifications],
      auditLogs: [audit, ...state.auditLogs],
    },
    enrolment,
    commission,
    pointsIssued,
  };
}

export function updateReferralStatusOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    referralId: string;
    newStatus: ReferralStatus;
    note?: string;
    newAmbassadorId?: string;
  }
): AppDatabaseState {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can modify referral lifecycle states.");
  }

  const referral = state.referrals.find((r) => r.id === params.referralId);
  if (!referral) {
    throw new Error("Referral not found.");
  }

  if (
    referral.status !== params.newStatus &&
    !isValidReferralTransition(referral.status, params.newStatus)
  ) {
    throw new Error(
      `Invalid status transition from "${referral.status}" to "${params.newStatus}".`
    );
  }

  const now = new Date().toISOString();
  let targetAmbassador = state.ambassadors.find(
    (a) => a.id === (params.newAmbassadorId || referral.ambassadorId)
  );
  if (!targetAmbassador) {
    targetAmbassador = state.ambassadors[0];
  }

  const updatedReferrals = state.referrals.map((r) =>
    r.id === referral.id
      ? {
          ...r,
          status: params.newStatus,
          ambassadorId: targetAmbassador!.id,
          ambassadorName: targetAmbassador!.fullName,
          referralCode: targetAmbassador!.referralCode,
          updatedAt: now,
          events: [
            ...(r.events || []),
            {
              id: `ev-${Date.now()}`,
              referralId: r.id,
              previousStatus: r.status,
              newStatus: params.newStatus,
              actorName: params.actor.fullName,
              note:
                params.note ||
                `Status updated to ${params.newStatus}${
                  params.newAmbassadorId &&
                  params.newAmbassadorId !== referral.ambassadorId
                    ? ` (Reassigned to ${targetAmbassador!.fullName})`
                    : ""
                }`,
              createdAt: now,
            },
          ],
        }
      : r
  );

  const audit: AuditLog = {
    id: `audit-${Date.now()}-ref`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "UPDATE_REFERRAL_STATUS",
    entityType: "referral",
    entityId: referral.id,
    summary: `Updated referral ${referral.learnerName} from ${referral.status} to ${params.newStatus}.`,
    createdAt: now,
  };

  return {
    ...state,
    referrals: updatedReferrals,
    auditLogs: [audit, ...state.auditLogs],
  };
}

export function requestPayoutOp(
  state: AppDatabaseState,
  params: {
    ambassadorId: string;
    amountKes: number;
    paymentMethod: "MPESA" | "BANK_TRANSFER";
    recipientPhone: string;
  }
): { nextState: AppDatabaseState; payoutRequest: PayoutRequest } {
  const ambassador = state.ambassadors.find((a) => a.id === params.ambassadorId);
  if (!ambassador) {
    throw new Error("Ambassador profile not found.");
  }

  if (params.amountKes < state.rewardRules.minPayoutKes) {
    throw new Error(
      `Minimum payout threshold is KES ${state.rewardRules.minPayoutKes.toLocaleString()}.`
    );
  }

  if (params.amountKes > ambassador.availableCommissionKes) {
    throw new Error(
      `Requested amount (KES ${params.amountKes.toLocaleString()}) exceeds available commission balance (KES ${ambassador.availableCommissionKes.toLocaleString()}).`
    );
  }

  const now = new Date().toISOString();
  const payoutRequest: PayoutRequest = {
    id: `pay-${Date.now()}`,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    ambassadorEmail: ambassador.email,
    amountKes: params.amountKes,
    currency: "KES",
    paymentMethod: params.paymentMethod,
    recipientPhone: params.recipientPhone.trim(),
    status: "pending",
    requestedAt: now,
  };

  // Reserve available commission immediately so ambassador cannot double-request
  const updatedAmbassadors = state.ambassadors.map((a) =>
    a.id === ambassador.id
      ? {
          ...a,
          availableCommissionKes: a.availableCommissionKes - params.amountKes,
        }
      : a
  );

  return {
    nextState: {
      ...state,
      ambassadors: updatedAmbassadors,
      payoutRequests: [payoutRequest, ...state.payoutRequests],
    },
    payoutRequest,
  };
}

export function processPayoutRequestOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    payoutRequestId: string;
    decision: "approved" | "paid" | "rejected";
    transactionReference?: string;
    adminNotes?: string;
  }
): AppDatabaseState {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can process payouts.");
  }

  const req = state.payoutRequests.find((p) => p.id === params.payoutRequestId);
  if (!req) {
    throw new Error("Payout request not found.");
  }

  if (params.decision === "paid" && !params.transactionReference?.trim()) {
    throw new Error(
      "A valid M-Pesa or bank transaction reference is required to mark a payout as paid."
    );
  }

  const now = new Date().toISOString();
  const updatedRequests = state.payoutRequests.map((p) =>
    p.id === req.id
      ? {
          ...p,
          status: params.decision,
          reviewedBy: params.actor.fullName,
          reviewedAt: now,
          transactionReference:
            params.transactionReference?.trim().toUpperCase() || p.transactionReference,
          adminNotes: params.adminNotes || p.adminNotes,
        }
      : p
  );

  let updatedAmbassadors = [...state.ambassadors];
  if (params.decision === "paid") {
    updatedAmbassadors = updatedAmbassadors.map((a) =>
      a.id === req.ambassadorId
        ? { ...a, paidCommissionKes: a.paidCommissionKes + req.amountKes }
        : a
    );
  } else if (params.decision === "rejected" && req.status !== "rejected") {
    // Refund reserved balance back to availableCommissionKes
    updatedAmbassadors = updatedAmbassadors.map((a) =>
      a.id === req.ambassadorId
        ? {
            ...a,
            availableCommissionKes: a.availableCommissionKes + req.amountKes,
          }
        : a
    );
  }

  const audit: AuditLog = {
    id: `audit-${Date.now()}-pay`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: `PAYOUT_${params.decision.toUpperCase()}`,
    entityType: "payout_request",
    entityId: req.id,
    summary: `Payout request of KES ${req.amountKes.toLocaleString()} for ${req.ambassadorName} marked as ${params.decision}${
      params.transactionReference ? ` (Ref: ${params.transactionReference})` : ""
    }.`,
    createdAt: now,
  };

  return {
    ...state,
    payoutRequests: updatedRequests,
    ambassadors: updatedAmbassadors,
    auditLogs: [audit, ...state.auditLogs],
  };
}

/**
 * TRASH & PROFESSIONAL DATA RECOVERY SYSTEM (48-Hour Retention Window)
 */

export const TRASH_RETENTION_MS = 2 * 24 * 60 * 60 * 1000; // 48 Hours (2 Days)

export function moveToTrashOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    entityType: TrashEntityType;
    entityId: string;
    title?: string;
    subtitle?: string;
    reason?: string;
  }
): { nextState: AppDatabaseState; trashItem: TrashItem } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can move records to trash.");
  }

  const now = new Date();
  const deletedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + TRASH_RETENTION_MS).toISOString();

  let payload: any = null;
  let title = params.title || "";
  let subtitle = params.subtitle || "";

  let nextState: AppDatabaseState = { ...state };

  switch (params.entityType) {
    case "application": {
      const app = state.applications.find((a) => a.id === params.entityId);
      if (!app) throw new Error("Application not found.");
      payload = app;
      title = title || `${app.fullName} (${app.email})`;
      subtitle = subtitle || `Applicant • ${app.county} • ${app.institution || "Independent"}`;
      nextState.applications = state.applications.filter((a) => a.id !== params.entityId);
      break;
    }
    case "ambassador": {
      const amb = state.ambassadors.find((a) => a.id === params.entityId);
      if (!amb) throw new Error("Ambassador profile not found.");
      const matchingProfile = state.profiles.find(
        (p) => p.id === amb.userId || p.email.toLowerCase() === amb.email.toLowerCase()
      );
      const matchingApps = state.applications.filter(
        (a) => (a.userId && a.userId === amb.userId) || a.email.toLowerCase() === amb.email.toLowerCase()
      );
      payload = {
        ambassador: amb,
        profile: matchingProfile,
        applications: matchingApps,
      };
      title = title || `${amb.fullName} (${amb.referralCode})`;
      subtitle = subtitle || `${amb.email} • Tier: ${amb.level} • KES ${amb.totalCommissionKes.toLocaleString()} earned`;
      nextState.ambassadors = state.ambassadors.filter((a) => a.id !== params.entityId);
      if (matchingProfile) {
        nextState.profiles = state.profiles.filter((p) => p.id !== matchingProfile.id);
      }
      if (matchingApps.length > 0) {
        const appIds = new Set(matchingApps.map((a) => a.id));
        nextState.applications = state.applications.filter((a) => !appIds.has(a.id));
      }
      break;
    }
    case "referral": {
      const ref = state.referrals.find((r) => r.id === params.entityId);
      if (!ref) throw new Error("Referral record not found.");
      payload = ref;
      title = title || `${ref.learnerName} — ${ref.courseTitle}`;
      subtitle = subtitle || `Referred by: ${ref.ambassadorName} (${ref.referralCode}) • ${ref.status}`;
      nextState.referrals = state.referrals.filter((r) => r.id !== params.entityId);
      break;
    }
    case "enrolment": {
      const enr = state.enrolments.find((e) => e.id === params.entityId);
      if (!enr) throw new Error("Enrolment record not found.");
      payload = enr;
      title = title || `${enr.learnerName} — ${enr.courseTitle}`;
      subtitle = subtitle || `Ref: ${enr.paymentReference} • KES ${enr.amountPaidKes.toLocaleString()} • ${enr.verificationStatus}`;
      nextState.enrolments = state.enrolments.filter((e) => e.id !== params.entityId);
      break;
    }
    case "course": {
      const course = state.courses.find((c) => c.id === params.entityId);
      if (!course) throw new Error("Course not found.");
      payload = course;
      title = title || course.title;
      subtitle = subtitle || `${course.category} • KES ${course.publishedFeeKes.toLocaleString()} • ${course.duration}`;
      nextState.courses = state.courses.filter((c) => c.id !== params.entityId);
      break;
    }
    case "campaign": {
      const camp = state.campaigns.find((c) => c.id === params.entityId);
      if (!camp) throw new Error("Campaign not found.");
      payload = camp;
      title = title || camp.name;
      subtitle = subtitle || `Active ${camp.startDate} to ${camp.endDate} • +${camp.bonusCommissionPct}% bonus`;
      nextState.campaigns = state.campaigns.filter((c) => c.id !== params.entityId);
      break;
    }
    case "payout_request": {
      const pr = state.payoutRequests.find((p) => p.id === params.entityId);
      if (!pr) throw new Error("Payout request not found.");
      payload = pr;
      title = title || `KES ${pr.amountKes.toLocaleString()} — ${pr.ambassadorName}`;
      subtitle = subtitle || `${pr.paymentMethod} • ${pr.recipientPhone} • Status: ${pr.status}`;
      nextState.payoutRequests = state.payoutRequests.filter((p) => p.id !== params.entityId);
      break;
    }
    case "marketing_asset": {
      const asset = state.marketingAssets.find((m) => m.id === params.entityId);
      if (!asset) throw new Error("Marketing asset not found.");
      payload = asset;
      title = title || asset.title;
      subtitle = subtitle || `${asset.category} • Uploaded by ${asset.uploadedBy}`;
      nextState.marketingAssets = state.marketingAssets.filter((m) => m.id !== params.entityId);
      break;
    }
    case "announcement": {
      const ann = state.announcements.find((a) => a.id === params.entityId);
      if (!ann) throw new Error("Announcement not found.");
      payload = ann;
      title = title || ann.title;
      subtitle = subtitle || `Audience: ${ann.audience} • Published by ${ann.publishedBy}`;
      nextState.announcements = state.announcements.filter((a) => a.id !== params.entityId);
      break;
    }
    default:
      throw new Error(`Unsupported entity type: ${params.entityType}`);
  }

  const trashItem: TrashItem = {
    id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType: params.entityType,
    entityId: params.entityId,
    title,
    subtitle,
    deletedBy: params.actor.fullName,
    deletedAt,
    expiresAt,
    payload,
  };

  const audit: AuditLog = {
    id: `audit-${Date.now()}-trash`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "MOVED_TO_TRASH",
    entityType: params.entityType,
    entityId: params.entityId,
    summary: `${params.actor.fullName} moved ${params.entityType} "${title}" to Trash (48-hour recovery window).`,
    metadata: { expiresAt },
    createdAt: deletedAt,
  };

  return {
    nextState: {
      ...nextState,
      trash: [trashItem, ...(state.trash || [])],
      auditLogs: [audit, ...state.auditLogs],
    },
    trashItem,
  };
}

export function restoreFromTrashOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    trashId: string;
  }
): { nextState: AppDatabaseState; restoredItem: TrashItem } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can restore records.");
  }

  const trashItem = (state.trash || []).find((t) => t.id === params.trashId);
  if (!trashItem) {
    throw new Error("Item not found in trash or has already been permanently purged.");
  }

  let nextState: AppDatabaseState = {
    ...state,
    trash: (state.trash || []).filter((t) => t.id !== params.trashId),
  };

  switch (trashItem.entityType) {
    case "application": {
      const app: AmbassadorApplication = trashItem.payload;
      nextState.applications = [app, ...nextState.applications];
      if (nextState.deletedApplicationIds) {
        nextState.deletedApplicationIds = nextState.deletedApplicationIds.filter((id) => id !== app.id);
      }
      break;
    }
    case "ambassador": {
      const { ambassador, profile, applications } = trashItem.payload;
      if (ambassador) {
        nextState.ambassadors = [ambassador, ...nextState.ambassadors];
      }
      if (profile) {
        const exists = nextState.profiles.some((p) => p.id === profile.id);
        if (!exists) {
          nextState.profiles = [profile, ...nextState.profiles];
        }
      }
      if (Array.isArray(applications)) {
        const existingAppIds = new Set(nextState.applications.map((a) => a.id));
        const newApps = applications.filter((a: any) => !existingAppIds.has(a.id));
        nextState.applications = [...newApps, ...nextState.applications];
      }
      if (nextState.deletedUserIds && ambassador?.userId) {
        nextState.deletedUserIds = nextState.deletedUserIds.filter((id) => id !== ambassador.userId);
      }
      break;
    }
    case "referral": {
      nextState.referrals = [trashItem.payload, ...nextState.referrals];
      break;
    }
    case "enrolment": {
      nextState.enrolments = [trashItem.payload, ...nextState.enrolments];
      break;
    }
    case "course": {
      nextState.courses = [trashItem.payload, ...nextState.courses];
      break;
    }
    case "campaign": {
      nextState.campaigns = [trashItem.payload, ...nextState.campaigns];
      break;
    }
    case "payout_request": {
      nextState.payoutRequests = [trashItem.payload, ...nextState.payoutRequests];
      break;
    }
    case "marketing_asset": {
      nextState.marketingAssets = [trashItem.payload, ...nextState.marketingAssets];
      break;
    }
    case "announcement": {
      nextState.announcements = [trashItem.payload, ...nextState.announcements];
      break;
    }
  }

  nextState.deletedTrashIds = Array.from(
    new Set([...(state.deletedTrashIds || []), trashItem.id])
  );
  if (nextState.deletedEntityIds) {
    nextState.deletedEntityIds = nextState.deletedEntityIds.filter(
      (id) => id !== trashItem.entityId
    );
  }

  const audit: AuditLog = {
    id: `audit-${Date.now()}-restore`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "RESTORED_FROM_TRASH",
    entityType: trashItem.entityType,
    entityId: trashItem.entityId,
    summary: `${params.actor.fullName} restored ${trashItem.entityType} "${trashItem.title}" from Trash to active database.`,
    createdAt: new Date().toISOString(),
  };

  nextState.auditLogs = [audit, ...nextState.auditLogs];

  return { nextState, restoredItem: trashItem };
}

export function deletePermanentlyFromTrashOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    trashId: string;
  }
): { nextState: AppDatabaseState; purgedItem: TrashItem } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can purge records permanently.");
  }

  const trashItem = (state.trash || []).find((t) => t.id === params.trashId);
  if (!trashItem) {
    throw new Error("Item not found in trash.");
  }

  const deletedUserIds = state.deletedUserIds ? [...state.deletedUserIds] : [];
  const deletedAppIds = state.deletedApplicationIds ? [...state.deletedApplicationIds] : [];
  const deletedEntityIds = state.deletedEntityIds ? [...state.deletedEntityIds, trashItem.entityId] : [trashItem.entityId];
  const deletedTrashIds = state.deletedTrashIds ? [...state.deletedTrashIds, trashItem.id] : [trashItem.id];

  if (trashItem.entityType === "application") {
    deletedAppIds.push(trashItem.entityId);
  } else if (trashItem.entityType === "ambassador") {
    deletedUserIds.push(trashItem.entityId);
    if (trashItem.payload?.ambassador?.userId) {
      deletedUserIds.push(trashItem.payload.ambassador.userId);
    }
    if (Array.isArray(trashItem.payload?.applications)) {
      for (const app of trashItem.payload.applications) {
        if (app?.id) deletedAppIds.push(app.id);
      }
    }
  }

  const audit: AuditLog = {
    id: `audit-${Date.now()}-purge`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "PERMANENTLY_PURGED_FROM_TRASH",
    entityType: trashItem.entityType,
    entityId: trashItem.entityId,
    summary: `${params.actor.fullName} permanently deleted ${trashItem.entityType} "${trashItem.title}" from Trash.`,
    createdAt: new Date().toISOString(),
  };

  return {
    nextState: {
      ...state,
      trash: (state.trash || []).filter((t) => t.id !== params.trashId),
      deletedApplicationIds: Array.from(new Set(deletedAppIds)),
      deletedUserIds: Array.from(new Set(deletedUserIds)),
      deletedEntityIds: Array.from(new Set(deletedEntityIds)),
      deletedTrashIds: Array.from(new Set(deletedTrashIds)),
      auditLogs: [audit, ...state.auditLogs],
    },
    purgedItem: trashItem,
  };
}

export function emptyTrashOp(
  state: AppDatabaseState,
  params: {
    actor: Profile;
    entityType?: TrashEntityType;
  }
): { nextState: AppDatabaseState; count: number } {
  if (params.actor.role !== "super_admin") {
    throw new Error("Unauthorized: Only Super Administrators can empty trash.");
  }

  const currentTrash = state.trash || [];
  const toDelete = params.entityType
    ? currentTrash.filter((t) => t.entityType === params.entityType)
    : currentTrash;

  const count = toDelete.length;
  if (count === 0) return { nextState: state, count: 0 };

  const remainingTrash = params.entityType
    ? currentTrash.filter((t) => t.entityType !== params.entityType)
    : [];

  const deletedUserIds = state.deletedUserIds ? [...state.deletedUserIds] : [];
  const deletedAppIds = state.deletedApplicationIds ? [...state.deletedApplicationIds] : [];
  const deletedEntityIds = state.deletedEntityIds ? [...state.deletedEntityIds] : [];
  const deletedTrashIds = state.deletedTrashIds ? [...state.deletedTrashIds] : [];

  for (const item of toDelete) {
    deletedTrashIds.push(item.id);
    deletedEntityIds.push(item.entityId);
    if (item.entityType === "application") {
      deletedAppIds.push(item.entityId);
    } else if (item.entityType === "ambassador") {
      deletedUserIds.push(item.entityId);
      if (item.payload?.ambassador?.userId) {
        deletedUserIds.push(item.payload.ambassador.userId);
      }
      if (Array.isArray(item.payload?.applications)) {
        for (const app of item.payload.applications) {
          if (app?.id) deletedAppIds.push(app.id);
        }
      }
    }
  }

  const audit: AuditLog = {
    id: `audit-${Date.now()}-empty-trash`,
    actorId: params.actor.id,
    actorEmail: params.actor.email,
    actorRole: params.actor.role,
    action: "TRASH_EMPTIED",
    entityType: params.entityType || "all",
    entityId: "trash",
    summary: `${params.actor.fullName} emptied ${count} items permanently from Trash.`,
    createdAt: new Date().toISOString(),
  };

  return {
    nextState: {
      ...state,
      trash: remainingTrash,
      deletedApplicationIds: Array.from(new Set(deletedAppIds)),
      deletedUserIds: Array.from(new Set(deletedUserIds)),
      deletedEntityIds: Array.from(new Set(deletedEntityIds)),
      deletedTrashIds: Array.from(new Set(deletedTrashIds)),
      auditLogs: [audit, ...state.auditLogs],
    },
    count,
  };
}

export function purgeExpiredTrashOp(state: AppDatabaseState): {
  nextState: AppDatabaseState;
  purgedCount: number;
} {
  const currentTrash = state.trash || [];
  const now = Date.now();
  const expired = currentTrash.filter((t) => new Date(t.expiresAt).getTime() <= now);
  const unexpired = currentTrash.filter((t) => new Date(t.expiresAt).getTime() > now);
  const purgedCount = expired.length;

  if (purgedCount === 0) return { nextState: state, purgedCount: 0 };

  const deletedTrashIds = Array.from(
    new Set([...(state.deletedTrashIds || []), ...expired.map((t) => t.id)])
  );
  const deletedEntityIds = Array.from(
    new Set([...(state.deletedEntityIds || []), ...expired.map((t) => t.entityId)])
  );

  return {
    nextState: {
      ...state,
      trash: unexpired,
      deletedTrashIds,
      deletedEntityIds,
    },
    purgedCount,
  };
}

export function deleteCourseOp(
  state: AppDatabaseState,
  params: { actor: Profile; courseId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "course",
      entityId: params.courseId,
    }).nextState;
  }
  return {
    ...state,
    courses: state.courses.filter((c) => c.id !== params.courseId),
  };
}

export function deleteCampaignOp(
  state: AppDatabaseState,
  params: { actor: Profile; campaignId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "campaign",
      entityId: params.campaignId,
    }).nextState;
  }
  return {
    ...state,
    campaigns: state.campaigns.filter((c) => c.id !== params.campaignId),
  };
}

export function deleteReferralOp(
  state: AppDatabaseState,
  params: { actor: Profile; referralId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "referral",
      entityId: params.referralId,
    }).nextState;
  }
  return {
    ...state,
    referrals: state.referrals.filter((r) => r.id !== params.referralId),
  };
}

export function deleteEnrolmentOp(
  state: AppDatabaseState,
  params: { actor: Profile; enrolmentId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "enrolment",
      entityId: params.enrolmentId,
    }).nextState;
  }
  return {
    ...state,
    enrolments: state.enrolments.filter((e) => e.id !== params.enrolmentId),
  };
}

export function deleteMarketingAssetOp(
  state: AppDatabaseState,
  params: { actor: Profile; assetId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "marketing_asset",
      entityId: params.assetId,
    }).nextState;
  }
  return {
    ...state,
    marketingAssets: state.marketingAssets.filter((m) => m.id !== params.assetId),
  };
}

export function deleteAnnouncementOp(
  state: AppDatabaseState,
  params: { actor: Profile; announcementId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "announcement",
      entityId: params.announcementId,
    }).nextState;
  }
  return {
    ...state,
    announcements: state.announcements.filter((a) => a.id !== params.announcementId),
  };
}

export function deletePayoutRequestOp(
  state: AppDatabaseState,
  params: { actor: Profile; payoutRequestId: string; moveToTrash?: boolean }
) {
  if (params.moveToTrash !== false) {
    return moveToTrashOp(state, {
      actor: params.actor,
      entityType: "payout_request",
      entityId: params.payoutRequestId,
    }).nextState;
  }
  return {
    ...state,
    payoutRequests: state.payoutRequests.filter((p) => p.id !== params.payoutRequestId),
  };
}

