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

  const baseRow = {
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
  };

  try {
    let { error } = await client.from("applications").upsert(
      {
        ...baseRow,
        approval_email_sent_at: app.approvalEmailSentAt || null,
        approval_email_last_error: app.approvalEmailLastError ?? null,
      },
      { onConflict: "id" }
    );

    if (
      error &&
      (error.message?.includes("approval_email_") || error.code === "PGRST204")
    ) {
      console.warn(
        "[Supabase] approval_email_sent_at/approval_email_last_error columns missing on public.applications; run migration 20261113000002_application_email_tracking.sql. Retrying without tracking columns."
      );
      const retry = await client
        .from("applications")
        .upsert(baseRow, { onConflict: "id" });
      error = retry.error;
    }

    if (error) {
      console.error("[Supabase] Could not upsert to public.applications:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        applicationId: app.id,
      });
      return false;
    }
    console.info(`[Supabase] Upserted application ${app.id} (${app.email}) into public.applications.`);
    return true;
  } catch (err) {
    console.error("[Supabase] Failed to upsert to public.applications:", err);
    return false;
  }
}

export async function fetchSupabaseApplicationById(
  id: string
): Promise<AmbassadorApplication | null> {
  const client = getServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("applications")
      .select("payload, approval_email_sent_at, approval_email_last_error")
      .eq("id", id)
      .single();

    if (error) {
      if (
        error.message?.includes("approval_email_") ||
        error.code === "PGRST204"
      ) {
        const fallback = await client
          .from("applications")
          .select("payload")
          .eq("id", id)
          .single();
        if (fallback.error || !fallback.data?.payload) return null;
        return fallback.data.payload as AmbassadorApplication;
      }
      return null;
    }

    const row = data as {
      payload?: AmbassadorApplication;
      approval_email_sent_at?: string | null;
      approval_email_last_error?: string | null;
    } | null;
    if (!row?.payload) return null;

    return {
      ...row.payload,
      approvalEmailSentAt:
        row.approval_email_sent_at ?? row.payload.approvalEmailSentAt,
      approvalEmailLastError:
        row.approval_email_last_error !== undefined
          ? row.approval_email_last_error
          : row.payload.approvalEmailLastError,
    };
  } catch {
    return null;
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
