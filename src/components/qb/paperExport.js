"use client";
// Download a question paper as PDF, PNG or Word (.docx), made in the browser.
// Works on phones too (including the WhatsApp in-app browser, where Print does nothing).
//  - PDF and PNG are pictures of the paper, A3, cut into pages between questions (never through one).
//  - Word is a real, editable document built from the paper's questions.
import { optionLayout, labelFor } from "@/lib/qbFormats";

const A3 = { w: 841.89, h: 1190.55 }; // points
const fmtN = (v) => String(+Number(v).toFixed(2));

// ───────────────────────── picture of the paper, page by page ─────────────────────────
export async function renderPages(sheet) {
  const { default: html2canvas } = await import("html2canvas");
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  // draw a copy at full size, away from the screen, without the ↻ buttons
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-20000px;top:0;zoom:1;background:#fff;z-index:-1";
  const copy = sheet.cloneNode(true);
  copy.querySelectorAll(".swap").forEach((b) => b.remove());
  // the picture-maker places text on underlined lines too low; line them up at the bottom instead
  copy.querySelectorAll(".fl").forEach((el) => { el.style.alignItems = "flex-end"; });
  copy.querySelectorAll(".fl .ln").forEach((el) => { el.style.lineHeight = "1.25"; el.style.paddingBottom = "6pt"; });
  holder.appendChild(copy);
  document.body.appendChild(holder);
  try {
    await Promise.all([...copy.querySelectorAll("img")].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    const W = copy.offsetWidth, H = copy.offsetHeight;
    const top0 = copy.getBoundingClientRect().top;
    // places where a page may end: below a question, a passage or a heading
    const cuts = [...copy.querySelectorAll(".mq,.bq,.bp,.pass,.sec,.div,.box,.end")]
      .map((el) => el.getBoundingClientRect().bottom - top0 + 2).filter((y) => y > 0 && y < H).sort((a, b) => a - b);

    // big enough to print sharply, small enough for a phone's memory
    const scale = Math.max(1, Math.min(2.2, Math.sqrt(15e6 / (W * H))));
    const canvas = await html2canvas(copy, { scale, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: W + 40 });

    const pxPerPt = W / A3.w;
    const pageH = A3.h * pxPerPt;
    const pages = [];
    let y = 0;
    while (y < H - 4) {
      let end = Math.min(H, y + pageH);
      if (end < H) {
        const ok = cuts.filter((c) => c > y + pageH * 0.4 && c <= end);
        if (ok.length) end = ok[ok.length - 1];
      }
      const part = document.createElement("canvas");
      part.width = canvas.width;
      part.height = Math.ceil((end - y) * scale);
      const ctx = part.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, part.width, part.height);
      ctx.drawImage(canvas, 0, Math.floor(y * scale), canvas.width, part.height, 0, 0, part.width, part.height);
      pages.push({ canvas: part, hPt: (end - y) / pxPerPt });
      y = end;
    }
    return pages;
  } finally {
    holder.remove();
  }
}

export async function paperPdf(sheet, base) {
  const [{ jsPDF }, pages] = await Promise.all([import("jspdf"), renderPages(sheet)]);
  const pdf = new jsPDF({ unit: "pt", format: "a3", orientation: "portrait", compress: true });
  pages.forEach((p, i) => {
    if (i) pdf.addPage("a3", "portrait");
    pdf.addImage(p.canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, A3.w, p.hPt);
  });
  return [new File([pdf.output("blob")], `${base}.pdf`, { type: "application/pdf" })];
}

export async function paperPngs(sheet, base) {
  const pages = await renderPages(sheet);
  return Promise.all(pages.map((p, i) => new Promise((res) => p.canvas.toBlob((b) =>
    res(new File([b], pages.length > 1 ? `${base} - page ${i + 1}.png` : `${base}.png`, { type: "image/png" })), "image/png"))));
}

// ───────────────────────── editable Word document ─────────────────────────
// $...$ maths becomes plain text with real superscripts / subscripts where possible
const TEX = { "\\times": "×", "\\div": "÷", "\\pm": "±", "\\le": "≤", "\\leq": "≤", "\\ge": "≥", "\\geq": "≥", "\\ne": "≠", "\\neq": "≠",
  "\\pi": "π", "\\theta": "θ", "\\alpha": "α", "\\beta": "β", "\\degree": "°", "\\circ": "°", "\\cdot": "·", "\\infty": "∞", "\\angle": "∠",
  "\\triangle": "△", "\\therefore": "∴", "\\approx": "≈", "\\rightarrow": "→", "\\to": "→", "\\%": "%", "\\left": "", "\\right": "", "\\,": " ", "\\;": " ", "\\ ": " " };
