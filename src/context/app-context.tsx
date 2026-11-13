"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";
import { generateReferralCode } from "@/lib/utils";
import {
  AmbassadorApplication,
  AmbassadorProfile,
  AmbassadorSocialLinks,
  Announcement,
  Campaign,
  Course,
  MarketingAsset,
  Profile,
  Referral,
  ReferralStatus,
  RewardRuleConfig,
  SupportRequest,
  TrashEntityType,
  TrashItem,
} from "@/types";
import {
  blockAmbassadorAccountOp,
  deleteAmbassadorAccountOp,
  deleteAmbassadorApplicationOp,
  deleteAnnouncementOp,
  deleteCampaignOp,
  deleteCourseOp,
  deleteEnrolmentOp,
  deleteMarketingAssetOp,
  deletePayoutRequestOp,
  deletePermanentlyFromTrashOp,
  deleteReferralOp,
  emptyTrashOp,
  moveToTrashOp,
  processPayoutRequestOp,
  purgeExpiredTrashOp,
  recordReferralClickOp,
  requestPayoutOp,
  restoreFromTrashOp,
  reviewAmbassadorApplicationOp,
  submitAmbassadorApplicationOp,
  submitLearnerEnquiryOp,
  unblockAmbassadorAccountOp,
  updateReferralStatusOp,
  verifyEnrolmentAndIssueRewardsOp,
} from "@/lib/store-engine";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  isRealtimeConnected: boolean;
  refreshLiveState: () => Promise<void>;
  capturedReferralCode: string | null;
  // Auth & Role switcher (for testing & demo verification)
  signInWithEmail: (
    email: string,
    password?: string
  ) => { ok: boolean; error?: string; user?: Profile };
  signOut: () => void;
  switchDemoPersona: (role: "super_admin" | "ambassador" | "pending_applicant" | "guest") => void;
  resetDemoData: () => void;
  // Referral capture
  captureReferralCode: (code: string) => void;
  // Mutations
  submitApplication: (
    input: Parameters<typeof submitAmbassadorApplicationOp>[1]
  ) => Promise<AmbassadorApplication>;
  reviewApplication: (
    applicationId: string,
    decision: "approved" | "rejected" | "suspended",
    reviewNotes?: string
  ) => void;
  deleteApplication: (applicationId: string) => Promise<void>;
  deleteAmbassadorAccount: (ambassadorId: string) => Promise<void>;
  blockAmbassadorAccount: (ambassadorId: string, reason?: string) => Promise<void>;
  unblockAmbassadorAccount: (ambassadorId: string) => Promise<void>;
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
    socialLinks?: AmbassadorSocialLinks;
    promotionStrategy?: string;
    targetAudience?: string;
  }) => void;
  submitSupportRequest: (input: {
    subject: string;
    category: SupportRequest["category"];
    message: string;
  }) => void;
  respondSupportRequest: (id: string, response: string, status: SupportRequest["status"]) => void;
  markNotificationsRead: () => void;
  broadcastDbChange: (next: AppDatabaseState) => Promise<void>;
  // Trash & Professional Data Management Platform (48-Hour Recovery Window)
  moveToTrash: (
    entityType: TrashEntityType,
    entityId: string,
    title?: string,
    subtitle?: string
  ) => Promise<void>;
  restoreFromTrash: (trashId: string) => Promise<void>;
  deletePermanentlyFromTrash: (trashId: string) => Promise<void>;
  emptyTrash: (entityType?: TrashEntityType) => Promise<void>;
  purgeExpiredTrash: () => Promise<void>;
  deleteCourse: (courseId: string, moveToTrash?: boolean) => Promise<void>;
  deleteCampaign: (campaignId: string, moveToTrash?: boolean) => Promise<void>;
  deleteReferral: (referralId: string, moveToTrash?: boolean) => Promise<void>;
  deleteEnrolment: (enrolmentId: string, moveToTrash?: boolean) => Promise<void>;
  deleteMarketingAsset: (assetId: string, moveToTrash?: boolean) => Promise<void>;
  deleteAnnouncement: (announcementId: string, moveToTrash?: boolean) => Promise<void>;
  deletePayoutRequest: (payoutRequestId: string, moveToTrash?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppDatabaseState>(INITIAL_DATABASE_STATE);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [capturedReferralCode, setCapturedReferralCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  // Ref to active Supabase Realtime Channel
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Intelligent state merger: applies fresh database state while protecting approved status and deletions
  const applyServerState = (serverDb: AppDatabaseState) => {
    if (!serverDb || !Array.isArray(serverDb.applications)) return;

    setDb((prev) => {
      const deletedAppSet = new Set([
        ...(prev.deletedApplicationIds || []),
        ...(serverDb.deletedApplicationIds || []),
      ]);
      const deletedUserSet = new Set([
        ...(prev.deletedUserIds || []),
        ...(serverDb.deletedUserIds || []),
      ]);
      const deletedEntitySet = new Set([
        ...(prev.deletedEntityIds || []),
        ...(serverDb.deletedEntityIds || []),
      ]);
      const deletedTrashSet = new Set([
        ...(prev.deletedTrashIds || []),
        ...(serverDb.deletedTrashIds || []),
      ]);

      const trashMap = new Map<string, TrashItem>();
      for (const t of serverDb.trash || []) {
        if (!deletedTrashSet.has(t.id) && !deletedEntitySet.has(t.entityId)) {
          trashMap.set(t.id, t);
        }
      }
      for (const localTrash of prev.trash || []) {
        if (
          !deletedTrashSet.has(localTrash.id) &&
          !deletedEntitySet.has(localTrash.entityId) &&
          !trashMap.has(localTrash.id)
        ) {
          trashMap.set(localTrash.id, localTrash);
        }
      }
      const trashedEntitySet = new Set(Array.from(trashMap.values()).map((t) => t.entityId));
      const isLiveEntity = (id: string) =>
        !deletedEntitySet.has(id) && !trashedEntitySet.has(id);

      const appMap = new Map<string, AmbassadorApplication>();

      // 1. Process server applications, protecting local reviews and filtering deletions
      for (const sApp of serverDb.applications) {
        if (deletedAppSet.has(sApp.id)) continue;
        const localApp = prev.applications.find((a) => a.id === sApp.id);
        if (localApp) {
          // If locally approved, KEEP APPROVED! Never downgrade approved status to pending
          if (localApp.status === "approved" && sApp.status === "pending") {
            appMap.set(sApp.id, { ...sApp, ...localApp, status: "approved" });
            continue;
          }
          // If locally reviewed more recently, preserve local review
          if (
            localApp.reviewedAt &&
            (!sApp.reviewedAt || new Date(localApp.reviewedAt) > new Date(sApp.reviewedAt))
          ) {
            appMap.set(sApp.id, { ...sApp, ...localApp });
            continue;
          }
        }
        appMap.set(sApp.id, sApp);
      }

      // 2. Add any local applications that are not yet on the server (and not deleted)
      for (const localApp of prev.applications) {
        if (deletedAppSet.has(localApp.id)) continue;
        if (!appMap.has(localApp.id)) {
          appMap.set(localApp.id, localApp);
        }
      }

      const profileMap = new Map(
        serverDb.profiles
          .filter((p) => !deletedUserSet.has(p.id))
          .map((p) => [p.id, p])
      );
      for (const localProf of prev.profiles) {
        if (deletedUserSet.has(localProf.id)) continue;
        if (!profileMap.has(localProf.id)) {
          profileMap.set(localProf.id, localProf);
        }
      }

      const ambMap = new Map(
        serverDb.ambassadors
          .filter((a) => !deletedUserSet.has(a.userId) && !deletedUserSet.has(a.id))
          .map((a) => [a.id, a])
      );
      for (const localAmb of prev.ambassadors) {
        if (deletedUserSet.has(localAmb.userId) || deletedUserSet.has(localAmb.id)) continue;
        if (!ambMap.has(localAmb.id)) {
          ambMap.set(localAmb.id, localAmb);
        }
      }

      const refMap = new Map(
        (serverDb.referrals || []).filter((r) => isLiveEntity(r.id)).map((r) => [r.id, r])
      );
      for (const localRef of prev.referrals) {
        if (isLiveEntity(localRef.id) && !refMap.has(localRef.id)) {
          refMap.set(localRef.id, localRef);
        }
      }

      const payoutMap = new Map(
        (serverDb.payoutRequests || []).filter((p) => isLiveEntity(p.id)).map((p) => [p.id, p])
      );
      for (const localPayout of prev.payoutRequests || []) {
        if (isLiveEntity(localPayout.id) && !payoutMap.has(localPayout.id)) {
          payoutMap.set(localPayout.id, localPayout);
        }
      }

      const mergedState: AppDatabaseState = {
        ...serverDb,
        applications: Array.from(appMap.values()).filter((a) => isLiveEntity(a.id)),
        profiles: Array.from(profileMap.values()),
        ambassadors: Array.from(ambMap.values()).filter((a) => isLiveEntity(a.id)),
        referrals: Array.from(refMap.values()),
        payoutRequests: Array.from(payoutMap.values()),
        courses: (serverDb.courses || prev.courses || []).filter((c) => isLiveEntity(c.id)),
        campaigns: (serverDb.campaigns || prev.campaigns || []).filter((c) => isLiveEntity(c.id)),
        marketingAssets: (serverDb.marketingAssets || prev.marketingAssets || []).filter((m) => isLiveEntity(m.id)),
        announcements: (serverDb.announcements || prev.announcements || []).filter((a) => isLiveEntity(a.id)),
        trash: Array.from(trashMap.values()),
        deletedApplicationIds: Array.from(deletedAppSet),
        deletedUserIds: Array.from(deletedUserSet),
        deletedEntityIds: Array.from(deletedEntitySet),
        deletedTrashIds: Array.from(deletedTrashSet),
      };

      const consistent = ensureStateConsistency(mergedState);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consistent));
      } catch {
        // Ignore quota errors
      }
      return consistent;
    });
  };

  // Sync state on demand from /api/sync
  const syncWithServer = async () => {
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (res.ok) {
        const serverDb = (await res.json()) as AppDatabaseState;
        if (serverDb && Array.isArray(serverDb.applications)) {
          applyServerState(serverDb);
        }
      }
    } catch {
      // Fallback to local storage if offline
    }
  };

  useEffect(() => {
    try {
      const savedDb = localStorage.getItem(STORAGE_KEY);
      if (savedDb) {
        setDb(ensureStateConsistency(JSON.parse(savedDb)));
      } else {
        setDb(ensureStateConsistency(INITIAL_DATABASE_STATE));
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

    // 1. Initial server fetch
    syncWithServer();

    // 2. Setup Supabase Realtime WebSockets for instantaneous, zero-polling live updates
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const channel = supabase.channel("scds-live-updates", {
          config: {
            broadcast: { ack: true, self: false },
          },
        });

        channel
          // Postgres Changes: Listens to Supabase database row changes on public.app_state
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "app_state",
            },
            (payload) => {
              const newRecord = payload.new as { state?: AppDatabaseState } | undefined;
              if (newRecord?.state && Array.isArray(newRecord.state.applications)) {
                applyServerState(newRecord.state);
              } else {
                syncWithServer();
              }
            }
          )
          // Broadcast: Listens to instant peer broadcasts when ambassador applies or requests payout
          .on(
            "broadcast",
            { event: "app_state_mutation" },
            (payload) => {
              if (payload?.payload?.state && Array.isArray(payload.payload.state.applications)) {
                applyServerState(payload.payload.state);
              } else {
                syncWithServer();
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsRealtimeConnected(true);
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
              setIsRealtimeConnected(false);
            }
          });

        realtimeChannelRef.current = channel;
      } catch (err) {
        console.warn("Could not initialize Supabase Realtime channel:", err);
      }
    }

    // 3. Event-driven freshness triggers: sync when window gains focus or network reconnects
    const handleFocus = () => {
      syncWithServer();
    };
    const handleOnline = () => {
      syncWithServer();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    // 4. Background freshness polling every 4 seconds to guarantee instant visibility
    // for Admin & Ambassador real-time application and directory sync
    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 4000);

    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      clearInterval(syncInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore quota errors
    }
  }, [db, hydrated]);

  // Push mutations to peers via Realtime WebSocket broadcast & persist to server
  const broadcastDbChange = async (next: AppDatabaseState) => {
    setDb(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Retry with trimmed logs/notifications if browser storage quota (~5MB) is reached
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...next,
            auditLogs: (next.auditLogs || []).slice(0, 50),
            notifications: (next.notifications || []).slice(0, 50),
          })
        );
      } catch {
        // Ignore if storage is completely unavailable
      }
    }

    // 1. Instant WebSocket broadcast to any active admin / ambassador windows
    if (realtimeChannelRef.current) {
      try {
        realtimeChannelRef.current.send({
          type: "broadcast",
          event: "app_state_mutation",
          payload: { state: next, timestamp: Date.now() },
        });
      } catch (err) {
        // Channel reconnecting
      }
    }

    // 2. Persist to server / Supabase cloud database and merge any concurrent submissions
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
        keepalive: true,
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          state?: AppDatabaseState;
        } | null;
        if (json?.state && Array.isArray(json.state.applications)) {
          applyServerState(json.state);
        }
      }
    } catch (err) {
      console.warn("Could not sync with server immediately:", err);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SESSION_KEY, currentUserId || "");
    } catch {
      // Ignore
    }
  }, [currentUserId, hydrated]);

  // If current logged-in user was deleted, immediately clear session
  useEffect(() => {
    if (currentUserId && hydrated) {
      const deletedUserSet = new Set(db.deletedUserIds || []);
      const userExists = db.profiles.some((p) => p.id === currentUserId);
      if (deletedUserSet.has(currentUserId) || (!userExists && currentUserId !== "user-admin-1")) {
        signOut();
      }
    }
  }, [currentUserId, db.deletedUserIds, db.profiles, hydrated]);

  const currentUser =
    db.profiles.find((p) => p.id === currentUserId) || null;

  const currentApplication = currentUser
    ? db.applications.find(
        (a) =>
          (currentUser.id && a.userId === currentUser.id) ||
          a.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || null
    : null;

  const currentAmbassador = useMemo(() => {
    if (!currentUser) return null;

    const cleanEmail = currentUser.email.toLowerCase();
    const existing = db.ambassadors.find(
      (a) =>
        a.userId === currentUser.id ||
        a.email.toLowerCase() === cleanEmail
    );

    const isBlocked =
      currentUser.status === "blocked" ||
      currentUser.status === "suspended";

    const isApprovedCandidate =
      !isBlocked &&
      (currentUser.role?.toLowerCase() === "ambassador" ||
        currentUser.status?.toLowerCase() === "active" ||
        currentUser.status?.toLowerCase() === "approved" ||
        currentApplication?.status?.toLowerCase() === "approved");

    if (existing) {
      if (isBlocked) {
        return { ...existing, isActive: false, isBlocked: true };
      }
      if (isApprovedCandidate && !existing.isActive && !existing.isBlocked) {
        return { ...existing, isActive: true };
      }
      return existing;
    }

    // Auto-synthesize active ambassador profile if approved by admin
    if (isApprovedCandidate) {
      const existingCodes = db.ambassadors.map((a) => a.referralCode);
      const referralCode = generateReferralCode(
        currentUser.fullName || currentApplication?.fullName || "Ambassador",
        existingCodes
      );
      const newAmb: AmbassadorProfile = {
        id: `amb-${currentUser.id}`,
        userId: currentUser.id,
        fullName: currentUser.fullName || currentApplication?.fullName || "Ambassador",
        email: currentUser.email,
        phone: currentUser.phone || currentApplication?.phone || "",
        referralCode,
        level: "Starter",
        totalPoints: 0,
        availablePoints: 0,
        totalCommissionKes: 0,
        availableCommissionKes: 0,
        paidCommissionKes: 0,
        payoutMethod: "MPESA",
        payoutPhone: currentUser.phone || currentApplication?.phone || "",
        county: currentApplication?.county || "Nairobi",
        institution: currentApplication?.institution || "",
        occupation: currentApplication?.occupation || "Ambassador",
        bio: `${currentApplication?.occupation || "Ambassador"} representing SCDS in ${currentApplication?.county || "Kenya"}.`,
        isActive: true,
        clickCount: 0,
        badgeIds: [],
        createdAt: currentApplication?.createdAt || new Date().toISOString(),
      };
      return newAmb;
    }

    return null;
  }, [currentUser, db.ambassadors, currentApplication]);

  // Persist auto-synthesized ambassador to database so it stays permanently active
  useEffect(() => {
    if (!currentAmbassador || !currentUser) return;
    const exists = db.ambassadors.some(
      (a) =>
        a.userId === currentAmbassador.userId ||
        a.email.toLowerCase() === currentAmbassador.email.toLowerCase()
    );
    if (!exists) {
      const nextDb = ensureStateConsistency({
        ...db,
        profiles: db.profiles.map((p) =>
          p.id === currentUser.id
            ? { ...p, role: "ambassador", status: "active" }
            : p
        ),
        ambassadors: [currentAmbassador, ...db.ambassadors],
      });
      broadcastDbChange(nextDb);
    }
  }, [currentAmbassador, currentUser, db]);

  const signInWithEmail = (email: string, password?: string) => {
    const clean = email.trim().toLowerCase();
    let profile = db.profiles.find((p) => p.email.toLowerCase() === clean);

    // If profile not yet created in profiles array, recover from applications
    if (!profile) {
      const matchingApp = db.applications.find((a) => a.email.toLowerCase() === clean);
      if (matchingApp) {
        profile = {
          id: matchingApp.userId,
          email: clean,
          fullName: matchingApp.fullName,
          phone: matchingApp.phone,
          role: matchingApp.status === "approved" ? "ambassador" : "learner",
          status: matchingApp.status === "approved" ? "active" : matchingApp.status === "rejected" ? "rejected" : "pending",
          createdAt: matchingApp.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const nextDb = ensureStateConsistency({
          ...db,
          profiles: [profile, ...db.profiles],
        });
        broadcastDbChange(nextDb);
      } else {
        return {
          ok: false,
          error: "No account found with this email. Please check your spelling or apply to become an ambassador.",
        };
      }
    }

    // Password verification check
    if (profile.password && password && profile.password !== password) {
      return {
        ok: false,
        error: "Incorrect password. Please enter the valid password for your account.",
      };
    }

    // Check account status
    if (profile.status === "suspended") {
      return {
        ok: false,
        error: "This account has been temporarily suspended. Please contact SCDS support.",
      };
    }

    // If their application was approved or profile is marked active/approved, ensure their profile role is active ambassador
    const app = db.applications.find(
      (a) => (a.userId && a.userId === profile!.id) || a.email.toLowerCase() === clean
    );
    const isApprovedCandidate =
      app?.status?.toLowerCase() === "approved" ||
      profile.role?.toLowerCase() === "ambassador" ||
      profile.status?.toLowerCase() === "active" ||
      profile.status?.toLowerCase() === "approved";

    if (isApprovedCandidate && (profile.role !== "ambassador" || profile.status !== "active")) {
      profile = { ...profile, role: "ambassador", status: "active" };
      const nextDb = ensureStateConsistency({
        ...db,
        profiles: db.profiles.map((p) => (p.id === profile!.id ? profile! : p)),
      });
      broadcastDbChange(nextDb);
    }

    setCurrentUserId(profile.id);
    return { ok: true, user: profile };
  };

  const signOut = () => {
    setCurrentUserId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
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

  const submitApplication = async (
    input: Parameters<typeof submitAmbassadorApplicationOp>[1]
  ) => {
    // 1. Always persist on the server via POST /api/applications (never localStorage fallback)
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => null)) as {
      error?: string;
      application?: AmbassadorApplication;
      profile?: Profile;
    } | null;

    if (!res.ok || !json?.application) {
      throw new Error(
        json?.error ||
          "Unable to submit your application to the server. Please check your connection and try again."
      );
    }

    const serverApp = json.application;
    const serverProfile = json.profile;

    // 2. Reflect confirmed server application in local UI state & notify live listeners
    const { nextState, application, profile } = submitAmbassadorApplicationOp(
      db,
      input
    );
    const finalApp = serverApp || application;
    const finalProfile = serverProfile || profile;

    const mergedState: AppDatabaseState = {
      ...nextState,
      applications: [
        finalApp,
        ...nextState.applications.filter(
          (a) => a.id !== finalApp.id && a.email.toLowerCase() !== finalApp.email.toLowerCase()
        ),
      ],
      profiles: [
        finalProfile,
        ...nextState.profiles.filter(
          (p) => p.id !== finalProfile.id && p.email.toLowerCase() !== finalProfile.email.toLowerCase()
        ),
      ],
    };

    await broadcastDbChange(mergedState);
    setCurrentUserId(finalProfile.id);
    return finalApp;
  };

  const reviewApplication = async (
    applicationId: string,
    decision: "approved" | "rejected" | "suspended",
    reviewNotes?: string
  ) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState, ambassador } = reviewAmbassadorApplicationOp(db, {
      actor: currentUser,
      applicationId,
      decision,
      reviewNotes,
    });
    await broadcastDbChange(nextState);

    if (decision === "approved") {
      const approvedApp = nextState.applications.find((a) => a.id === applicationId);
      const targetEmail = ambassador?.email || approvedApp?.email;
      const targetName = ambassador?.fullName || approvedApp?.fullName || "Ambassador";
      const referralCode = ambassador?.referralCode || "SCDS-AMB";
      if (targetEmail && typeof window !== "undefined") {
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "application_approved",
            to: targetEmail,
            fullName: targetName,
            referralCode,
            dashboardUrl: `${window.location.origin}/dashboard`,
          }),
        })
          .then(async (res) => {
            const now = new Date().toISOString();
            if (res.ok) {
              const updatedApps = nextState.applications.map((a) =>
                a.id === applicationId
                  ? { ...a, approvalEmailSentAt: now, approvalEmailLastError: null }
                  : a
              );
              await broadcastDbChange({ ...nextState, applications: updatedApps });
            } else {
              const errJson = (await res.json().catch(() => ({}))) as { error?: string };
              const updatedApps = nextState.applications.map((a) =>
                a.id === applicationId
                  ? {
                      ...a,
                      approvalEmailLastError:
                        errJson.error || `HTTP ${res.status} sending approval email`,
                    }
                  : a
              );
              await broadcastDbChange({ ...nextState, applications: updatedApps });
            }
          })
          .catch(async (err) => {
            console.warn("Approval email dispatch failed:", err);
            const updatedApps = nextState.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    approvalEmailLastError:
                      err instanceof Error ? err.message : "Network error sending email",
                  }
                : a
            );
            await broadcastDbChange({ ...nextState, applications: updatedApps });
          });
      }
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = deleteAmbassadorApplicationOp(db, {
      actor: currentUser,
      applicationId,
    });
    await broadcastDbChange(nextState);
  };

  const deleteAmbassadorAccount = async (ambassadorId: string) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = deleteAmbassadorAccountOp(db, {
      actor: currentUser,
      ambassadorId,
    });
    await broadcastDbChange(nextState);
  };

  const blockAmbassadorAccount = async (ambassadorId: string, reason?: string) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = blockAmbassadorAccountOp(db, {
      actor: currentUser,
      ambassadorId,
      reason,
    });
    await broadcastDbChange(nextState);
  };

  const unblockAmbassadorAccount = async (ambassadorId: string) => {
    if (!currentUser) throw new Error("Not signed in.");
    const { nextState } = unblockAmbassadorAccountOp(db, {
      actor: currentUser,
      ambassadorId,
    });
    await broadcastDbChange(nextState);
  };

  const submitLearnerEnquiry = (
    input: Parameters<typeof submitLearnerEnquiryOp>[1]
  ) => {
    const { nextState, referral } = submitLearnerEnquiryOp(db, {
      ...input,
      referralCode: input.referralCode || capturedReferralCode || "",
    });
    broadcastDbChange(nextState);
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
    broadcastDbChange(nextState);
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
    broadcastDbChange(nextState);
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
    broadcastDbChange(nextState);
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
    broadcastDbChange(nextState);
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

  const updateAmbassadorProfile = async (input: {
    phone: string;
    county: string;
    institution: string;
    bio: string;
    payoutPhone: string;
    socialLinks?: AmbassadorSocialLinks;
    promotionStrategy?: string;
    targetAudience?: string;
  }) => {
    if (!currentAmbassador) return;
    const nextDb = {
      ...db,
      ambassadors: db.ambassadors.map((a) =>
        a.id === currentAmbassador.id
          ? {
              ...a,
              phone: input.phone,
              county: input.county,
              institution: input.institution,
              bio: input.bio,
              payoutPhone: input.payoutPhone,
              socialLinks: input.socialLinks || a.socialLinks,
              promotionStrategy: input.promotionStrategy || a.promotionStrategy,
              targetAudience: input.targetAudience || a.targetAudience,
            }
          : a
      ),
    };
    await broadcastDbChange(nextDb);
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

  // Trash & Professional Data Management Actions (48-Hour Recovery Window)
  const moveToTrash = async (
    entityType: TrashEntityType,
    entityId: string,
    title?: string,
    subtitle?: string
  ) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Administrators can move items to trash.");
    }
    const { nextState } = moveToTrashOp(db, {
      actor: currentUser,
      entityType,
      entityId,
      title,
      subtitle,
    });
    await broadcastDbChange(nextState);
  };

  const restoreFromTrash = async (trashId: string) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Administrators can restore items from trash.");
    }
    const { nextState } = restoreFromTrashOp(db, {
      actor: currentUser,
      trashId,
    });
    await broadcastDbChange(nextState);
  };

  const deletePermanentlyFromTrash = async (trashId: string) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Administrators can permanently delete items from trash.");
    }
    const { nextState } = deletePermanentlyFromTrashOp(db, {
      actor: currentUser,
      trashId,
    });
    await broadcastDbChange(nextState);
  };

  const emptyTrash = async (entityType?: TrashEntityType) => {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Administrators can empty trash.");
    }
    const { nextState } = emptyTrashOp(db, {
      actor: currentUser,
      entityType,
    });
    await broadcastDbChange(nextState);
  };

  const purgeExpiredTrash = async () => {
    const { nextState } = purgeExpiredTrashOp(db);
    await broadcastDbChange(nextState);
  };

  const deleteCourse = async (courseId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteCourseOp(db, { actor: currentUser, courseId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deleteCampaign = async (campaignId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteCampaignOp(db, { actor: currentUser, campaignId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deleteReferral = async (referralId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteReferralOp(db, { actor: currentUser, referralId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deleteEnrolment = async (enrolmentId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteEnrolmentOp(db, { actor: currentUser, enrolmentId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deleteMarketingAsset = async (assetId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteMarketingAssetOp(db, { actor: currentUser, assetId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deleteAnnouncement = async (announcementId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deleteAnnouncementOp(db, { actor: currentUser, announcementId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  const deletePayoutRequest = async (payoutRequestId: string, moveToTrash = true) => {
    if (!currentUser || currentUser.role !== "super_admin") throw new Error("Unauthorized");
    const nextDb = deletePayoutRequestOp(db, { actor: currentUser, payoutRequestId, moveToTrash });
    await broadcastDbChange(nextDb);
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        currentAmbassador,
        currentApplication,
        isSupabaseLive: isSupabaseConfigured(),
        isRealtimeConnected,
        refreshLiveState: syncWithServer,
        capturedReferralCode,
        signInWithEmail,
        signOut,
        switchDemoPersona,
        resetDemoData,
        captureReferralCode,
        submitApplication,
        reviewApplication,
        deleteApplication,
        deleteAmbassadorAccount,
        blockAmbassadorAccount,
        unblockAmbassadorAccount,
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
        broadcastDbChange,
        moveToTrash,
        restoreFromTrash,
        deletePermanentlyFromTrash,
        emptyTrash,
        purgeExpiredTrash,
        deleteCourse,
        deleteCampaign,
        deleteReferral,
        deleteEnrolment,
        deleteMarketingAsset,
        deleteAnnouncement,
        deletePayoutRequest,
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

