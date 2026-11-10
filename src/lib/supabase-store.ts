import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase";
import { AppDatabaseState } from "@/lib/seed-data";

/**
 * Persists and retrieves shared state from Supabase when cloud credentials are configured.
 * This guarantees real-time cross-device sync between applicants on mobile/incognito
 * and the administrator console on desktop/Vercel.
 */
function getClient() {
  if (!isSupabaseConfigured()) return null;
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchSupabaseState(): Promise<AppDatabaseState | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("app_state")
      .select("state")
      .eq("key", "main")
      .single();

    if (error || !data?.state) {
      return null;
    }

    return data.state as AppDatabaseState;
  } catch (err) {
    console.warn("Could not fetch state from Supabase app_state:", err);
    return null;
  }
}

export async function saveSupabaseState(state: AppDatabaseState): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    const { error } = await client.from("app_state").upsert(
      {
        key: "main",
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.warn("Could not upsert to Supabase app_state:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Failed to write to Supabase app_state:", err);
    return false;
  }
}
