import fs from "fs";
import path from "path";
import { AppDatabaseState, INITIAL_DATABASE_STATE } from "@/lib/seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/**
 * Server-side persistent storage helper.
 * When Supabase environment variables are not yet configured,
 * this persists applications, profiles, referrals, and audit events
 * to data/db.json on the server so ANY user applying on the public site
 * is immediately visible to the admin on their dashboard across different
 * devices, browser sessions, and private incognito windows.
 */
export function getPersistentDb(): AppDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(INITIAL_DATABASE_STATE, null, 2),
        "utf-8"
      );
      return INITIAL_DATABASE_STATE;
    }

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AppDatabaseState;

    // Ensure super admin profile exists with the official email and password
    const adminIdx = parsed.profiles.findIndex(
      (p) =>
        p.role === "super_admin" ||
        p.email.toLowerCase() === "samcreativedesignschool@gmail.com"
    );

    if (adminIdx === -1) {
      const adminProfile = INITIAL_DATABASE_STATE.profiles.find(
        (p) => p.role === "super_admin"
      )!;
      parsed.profiles.unshift(adminProfile);
      savePersistentDb(parsed);
    } else {
      parsed.profiles[adminIdx].email = "Samcreativedesignschool@gmail.com";
      parsed.profiles[adminIdx].password = "Admin@SCDS2026!#Sam";
      parsed.profiles[adminIdx].role = "super_admin";
      parsed.profiles[adminIdx].status = "active";
    }

    return parsed;
  } catch (err) {
    console.error("Failed to read server persistent db, using fallback:", err);
    return INITIAL_DATABASE_STATE;
  }
}

export function savePersistentDb(state: AppDatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to persistent db:", err);
  }
}
