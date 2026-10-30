import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/reset { ids: [attemptId, ...] }  (header x-admin-password)
// Retest for chosen students (the per-student button). Same method as
// /api/online-test/retest: the old attempt is copied to
// online_test_attempt_history, then removed, so the student can sit the test
// again and the old result is still on file.
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const ids = Array.isArray(b?.ids) ? b.ids : b?.id ? [b.id] : [];
  if (!ids.length) return NextResponse.json({ error: "Nothing to retest" }, { status: 400 });
  if (ids.length > 600) return NextResponse.json({ error: "Too many at once" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from("online_test_attempts").select("*").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ ok: true, done: 0 });

  const { error: hErr } = await supabase.from("online_test_attempt_history").insert(
    rows.map((r) => ({ reason: "retest (individual)", data: r }))
  );
  if (hErr) return NextResponse.json({ error: "Could not archive old result: " + hErr.message }, { status: 500 });
  const { error: dErr } = await supabase.from("online_test_attempts").delete().in("id", rows.map((r) => r.id));
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, done: rows.length });
}
