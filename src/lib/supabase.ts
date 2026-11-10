import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    undefined
  );
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.startsWith("http"));
}

/**
 * Browser-safe Supabase client (uses anon key + RLS)
 */
export function getSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !url.startsWith("http")) {
    return null;
  }
  return createBrowserClient(url, key);
}

/**
 * Server-only Supabase client (never expose service_role key to client)
 */
export function getSupabaseServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: Service client cannot be invoked in the browser.");
  }
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

