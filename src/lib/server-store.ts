import fs from "fs";
import path from "path";
import os from "os";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";

// In serverless environments (Vercel, AWS Lambda), process.cwd() is read-only.
// We must use os.tmpdir() to prevent EROFS errors.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production"
);

const DATA_DIR = isServerless ? os.tmpdir() : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "scds-app-db.json");

// In-memory global store to survive warm serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __scds_server_db__: AppDatabaseState | undefined;
}

function ensureAdminProfile(state: AppDatabaseState): AppDatabaseState {
  const adminIdx = state.profiles.findIndex(
    (p) =>
      p.role === "super_admin" ||
      p.email.toLowerCase() === "samcreativedesignschool@gmail.com"
  );

  if (adminIdx === -1) {
    const adminProfile = INITIAL_DATABASE_STATE.profiles.find(
      (p) => p.role === "super_admin"
    )!;
    state.profiles.unshift(adminProfile);
  } else {
    state.profiles[adminIdx].email = "Samcreativedesignschool@gmail.com";
    state.profiles[adminIdx].password = "Admin@SCDS2026!#Sam";
    state.profiles[adminIdx].role = "super_admin";
    state.profiles[adminIdx].status = "active";
  }
  return state;
}

export function getPersistentDb(): AppDatabaseState {
  if (globalThis.__scds_server_db__) {
    return ensureAdminProfile(globalThis.__scds_server_db__);
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = ensureAdminProfile(JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)));
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      globalThis.__scds_server_db__ = initial;
      return initial;
    }

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = ensureAdminProfile(JSON.parse(raw) as AppDatabaseState);
    globalThis.__scds_server_db__ = parsed;
    return parsed;
  } catch (err) {
    console.warn("Using in-memory database fallback:", err);
    const initial = ensureAdminProfile(JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)));
    globalThis.__scds_server_db__ = initial;
    return initial;
  }
}

export function savePersistentDb(state: AppDatabaseState): void {
  const stateWithAdmin = ensureAdminProfile(state);
  globalThis.__scds_server_db__ = stateWithAdmin;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(stateWithAdmin, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write file to disk (retained in-memory):", err);
  }
}
