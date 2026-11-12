import { describe, it, expect } from "vitest";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import {
  moveToTrashOp,
  restoreFromTrashOp,
  deletePermanentlyFromTrashOp,
  emptyTrashOp,
  purgeExpiredTrashOp,
  submitAmbassadorApplicationOp,
  deleteCourseOp,
  deleteCampaignOp,
  deleteReferralOp,
  deleteEnrolmentOp,
  deleteMarketingAssetOp,
  deleteAnnouncementOp,
  deletePayoutRequestOp,
  TRASH_RETENTION_MS,
} from "@/lib/store-engine";
import { ensureStateConsistency } from "@/lib/consistency";
import { mergeDatabaseStates } from "@/lib/server-store";
import { Profile, TrashItem } from "@/types";

const adminActor: Profile = {
  id: "admin-1",
  email: "admin@scds.co.ke",
  fullName: "System Admin",
  role: "super_admin",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const nonAdminActor: Profile = {
  id: "user-1",
  email: "learner@scds.co.ke",
  fullName: "Student Learner",
  role: "learner",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Trash Platform & 48-Hour Data Retention Management", () => {
  it("1. Moving a course to trash removes it from active list and sets 48-hour expiration", () => {
    const course = INITIAL_DATABASE_STATE.courses[0];
    expect(course).toBeDefined();

    const { nextState, trashItem } = moveToTrashOp(INITIAL_DATABASE_STATE, {
      actor: adminActor,
      entityType: "course",
      entityId: course.id,
    });

    // Removed from active courses
    expect(nextState.courses.some((c) => c.id === course.id)).toBe(false);
    // Added to trash collection
    expect(nextState.trash).toBeDefined();
    expect(nextState.trash?.some((t) => t.id === trashItem.id)).toBe(true);
    expect(trashItem.entityType).toBe("course");
    expect(trashItem.entityId).toBe(course.id);
    expect(trashItem.payload.id).toBe(course.id);

    // Verify 48-hour retention timestamp calculation
    const deletedTime = new Date(trashItem.deletedAt).getTime();
    const expiresTime = new Date(trashItem.expiresAt).getTime();
    const diffHours = (expiresTime - deletedTime) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(48, 1);
  });

  it("2. Moving an ambassador to trash safely removes them from active directory and stages in trash", () => {
    const amb = INITIAL_DATABASE_STATE.ambassadors[0];
    if (!amb) return;

    const { nextState, trashItem } = moveToTrashOp(INITIAL_DATABASE_STATE, {
      actor: adminActor,
      entityType: "ambassador",
      entityId: amb.id,
    });

    expect(nextState.ambassadors.some((a) => a.id === amb.id)).toBe(false);
    expect(nextState.trash?.some((t) => t.entityId === amb.id)).toBe(true);
    expect(trashItem.payload.ambassador.id).toBe(amb.id);
  });

  it("3. Restoring an entity from trash restores it back to its active collection", () => {
    const course = INITIAL_DATABASE_STATE.courses[0];
    const { nextState: trashedState, trashItem } = moveToTrashOp(
      INITIAL_DATABASE_STATE,
      {
        actor: adminActor,
        entityType: "course",
        entityId: course.id,
      }
    );

    expect(trashedState.courses.some((c) => c.id === course.id)).toBe(false);

    // Restore from trash
    const { nextState: restoredState, restoredItem } = restoreFromTrashOp(
      trashedState,
      {
        actor: adminActor,
        trashId: trashItem.id,
      }
    );

    expect(restoredItem.id).toBe(trashItem.id);
    expect(restoredState.courses.some((c) => c.id === course.id)).toBe(true);
    expect(restoredState.trash?.some((t) => t.id === trashItem.id)).toBe(false);
  });

  it("4. Delete permanently removes item immediately without waiting for 48 hours", () => {
    const course = INITIAL_DATABASE_STATE.courses[0];
    const { nextState: trashedState, trashItem } = moveToTrashOp(
      INITIAL_DATABASE_STATE,
      {
        actor: adminActor,
        entityType: "course",
        entityId: course.id,
      }
    );

    const { nextState: purgedState } = deletePermanentlyFromTrashOp(
      trashedState,
      {
        actor: adminActor,
        trashId: trashItem.id,
      }
    );

    expect(purgedState.trash?.some((t) => t.id === trashItem.id)).toBe(false);
    expect(purgedState.courses.some((c) => c.id === course.id)).toBe(false);
  });

  it("5. Empty trash clears all pending items in one click", () => {
    const c1 = INITIAL_DATABASE_STATE.courses[0];
    const c2 = INITIAL_DATABASE_STATE.courses[1];

    let state = moveToTrashOp(INITIAL_DATABASE_STATE, {
      actor: adminActor,
      entityType: "course",
      entityId: c1.id,
    }).nextState;

    state = moveToTrashOp(state, {
      actor: adminActor,
      entityType: "course",
      entityId: c2.id,
    }).nextState;

    expect(state.trash?.length).toBeGreaterThanOrEqual(2);

    const { nextState: emptiedState, count } = emptyTrashOp(state, {
      actor: adminActor,
    });

    expect(count).toBeGreaterThanOrEqual(2);
    expect(emptiedState.trash?.length).toBe(0);
  });

  it("6. Automatic 48-hour purge: items expired past 48h are purged, active items retained", () => {
    const now = Date.now();
    const expiredItem: TrashItem = {
      id: "trash-expired",
      entityType: "course",
      entityId: "course-expired",
      title: "Expired Course",
      deletedBy: "Admin",
      deletedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired 1 day ago
      payload: {},
    };

    const activeItem: TrashItem = {
      id: "trash-active",
      entityType: "campaign",
      entityId: "camp-active",
      title: "Active Trashed Campaign",
      deletedBy: "Admin",
      deletedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 2 days
      payload: {},
    };

    const stateWithTrash = {
      ...INITIAL_DATABASE_STATE,
      trash: [expiredItem, activeItem],
    };

    // Auto purge via purgeExpiredTrashOp
    const { nextState: purgedState, purgedCount } = purgeExpiredTrashOp(stateWithTrash);
    expect(purgedCount).toBe(1);
    expect(purgedState.trash?.some((t) => t.id === "trash-expired")).toBe(false);
    expect(purgedState.trash?.some((t) => t.id === "trash-active")).toBe(true);

    // Also verify ensureStateConsistency automatically purges expired items
    const consistentState = ensureStateConsistency(stateWithTrash);
    expect(consistentState.trash?.some((t) => t.id === "trash-expired")).toBe(false);
    expect(consistentState.trash?.some((t) => t.id === "trash-active")).toBe(true);
  });

  it("7. Unauthorized users cannot move items to trash or modify trash", () => {
    expect(() => {
      moveToTrashOp(INITIAL_DATABASE_STATE, {
        actor: nonAdminActor,
        entityType: "course",
        entityId: "any-course",
      });
    }).toThrow(/Unauthorized/);

    expect(() => {
      restoreFromTrashOp(INITIAL_DATABASE_STATE, {
        actor: nonAdminActor,
        trashId: "any-id",
      });
    }).toThrow(/Unauthorized/);
  });

  it("8. Purges pre-existing records for Kinyuam047@gmail.com and mathewatambo629@gmail.com while allowing new applications", () => {
    const oldTimestamp = "2026-11-10T10:00:00.000Z";
    const legacyState = {
      ...INITIAL_DATABASE_STATE,
      profiles: [
        ...INITIAL_DATABASE_STATE.profiles,
        {
          id: "user-kinyua-old",
          email: "kinyuam047@gmail.com",
          fullName: "Kinyua Old",
          role: "ambassador" as const,
          status: "active" as const,
          createdAt: oldTimestamp,
          updatedAt: oldTimestamp,
        },
        {
          id: "user-mathew-old",
          email: "mathewatambo629@gmail.com",
          fullName: "Mathew Old",
          role: "learner" as const,
          status: "pending" as const,
          createdAt: oldTimestamp,
          updatedAt: oldTimestamp,
        },
      ],
      applications: [
        {
          id: "app-kinyua-old",
          userId: "user-kinyua-old",
          fullName: "Kinyua Old",
          email: "Kinyuam047@gmail.com",
          phone: "0711111111",
          county: "Nairobi",
          institution: "UON",
          occupation: "Student",
          motivation: "Old motivation",
          experience: "Old experience",
          acceptedTerms: true,
          status: "approved" as const,
          createdAt: oldTimestamp,
        },
      ],
    };

    const cleaned = ensureStateConsistency(legacyState);
    expect(cleaned.profiles.some((p) => p.email.toLowerCase() === "kinyuam047@gmail.com")).toBe(false);
    expect(cleaned.profiles.some((p) => p.email.toLowerCase() === "mathewatambo629@gmail.com")).toBe(false);
    expect(cleaned.applications.some((a) => a.email.toLowerCase() === "kinyuam047@gmail.com")).toBe(false);

    // Now both emails can submit brand-new applications!
    const { nextState: afterKinyua, application: newKinyuaApp } = submitAmbassadorApplicationOp(cleaned, {
      fullName: "Kinyua New",
      email: "Kinyuam047@gmail.com",
      phone: "0711111111",
      password: "Password123!",
      county: "Nairobi",
      institution: "UON",
      occupation: "Student",
      motivation: "Fresh new application for SCDS ambassador program",
      experience: "Campus marketing and design",
      acceptedTerms: true,
    });

    const { nextState: afterMathew, application: newMathewApp } = submitAmbassadorApplicationOp(afterKinyua, {
      fullName: "Mathew New",
      email: "mathewatambo629@gmail.com",
      phone: "0722222222",
      password: "Password123!",
      county: "Nairobi",
      institution: "JKUAT",
      occupation: "Student",
      motivation: "Fresh new application for SCDS ambassador program",
      experience: "Campus leadership and design",
      acceptedTerms: true,
    });

    const verified = ensureStateConsistency(afterMathew);
    expect(verified.applications.some((a) => a.id === newKinyuaApp.id)).toBe(true);
    expect(verified.applications.some((a) => a.id === newMathewApp.id)).toBe(true);
  });

  it("9. Deleted payouts stay in Trash and never reappear in active payouts after server merge", () => {
    const payout = {
      id: "pay-test-1",
      ambassadorId: "amb-real-1",
      ambassadorName: "Test Ambassador",
      ambassadorEmail: "test@example.com",
      amountKes: 1500,
      paymentMethod: "MPESA" as const,
      recipientPhone: "0712345678",
      status: "requested" as const,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const serverBeforeDelete = {
      ...INITIAL_DATABASE_STATE,
      payoutRequests: [payout],
    };

    const afterMoveToTrash = deletePayoutRequestOp(serverBeforeDelete, {
      actor: adminActor,
      payoutRequestId: payout.id,
      moveToTrash: true,
    });

    expect(afterMoveToTrash.payoutRequests.some((p) => p.id === payout.id)).toBe(false);
    expect(afterMoveToTrash.trash?.some((t) => t.entityId === payout.id)).toBe(true);

    // Merging with an older state that still has the payout must keep it in Trash and OUT of active payouts!
    const merged = mergeDatabaseStates(serverBeforeDelete, afterMoveToTrash);
    expect(merged.payoutRequests.some((p) => p.id === payout.id)).toBe(false);
    expect(merged.trash?.some((t) => t.entityId === payout.id)).toBe(true);
  });

  it("10. Permanently deleting from Trash removes it completely and prevents reappearance on merge", () => {
    const course = INITIAL_DATABASE_STATE.courses[0];
    const { nextState: trashedState, trashItem } = moveToTrashOp(INITIAL_DATABASE_STATE, {
      actor: adminActor,
      entityType: "course",
      entityId: course.id,
    });

    const { nextState: purgedState } = deletePermanentlyFromTrashOp(trashedState, {
      actor: adminActor,
      trashId: trashItem.id,
    });

    expect(purgedState.trash?.some((t) => t.id === trashItem.id)).toBe(false);
    expect(purgedState.deletedTrashIds).toContain(trashItem.id);
    expect(purgedState.deletedEntityIds).toContain(course.id);

    // Merging with trashedState (or initial seed state) must NOT bring back the trash item or the course!
    const mergedWithTrashed = mergeDatabaseStates(trashedState, purgedState);
    expect(mergedWithTrashed.trash?.some((t) => t.id === trashItem.id)).toBe(false);
    expect(mergedWithTrashed.courses.some((c) => c.id === course.id)).toBe(false);

    const mergedWithSeed = mergeDatabaseStates(INITIAL_DATABASE_STATE, purgedState);
    expect(mergedWithSeed.trash?.some((t) => t.id === trashItem.id)).toBe(false);
    expect(mergedWithSeed.courses.some((c) => c.id === course.id)).toBe(false);
  });
});
