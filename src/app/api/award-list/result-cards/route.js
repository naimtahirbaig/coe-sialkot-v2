import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";
import { overallRemark } from "@/lib/resultCardConfig";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// GET /api/award-list/result-cards?code=6-Jinnah&examId=…&adminPassword=…
//                                                        &pin=…
//
// Returns one ready-to-print card per student in the section, plus the
// class-wide top three. Positions are ranked ACROSS THE WHOLE CLASS
// (all sections of that class), matching the sample card's "1 / 52".
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const examId = searchParams.get("examId");
  const examSlug = searchParams.get("examSlug");
  const adminPassword = searchParams.get("adminPassword");
  const pin = searchParams.get("pin");

  // Either the teachers' PIN or the admin password opens this, so the
  // same page serves staff and the office.
  const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;
  const isTeacher = pin && pin === process.env.AWARD_LIST_PIN;
  if (!isAdmin && !isTeacher) {
    return NextResponse.json({ error: "Enter the PIN or the admin password." }, { status: 401 });
  }
  if (!code) return NextResponse.json({ error: "Missing section code" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

  const { data: section } = await supabase
    .from("award_sections").select("*").eq("sheet_code", code).single();
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  // Every section of this class, so positions can be class-wide
  const { data: classSections } = await supabase
    .from("award_sections")
    .select("id, class, section_label, sheet_code, class_incharge")
    .eq("class", section.class);
  const classSectionIds = (classSections || []).map((s) => s.id);

  const [{ data: students }, { data: config }, { data: marks }] = await Promise.all([
    supabase.from("award_students")
      .select("id, section_id, s_no, roll_no, student_name, father_name")
      .in("section_id", classSectionIds)
      .order("s_no", { ascending: true }),
    supabase.from("award_subject_config")
      .select("section_id, subject_name, total_marks")
      .in("section_id", classSectionIds).eq("exam_id", exam.id),
    supabase.from("award_marks")
      .select("section_id, student_id, subject_name, marks_obtained")
      .in("section_id", classSectionIds).eq("exam_id", exam.id),
  ]);

  const cfgBySection = {};
  (config || []).forEach((c) => {
    cfgBySection[c.section_id] = cfgBySection[c.section_id] || {};
    cfgBySection[c.section_id][c.subject_name] = c.total_marks;
  });

  const marksByStudent = {};
  (marks || []).forEach((m) => {
    marksByStudent[m.student_id] = marksByStudent[m.student_id] || {};
    marksByStudent[m.student_id][m.subject_name] = m.marks_obtained;
  });

  const subjects = subjectsForClass(section.class);

  // Score every student in the class, so ranking is class-wide.
  // Percentage is out of the subjects a student actually has marks in,
  // matching the award list and proformas.
  const scored = (students || []).map((st) => {
    const cfg = cfgBySection[st.section_id] || {};
    const sm = marksByStudent[st.id] || {};
    let obtained = 0, outOf = 0, entered = 0;
    subjects.forEach((sub) => {
      const v = sm[sub];
      if (v === null || v === undefined || v === "") return;
      obtained += Number(v);
      outOf += Number(cfg[sub] || 0);
      entered += 1;
    });
    const pct = outOf > 0 ? (obtained / outOf) * 100 : null;
    return { ...st, obtained, outOf, entered, pct };
  });

  const ranked = scored.filter((s) => s.entered > 0).sort((a, b) => b.obtained - a.obtained);
  const positions = {};
  let lastScore = null, lastRank = 0;
  ranked.forEach((s, i) => {
    if (s.obtained !== lastScore) { lastRank = i + 1; lastScore = s.obtained; }
    positions[s.id] = lastRank;
  });
  const classSize = ranked.length;

  const top3 = ranked.slice(0, 3).map((s) => ({
    name: s.student_name,
    father: s.father_name,
    score: `${s.obtained}/${s.outOf} (${s.pct.toFixed(2)}%)`,
  }));

  const examLabel = `${MONTHS[exam.month - 1]} ${exam.year} — ${exam.name}`;
  const cfg = cfgBySection[section.id] || {};

  const cards = scored
    .filter((s) => s.section_id === section.id)
    .map((s) => {
      const sm = marksByStudent[s.id] || {};
      return {
        studentId: s.id,
        name: s.student_name,
        father: s.father_name,
        roll: String(s.roll_no),
        cls: `${section.class} ${String(section.section_label).split("(")[0].trim()}`,
        sectionLabel: section.section_label,
        exam: exam.name,
        examLine: examLabel,
        position: s.entered > 0 ? `${positions[s.id]} / ${classSize}` : "—",
        complete: s.entered === subjects.length,
        subjects: subjects.map((sub) => ({
          name: sub,
          max: cfg[sub] ?? null,
          obtained: sm[sub] ?? null,
        })),
        top3,
        remark: s.pct === null ? "Result not yet complete." : overallRemark(s.pct),
      };
    });

  return NextResponse.json({
    isAdmin: !!isAdmin,
    exam,
    section: {
      sheet_code: section.sheet_code,
      class: section.class,
      section_label: section.section_label,
      class_incharge: section.class_incharge,
    },
    subjectCount: subjects.length,
    cards,
  });
}
