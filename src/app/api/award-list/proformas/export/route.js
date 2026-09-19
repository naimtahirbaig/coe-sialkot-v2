import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";
import { buildProforma1, buildProforma2, P1_HEADERS, P2_HEADERS } from "@/lib/proformas";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// GET /api/award-list/proformas/export?examSlug=…&pin=…
//                                     ?examId=…&adminPassword=…
//
// One workbook: Proforma 1 on the first sheet, then Proforma 2 on its own
// sheet per subject — matching the template's note that Proforma 2 is
// "used subject wise separately".
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

  const [{ data: sections }, { data: students }, { data: config }, { data: marks }] =
    await Promise.all([
      supabase
        .from("award_sections")
        .select("id, class, section_label, section_letter, class_incharge")
        .order("class", { ascending: true })
        .order("section_letter", { ascending: true }),
      supabase.from("award_students").select("id, section_id"),
      supabase
        .from("award_subject_config")
        .select("section_id, subject_name, total_marks, teacher_name")
        .eq("exam_id", exam.id),
      supabase
        .from("award_marks")
        .select("section_id, student_id, subject_name, marks_obtained")
        .eq("exam_id", exam.id),
    ]);

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
  (sections || []).forEach((s) => (subjectsBySection[s.id] = subjectsForClass(s.class)));

  const active = (sections || []).filter((s) => configBySection[s.id]);

  const p1 = buildProforma1({ sections: active, studentsBySection, configBySection, marksBySection });
  const p2 = buildProforma2({
    sections: active, studentsBySection, configBySection,
    teacherBySection, marksBySection, subjectsBySection,
  });

  const examTitle = `${MONTHS[exam.month - 1]} ${exam.year} — ${exam.name}`;
  const wb = XLSX.utils.book_new();

  const AUTHORITY = "PUNJAB DAANISH SCHOOLS & CENTRES OF EXCELLENCE AUTHORITY";
  const COE = "Name of COE: Centre of Excellence Sialkot (Boys)";

  // ---------- Proforma 1 ----------
  const p1rows = p1.map((r) => [
    r.sr, r.incharge, r.className, r.appeared, r.passed, r.passPct, r.resultPct,
    r.avgMarks, r.totalMarks, r.avgPct,
    r.bands.b90, r.bands.b80, r.bands.b70, r.bands.b60, r.bands.b50, r.bands.b40, r.bands.below40,
    r.above70, r.below70, r.diff70, r.above70Pct,
  ]);

  const sum = (f) => p1.reduce((a, r) => a + (f(r) || 0), 0);
  const gAppeared = sum((r) => r.appeared);
  const gPassed = sum((r) => r.passed);
  const gAbove = sum((r) => r.above70);
  const gBelow = sum((r) => r.below70);
  const p1total = [
    "Grand Total", "", "", gAppeared, gPassed,
    gAppeared ? Math.round((gPassed / gAppeared) * 10000) / 100 : null, "", "", "", "",
    sum((r) => r.bands.b90), sum((r) => r.bands.b80), sum((r) => r.bands.b70),
    sum((r) => r.bands.b60), sum((r) => r.bands.b50), sum((r) => r.bands.b40),
    sum((r) => r.bands.below40),
    gAbove, gBelow, gAbove - gBelow,
    gAppeared ? Math.round((gAbove / gAppeared) * 10000) / 100 : null,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([
    [AUTHORITY],
    [`Proforma 1 — Overall Class / Section wise Result | ${examTitle}`],
    [COE],
    [],
    P1_HEADERS,
    ...p1rows,
    p1total,
  ]);
  ws1["!cols"] = [
    { wch: 6 }, { wch: 24 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 9 },
    { wch: 9 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    ...Array(7).fill({ wch: 9 }),
    { wch: 11 }, { wch: 11 }, { wch: 14 }, { wch: 13 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Proforma 1");

  // ---------- Proforma 2, one sheet per subject ----------
  Object.keys(p2).forEach((subject) => {
    const rows = p2[subject].map((r) => [
      r.sr, r.teacher, r.className, r.appeared, r.passed, r.passPct, r.resultPct,
      r.totalMarks, r.avgMarks, r.avgPct,
      r.bands.b90, r.bands.b80, r.bands.b70, r.bands.b60,
      r.bands.b50, r.bands.b40, r.bands.b33, r.bands.below33,
      r.above70, r.below70, r.diff70, r.above70Pct,
    ]);

    const s2 = (f) => p2[subject].reduce((a, r) => a + (f(r) || 0), 0);
    const a2 = s2((r) => r.appeared);
    const p2p = s2((r) => r.passed);
    const ab2 = s2((r) => r.above70);
    const be2 = s2((r) => r.below70);
    const total = [
      "Grand Total", "", "", a2, p2p,
      a2 ? Math.round((p2p / a2) * 10000) / 100 : null, "", "", "", "",
      s2((r) => r.bands.b90), s2((r) => r.bands.b80), s2((r) => r.bands.b70),
      s2((r) => r.bands.b60), s2((r) => r.bands.b50), s2((r) => r.bands.b40),
      s2((r) => r.bands.b33), s2((r) => r.bands.below33),
      ab2, be2, ab2 - be2, a2 ? Math.round((ab2 / a2) * 10000) / 100 : null,
    ];

    const ws = XLSX.utils.aoa_to_sheet([
      [AUTHORITY],
      [`Proforma 2 — Teachers Result | ${examTitle}`],
      [`${COE}          Name of Subject: ${subject}`],
      [],
      P2_HEADERS,
      ...rows,
      total,
    ]);
    ws["!cols"] = [
      { wch: 6 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 9 },
      { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 12 },
      ...Array(8).fill({ wch: 9 }),
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 11 },
    ];

    // Sheet names: 31 chars max, and / \ ? * [ ] are not allowed
    const safe = subject.replace(/[\\/?*\[\]:]/g, "-").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safe);
  });

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const fname = `proformas-${examTitle.replace(/[^a-zA-Z0-9]+/g, "-")}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
