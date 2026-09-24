// Server-only Supabase client using the service-role key, which bypasses
// Row Level Security. Never import this file from client-side code.
//
// If your project already has an equivalent helper (e.g. the one used by
// your award-list routes), use that instead and delete this file — just
// make sure it also uses the service-role key, not the anon key, since
// these routes write on behalf of any staff member without per-user auth.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "case-register: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. " +
    "Add them in your Vercel project settings (Environment Variables)."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
