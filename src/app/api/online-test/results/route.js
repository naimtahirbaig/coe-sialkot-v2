import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/results?test=...&adminPassword=...   (office only)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pw = req.headers.get("x-admin-password") || searchParams.get("adminPassword");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  const test = searchParams.get("test");
  const supabase = getSupabaseAdmin();
  let q = supabase.from("online_test_attempts")
    .select("id, test_slug, student_name, roll_no, class, section_label, teacher_name, status, started_at, finished_at, correct, wrong, skipped, percentage, grade, tab_switches, camera_dropped")
    .order("section_label").order("roll_no");
  if (test) q = q.eq("test_slug", test);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data });
}
