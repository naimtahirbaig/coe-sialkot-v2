// Builds proforma sheets that match the official template exactly:
// same merged header blocks, Tahoma fonts, medium/thin borders, grey
// header shading, column widths, row heights and live formulas.
//
// Measurements were taken from the school's own template workbook, so a
// printed page from here lines up with a printed page from the original.

const GREY_HEADER = "FFBFBFBF";   // theme0 tint -0.25
const GREY_ROW = "FFF2F2F2";      // theme0 tint -0.05

const med = { style: "medium" };
const thin = { style: "thin" };

function setFill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function box(cell, { l = thin, r = thin, t = thin, b = thin } = {}) {
  cell.border = { left: l, right: r, top: t, bottom: b };
}

function titleRow(ws, row, text, lastCol, height) {
  ws.mergeCells(row, 1, row, lastCol);
  const c = ws.getCell(row, 1);
  c.value = text;
  c.font = { name: "Tahoma", size: 12, bold: true };
  c.alignment = { horizontal: row === 1 ? "center" : "left", vertical: "middle", wrapText: true };
  ws.getRow(row).height = height;
  for (let i = 1; i <= lastCol; i++) box(ws.getCell(row, i), { l: med, r: med, t: med, b: med });
}

function headerCell(ws, r1, c1, r2, c2, text) {
  if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
  const c = ws.getCell(r1, c1);
  c.value = text;
  c.font = { name: "Tahoma", size: 8, bold: true };
  c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  setFill(c, GREY_HEADER);
  for (let r = r1; r <= r2; r++)
    for (let cc = c1; cc <= c2; cc++)
      box(ws.getCell(r, cc), { l: med, r: med, t: med, b: med });
  return c;
}

const AUTHORITY = "PUNJAB DAANISH SCHOOLS & CENTRES OF EXCELLENCE AUTHORITY";

