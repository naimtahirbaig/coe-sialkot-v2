import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/award-list/section?code=6-Jinnah&pin=1234[&examId=...]
// Without examId this uses whichever exam is currently open, which is how
// the shared /award-list link works for teachers.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const pin = searchParams.get("pin");
  const examId = searchParams.get("examId");
  const examSlug = searchParams.get("examSlug");

  if (pin !== process.env.AWARD_LIST_PIN) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing section code" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

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
        .eq("section_id", section.id)
        .eq("exam_id", exam.id),
      supabase
        .from("award_marks")
        .select("student_id, subject_name, marks_obtained, locked")
        .eq("section_id", section.id)
        .eq("exam_id", exam.id),
    ]);

  if (studErr) {
    return NextResponse.json({ error: studErr.message }, { status: 500 });
  }

  return NextResponse.json({
    exam,
    section,
    subjects: subjectsForClass(section.class),
    students,
    subjectConfig: config || [],
    marks: marks || [],
  });
}
