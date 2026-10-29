import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isTestOpen } from "@/lib/onlineTestStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/status?test=...   (public)  → { open }
export async function GET(req) {
  const test = new URL(req.url).searchParams.get("test");
  if (!test) return NextResponse.json({ error: "Missing test" }, { status: 400 });
  const open = await isTestOpen(getSupabaseAdmin(), test);
  return NextResponse.json({ open }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/online-test/status { test, open }   (header x-admin-password)
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b?.test || typeof b.open !== "boolean") return NextResponse.json({ error: "Missing details" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("online_test_settings")
    .upsert({ test_slug: b.test, is_open: b.open, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ open: b.open });
}
