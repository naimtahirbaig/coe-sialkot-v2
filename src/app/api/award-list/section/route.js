import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";

// GET /api/award-list/section?code=6-Jinnah&pin=1234
// Returns the roster, subject list, any previously saved "total marks" per
// subject, and any previously saved per-student marks — so a teacher
// re-opening the link sees what they already entered.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const pin = searchParams.get("pin");

  if (pin !== process.env.AWARD_LIST_PIN) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing section code" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: section, error: sectionErr } = await supabase
    .from("award_sections")
    .select("*")
    .eq("sheet_code", code)
    .single();

  if (sectionErr || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const [{ data: students, error: studErr }, { data: config }, { data: marks }] =
    await Promise.all([
      supabase
        .from("award_students")
        .select("id, s_no, roll_no, student_name, father_name")
        .eq("section_id", section.id)
        .order("s_no", { ascending: true }),
      supabase
        .from("award_subject_config")
        .select("subject_name, total_marks, teacher_name, locked")
        .eq("section_id", section.id),
      supabase
        .from("award_marks")
        .select("student_id, subject_name, marks_obtained")
        .eq("section_id", section.id),
    ]);

  if (studErr) {
    return NextResponse.json({ error: studErr.message }, { status: 500 });
  }

  return NextResponse.json({
    section,
    subjects: subjectsForClass(section.class),
    students,
    subjectConfig: config || [],
    marks: marks || [],
  });
}
