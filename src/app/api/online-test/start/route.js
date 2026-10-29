import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TEACHER_NAMES } from "@/lib/awardListTeachers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/start  { test, studentId, teacher, class }
// Claims the student's single attempt BEFORE the first question is shown.
// A second claim (retake, reload, another device) is refused by the
// unique (test_slug, student_id) constraint, so it cannot be raced.
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
  return NextResponse.json({
    token,
    student: { name: st.student_name, roll: st.roll_no, section: String(sec.section_label).split("(")[0].trim() },
  });
}