function texRuns(tex) {
  let s = tex;
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${a.length > 1 ? `(${a})` : a}/${b.length > 1 ? `(${b})` : b}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)").replace(/\\text\{([^{}]*)\}/g, "$1").replace(/\\mathrm\{([^{}]*)\}/g, "$1");
  }
  Object.entries(TEX).forEach(([k, v]) => { s = s.split(k).join(v); });
  // split into normal / ^superscript / _subscript pieces
  const out = [];
  const re = /([\^_])(\{([^{}]*)\}|(.))/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    out.push({ t: m[3] ?? m[4], sup: m[1] === "^", sub: m[1] === "_" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out.map((r) => ({ ...r, t: r.t.replace(/[{}]/g, "").replace(/\\/g, "") }));
}
function richPieces(text) {
  const src = String(text ?? "");
  const out = [];
  const re = /\$([^$\n]+)\$/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: src.slice(last, m.index) });
    out.push(...texRuns(m[1]));
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: src.slice(last) });
  return out;
}

async function imageData(src) {
  if (!src) return null;
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    // Word wants PNG / JPG / GIF / BMP: anything else is redrawn as PNG
    const bmp = await createImageBitmap(blob);
    let data, type = /jpe?g/.test(blob.type) ? "jpg" : blob.type.includes("png") ? "png" : "";
    if (type) data = new Uint8Array(await blob.arrayBuffer());
    else {
      const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
      c.getContext("2d").drawImage(bmp, 0, 0);
      data = new Uint8Array(await (await new Promise((r) => c.toBlob(r, "image/png"))).arrayBuffer()); type = "png";
    }
    return { data, type, w: bmp.width, h: bmp.height };
  } catch { return null; }
}

