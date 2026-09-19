import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveExam } from "@/lib/resolveExam";

// POST body:
// { code, pin, subject, totalMarks, teacherName, marks: [{studentId, value}], examId? }
//
// Locking rule: after saving, if EVERY student in the section now has a
// mark for this subject, the subject auto-locks. If even one box is empty
// it stays unlocked so the teacher can finish later. Locking is per exam.
export async function POST(req) {
  const body = await req.json();
  const { code, pin, subject, totalMarks, teacherName, marks, examId, examSlug } = body || {};

  if (pin !== process.env.AWARD_LIST_PIN) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }
  if (!code || !subject || !Array.isArray(marks)) {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
  if (!teacherName || !teacherName.trim()) {
    return NextResponse.json({ error: "Please select the subject teacher's name." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

  const { data: section, error: sectionErr } = await supabase
    .from("award_sections")
    .select("id")
    .eq("sheet_code", code)
    .single();

  if (sectionErr || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const { data: existingConfig } = await supabase
    .from("award_subject_config")
    .select("locked")
    .eq("section_id", section.id)
    .eq("exam_id", exam.id)
    .eq("subject_name", subject)
    .maybeSingle();

  if (existingConfig?.locked) {
    return NextResponse.json(
      { error: `${subject} is locked. Ask an admin to unlock it before saving.` },
      { status: 403 }
    );
  }

  // 1. Subject settings for this exam
  const { error: configErr } = await supabase.from("award_subject_config").upsert(
    {
      exam_id: exam.id,
      section_id: section.id,
      subject_name: subject,
      total_marks:
        totalMarks === "" || totalMarks === null || totalMarks === undefined
          ? null
          : Number(totalMarks),
      teacher_name: teacherName.trim(),
    },
    { onConflict: "exam_id,section_id,subject_name" }
  );
  if (configErr) return NextResponse.json({ error: configErr.message }, { status: 500 });

  // 2. Per-student marks for this exam
  const markRows = marks.map((m) => ({
    exam_id: exam.id,
    student_id: m.studentId,
    section_id: section.id,
    subject_name: subject,
    marks_obtained:
      m.value === "" || m.value === null || m.value === undefined ? null : Number(m.value),
    updated_at: new Date().toISOString(),
  }));
  if (markRows.length > 0) {
    const { error: marksErr } = await supabase
      .from("award_marks")
      .upsert(markRows, { onConflict: "exam_id,student_id,subject_name" });
    if (marksErr) return NextResponse.json({ error: marksErr.message }, { status: 500 });
  }

  // 3. Auto-lock only when the subject is complete for this exam
  const { count: studentCount } = await supabase
    .from("award_students")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id);

  const { count: filledCount } = await supabase
    .from("award_marks")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id)
    .eq("exam_id", exam.id)
    .eq("subject_name", subject)
    .not("marks_obtained", "is", null);

  const complete = (studentCount || 0) > 0 && filledCount === studentCount;

  await supabase
    .from("award_subject_config")
    .update({ locked: complete, locked_at: complete ? new Date().toISOString() : null })
    .eq("section_id", section.id)
    .eq("exam_id", exam.id)
    .eq("subject_name", subject);

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  await supabase.from("award_save_log").insert({ section_id: section.id, ip });

  return NextResponse.json({ ok: true, locked: complete, exam });
}
