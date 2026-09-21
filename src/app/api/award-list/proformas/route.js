import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";
import { buildProforma1, buildProforma2 } from "@/lib/proformas";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/award-list/proformas?examSlug=…&pin=…
//                              ?examId=…&adminPassword=…
//
// Accepts EITHER the teachers' PIN or the admin password, so the same
// link works for staff and for the office.
//
// Everything is computed from award_marks on each request — the
// proformas are therefore always in step with whatever teachers have
// entered, with nothing stored or synchronised separately.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const examSlug = searchParams.get("examSlug");
  const pin = searchParams.get("pin");
  const adminPassword = searchParams.get("adminPassword");

  const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;
  const isTeacher = pin && pin === process.env.AWARD_LIST_PIN;
  if (!isAdmin && !isTeacher) {
    return NextResponse.json({ error: "Enter the PIN or the admin password." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

  // Students and marks both exceed Supabase's 1,000-row page, so they are
  // read with fetchAll. A plain select would silently drop whole sections.
  let sections, students, config, marks;
  try {
    [sections, students, config, marks] = await Promise.all([
      fetchAll((opts) =>
        supabase
          .from("award_sections")
          .select("id, class, section_label, section_letter, class_incharge, sheet_code", opts)
          .order("class", { ascending: true })
          .order("section_letter", { ascending: true })
          .order("id", { ascending: true })
      ),
      fetchAll((opts) =>
        supabase.from("award_students").select("id, section_id", opts).order("id", { ascending: true })
      ),
      fetchAll((opts) =>
        supabase
          .from("award_subject_config")
          .select("section_id, subject_name, total_marks, teacher_name", opts)
          .eq("exam_id", exam.id)
          .order("id", { ascending: true })
      ),
      fetchAll((opts) =>
        supabase
          .from("award_marks")
          .select("section_id, student_id, subject_name, marks_obtained", opts)
          .eq("exam_id", exam.id)
          .order("id", { ascending: true })
      ),
    ]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  // Group everything by section for the computation
  const studentsBySection = {};
  (students || []).forEach((s) => {
    (studentsBySection[s.section_id] = studentsBySection[s.section_id] || []).push(s);
  });

  const configBySection = {};
  const teacherBySection = {};
  (config || []).forEach((c) => {
    configBySection[c.section_id] = configBySection[c.section_id] || {};
    teacherBySection[c.section_id] = teacherBySection[c.section_id] || {};
    configBySection[c.section_id][c.subject_name] = c.total_marks;
    teacherBySection[c.section_id][c.subject_name] = c.teacher_name;
  });

  const marksBySection = {};
  (marks || []).forEach((m) => {
    marksBySection[m.section_id] = marksBySection[m.section_id] || {};
    const bag = marksBySection[m.section_id];
    bag[m.student_id] = bag[m.student_id] || {};
    bag[m.student_id][m.subject_name] = m.marks_obtained;
  });

  const subjectsBySection = {};
  (sections || []).forEach((s) => {
    subjectsBySection[s.id] = subjectsForClass(s.class);
  });

  // Only sections that actually have data for this exam appear on a proforma
  const active = (sections || []).filter((s) => configBySection[s.id]);

  const proforma1 = buildProforma1({
    sections: active,
    studentsBySection,
    configBySection,
    marksBySection,
  });

  const proforma2 = buildProforma2({
    sections: active,
    studentsBySection,
    configBySection,
    teacherBySection,
    marksBySection,
    subjectsBySection,
  });

  return NextResponse.json({
    exam,
    generatedAt: new Date().toISOString(),
    proforma1,
    proforma2,
    isAdmin: !!isAdmin,
  });
}
