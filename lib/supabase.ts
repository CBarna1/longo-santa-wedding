import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the PUBLISHABLE (anon) key only.
 *
 * Security model:
 * - RLS is enabled on `rsvps` with a single INSERT policy for `anon`.
 * - There is no SELECT policy, so this key can add RSVPs but can never
 *   read the guest list back.
 * - The secret key (sb_secret_...) is never used anywhere in this app.
 *
 * The env vars are deliberately NOT prefixed with NEXT_PUBLIC_, so they are
 * never bundled into client JavaScript.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable.");
  }
  if (key.startsWith("sb_secret_")) {
    // Guard against accidentally pasting the secret key.
    throw new Error("SUPABASE_ANON_KEY must be the publishable key, not the secret key.");
  }

  client = createClient(url, key, {
    // No user sessions on the server; avoid any storage/refresh behavior.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
