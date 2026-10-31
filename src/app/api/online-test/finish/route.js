import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/finish — saves the result and the result card.
// Needs the one-time token issued by /start, and works only once.
export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b?.test || !b?.studentId || !b?.token) {
    return NextResponse.json({ error: "Missing details" }, { status: 400 });
  }
  const card = typeof b.card === "string" ? b.card : "";
  if (card && (!card.startsWith("data:image/") || card.length > 3_500_000)) {
    return NextResponse.json({ error: "Card image rejected" }, { status: 400 });
  }
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("online_test_attempts").select("id, token, status")
    .eq("test_slug", b.test).eq("student_id", String(b.studentId)).single();
  if (!row || row.token !== b.token) {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 403 });
  }
  if (row.status === "submitted") {
    return NextResponse.json({ ok: true, already: true });
  }
  const fields = {
    status: "submitted",
    finished_at: new Date().toISOString(),
    correct: num(b.correct), wrong: num(b.wrong), skipped: num(b.skipped),
    percentage: num(b.pct),
    grade: String(b.grade || "").slice(0, 3),
    tab_switches: num(b.tabSwitches),
    camera_dropped: !!b.cameraDropped,
    answers: Array.isArray(b.answers) ? b.answers.slice(0, 200) : null,
    card_image: card || null,
  };
  const face = {
    face_events: num(b.faceEvents), no_face_secs: num(b.noFaceSecs), multi_face: num(b.multiFace),
  };
  // Newer columns may not exist yet (migration not run): fall back step by
  // step so the result is ALWAYS saved.
  const attempts = [
    { ...fields, ...face, progress: null }, { ...fields, ...face }, { ...fields, progress: null }, fields,
  ];
  let error = null;
  for (const upd of attempts) {
    ({ error } = await supabase.from("online_test_attempts")
      .update(upd).eq("id", row.id).eq("status", "in_progress"));
    if (!error) break;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
