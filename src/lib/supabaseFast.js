// Supabase client that gives up quickly (default 7 s) instead of hanging for 20+ seconds
// when the database does not answer. Used by the setup / status / list endpoints so the
// pages can show a clear message and a Retry button.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
let client = null;

export function getSupabaseFast(ms = 7000) {
  if (!url || !key) throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: (u, o = {}) => fetch(u, { ...o, signal: AbortSignal.timeout(ms) }) },
    });
  }
  return client;
}

export const DB_DOWN = "The database is not responding right now. Please try again in a minute.";

// Never show a raw HTML error page (Cloudflare 522 etc.) to anyone.
export function cleanError(e) {
  const m = String((e && e.message) || e || "");
  if (!m || m.trim().startsWith("<") || /timed out|timeout|522|52\d|fetch failed|aborted|abort|ECONN|ENOTFOUND|network/i.test(m)) return DB_DOWN;
  return m;
}
