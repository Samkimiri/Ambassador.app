import fs from "fs";
import path from "path";
import os from "os";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";
import {
  AmbassadorApplication,
  AmbassadorProfile,
  Enrolment,
  PayoutRequest,
  Profile,
  Referral,
  TrashItem,
} from "@/types";

export { ensureStateConsistency };

// In serverless environments (Vercel, AWS Lambda), process.cwd() is read-only.
// We must use os.tmpdir() to prevent EROFS errors.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production")
);

const DATA_DIR = isServerless ? os.tmpdir() : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "scds-app-db.json");

// In-memory global store to survive warm serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __scds_server_db__: AppDatabaseState | undefined;
}

/**
 * Merges two database states safely without overwriting or losing records created
 * across separate devices or sessions.
 */
export function mergeDatabaseStates(
  currentDb: AppDatabaseState,
  incomingDb: AppDatabaseState
): AppDatabaseState {
  if (!incomingDb || typeof incomingDb !== "object") return currentDb;
  if (!currentDb || typeof currentDb !== "object") return incomingDb;

  const deletedAppSet = new Set([
    ...(currentDb.deletedApplicationIds || []),
    ...(incomingDb.deletedApplicationIds || []),
  ]);
  const deletedUserSet = new Set([
    ...(currentDb.deletedUserIds || []),
    ...(incomingDb.deletedUserIds || []),
  ]);
  const deletedEntitySet = new Set([
    ...(currentDb.deletedEntityIds || []),
    ...(incomingDb.deletedEntityIds || []),
  ]);
  const deletedTrashSet = new Set([
    ...(currentDb.deletedTrashIds || []),
    ...(incomingDb.deletedTrashIds || []),
  ]);

  // 0. Trash: union excluding permanently purged/restored trash items
  const trashMap = new Map<string, TrashItem>();
  for (const t of currentDb.trash || []) {
    if (!deletedTrashSet.has(t.id) && !deletedEntitySet.has(t.entityId)) {
      trashMap.set(t.id, t);
    }
  }
  for (const t of incomingDb.trash || []) {
    if (!deletedTrashSet.has(t.id) && !deletedEntitySet.has(t.entityId) && !trashMap.has(t.id)) {
      trashMap.set(t.id, t);
    }
  }
  const trashedEntitySet = new Set(Array.from(trashMap.values()).map((t) => t.entityId));

  // 1. Applications: union of all non-deleted applications
  const appMap = new Map<string, AmbassadorApplication>();
  for (const app of currentDb.applications || []) {
    if (!deletedAppSet.has(app.id)) {
      appMap.set(app.id, app);
    }
  }
  for (const app of incomingDb.applications || []) {
    if (deletedAppSet.has(app.id)) continue;
    if (!appMap.has(app.id)) {
      appMap.set(app.id, app);
    } else {
      const existing = appMap.get(app.id)!;
      // If either has approved status, KEEP APPROVED!
      if (existing.status === "approved" || app.status === "approved") {
        appMap.set(app.id, {
          ...existing,
          ...app,
          status: "approved",
          reviewedAt: existing.reviewedAt || app.reviewedAt || new Date().toISOString(),
        });
      } else if (
        app.reviewedAt &&
        (!existing.reviewedAt || new Date(app.reviewedAt) > new Date(existing.reviewedAt))
      ) {
        appMap.set(app.id, { ...existing, ...app });
      } else {
        appMap.set(app.id, { ...existing, ...app });
      }
    }
  }

  // 2. Profiles: union by email and id
  const profileMap = new Map<string, Profile>();
  for (const p of currentDb.profiles || []) {
    if (!deletedUserSet.has(p.id)) {
      profileMap.set(p.email.toLowerCase().trim(), p);
    }
  }
  for (const p of incomingDb.profiles || []) {
    const key = p.email.toLowerCase().trim();
    if (deletedUserSet.has(p.id) || deletedUserSet.has(key)) continue;
    if (!profileMap.has(key)) {
      profileMap.set(key, p);
    } else {
      const existing = profileMap.get(key)!;
      if (existing.role === "super_admin" || p.role === "super_admin") {
        profileMap.set(key, { ...existing, ...p, role: "super_admin", status: "active" });
      } else if (existing.role === "ambassador" || p.role === "ambassador") {
        profileMap.set(key, { ...existing, ...p, role: "ambassador", status: "active" });
      } else {
        profileMap.set(key, { ...existing, ...p });
      }
    }
  }

  // 3. Ambassadors: union by email and referralCode
  const ambMap = new Map<string, AmbassadorProfile>();
  for (const a of currentDb.ambassadors || []) {
    if (!deletedUserSet.has(a.id) && !deletedUserSet.has(a.userId)) {
      ambMap.set(a.email.toLowerCase().trim(), a);
    }
  }
  for (const a of incomingDb.ambassadors || []) {
    const key = a.email.toLowerCase().trim();
    if (deletedUserSet.has(a.id) || deletedUserSet.has(a.userId)) continue;
    if (!ambMap.has(key)) {
      ambMap.set(key, a);
    } else {
      const existing = ambMap.get(key)!;
      ambMap.set(key, {
        ...existing,
        ...a,
        totalPoints: Math.max(existing.totalPoints || 0, a.totalPoints || 0),
        availablePoints: Math.max(existing.availablePoints || 0, a.availablePoints || 0),
        totalCommissionKes: Math.max(
          existing.totalCommissionKes || 0,
          a.totalCommissionKes || 0
        ),
        availableCommissionKes: Math.max(
          existing.availableCommissionKes || 0,
          a.availableCommissionKes || 0
        ),
        paidCommissionKes: Math.max(
          existing.paidCommissionKes || 0,
          a.paidCommissionKes || 0
        ),
      });
    }
  }

  const isLiveEntity = (id: string) =>
    !deletedEntitySet.has(id) && !trashedEntitySet.has(id);

  // 4. Referrals
  const refMap = new Map<string, Referral>();
  for (const r of currentDb.referrals || []) {
    if (isLiveEntity(r.id)) refMap.set(r.id, r);
  }
  for (const r of incomingDb.referrals || []) {
    if (!isLiveEntity(r.id)) continue;
    if (!refMap.has(r.id)) {
      refMap.set(r.id, r);
    } else {
      refMap.set(r.id, { ...refMap.get(r.id)!, ...r });
    }
  }

  // 5. Enrolments
  const enrMap = new Map<string, Enrolment>();
  for (const e of currentDb.enrolments || []) {
    if (isLiveEntity(e.id)) enrMap.set(e.id, e);
  }
  for (const e of incomingDb.enrolments || []) {
    if (!isLiveEntity(e.id)) continue;
    if (!enrMap.has(e.id)) {
      enrMap.set(e.id, e);
    } else {
      enrMap.set(e.id, { ...enrMap.get(e.id)!, ...e });
    }
  }

  // 6. Payout requests
  const payMap = new Map<string, PayoutRequest>();
  for (const pr of currentDb.payoutRequests || []) {
    if (isLiveEntity(pr.id)) payMap.set(pr.id, pr);
  }
  for (const pr of incomingDb.payoutRequests || []) {
    if (!isLiveEntity(pr.id)) continue;
    if (!payMap.has(pr.id)) {
      payMap.set(pr.id, pr);
    } else {
      payMap.set(pr.id, { ...payMap.get(pr.id)!, ...pr });
    }
  }

  const merged: AppDatabaseState = {
    ...currentDb,
    ...incomingDb,
    applications: Array.from(appMap.values()).filter((a) => isLiveEntity(a.id)),
    profiles: Array.from(profileMap.values()),
    ambassadors: Array.from(ambMap.values()).filter((a) => isLiveEntity(a.id)),
    referrals: Array.from(refMap.values()),
    enrolments: Array.from(enrMap.values()),
    payoutRequests: Array.from(payMap.values()),
    courses: (incomingDb.courses || currentDb.courses || []).filter((c) => isLiveEntity(c.id)),
    campaigns: (incomingDb.campaigns || currentDb.campaigns || []).filter((c) => isLiveEntity(c.id)),
    marketingAssets: (incomingDb.marketingAssets || currentDb.marketingAssets || []).filter((m) => isLiveEntity(m.id)),
    announcements: (incomingDb.announcements || currentDb.announcements || []).filter((a) => isLiveEntity(a.id)),
    trash: Array.from(trashMap.values()),
    deletedApplicationIds: Array.from(deletedAppSet),
    deletedUserIds: Array.from(deletedUserSet),
    deletedEntityIds: Array.from(deletedEntitySet),
    deletedTrashIds: Array.from(deletedTrashSet),
  };

  return ensureStateConsistency(merged);
}

export function getPersistentDb(): AppDatabaseState {
  if (globalThis.__scds_server_db__) {
    return ensureStateConsistency(globalThis.__scds_server_db__);
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = ensureStateConsistency(
        JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE))
      );
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      globalThis.__scds_server_db__ = initial;
      return initial;
    }

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = ensureStateConsistency(JSON.parse(raw) as AppDatabaseState);
    globalThis.__scds_server_db__ = parsed;
    return parsed;
  } catch (err) {
    console.warn("Using in-memory database fallback:", err);
    const initial = ensureStateConsistency(
      JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE))
    );
    globalThis.__scds_server_db__ = initial;
    return initial;
  }
}

export function savePersistentDb(state: AppDatabaseState): void {
  const current = getPersistentDb();
  const merged = mergeDatabaseStates(current, state);
  globalThis.__scds_server_db__ = merged;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write file to disk (retained in-memory):", err);
  }
}
