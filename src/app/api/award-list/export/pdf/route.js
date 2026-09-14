import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass, computeTotals, assignPositions } from "@/lib/awardListConfig";

// GET /api/award-list/export/pdf?codes=6-Jinnah,7-Iqbal&adminPassword=...
// One (or more, paginated) landscape page(s) per section.
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
  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 24 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", resolve));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const rowHeight = 14;

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
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

    // Column layout: S#, Roll, Name, Father, subjects..., Obt, Tot, %, Pos, Grd
    const cols = [
      { key: "s_no", label: "S#", w: 24 },
      { key: "roll_no", label: "Roll", w: 32 },
      { key: "student_name", label: "Student Name", w: 110 },
      { key: "father_name", label: "Father's Name", w: 100 },
      ...subjects.map((s) => ({ key: s, label: s.length > 14 ? s.slice(0, 12) + "…" : s, w: 55 })),
      { key: "obtained", label: "Obt.", w: 40 },
      { key: "total", label: "Tot.", w: 40 },
      { key: "percentage", label: "%", w: 40 },
      { key: "position", label: "Pos", w: 32 },
      { key: "grade", label: "Grd", w: 32 },
    ];
    // Scale columns down proportionally if they overflow the page width
    const rawWidth = cols.reduce((a, c) => a + c.w, 0);
    const scale = rawWidth > pageWidth ? pageWidth / rawWidth : 1;
    cols.forEach((c) => (c.w = c.w * scale));

    if (i > 0) doc.addPage();

    doc.fontSize(11).font("Helvetica-Bold").text(
      "GOVERNMENT OF PUNJAB — CENTER OF EXCELLENCE SIALKOT (BOYS)",
      { align: "center" }
    );
    doc.fontSize(10).text(
      `AWARD LIST | Class ${section.class}-${section.section_label} | Session 2026-27`,
      { align: "center" }
    );
    doc.fontSize(8).font("Helvetica").text(
      `Class Incharge: ${section.class_incharge}   |   No. of Students: ${section.student_count}`,
      { align: "center" }
    );
    const teacherList = subjects
      .filter((s) => teachers[s])
      .map((s) => `${s}: ${teachers[s]}`)
      .join("   |   ");
    if (teacherList) {
      doc.fontSize(6.5).fillColor("#555").text(teacherList, { align: "center" });
      doc.fillColor("#000");
    }
    doc.moveDown(0.5);

    const drawRow = (values, opts = {}) => {
      const rowY = doc.y;
      if (rowY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      const startY = doc.y; // re-read in case addPage() just reset it
      let x = doc.page.margins.left;
      doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(6.5);
      values.forEach((val, idx) => {
        doc.text(String(val ?? ""), x, startY, {
          width: cols[idx].w,
          height: rowHeight,
          ellipsis: true,
          lineBreak: false,
        });
        x += cols[idx].w;
      });
      doc.y = startY + rowHeight; // set absolute, don't accumulate drift
    };

    drawRow(cols.map((c) => c.label), { bold: true });
    drawRow(
      cols.map((c) =>
        ["s_no", "roll_no", "student_name", "father_name"].includes(c.key)
          ? (c.key === "s_no" ? "TOTAL MARKS" : "")
          : subjects.includes(c.key)
          ? config[c.key] ?? ""
          : c.key === "total"
          ? Object.values(config).reduce((a, b) => a + (Number(b) || 0), 0)
          : ""
      ),
      { bold: true }
    );

    rowsWithTotals.forEach((r) => {
      drawRow(
        cols.map((c) => {
          if (c.key === "s_no") return r.s_no;
          if (c.key === "roll_no") return r.roll_no;
          if (c.key === "student_name") return r.student_name;
          if (c.key === "father_name") return r.father_name;
          if (subjects.includes(c.key)) return (marksByStudent[r.id] || {})[c.key] ?? "";
          if (c.key === "obtained") return r.obtained ?? "";
          if (c.key === "total") return r.total || "";
          if (c.key === "percentage") return r.percentage !== null ? r.percentage : "";
          if (c.key === "position") return r.obtained !== null ? positions[r.id] : "";
          if (c.key === "grade") return r.grade || "";
          return "";
        })
      );
    });
  }

  doc.end();
  await done;
  const buf = Buffer.concat(chunks);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="award-lists-${Date.now()}.pdf"`,
    },
  });
}
