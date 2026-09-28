// Server-only Supabase client using the service-role key, which bypasses
// Row Level Security. Never import this file from client-side code.
//
// Exports TWO shapes on purpose:
//   getSupabaseAdmin()  — used by the award-list / exams / proforma routes
//   supabaseAdmin       — used by the case-register routes
// Both return the same client. Keep both: removing either one breaks
// half the site, which is exactly what happened before.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : null;
