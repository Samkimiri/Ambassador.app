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
} from "@/types";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  computeAmbassadorLevel,
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
    county: string;
    institution: string;
    occupation: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    portfolio?: string;
    motivation: string;
    experience: string;
    acceptedTerms: boolean;
  }
): { nextState: AppDatabaseState; application: AmbassadorApplication; profile: Profile } {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingApp = state.applications.find(
    (a) => a.email.toLowerCase() === normalizedEmail && a.status !== "rejected"
  );
  if (existingApp) {
    throw new Error("An application with this email address already exists.");
  }

  const now = new Date().toISOString();
  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const appId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const profile: Profile = {
    id: userId,
    email: normalizedEmail,
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
    socialLinks: {
      instagram: input.instagram?.trim() || undefined,
      linkedin: input.linkedin?.trim() || undefined,
      tiktok: input.tiktok?.trim() || undefined,
      portfolio: input.portfolio?.trim() || undefined,
    },
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
      createdAmbassador = { ...existingAmb, isActive: true };
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

  // If no code or invalid code, fall back to first active ambassador only if explicitly provided; otherwise throw clear error if invalid code was entered
  if (cleanedCode && !ambassador) {
    throw new Error(
      `Referral code "${cleanedCode}" is not recognized or is no longer active.`
    );
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
            ...r.events,
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
            ...r.events,
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

