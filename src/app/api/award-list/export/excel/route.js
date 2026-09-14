import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass, computeTotals, assignPositions } from "@/lib/awardListConfig";

// GET /api/award-list/export/excel?codes=6-Jinnah,7-Iqbal&adminPassword=...
// Returns a .xlsx file with one sheet per requested section, matching the
// layout of the original award list template.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const adminPassword = searchParams.get("adminPassword");
  const codes = (searchParams.get("codes") || "").split(",").filter(Boolean);

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (codes.length === 0) {
    return NextResponse.json({ error: "No sections requested" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const wb = XLSX.utils.book_new();

  for (const code of codes) {
    const { data: section } = await supabase
      .from("award_sections")
      .select("*")
      .eq("sheet_code", code)
      .single();
    if (!section) continue;

    const [{ data: students }, { data: configRows }, { data: markRows }] = await Promise.all([
      supabase
        .from("award_students")
        .select("id, s_no, roll_no, student_name, father_name")
        .eq("section_id", section.id)
        .order("s_no", { ascending: true }),
      supabase
        .from("award_subject_config")
        .select("subject_name, total_marks, teacher_name")
        .eq("section_id", section.id),
      supabase
        .from("award_marks")
        .select("student_id, subject_name, marks_obtained")
        .eq("section_id", section.id),
    ]);

    const subjects = subjectsForClass(section.class);
    const config = {};
    const teachers = {};
    subjects.forEach((s) => (config[s] = null));
    (configRows || []).forEach((c) => {
      config[c.subject_name] = c.total_marks;
      teachers[c.subject_name] = c.teacher_name;
    });

    const marksByStudent = {};
    (markRows || []).forEach((m) => {
      marksByStudent[m.student_id] = marksByStudent[m.student_id] || {};
      marksByStudent[m.student_id][m.subject_name] = m.marks_obtained;
    });

    const rowsWithTotals = (students || []).map((st) => {
      const totals = computeTotals(marksByStudent[st.id] || {}, config);
      return { ...st, ...totals };
    });
    const positions = assignPositions(
      rowsWithTotals.map((r) => ({ id: r.id, obtained: r.obtained }))
    );

    const totalMarksSum = Object.values(config).reduce((a, b) => a + (Number(b) || 0), 0);

    const header1 = ["GOVERNMENT OF PUNJAB — CENTER OF EXCELLENCE SIALKOT (BOYS)"];
    const header2 = [`AWARD LIST | Class ${section.class}-${section.section_label} | Session 2026-27`];
    const header3 = [`Class Incharge: ${section.class_incharge}   |   No. of Students: ${section.student_count}`];
    const colHeaders = [
      "S#", "Roll No", "Student Name", "Father's Name",
      ...subjects,
      "Total Obtained", "Total Marks", "Percentage", "Position", "Grade", "Remarks",
    ];
    const totalMarksRow = [
      "TOTAL MARKS", "", "", "",
      ...subjects.map((s) => config[s] ?? ""),
      "", totalMarksSum || "", "", "", "", "",
    ];
    const teacherRow = [
      "SUBJECT TEACHER", "", "", "",
      ...subjects.map((s) => teachers[s] || ""),
      "", "", "", "", "", "",
    ];

    const dataRows = rowsWithTotals.map((r) => [
      r.s_no, r.roll_no, r.student_name, r.father_name,
      ...subjects.map((s) => (marksByStudent[r.id] || {})[s] ?? ""),
      r.obtained ?? "",
      r.total || "",
      r.percentage !== null ? r.percentage : "",
      r.obtained !== null ? positions[r.id] : "",
      r.grade || "",
      "",
    ]);

    const aoa = [header1, header2, header3, [], colHeaders, totalMarksRow, teacherRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 5 }, { wch: 8 }, { wch: 24 }, { wch: 22 },
      ...subjects.map(() => ({ wch: 10 })),
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 14 },
    ];

    // Sheet names max 31 chars, no special chars
    const sheetName = code.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="award-lists-${Date.now()}.xlsx"`,
    },
  });
}
