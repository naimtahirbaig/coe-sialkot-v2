import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";
import { buildProforma1, buildProforma2 } from "@/lib/proformas";
import { addProforma1Sheet, addProforma2Sheet } from "@/lib/proformaExcel";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const COE_NAME = "Centre of Excellence Sialkot (Boys)";

// GET /api/award-list/proformas/export?examId=…&adminPassword=…[&class=6]
//                                    ?examSlug=…&pin=…
//
// Produces a workbook laid out exactly like the school's own template:
// Proforma 1 is per class (matching "Result of ______ Class"), and
// Proforma 2 gets a sheet per subject within that class.
//
// With ?class= it covers one class (1 + up to 9 sheets). Without it,
// every class that has data.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const examSlug = searchParams.get("examSlug");
  const pin = searchParams.get("pin");
  const adminPassword = searchParams.get("adminPassword");
  const onlyClass = searchParams.get("class");

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
      fetchAll(() =>
        supabase
          .from("award_sections")
          .select("id, class, section_label, section_letter, class_incharge")
          .order("class", { ascending: true })
          .order("section_letter", { ascending: true })
          .order("id", { ascending: true })
      ),
      fetchAll(() =>
        supabase.from("award_students").select("id, section_id").order("id", { ascending: true })
      ),
      fetchAll(() =>
        supabase
          .from("award_subject_config")
          .select("section_id, subject_name, total_marks, teacher_name")
          .eq("exam_id", exam.id)
          .order("id", { ascending: true })
      ),
      fetchAll(() =>
        supabase
          .from("award_marks")
          .select("section_id, student_id, subject_name, marks_obtained")
          .eq("exam_id", exam.id)
          .order("id", { ascending: true })
      ),
    ]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

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

  let active = (sections || []).filter((s) => configBySection[s.id]);
  if (onlyClass) active = active.filter((s) => Number(s.class) === Number(onlyClass));

  if (active.length === 0) {
    return NextResponse.json(
      { error: "No marks have been saved yet for this exam" + (onlyClass ? ` in Class ${onlyClass}.` : ".") },
      { status: 404 }
    );
  }

  const examTitle = `${MONTHS[exam.month - 1]} ${exam.year} — ${exam.name}`;
  const classes = [...new Set(active.map((s) => Number(s.class)))].sort((a, b) => a - b);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Centre of Excellence Sialkot";
  wb.created = new Date();

  for (const classNum of classes) {
    const classSections = active.filter((s) => Number(s.class) === classNum);

    const p1 = buildProforma1({
      sections: classSections, studentsBySection, configBySection, marksBySection,
    });
    addProforma1Sheet(wb, { classNum, examTitle, rows: p1, coeName: COE_NAME });

    const p2 = buildProforma2({
      sections: classSections, studentsBySection, configBySection,
      teacherBySection, marksBySection, subjectsBySection,
    });

    // Keep the template's subject order rather than whatever came back
    const ordered = subjectsForClass(classNum).filter((s) => p2[s]?.length);
    ordered.forEach((subject, i) => {
      // Sheet names: 31 chars, no / \ ? * [ ] : — and must be unique
      const short = subject.replace(/[\\/?*\[\]:]/g, "-").slice(0, 18);
      addProforma2Sheet(wb, {
        classNum, subject, examTitle, rows: p2[subject], coeName: COE_NAME,
        sheetName: `P2 ${classNum} ${short}`.slice(0, 31) || `P2 ${classNum}-${i}`,
      });
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const scope = onlyClass ? `Class-${onlyClass}` : "All-Classes";
  const fname = `Proformas-${scope}-${examTitle.replace(/[^a-zA-Z0-9]+/g, "-")}.xlsx`;

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
