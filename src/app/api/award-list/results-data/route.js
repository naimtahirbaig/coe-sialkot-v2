import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// POST /api/award-list/results-data   { adminPassword, examId }
//
// ADMIN ONLY. Returns every class and section of one exam with each
// student's marks, percentage and class-wide position, so the Exams page
// can build one-page section sheets, class sheets, summaries and
// comparisons in the browser from a single request.
//
// Percentage = obtained / total of the subjects the student actually has
// a mark in (blank = not entered), the same rule as the award list,
// proformas and result cards. Positions are across the whole class, ties
// share a rank.
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!body.adminPassword || body.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized — check the admin password." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { exam, error: examErr } = await resolveExam(supabase, body.examId, body.examSlug);
  if (examErr || !exam) return NextResponse.json({ error: examErr || "Exam not found" }, { status: 400 });

  const { data: sections, error: secErr } = await supabase
    .from("award_sections")
    .select("id, sheet_code, class, section_label, section_letter, class_incharge")
    .order("class", { ascending: true })
    .order("section_letter", { ascending: true });
  if (secErr) return NextResponse.json({ error: secErr.message }, { status: 500 });

  let students, config, marks;
  try {
    [students, config, marks] = await Promise.all([
      fetchAll((opts) =>
        supabase.from("award_students")
          .select("id, section_id, s_no, roll_no, student_name, father_name", opts)
          .order("id", { ascending: true })),
      fetchAll((opts) =>
        supabase.from("award_subject_config")
          .select("section_id, subject_name, total_marks", opts)
          .eq("exam_id", exam.id).order("id", { ascending: true })),
      fetchAll((opts) =>
        supabase.from("award_marks")
          .select("student_id, subject_name, marks_obtained", opts)
          .eq("exam_id", exam.id).order("id", { ascending: true })),
    ]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const cfgBySection = {};
  config.forEach((c) => {
    (cfgBySection[c.section_id] = cfgBySection[c.section_id] || {})[c.subject_name] = c.total_marks;
  });
  const marksByStudent = {};
  marks.forEach((m) => {
    (marksByStudent[m.student_id] = marksByStudent[m.student_id] || {})[m.subject_name] = m.marks_obtained;
  });
  const studentsBySection = {};
  students.forEach((s) => (studentsBySection[s.section_id] = studentsBySection[s.section_id] || []).push(s));

  const classNums = [...new Set(sections.map((s) => s.class))].sort((a, b) => a - b);
  const classes = classNums.map((cn) => {
    const subjects = subjectsForClass(cn);
    const secs = sections.filter((s) => s.class === cn).map((sec) => {
      const cfg = cfgBySection[sec.id] || {};
      const list = (studentsBySection[sec.id] || [])
        .sort((a, b) => (a.s_no ?? 0) - (b.s_no ?? 0) || a.id - b.id)
        .map((st) => {
          const sm = marksByStudent[st.id] || {};
          let obtained = 0, outOf = 0, entered = 0;
          const m = {};
          subjects.forEach((sub) => {
            const v = sm[sub];
            if (v === null || v === undefined || v === "") { m[sub] = null; return; }
            m[sub] = Number(v);
            obtained += Number(v);
            outOf += Number(cfg[sub] || 0);
            entered += 1;
          });
          return {
            id: st.id, roll: String(st.roll_no), name: st.student_name, father: st.father_name,
            marks: m, obtained, outOf, entered,
            pct: outOf > 0 ? (obtained / outOf) * 100 : null,
            position: null,
          };
        });
      return {
        code: sec.sheet_code,
        label: sec.section_label,
        name: String(sec.section_label).split("(")[0].trim(),
        incharge: sec.class_incharge,
        max: subjects.reduce((o, s) => ((o[s] = cfg[s] ?? null), o), {}),
        students: list,
      };
    });

    // Class-wide ranking, ties share a rank
    const ranked = secs.flatMap((s) => s.students).filter((s) => s.entered > 0)
      .sort((a, b) => b.obtained - a.obtained);
    let last = null, rank = 0;
    ranked.forEach((s, i) => {
      if (s.obtained !== last) { rank = i + 1; last = s.obtained; }
      s.position = rank;
    });

    return { class: cn, subjects, ranked: ranked.length, sections: secs };
  });

  return NextResponse.json({
    exam,
    examLine: `${MONTHS[exam.month - 1]} ${exam.year} — ${exam.name}`,
    classes,
  });
}
