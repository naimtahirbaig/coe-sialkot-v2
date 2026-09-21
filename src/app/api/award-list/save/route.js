import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveExam } from "@/lib/resolveExam";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST body:
// { code, pin, subject, totalMarks, teacherName,
//   marks: [{ studentId, value }], examSlug? | examId? }
//
// LOCKING RULES
//   * Every mark locks the moment it is saved. A locked mark is never
//     overwritten by a later save — only an admin unlock reopens it.
//   * Empty boxes are not written, so they stay open until filled.
//   * Total marks and teacher name are fixed by the FIRST save. If the
//     total could change afterwards, every locked mark's percentage would
//     silently shift.
//   * Marks are validated before locking: a mark above the paper total,
//     below zero, or not a number is rejected — once locked, a typo could
//     not be corrected by the teacher.
//   * When every student has a locked mark, the whole subject is marked
//     complete (locked), which disables its Save button.
export async function POST(req) {
  const body = await req.json();
  const { code, pin, subject, totalMarks, teacherName, marks, examId, examSlug } = body || {};

  if (pin !== process.env.AWARD_LIST_PIN) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }
  if (!code || !subject || !Array.isArray(marks)) {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

  const { data: section } = await supabase
    .from("award_sections").select("id").eq("sheet_code", code).single();
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  const [{ data: cfg }, { data: existing }, { count: studentCount }] = await Promise.all([
    supabase.from("award_subject_config")
      .select("total_marks, teacher_name, locked")
      .eq("exam_id", exam.id).eq("section_id", section.id).eq("subject_name", subject)
      .maybeSingle(),
    supabase.from("award_marks")
      .select("student_id, marks_obtained, locked")
      .eq("exam_id", exam.id).eq("section_id", section.id).eq("subject_name", subject),
    supabase.from("award_students")
      .select("id", { count: "exact", head: true })
      .eq("section_id", section.id),
  ]);

  if (cfg?.locked) {
    return NextResponse.json(
      { error: `${subject} is complete and locked. Ask an admin to unlock it.` },
      { status: 403 }
    );
  }

  const lockedStudents = new Set(
    (existing || []).filter((m) => m.locked).map((m) => m.student_id)
  );
  const alreadyStarted = lockedStudents.size > 0;

  // Total and teacher: set by the first save, fixed afterwards.
  let total = cfg?.total_marks ?? null;
  let teacher = cfg?.teacher_name ?? null;

  if (!alreadyStarted) {
    const t = totalMarks === "" || totalMarks === null || totalMarks === undefined
      ? null : Number(totalMarks);
    if (t === null || !Number.isFinite(t) || t <= 0) {
      return NextResponse.json({ error: "Enter the total marks for this paper before saving." }, { status: 400 });
    }
    if (!teacherName || !String(teacherName).trim()) {
      return NextResponse.json({ error: "Select the subject teacher's name before saving." }, { status: 400 });
    }
    total = t;
    teacher = String(teacherName).trim();
  }

  // Only boxes that have a value and are not already locked are written.
  const toWrite = [];
  const invalid = [];
  for (const m of marks) {
    if (lockedStudents.has(m.studentId)) continue;           // never overwrite a locked mark
    if (m.value === "" || m.value === null || m.value === undefined) continue;  // stays open
    const v = Number(m.value);
    if (!Number.isFinite(v) || v < 0 || (total !== null && v > total)) {
      invalid.push(m.value);
      continue;
    }
    toWrite.push({
      exam_id: exam.id,
      student_id: m.studentId,
      section_id: section.id,
      subject_name: subject,
      marks_obtained: v,
      locked: true,
      locked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (invalid.length) {
    return NextResponse.json(
      {
        error:
          `${invalid.length} mark${invalid.length === 1 ? " is" : "s are"} not valid ` +
          `(must be a number from 0 to ${total}). Nothing was saved — correct ` +
          `${invalid.length === 1 ? "it" : "them"} and save again.`,
      },
      { status: 400 }
    );
  }

  if (!alreadyStarted) {
    const { error } = await supabase.from("award_subject_config").upsert(
      { exam_id: exam.id, section_id: section.id, subject_name: subject,
        total_marks: total, teacher_name: teacher },
      { onConflict: "exam_id,section_id,subject_name" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (toWrite.length) {
    const { error } = await supabase
      .from("award_marks")
      .upsert(toWrite, { onConflict: "exam_id,student_id,subject_name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lockedTotal = lockedStudents.size + toWrite.length;
  const remaining = Math.max(0, (studentCount || 0) - lockedTotal);
  const complete = (studentCount || 0) > 0 && remaining === 0;

  if (complete) {
    await supabase.from("award_subject_config")
      .update({ locked: true, locked_at: new Date().toISOString() })
      .eq("exam_id", exam.id).eq("section_id", section.id).eq("subject_name", subject);
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  await supabase.from("award_save_log").insert({ section_id: section.id, ip });

  return NextResponse.json({
    ok: true,
    teacher,
    total,
    savedNow: toWrite.length,
    savedStudentIds: toWrite.map((r) => r.student_id),
    lockedTotal,
    remaining,
    students: studentCount || 0,
    complete,
    locked: complete,
    exam,
  });
}
