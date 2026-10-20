"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  AmbassadorApplication,
  AmbassadorProfile,
  Announcement,
  Campaign,
  Course,
  MarketingAsset,
  Profile,
  Referral,
  ReferralStatus,
  RewardRuleConfig,
  SupportRequest,
} from "@/types";
import {
  processPayoutRequestOp,
  recordReferralClickOp,
  requestPayoutOp,
  reviewAmbassadorApplicationOp,
  submitAmbassadorApplicationOp,
  submitLearnerEnquiryOp,
  updateReferralStatusOp,
  verifyEnrolmentAndIssueRewardsOp,
} from "@/lib/store-engine";
import { isSupabaseConfigured } from "@/lib/supabase";
import { enqueueOfflineAction } from "@/components/pwa/pwa-manager";

const STORAGE_KEY = "scds_ambassador_hub_state_v1";
const SESSION_KEY = "scds_ambassador_hub_user_v1";
const REF_COOKIE_KEY = "scds_ref_attribution_v1";

interface AppContextValue {
  db: AppDatabaseState;
  currentUser: Profile | null;
  currentAmbassador: AmbassadorProfile | null;
  currentApplication: AmbassadorApplication | null;
  isSupabaseLive: boolean;
  capturedReferralCode: string | null;
  // Auth & Role switcher (for testing & demo verification)
  signInWithEmail: (email: string) => { ok: boolean; error?: string; user?: Profile };
  signOut: () => void;
  switchDemoPersona: (role: "super_admin" | "ambassador" | "pending_applicant" | "guest") => void;
  resetDemoData: () => void;
  // Referral capture
  captureReferralCode: (code: string) => void;
  // Mutations
  submitApplication: (
    input: Parameters<typeof submitAmbassadorApplicationOp>[1]
  ) => AmbassadorApplication;
  reviewApplication: (
    applicationId: string,
    decision: "approved" | "rejected" | "suspended",
    reviewNotes?: string
  ) => void;
  submitLearnerEnquiry: (
    input: Parameters<typeof submitLearnerEnquiryOp>[1]
  ) => Referral;
  updateReferralStatus: (
    referralId: string,
    newStatus: ReferralStatus,
    note?: string,
    newAmbassadorId?: string
  ) => void;
  verifyEnrolment: (params: {
    referralId: string;
    paymentReference: string;
    amountPaidKes?: number;
    cohort?: string;
    notes?: string;
  }) => void;
  requestPayout: (params: {
    amountKes: number;
    paymentMethod: "MPESA" | "BANK_TRANSFER";
    recipientPhone: string;
  }) => void;
  processPayout: (params: {
    payoutRequestId: string;
    decision: "approved" | "paid" | "rejected";
    transactionReference?: string;
    adminNotes?: string;
  }) => void;
  saveCourse: (course: Omit<Course, "id" | "createdAt"> & { id?: string }) => void;
  saveCampaign: (campaign: Omit<Campaign, "id" | "createdAt"> & { id?: string }) => void;
  saveMarketingAsset: (
    asset: Omit<MarketingAsset, "id" | "createdAt" | "uploadedBy">
  ) => void;
  publishAnnouncement: (input: {
    title: string;
    body: string;
    audience: Announcement["audience"];
    isPinned: boolean;
  }) => void;
  updateRewardRules: (rules: Partial<RewardRuleConfig>) => void;
  updateAmbassadorProfile: (input: {
    phone: string;
    county: string;
    institution: string;
    bio: string;
    payoutPhone: string;
  }) => void;
  submitSupportRequest: (input: {
    subject: string;
    category: SupportRequest["category"];
    message: string;
  }) => void;
  respondSupportRequest: (id: string, response: string, status: SupportRequest["status"]) => void;
  markNotificationsRead: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppDatabaseState>(INITIAL_DATABASE_STATE);
  const [currentUserId, setCurrentUserId] = useState<string | null>("user-amb-1");
  const [capturedReferralCode, setCapturedReferralCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedDb = localStorage.getItem(STORAGE_KEY);
      if (savedDb) {
        setDb(JSON.parse(savedDb));
      }
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession !== null) {
        setCurrentUserId(savedSession || null);
      }
      const savedRef = localStorage.getItem(REF_COOKIE_KEY);
      if (savedRef) {
        const parsed = JSON.parse(savedRef) as { code: string; expiresAt: number };
        if (parsed.expiresAt > Date.now()) {
          setCapturedReferralCode(parsed.code);
        } else {
          localStorage.removeItem(REF_COOKIE_KEY);
        }
      }
    } catch {
      // Fallback to initial seed state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore quota errors
    }
  }, [db, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SESSION_KEY, currentUserId || "");
    } catch {
      // Ignore
    }
  }, [currentUserId, hydrated]);

  const currentUser =
    db.profiles.find((p) => p.id === currentUserId) || null;

  const currentAmbassador = currentUser
    ? db.ambassadors.find(
        (a) =>
          a.userId === currentUser.id ||
          a.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || null
    : null;

  const currentApplication = currentUser
    ? db.applications.find(
        (a) =>
          a.userId === currentUser.id ||
          a.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || null
    : null;

  const signInWithEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    const profile = db.profiles.find((p) => p.email.toLowerCase() === clean);
    if (!profile) {
      return {
        ok: false,
        error:
          "No account found with that email. Try one of the seeded accounts or submit an Ambassador Application first.",
      };
    }
    setCurrentUserId(profile.id);
    return { ok: true, user: profile };
  };

  const signOut = () => {
    setCurrentUserId(null);
  };

  const switchDemoPersona = (
    role: "super_admin" | "ambassador" | "pending_applicant" | "guest"
  ) => {
    if (role === "super_admin") {
      setCurrentUserId("user-admin-1");
    } else if (role === "ambassador") {
      setCurrentUserId("user-amb-1");
    } else if (role === "pending_applicant") {
      setCurrentUserId("user-pending-1");
    } else {
      setCurrentUserId(null);
    }
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDb(INITIAL_DATABASE_STATE);
    setCurrentUserId("user-amb-1");
  };

  const captureReferralCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setCapturedReferralCode(clean);
    const windowDays = db.rewardRules.attributionWindowDays || 30;
    const expiresAt = Date.now() + windowDays * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(
        REF_COOKIE_KEY,
        JSON.stringify({ code: clean, expiresAt })
      );
      document.cookie = `scds_ref=${encodeURIComponent(clean)}; path=/; max-age=${
        windowDays * 86400
      }; SameSite=Lax`;
    } catch {
      // Ignore cookie/storage errors
    }
    setDb((prev) => recordReferralClickOp(prev, clean));
  };

  const submitApplication = (
    input: Parameters<typeof submitAmbassadorApplicationOp>[1]
  ) => {
    const { nextState, application, profile } = submitAmbassadorApplicationOp(
      db,
      input
    );
    setDb(nextState);
    setCurrentUserId(profile.id);
    return application;
  };

  const reviewApplication = (
    applicationId: string,
    decision: "approved" | "rejected" | "suspended",
    reviewNotes?: string
  ) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = reviewAmbassadorApplicationOp(db, {
      actor: currentUser,
      applicationId,
      decision,
      reviewNotes,
    });
    setDb(nextState);
  };

  const submitLearnerEnquiry = (
    input: Parameters<typeof submitLearnerEnquiryOp>[1]
  ) => {
    const { nextState, referral } = submitLearnerEnquiryOp(db, {
      ...input,
      referralCode: input.referralCode || capturedReferralCode || "",
    });
    setDb(nextState);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction({
        type: "LEARNER_ENQUIRY",
        label: `Learner Enquiry: ${referral.learnerName} (${referral.courseTitle})`,
      });
    }
    return referral;
  };

  const updateReferralStatus = (
    referralId: string,
    newStatus: ReferralStatus,
    note?: string,
    newAmbassadorId?: string
  ) => {
    if (!currentUser) throw new Error("Not signed in.");
    const nextState = updateReferralStatusOp(db, {
      actor: currentUser,
      referralId,
      newStatus,
      note,
      newAmbassadorId,
    });
    setDb(nextState);
  };

  const verifyEnrolment = (params: {
    referralId: string;
    paymentReference: string;
    amountPaidKes?: number;
    cohort?: string;
    notes?: string;
  }) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = verifyEnrolmentAndIssueRewardsOp(db, {
      actor: currentUser,
      ...params,
    });
    setDb(nextState);
  };

  const requestPayout = (params: {
    amountKes: number;
    paymentMethod: "MPESA" | "BANK_TRANSFER";
    recipientPhone: string;
  }) => {
    if (!currentAmbassador) throw new Error("Ambassador profile required.");
    const { nextState } = requestPayoutOp(db, {
      ambassadorId: currentAmbassador.id,
      ...params,
    });
    setDb(nextState);
  };

  const processPayout = (params: {
    payoutRequestId: string;
    decision: "approved" | "paid" | "rejected";
    transactionReference?: string;
    adminNotes?: string;
  }) => {
    if (!currentUser) throw new Error("Not signed in.");
    const nextState = processPayoutRequestOp(db, {
      actor: currentUser,
      ...params,
    });
    setDb(nextState);
  };

  const saveCourse = (
    courseInput: Omit<Course, "id" | "createdAt"> & { id?: string }
  ) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    if (courseInput.id) {
      setDb((prev) => ({
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === courseInput.id ? { ...c, ...courseInput } : c
        ),
      }));
    } else {
      const newCourse: Course = {
        ...courseInput,
        id: `course-${Date.now()}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        courses: [newCourse, ...prev.courses],
      }));
    }
  };

  const saveCampaign = (
    campaignInput: Omit<Campaign, "id" | "createdAt"> & { id?: string }
  ) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    if (campaignInput.id) {
      setDb((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) =>
          c.id === campaignInput.id ? { ...c, ...campaignInput } : c
        ),
      }));
    } else {
      const newCamp: Campaign = {
        ...campaignInput,
        id: `camp-${Date.now()}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        campaigns: [newCamp, ...prev.campaigns],
      }));
    }
  };

  const saveMarketingAsset = (
    assetInput: Omit<MarketingAsset, "id" | "createdAt" | "uploadedBy">
  ) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Only Super Administrators may publish official resources.");
    }
    const now = new Date().toISOString();
    const newAsset: MarketingAsset = {
      ...assetInput,
      id: `asset-${Date.now()}`,
      uploadedBy: currentUser.fullName,
      createdAt: now,
    };
    setDb((prev) => ({
      ...prev,
      marketingAssets: [newAsset, ...prev.marketingAssets],
    }));
  };

  const publishAnnouncement = (input: {
    title: string;
    body: string;
    audience: Announcement["audience"];
    isPinned: boolean;
  }) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      title: input.title,
      body: input.body,
      audience: input.audience,
      isPinned: input.isPinned,
      publishedBy: currentUser.fullName,
      publishedAt: now,
    };
    setDb((prev) => ({
      ...prev,
      announcements: [ann, ...prev.announcements],
    }));
  };

  const updateRewardRules = (rules: Partial<RewardRuleConfig>) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      rewardRules: {
        ...prev.rewardRules,
        ...rules,
        updatedAt: now,
      },
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorId: currentUser.id,
          actorEmail: currentUser.email,
          actorRole: currentUser.role,
          action: "UPDATE_REWARD_RULES",
          entityType: "reward_rules",
          entityId: prev.rewardRules.id,
          summary: `Updated SCDS reward & commission rules configuration.`,
          createdAt: now,
        },
        ...prev.auditLogs,
      ],
    }));
  };

  const updateAmbassadorProfile = (input: {
    phone: string;
    county: string;
    institution: string;
    bio: string;
    payoutPhone: string;
  }) => {
    if (!currentAmbassador) return;
    setDb((prev) => ({
      ...prev,
      ambassadors: prev.ambassadors.map((a) =>
        a.id === currentAmbassador.id
          ? {
              ...a,
              phone: input.phone,
              county: input.county,
              institution: input.institution,
              bio: input.bio,
              payoutPhone: input.payoutPhone,
            }
          : a
      ),
    }));
  };

  const submitSupportRequest = (input: {
    subject: string;
    category: SupportRequest["category"];
    message: string;
  }) => {
    if (!currentUser) throw new Error("Not signed in");
    const now = new Date().toISOString();
    const req: SupportRequest = {
      id: `sup-${Date.now()}`,
      userId: currentUser.id,
      ambassadorName: currentUser.fullName,
      ambassadorEmail: currentUser.email,
      subject: input.subject,
      category: input.category,
      message: input.message,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    setDb((prev) => ({
      ...prev,
      supportRequests: [req, ...prev.supportRequests],
    }));
  };

  const respondSupportRequest = (
    id: string,
    response: string,
    status: SupportRequest["status"]
  ) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      supportRequests: prev.supportRequests.map((s) =>
        s.id === id
          ? {
              ...s,
              adminResponse: response,
              status,
              respondedBy: currentUser.fullName,
              updatedAt: now,
            }
          : s
      ),
    }));
  };

  const markNotificationsRead = () => {
    if (!currentUser) return;
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === currentUser.id ? { ...n, isRead: true } : n
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        currentAmbassador,
        currentApplication,
        isSupabaseLive: isSupabaseConfigured(),
        capturedReferralCode,
        signInWithEmail,
        signOut,
        switchDemoPersona,
        resetDemoData,
        captureReferralCode,
        submitApplication,
        reviewApplication,
        submitLearnerEnquiry,
        updateReferralStatus,
        verifyEnrolment,
        requestPayout,
        processPayout,
        saveCourse,
        saveCampaign,
        saveMarketingAsset,
        publishAnnouncement,
        updateRewardRules,
        updateAmbassadorProfile,
        submitSupportRequest,
        respondSupportRequest,
        markNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside <AppProvider />");
  }
  return ctx;
}

