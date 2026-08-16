import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** True bila kredensial Supabase eksternal sudah tersedia. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env["EXT_SUPABASE_URL"] && process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"]);
}

/** Client service-role ke Supabase eksternal milik user. Server-only. */
export function getAdminClient(): SupabaseClient {
  const url = process.env["EXT_SUPABASE_URL"];
  const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Supabase belum terkonfigurasi: set EXT_SUPABASE_URL dan EXT_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers: h });
      },
    },
  });
}
