import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TEACHER_NAMES } from "@/lib/awardListTeachers";
import { isTestOpen } from "@/lib/onlineTestStatus";
import { previousResults } from "@/lib/onlineTests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STALE_MS = 90 * 1000;

// POST /api/online-test/start  { test, studentId, teacher, class }
// Claims the student's single attempt BEFORE the first question is shown.
// A finished attempt can never be claimed again. An UNFINISHED one is
// resumed (power cut, dropped internet). Brand-new claims are raced safely
// by the unique (test_slug, student_id) constraint.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const { test, studentId, teacher } = body || {};
  const cls = Number(body?.class);
  if (!test || !studentId || !teacher || !cls) {
    return NextResponse.json({ error: "Missing details" }, { status: 400 });
  }
  if (!TEACHER_NAMES.includes(teacher)) {
    return NextResponse.json({ error: "Unknown teacher" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: st } = await supabase
    .from("award_students").select("id, section_id, roll_no, student_name")
    .eq("id", studentId).single();
  if (!st) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  const { data: sec } = await supabase
    .from("award_sections").select("class, section_label").eq("id", st.section_id).single();
  if (!sec || Number(sec.class) !== cls) {
    return NextResponse.json({ error: "This student is not in this class" }, { status: 400 });
  }
  const sectionName = String(sec.section_label).split("(")[0].trim();

  // ---- An attempt already exists for this student?
  const { data: existing } = await supabase.from("online_test_attempts")
    .select("*").eq("test_slug", test).eq("student_id", String(st.id)).maybeSingle();
  if (existing) {
    if (existing.status === "submitted") {
      return NextResponse.json({ error: "This student has already taken this test. No retake is allowed." }, { status: 409 });
    }
    // Unfinished: resume it. Same browser (token matches) resumes at once.
    // From anywhere else it is allowed only if the old session has been quiet
    // for a while, so a classmate cannot hijack a test that is running.
    const quietMs = Date.now() - new Date(existing.last_seen || existing.started_at).getTime();
    const sameDevice = body.token && body.token === existing.token;
    if (!sameDevice && quietMs < STALE_MS) {
      return NextResponse.json({
        error: "This test is already open on another device. If the power or internet failed, wait about 90 seconds and try again.",
      }, { status: 409 });
    }
    const token = sameDevice ? existing.token : crypto.randomUUID();
    const upd = await supabase.from("online_test_attempts")
      .update({ token, last_seen: new Date().toISOString() }).eq("id", existing.id);
    if (upd.error) await supabase.from("online_test_attempts").update({ token }).eq("id", existing.id);
    const previous = await previousResults(supabase, st.id, test);
    const pr = existing.progress;
    return NextResponse.json({
      previous, token, resumed: true,
      resume: pr && pr.paper ? { ...pr, started: existing.started_at } : null,
      student: { name: st.student_name, roll: st.roll_no, section: sectionName },
    });
  }

  // ---- Brand-new attempt: only while the test is Active.
  if (!(await isTestOpen(supabase, test))) {
    return NextResponse.json({ error: "This test is closed. It is not accepting new attempts." }, { status: 403 });
  }

  const token = crypto.randomUUID();
  const { error } = await supabase.from("online_test_attempts").insert({
    test_slug: test,
    student_id: String(st.id),
    student_name: st.student_name,
    roll_no: String(st.roll_no ?? ""),
    class: Number(sec.class),
    section_label: String(sec.section_label).split("(")[0].trim(),
    teacher_name: teacher,
    token,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This student has already taken this test. No retake is allowed." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Earlier results in this subject, for the comparison on the result card.
  const previous = await previousResults(supabase, st.id, test);
  return NextResponse.json({
    previous,
    token,
    student: { name: st.student_name, roll: st.roll_no, section: String(sec.section_label).split("(")[0].trim() },
  });
}
