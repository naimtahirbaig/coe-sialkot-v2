// Builds a Word (.docx) file for a generated paper.
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { fmtNum } from "@/lib/questionBank";

export async function buildDocx(p, withKey) {
  const FONT = "Times New Roman";
  const run = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
  const center = (text, size, bold = true) =>
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [run(text, { bold, size })] });

  const kids = [];
  if (p.school) kids.push(center(p.school, 36));
  kids.push(center(p.title, 28));
  kids.push(center(`Class ${p.classNum} - ${p.subject}`, 26));
  kids.push(center(`${p.duration ? `Time: ${p.duration} minutes        ` : ""}Total Marks: ${fmtNum(p.totalMarks)}`, 24, false));
  if (withKey) kids.push(center("ANSWER KEY", 24));
  if (p.instructions) {
    kids.push(new Paragraph({ spacing: { before: 160, after: 120 }, children: [run("Instructions: ", { bold: true }), run(p.instructions)] }));
  }

  let qno = 0;
  for (const s of p.sections) {
    kids.push(new Paragraph({
      spacing: { before: 280, after: 40 },
      children: [run(s.title, { bold: true, size: 26 }), run(`   (${s.attempt} x ${fmtNum(s.marksEach)} = ${fmtNum(s.attempt * s.marksEach)} marks)`, { bold: true })],
    }));
    kids.push(new Paragraph({ spacing: { after: 120 }, children: [run(s.instructions, { italics: true })] }));
    for (const q of s.questions) {
      qno++;
      kids.push(new Paragraph({ spacing: { before: 100, after: 40 }, children: [run(`Q${qno}. ${q.text}   [${fmtNum(q.marks)}]`)] }));
      if (q.qtype === "mcq") {
        q.opts.forEach((o, i) => {
          if (o) kids.push(new Paragraph({ indent: { left: 567 }, children: [run(`(${"abcd"[i]}) ${o}`)] }));
        });
      } else if (q.qtype === "true_false") {
        kids.push(new Paragraph({ indent: { left: 567 }, children: [run("(True / False)")] }));
      }
      if (withKey) {
        let ans = "";
        if (q.qtype === "mcq" && q.correct) ans = `${q.correct}) ${q.opts["ABCD".indexOf(q.correct)] || ""}`;
        else if (q.qtype === "true_false") ans = q.correct;
        ans = [ans, q.answer].filter(Boolean).join(" - ") || "(no model answer stored)";
        kids.push(new Paragraph({ indent: { left: 567 }, children: [run(`Answer: ${ans}`, { italics: true })] }));
      }
    }
  }
  kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [run("- End of paper -", { italics: true })] }));

  const doc = new Document({ sections: [{ children: kids }] });
  return Packer.toBuffer(doc);
}