export async function paperDocx(doc, keyOn, base) {
  const D = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, TabStopType, VerticalAlign, TableLayoutType } = D;
  const h = doc.header;
  const rtl = h.lang === "ur";
  const A = doc.partA, B = doc.partB || [];
  const font = rtl ? "Jameel Noori Nastaleeq" : "Calibri";
  const latin = "Calibri";
  const GREEN = "0B7A3E";
  const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
  const thick = { style: BorderStyle.SINGLE, size: 24, color: "000000" };

  // A3 page, margins about 1.7 cm / 1.4 cm
  const PAGE = { width: 16838, height: 23811 }, MX = 1000, MY = 800;
  const CONTENT = PAGE.width - 2 * MX; // twips

  const run = (t, o = {}) => new TextRun({ text: t, font: o.latin ? latin : font, size: o.size || (rtl ? 24 : 21), bold: o.bold, italics: o.italics, color: o.color,
    superScript: o.sup, subScript: o.sub, rightToLeft: rtl && !o.latin });
  const rich = (text, o = {}) => richPieces(text).flatMap((p) => {
    const lines = p.t.split("\n");
    return lines.map((line, i) => new TextRun({ text: line, break: i ? 1 : 0, font, size: o.size || (rtl ? 24 : 21), bold: o.bold, italics: o.italics, color: o.color, superScript: p.sup, subScript: p.sub, rightToLeft: rtl }));
  });
  const para = (children, o = {}) => new Paragraph({ children, bidirectional: rtl, alignment: o.align || (rtl ? AlignmentType.RIGHT : AlignmentType.LEFT),
    spacing: { before: o.before ?? 0, after: o.after ?? 60, line: rtl ? 360 : 264 }, tabStops: o.tabs, keepNext: o.keepNext, keepLines: true });
  const center = (children, o = {}) => para(children, { ...o, align: AlignmentType.CENTER });

  async function picture(src, maxW, maxH) {
    const im = await imageData(src);
    if (!im) return null;
    const k = Math.min(1, maxW / im.w, maxH / im.h);
    return new ImageRun({ type: im.type, data: im.data, transformation: { width: Math.round(im.w * k), height: Math.round(im.h * k) } });
  }

  // ── header box: logo | titles | QR ──
  const [logo, qr] = await Promise.all([h.logo ? picture(h.logo, 110, 110) : null, h.qr ? picture(h.qr, 105, 105) : null]);
  const titles = [
    center([run(h.title || "", { bold: true, size: 40, latin: true })]),
    center([run(`${h.gradeLabel || ""}${h.version ? ` · ${h.version.toUpperCase()}` : ""}`, { bold: true, size: 36, latin: true })]),
    center([run(`SUBJECT: ${h.subjectTitle || ""}`, { bold: true, size: 36, latin: true })]),
  ];
  const side = 1900;
  const headRow = (logo || qr)
    ? new Table({ width: { size: CONTENT - 400, type: WidthType.DXA }, columnWidths: [side, CONTENT - 400 - 2 * side, side], borders: noBorders, layout: TableLayoutType.FIXED,
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: side, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ children: logo ? [logo] : [] })] }),
          new TableCell({ width: { size: CONTENT - 400 - 2 * side, type: WidthType.DXA }, children: titles }),
          new TableCell({ width: { size: side, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: qr ? [qr] : [] })] }),
        ] })] })
    : null;

  const aTotal = (A.plain.length + (A.passage?.questions.length || 0)) * A.marksEach;
  const bTotal = B.reduce((t, blk) => t + blk.parts.reduce((x, p) => x + p.marks, 0), 0);
  const lineTab = [{ type: TabStopType.RIGHT, position: CONTENT - 500, leader: "underscore" }];
  const box = new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], layout: TableLayoutType.FIXED,
    borders: { top: thick, bottom: thick, left: thick, right: thick, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ children: [new TableCell({ width: { size: CONTENT, type: WidthType.DXA }, margins: { top: 120, bottom: 100, left: 200, right: 200 }, children: [
      ...(headRow ? [headRow] : titles),
      center([run(`[Part A: ${fmtN(aTotal)} Marks Part B: ${fmtN(bTotal)} Marks Total: ${fmtN(aTotal + bTotal)} Marks]`, { bold: true, size: 24, latin: true })], { before: 120 }),
      new Paragraph({ tabStops: lineTab, spacing: { before: 80, after: 40 }, children: [run("School Name:  ", { bold: true, size: 23, latin: true }), run(h.school || "", { bold: true, size: 23, latin: true }), run("\t", { latin: true })] }),
      new Paragraph({ spacing: { before: 140, after: 40 }, children: [
        run("Student Name : ", { bold: true, size: 22, latin: true }), run("_____________________________   ", { latin: true }),
        run("Roll Number : ", { bold: true, size: 22, latin: true }), run("_______________   ", { latin: true }),
        run("Section : ", { bold: true, size: 22, latin: true }), run("_______________", { latin: true }),
      ] }),
    ] })] })],
  });

  const children = [box];
  const heading = (t) => center([run(t, { bold: true, size: rtl ? 30 : 33 })], { before: 240, after: 120, keepNext: true });

  // ── Part A: MCQs in two columns ──
  const half = Math.floor((CONTENT - 300) / 2);
  const mcqCell = async (q, n) => {
    const out = [para([run(rtl ? `سوال نمبر ${n}: ` : `Question No.${n} : `, { bold: true }), ...rich(q.text, { bold: true })], { after: 40, keepNext: true })];
    if (q.image) { const im = await picture(q.image, 300, 200); if (im) out.push(center([im], { keepNext: true })); }
    const lay = optionLayout(q.opts);
    const opt = (o, i) => {
      const ok = keyOn && q.correct === "ABCD"[i];
      return [run(`(${"abcd"[i]}) `, { latin: true, bold: ok, color: ok ? GREEN : undefined }), ...rich(o, { bold: ok, color: ok ? GREEN : undefined })];
    };
    const opts = (q.opts || []).map((o, i) => (o ? opt(o, i) : null)).filter(Boolean);
    const tab = (k) => Array.from({ length: k - 1 }, (_, i) => ({ type: TabStopType.LEFT, position: Math.round((half / k) * (i + 1)) }));
    // Urdu: right-to-left tab stops spread the options unevenly in Word, so they are spaced instead
    if (rtl && lay !== "list") {
      const per = lay === "row" ? 4 : 2;
      for (let i = 0; i < opts.length; i += per) out.push(para(opts.slice(i, i + per).flatMap((o, j) => (j ? [run("          "), ...o] : o)), { after: i + per >= opts.length ? 120 : 20 }));
    } else if (lay === "row") out.push(para(opts.flatMap((o, i) => (i ? [run("\t"), ...o] : o)), { tabs: tab(4), after: 120 }));
    else if (lay === "grid") {
      for (let i = 0; i < opts.length; i += 2) out.push(para([...opts[i], ...(opts[i + 1] ? [run("\t"), ...opts[i + 1]] : [])], { tabs: tab(2), after: i + 2 >= opts.length ? 120 : 20 }));
    } else opts.forEach((o, i) => out.push(para(o, { after: i === opts.length - 1 ? 120 : 20 })));
    return out;
  };
  const mcqTable = async (list, startN) => {
    const cells = await Promise.all(list.map((q, i) => mcqCell(q, startN + i)));
    const rows = [];
    for (let i = 0; i < cells.length; i += 2) {
      rows.push(new TableRow({ cantSplit: true, children: [cells[i], cells[i + 1] || [new Paragraph("")]].map((c) =>
        new TableCell({ width: { size: half, type: WidthType.DXA }, margins: { left: 60, right: 140 }, children: c })) }));
    }
    return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [half + 150, half + 150], borders: noBorders, layout: TableLayoutType.FIXED, visuallyRightToLeft: rtl, rows });
  };

  let n = 0;
  if (aTotal > 0) {
    children.push(heading(rtl ? "حصہ اول: معروضی سوالات" : "OBJECTIVE PART(MCQs)"));
    if (A.plain.length) { children.push(await mcqTable(A.plain, 1)); n = A.plain.length; }
    if (A.passage) {
      children.push(para([run(rtl ? "پیراگراف ہدایات" : "Paragraph Instruction", { bold: true })], { before: 120, keepNext: true }));
      if (A.passage.instruction) children.push(para(rich(A.passage.instruction, { bold: true }), { keepNext: true }));
      if (A.passage.image) { const im = await picture(A.passage.image, 260, 260); if (im) children.push(center([im])); }
      children.push(para(rich(A.passage.text), { after: 160 }));
      children.push(await mcqTable(A.passage.questions, n + 1));
    }
  }

  // ── Part B ──
  if (B.length) {
    children.push(heading(rtl ? "حصہ دوم: انشائیہ سوالات" : "SUBJECTIVE PART(CRQs)"));
    for (const blk of B) {
      children.push(para([run(rtl ? `سوال نمبر ${blk.no}` : `Question No: ${blk.no}`, { bold: true })], { before: 160, keepNext: true }));
      for (let pj = 0; pj < blk.parts.length; pj++) {
        const pt = blk.parts[pj];
        const label = blk.parts.length > 1 ? [run(`${labelFor(pj, h.lang)} `, { bold: true, latin: true })] : [];
        children.push(para([...label, ...rich(pt.q.text, { bold: true }), run(rtl ? ` (${fmtN(pt.marks)} نمبر)` : ` (${fmtN(pt.marks)} Marks)`, { bold: true })], { before: 100, after: 80 }));
        if (pt.q.image) { const im = await picture(pt.q.image, 360, 240); if (im) children.push(center([im])); }
        if (keyOn) {
          const ans = `${pt.q.qtype === "true_false" ? pt.q.correct || "" : ""} ${pt.q.answer || ""}`.trim();
          if (ans) children.push(para([run(rtl ? "جواب: " : "Answer: ", { italics: true, color: GREEN }), ...rich(ans, { italics: true, color: GREEN })]));
        }
      }
    }
  }

  const file = new Document({
    creator: "Centre of Excellence Sialkot (Boys)", title: base,
    styles: { default: { document: { run: { font, size: 21 } } } },
    sections: [{ properties: { page: { size: PAGE, margin: { top: MY, bottom: MY, left: MX, right: MX } } }, children }],
  });
  const blob = await Packer.toBlob(file);
  return [new File([blob], `${base}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })];
}

// ───────────────────────── hand the files to the teacher ─────────────────────────
// Phones: the share sheet (save to Files / Downloads, or send on WhatsApp).
// Computers: a normal download; several PNG pages come as one .zip.
export async function deliver(files, zipName) {
  const phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (phone && navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files, title: files[0].name }); return "shared"; }
    catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  }
  let blob = files[0], name = files[0].name;
  if (files.length > 1) {
    const JSZip = (await import("jszip")).default;
    const z = new JSZip();
    files.forEach((f) => z.file(f.name, f));
    blob = await z.generateAsync({ type: "blob" });
    name = zipName;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return "saved";
}
