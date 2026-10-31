import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/progress
// { test, studentId, token, idx, picks:[…], tabSwitches, camDropped, shotAt,
//   paper?: [{q, o:[[text,1|0],…]}], photos?: [{src, at, time}] }
// Saves where the student has got to, so the test can be resumed after a
// power cut or a dropped connection. Needs the attempt's token.
export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b?.test || !b?.studentId || !b?.token) return NextResponse.json({ error: "Missing details" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("online_test_attempts").select("id, token, status, progress")
    .eq("test_slug", b.test).eq("student_id", String(b.studentId)).maybeSingle();
  if (!row) return NextResponse.json({ error: "No such attempt" }, { status: 404 });
  if (row.token !== b.token) {
    return NextResponse.json({ error: "This attempt was taken over on another device.", superseded: true }, { status: 403 });
  }
  if (row.status === "submitted") return NextResponse.json({ ok: true, already: true });

  const old = row.progress || {};
  const next = { ...old };
  if (Array.isArray(b.paper) && b.paper.length <= 200) next.paper = b.paper;
  if (Array.isArray(b.picks)) next.picks = b.picks.slice(0, 200).map((n) => (Number.isInteger(n) ? n : -1));
  if (Number.isInteger(b.idx)) next.idx = b.idx;
  if (Number.isFinite(Number(b.tabSwitches))) next.tabSwitches = Number(b.tabSwitches);
  next.camDropped = !!b.camDropped;
  if (Number.isFinite(Number(b.faceEvents))) next.faceEvents = Number(b.faceEvents);
  if (Number.isFinite(Number(b.noFaceSecs))) next.noFaceSecs = Number(b.noFaceSecs);
  if (Number.isFinite(Number(b.multiFace))) next.multiFace = Number(b.multiFace);
  if (Array.isArray(b.shotAt)) next.shotAt = b.shotAt.slice(0, 10).map(Number);
  if (Array.isArray(b.photos)) {
    const ok = b.photos.slice(0, 8).filter((p) => typeof p?.src === "string" && p.src.startsWith("data:image/") && p.src.length < 400_000);
    next.photos = ok.map((p) => ({ src: p.src, at: String(p.at || "").slice(0, 30), time: String(p.time || "").slice(0, 40) }));
  }
  const { error } = await supabase.from("online_test_attempts")
    .update({ progress: next, last_seen: new Date().toISOString() }).eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
