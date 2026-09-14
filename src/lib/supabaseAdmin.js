// Server-only Supabase client using the service role key, so it can write
// to award_* tables even though RLS blocks public writes.
// NEVER import this from a "use client" component — API routes / server
// actions only.
//
// If you already have an equivalent helper in the repo (e.g. the one used
// to write mcq_tests rows), just reuse that instead of adding this file.

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
