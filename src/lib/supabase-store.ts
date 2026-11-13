import { getSupabaseServiceClient, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase";
import { AppDatabaseState } from "@/lib/seed-data";
import { AmbassadorApplication } from "@/types";

/**
 * Checks whether server-side Supabase credentials (URL + service role key) are configured.
 */
export function isSupabaseServiceConfigured(): boolean {
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return Boolean(url && serviceKey && url.startsWith("http"));
}

function getServerClient() {
  if (isSupabaseServiceConfigured()) {
    return getSupabaseServiceClient();
  }
  return null;
}

export async function fetchSupabaseState(): Promise<AppDatabaseState | null> {
  const client = getServerClient();
  if (!client) {
    if (isSupabaseConfigured()) {
      console.warn(
        "[Supabase] SUPABASE_SERVICE_ROLE_KEY is missing; server state cannot be fetched securely."
      );
    }
    return null;
  }

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
  const client = getServerClient();
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
      console.error("Could not upsert to Supabase app_state:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to write to Supabase app_state:", err);
    return false;
  }
}

export async function upsertSupabaseApplication(
  app: AmbassadorApplication
): Promise<boolean> {
  const client = getServerClient();
  if (!client) return false;

  try {
    const { error } = await client.from("applications").upsert(
      {
        id: app.id,
        user_id: app.userId,
        full_name: app.fullName,
        email: app.email.toLowerCase().trim(),
        phone: app.phone,
        county: app.county || null,
        institution: app.institution || null,
        occupation: app.occupation || null,
        status: app.status,
        payload: app,
        created_at: app.createdAt || new Date().toISOString(),
        reviewed_at: app.reviewedAt || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Could not upsert to Supabase applications table:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Failed to upsert to Supabase applications table:", err);
    return false;
  }
}

export async function fetchSupabaseApplications(): Promise<AmbassadorApplication[] | null> {
  const client = getServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("applications")
      .select("payload")
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    return (data || [])
      .map((row: { payload?: AmbassadorApplication }) => row.payload)
      .filter((p): p is AmbassadorApplication => Boolean(p && p.id));
  } catch {
    return null;
  }
}
