import fs from "fs";
import path from "path";
import os from "os";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";
import { ensureStateConsistency } from "@/lib/consistency";

export { ensureStateConsistency };

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

export function getPersistentDb(): AppDatabaseState {
  if (globalThis.__scds_server_db__) {
    return ensureStateConsistency(globalThis.__scds_server_db__);
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = ensureStateConsistency(JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)));
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
    const initial = ensureStateConsistency(JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE)));
    globalThis.__scds_server_db__ = initial;
    return initial;
  }
}

export function savePersistentDb(state: AppDatabaseState): void {
  const consistentState = ensureStateConsistency(state);
  globalThis.__scds_server_db__ = consistentState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(consistentState, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write file to disk (retained in-memory):", err);
  }
}
