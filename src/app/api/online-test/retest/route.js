import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/retest   (header x-admin-password)
// { test, below, classNum?, section? }
// Gives a retest to everyone in the class (or one section) who scored below
// `below` %, plus anyone who started but never finished. Their old attempt
// is copied to online_test_attempt_history, then removed so they can sit the
// test again with a fresh random paper.
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const below = Number(b?.below);
  if (!b?.test || !(below > 0 && below <= 100)) {
    return NextResponse.json({ error: "Missing test or percentage." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  let q = supabase.from("online_test_attempts").select("*").eq("test_slug", b.test);
  if (b.section) q = q.eq("section_label", b.section);
  if (b.classNum) q = q.eq("class", Number(b.classNum));
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pick = (data || []).filter((r) => r.status !== "submitted" || Number(r.percentage) < below);
  if (!pick.length) return NextResponse.json({ count: 0 });

  const { error: hErr } = await supabase.from("online_test_attempt_history").insert(
    pick.map((r) => ({ reason: `retest below ${below}%`, data: r }))
  );
  if (hErr) return NextResponse.json({ error: "Could not archive old results: " + hErr.message }, { status: 500 });
  const { error: dErr } = await supabase.from("online_test_attempts").delete().in("id", pick.map((r) => r.id));
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
  return NextResponse.json({ count: pick.length });
}