/* ------------------------------------------------------------------ */
/* Proforma 1 — one sheet per class                                     */
/* ------------------------------------------------------------------ */
export function addProforma1Sheet(wb, { classNum, examTitle, rows, coeName }) {
  const ws = wb.addWorksheet(`P1 Class ${classNum}`, {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const W = [4.5, 10, 8.66, 8.43, 8.5, 7.16, 8.43, 8.5, 6.5, 7.83,
             6.16, 8.43, 8.43, 8.43, 8.43, 8.43, 8.43, 8.43, 8.43, 9.33, 9.83];
  W.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const LAST = 21;

  titleRow(ws, 1, AUTHORITY, LAST, 21);
  titleRow(ws, 2, ` Proforma 1                    Over all Class / Section wise Result of Class ${classNum} — ${examTitle}`, LAST, 21);
  titleRow(ws, 3, `Name of COE: ${coeName}`, LAST, 21);

  // Header block, rows 4–6
  headerCell(ws, 4, 1, 6, 1, "Sr. No");
  headerCell(ws, 4, 2, 6, 2, "Name of Class Incharge");
  headerCell(ws, 4, 3, 6, 3, "Name of Class with section");
  headerCell(ws, 4, 4, 6, 4, "No. of Students appeared");
  headerCell(ws, 4, 5, 6, 5, "No. of Students Passed");
  headerCell(ws, 4, 6, 6, 6, "Passed%");
  headerCell(ws, 4, 7, 6, 7, " Result  %  ");
  headerCell(ws, 4, 8, 6, 8, "Average Student Marks ");
  headerCell(ws, 4, 9, 6, 9, "Total Marks");
  headerCell(ws, 4, 10, 6, 10, "Average marks %");
  headerCell(ws, 4, 11, 4, 17, "");                     // band group strip
  ["90% above", "80% above", "70% above", "60% above", "50% above", "40% above", "Below 40%"]
    .forEach((t, i) => headerCell(ws, 5, 11 + i, 6, 11 + i, t));
  headerCell(ws, 4, 18, 6, 18, "70 % & above");
  headerCell(ws, 4, 19, 6, 19, "Below 70 %");
  headerCell(ws, 4, 20, 6, 20, "Difference 70 % Above & Below");
  headerCell(ws, 4, 21, 6, 21, "70% & above Grade %");
  ws.getRow(4).height = 20;
  ws.getRow(5).height = 14;
  ws.getRow(6).height = 14;

  // Data rows
  const first = 7;
  rows.forEach((r, i) => {
    const n = first + i;
    // Height left unset so Excel auto-fits wrapped names
    const vals = [
      i + 1, r.incharge, r.className, r.appeared, r.passed, r.passPct, r.resultPct,
      r.avgMarks, r.totalMarks, null,
      r.bands.b90, r.bands.b80, r.bands.b70, r.bands.b60, r.bands.b50, r.bands.b40, r.bands.below40,
      null, null, null, null,
    ];
    vals.forEach((v, ci) => {
      const c = ws.getCell(n, ci + 1);
      if (v !== null && v !== undefined) c.value = v;
      c.font = { name: "Tahoma", size: 10 };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      box(c);
    });
    // Live formulas, exactly as the template has them
    ws.getCell(n, 10).value = { formula: `IF(I${n}=0,"",H${n}/I${n}*100)` };
    ws.getCell(n, 18).value = { formula: `K${n}+L${n}+M${n}` };
    ws.getCell(n, 19).value = { formula: `N${n}+O${n}+P${n}+Q${n}` };
    ws.getCell(n, 20).value = { formula: `R${n}-S${n}` };
    ws.getCell(n, 21).value = { formula: `IF(D${n}=0,"",R${n}/D${n})` };
    ws.getCell(n, 10).numFmt = "0.00";
    ws.getCell(n, 6).numFmt = "0.00";
    ws.getCell(n, 7).numFmt = "0.00";
    ws.getCell(n, 8).numFmt = "0.00";
    ws.getCell(n, 21).numFmt = "0.00%";
  });

  // Grand Total
  const gt = first + rows.length;
  const last = gt - 1;
  ws.getRow(gt).height = 31.5;
  ws.mergeCells(gt, 1, gt, 2);
  const gtc = ws.getCell(gt, 1);
  gtc.value = "Grand Total";
  gtc.font = { name: "Tahoma", size: 10, bold: true };
  gtc.alignment = { horizontal: "center", vertical: "middle" };
  for (let i = 1; i <= LAST; i++) {
    const c = ws.getCell(gt, i);
    c.font = { name: "Tahoma", size: 10, bold: true };
    c.alignment = { horizontal: "center", vertical: "middle" };
    box(c, { l: med, r: med, t: med, b: med });
  }
  if (rows.length) {
    [4, 5, 8, 9, 11, 12, 13, 14, 15, 16, 17].forEach((col) => {
      const L = ws.getColumn(col).letter;
      ws.getCell(gt, col).value = { formula: `SUM(${L}${first}:${L}${last})` };
    });
    ws.getCell(gt, 6).value = { formula: `IF(D${gt}=0,"",E${gt}/D${gt}*100)` };
    ws.getCell(gt, 7).value = { formula: `IF(D${gt}=0,"",E${gt}/D${gt}*100)` };
    ws.getCell(gt, 10).value = { formula: `IF(I${gt}=0,"",H${gt}/I${gt}*100)` };
    ws.getCell(gt, 18).value = { formula: `K${gt}+L${gt}+M${gt}` };
    ws.getCell(gt, 19).value = { formula: `N${gt}+O${gt}+P${gt}+Q${gt}` };
    ws.getCell(gt, 20).value = { formula: `R${gt}-S${gt}` };
    ws.getCell(gt, 21).value = { formula: `IF(D${gt}=0,"",R${gt}/D${gt})` };
    ws.getCell(gt, 6).numFmt = "0.00";
    ws.getCell(gt, 7).numFmt = "0.00";
    ws.getCell(gt, 10).numFmt = "0.00";
    ws.getCell(gt, 21).numFmt = "0.00%";
  }
  return ws;
}

/* ------------------------------------------------------------------ */
/* Proforma 2 — one sheet per class + subject                           */
/* ------------------------------------------------------------------ */
export function addProforma2Sheet(wb, { classNum, subject, examTitle, rows, coeName, sheetName }) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const W = [5.16, 13, 8, 8.5, 8.66, 8, 8.5, 8.33, 8.5, 7.83,
             6.5, 5.83, 8.43, 8.43, 8.43, 8.43, 5.83, 8.43, 7, 6.5, 9.16, 8.5];
  W.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const LAST = 22;

  titleRow(ws, 1, AUTHORITY, LAST, 32.25);
  titleRow(ws, 2, `Proforma 2                    Teachers Result — Class ${classNum} — ${examTitle}`, LAST, 28.5);
  titleRow(ws, 3, `Name of COE: ${coeName}          Name of Subject: ${subject}`, LAST, 28.5);

  headerCell(ws, 4, 1, 6, 1, "Sr. No");
  headerCell(ws, 4, 2, 6, 2, "Name of Teacher");
  headerCell(ws, 4, 3, 6, 3, "Class with section");
  headerCell(ws, 4, 4, 6, 4, "No of Students appeared ");
  headerCell(ws, 4, 5, 6, 5, "No of Students Passed");
  headerCell(ws, 4, 6, 6, 6, "Pass %");
  headerCell(ws, 4, 7, 6, 7, "Subject pass % ");
  headerCell(ws, 4, 8, 6, 8, "Total Marks of Subject");
  headerCell(ws, 4, 9, 6, 9, "Average Student Marks in Subejct");
  headerCell(ws, 4, 10, 6, 10, "Average marks %");
  headerCell(ws, 4, 12, 4, 20, "");
  ["90 % & above", "80 % & above", "70 % & above", "60 % & above", "50 % & above",
   "40 % &  above", "33 % &  above", "33 % &  Below",
   "No of 70% & above Grades", "No of Below 70% Grades"]
    .forEach((t, i) => headerCell(ws, 5, 11 + i, 6, 11 + i, t));
  headerCell(ws, 4, 21, 6, 21, "Difference 70 % Above & Below Grades");
  headerCell(ws, 4, 22, 6, 22, " 70% Above %");
  ws.getRow(4).height = 31.5;
  ws.getRow(5).height = 33;
  ws.getRow(6).height = 20;

  const first = 7;
  rows.forEach((r, i) => {
    const n = first + i;
    // Height left unset so Excel auto-fits wrapped names
    const vals = [
      i + 1, r.teacher, r.className, r.appeared, r.passed, null, null,
      r.totalMarks, r.avgMarks, null,
      r.bands.b90, r.bands.b80, r.bands.b70, r.bands.b60,
      r.bands.b50, r.bands.b40, r.bands.b33, r.bands.below33,
      null, null, null, null,
    ];
    vals.forEach((v, ci) => {
      const c = ws.getCell(n, ci + 1);
      if (v !== null && v !== undefined) c.value = v;
      c.font = { name: "Tahoma", size: 9 };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      setFill(c, GREY_ROW);
      box(c);
    });
    ws.getCell(n, 6).value = { formula: `IF(D${n}=0,"",E${n}/D${n})` };
    ws.getCell(n, 7).value = { formula: `IF(D${n}=0,"",E${n}/D${n})` };
    ws.getCell(n, 10).value = { formula: `IF(H${n}=0,"",I${n}/H${n})` };
    ws.getCell(n, 19).value = { formula: `K${n}+L${n}+M${n}` };
    ws.getCell(n, 20).value = { formula: `N${n}+O${n}+P${n}+Q${n}+R${n}` };
    ws.getCell(n, 21).value = { formula: `S${n}-T${n}` };
    ws.getCell(n, 22).value = { formula: `IF(D${n}=0,"",S${n}/D${n})` };
    [6, 7, 10, 22].forEach((c) => (ws.getCell(n, c).numFmt = "0.00%"));
    ws.getCell(n, 9).numFmt = "0.00";
  });

  const gt = first + rows.length;
  const last = gt - 1;
  ws.mergeCells(gt, 1, gt, 3);
  const gtc = ws.getCell(gt, 1);
  gtc.value = "Grand Total";
  for (let i = 1; i <= LAST; i++) {
    const c = ws.getCell(gt, i);
    c.font = { name: "Tahoma", size: 9, bold: true };
    c.alignment = { horizontal: "center", vertical: "middle" };
    box(c, { l: med, r: med, t: med, b: med });
  }
  if (rows.length) {
    [4, 5, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18].forEach((col) => {
      const L = ws.getColumn(col).letter;
      ws.getCell(gt, col).value = { formula: `SUM(${L}${first}:${L}${last})` };
    });
    ws.getCell(gt, 6).value = { formula: `IF(D${gt}=0,"",E${gt}/D${gt})` };
    ws.getCell(gt, 7).value = { formula: `IF(D${gt}=0,"",E${gt}/D${gt})` };
    ws.getCell(gt, 10).value = { formula: `IF(H${gt}=0,"",I${gt}/H${gt})` };
    ws.getCell(gt, 19).value = { formula: `K${gt}+L${gt}+M${gt}` };
    ws.getCell(gt, 20).value = { formula: `N${gt}+O${gt}+P${gt}+Q${gt}+R${gt}` };
    ws.getCell(gt, 21).value = { formula: `S${gt}-T${gt}` };
    ws.getCell(gt, 22).value = { formula: `IF(D${gt}=0,"",S${gt}/D${gt})` };
    [6, 7, 10, 22].forEach((c) => (ws.getCell(gt, c).numFmt = "0.00%"));
  }

  // Template's footer note
  const note = gt + 2;
  ws.mergeCells(note, 1, note, LAST);
  const nc = ws.getCell(note, 1);
  nc.value = "Note: Proforma 2 be used subject wise sepreately";
  nc.font = { name: "Tahoma", size: 10, bold: true };
  nc.alignment = { horizontal: "left", vertical: "middle" };
  for (let i = 1; i <= LAST; i++) box(ws.getCell(note, i), { l: med, r: med, t: med, b: med });

  return ws;
}
