// One-page result sheets, summary sheets and comparison sheets.
//
// Everything here is pure: it takes the data from /api/award-list/results-data
// and turns it into "pages". Each page knows how to draw itself on an
// A4-landscape canvas, so the Exams page can send the same pages to PDF
// at any resolution.

import { bandFor } from "./resultCardConfig";
import { colourForSection, overallRemark } from "./resultCardConfig";

export const PAGE_W = 1754;   // A4 landscape on a 1240-wide grid
export const PAGE_H = 1240;
export const PASS_PCT = 40;   // same pass mark as the proformas

const NAVY = "#1F4973";
const INK = "#14141C";
const MUTED = "#78788C";
const GOLD = "#C9922A";
const HAIR = "#D7D7E1";
const RED = "#B91C1C";
const ROWS_PER_PAGE = 54;

const SHORT = {
  "Tarjuma-tul-Qur'an (THQ)": "THQ",
  "History & Geography": "Hist & Geo",
  "General Science": "Gen Science",
  "Computer Science": "Comp Science",
  "Computer Science / Biology": "CS / Biology",
  "Pakistan Studies": "Pak Studies",
};
const shortName = (s) => SHORT[s] || s;
const F = (w, s) => `${w} ${s}px Arial, Helvetica, sans-serif`;

function put(ctx, str, x, y, font, fill, align = "left") {
  ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(String(str ?? ""), x, y);
}
function fit(ctx, str, maxW, weight, size) {
  let s = size; ctx.font = F(weight, s);
  while (s > 8 && ctx.measureText(String(str)).width > maxW) { s -= 0.5; ctx.font = F(weight, s); }
  return s;
}
const fmt = (n, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toFixed(d));

// ---------------------------------------------------------------- data

// "section" level -> one unit per section; "class" level -> one per class
// (only the selected sections of that class).
export function buildUnits(data, selectedCodes, level) {
  const sel = new Set(selectedCodes);
  const units = [];
  data.classes.forEach((cl) => {
    const secs = cl.sections.filter((s) => sel.has(s.code));
    if (!secs.length) return;
    const decorate = (sec) => sec.students.map((st) => ({ ...st, sectionName: sec.name, max: sec.max }));
    if (level === "section") {
      secs.forEach((sec) => units.push({
        key: sec.code, kind: "section", classNum: cl.class, subjects: cl.subjects,
        title: `Class ${cl.class} — ${sec.label}`, short: `${cl.class} ${sec.name}`,
        incharge: sec.incharge, accent: colourForSection(sec.label),
        max: sec.max, students: decorate(sec), classRanked: cl.ranked,
      }));
    } else {
      const all = secs.length === cl.sections.length;
      const max = secs[0].max;
      units.push({
        key: "class-" + cl.class, kind: "class", classNum: cl.class, subjects: cl.subjects,
        title: `Class ${cl.class}${all ? "" : " (selected sections)"}`,
        short: `Class ${cl.class}`,
        incharge: secs.map((s) => s.name).join(", "), accent: NAVY,
        max, students: secs.flatMap(decorate), classRanked: cl.ranked,
        sectionNames: secs.map((s) => s.name),
      });
    }
  });
  return units;
}

export function statsFor(unit) {
  const st = unit.students;
  const appeared = st.filter((s) => s.entered > 0);
  const pcts = appeared.map((s) => s.pct).filter((p) => p !== null);
  const grades = {};
  appeared.forEach((s) => { const g = bandFor(s.pct)?.grade; if (g) grades[g] = (grades[g] || 0) + 1; });
  const passed = pcts.filter((p) => p >= PASS_PCT).length;
  const top = [...appeared].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0];
  const subj = {};
  unit.subjects.forEach((sub) => {
    let sum = 0, n = 0, pass = 0;
    st.forEach((s) => {
      const v = s.marks[sub], mx = s.max?.[sub];
      if (v === null || v === undefined || !mx) return;
      const p = (v / mx) * 100; sum += p; n++; if (p >= PASS_PCT) pass++;
    });
    subj[sub] = { avg: n ? sum / n : null, passPct: n ? (pass / n) * 100 : null, n };
  });
  return {
    students: st.length, appeared: appeared.length, passed,
    passPct: appeared.length ? (passed / appeared.length) * 100 : null,
    avg: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
    highest: pcts.length ? Math.max(...pcts) : null,
    lowest: pcts.length ? Math.min(...pcts) : null,
    grades, top, subj,
  };
}

// ----------------------------------------------------------- pagination

function chunk(list, perPage) {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const per = Math.ceil(list.length / pages) || 1;
  return Array.from({ length: pages }, (_, i) => list.slice(i * per, (i + 1) * per));
}

// Section-wise: one page per section (more only if a section is huge).
// Class-wise: whole class in merit order, section column, as many pages as needed.
export function resultPages(data, units) {
  const pages = [];
  units.forEach((u) => {
    let rows = u.students.map((s) => ({ ...s }));
    if (u.kind === "class") {
      rows.sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) ||
        a.sectionName.localeCompare(b.sectionName) || a.roll.localeCompare(b.roll, undefined, { numeric: true }));
    }
    const parts = chunk(rows, ROWS_PER_PAGE);
    parts.forEach((part, i) => pages.push({
      draw: (ctx, o) => drawResultTable(ctx, {
        unit: u, rows: part, examLine: data.examLine, pageNo: i + 1, pageCount: parts.length,
      }, o),
    }));
  });
  return pages;
}

export function summaryPages(data, units, level) {
  const rows = units.map((u) => ({ unit: u, st: statsFor(u) }));
  // overall row across everything selected
  let total = null;
  if (units.length > 1) {
    const all = { subjects: [], students: units.flatMap((u) => u.students), max: {} };
    total = { unit: { short: "ALL SELECTED", title: "All selected", accent: NAVY, students: all.students, subjects: [] }, st: statsFor(all) };
  }
  const parts = chunk(rows, 26);
  return parts.map((part, i) => ({
    draw: (ctx, o) => drawSummary(ctx, {
      rows: part, total: i === parts.length - 1 ? total : null, level, examLine: data.examLine,
      pageNo: i + 1, pageCount: parts.length,
    }, o),
  }));
}

export function comparisonPages(data, units, level) {
  const rows = units.map((u) => ({ unit: u, st: statsFor(u) }));
  const pages = [];
  // Subjects differ between Classes 6-8 and 9-10, so group by subject list
  const groups = [];
  rows.forEach((r) => {
    const key = r.unit.subjects.join("|");
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, subjects: r.unit.subjects, rows: [] }));
    g.rows.push(r);
  });
  groups.forEach((g) => {
    const parts = chunk(g.rows, 24);
    parts.forEach((part, i) => pages.push({
      draw: (ctx, o) => drawComparison(ctx, {
        rows: part, subjects: g.subjects, level, examLine: data.examLine,
        pageNo: i + 1, pageCount: parts.length,
      }, o),
    }));
  });
  pages.push({ draw: (ctx, o) => drawRanking(ctx, { rows, level, examLine: data.examLine }, o) });
  return pages;
}

// -------------------------------------------------------------- drawing

function header(ctx, o, accent, line1, line2, line3, logos) {
  const colour = o.style === "colour", W = PAGE_W, HEAD_H = 112;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, PAGE_H);
  if (colour) { ctx.fillStyle = accent; ctx.fillRect(0, 0, W, HEAD_H); }
  else { ctx.fillStyle = accent; ctx.fillRect(0, HEAD_H - 4, W, 4); }
  const ink = colour ? "#fff" : INK, sub = colour ? "#ffffffcc" : MUTED, S = 80;
  const lg = o.logos || {};
  if (lg.authority) { ctx.save(); ctx.beginPath(); ctx.arc(30 + S / 2, HEAD_H / 2 - 2, S / 2, 0, 7); ctx.clip(); ctx.drawImage(lg.authority, 30, HEAD_H / 2 - 2 - S / 2, S, S); ctx.restore(); }
  if (lg.punjab) { ctx.save(); ctx.beginPath(); ctx.arc(W - 30 - S / 2, HEAD_H / 2 - 2, S / 2, 0, 7); ctx.clip(); ctx.drawImage(lg.punjab, W - 30 - S, HEAD_H / 2 - 2 - S / 2, S, S); ctx.restore(); }
  put(ctx, "CENTRE OF EXCELLENCE SIALKOT (BOYS)", W / 2, 28, F("bold", 26), ink, "center");
  put(ctx, line1, W / 2, 60, F("bold", 21), ink, "center");
  put(ctx, line2, W / 2, 90, F("normal", 15), sub, "center");
  return HEAD_H;
}

function footer(ctx, note, pageNo, pageCount) {
  const y = PAGE_H - 16;
  put(ctx, note, 30, y, F("normal", 12), MUTED);
  const right = (pageCount > 1 ? `Page ${pageNo} of ${pageCount}   ·   ` : "") + "coesialkot.com";
  put(ctx, right, PAGE_W - 30, y, F("bold", 12), GOLD, "right");
}

function drawResultTable(ctx, spec, o) {
  const { unit, rows, examLine, pageNo, pageCount } = spec;
  const colour = o.style === "colour", accent = unit.accent, M = 30, W = PAGE_W;
  const subjects = unit.subjects, nSub = subjects.length;
  const showSec = unit.kind === "class";
  const HEAD_H = header(ctx, o, accent,
    `${showSec ? "CLASS" : "SECTION"} RESULT SHEET  ·  ${unit.title}`, "", "", o.logos);
  // sub line (drawn after header so it can use counts)
  const sub = colour ? "#ffffffcc" : MUTED;
  put(ctx, `${examLine}   |   ${showSec ? "Sections: " : "Class Incharge: "}${unit.incharge || "—"}   |   Students: ${unit.students.length}`,
      W / 2, 90, F("normal", 15), sub, "center");

  const tableW = W - M * 2;
  const fixed = { pos: 62, roll: 56, sec: showSec ? 78 : 0, tot: 112, pct: 70, grd: 52 };
  const subW = 92;
  const rest = tableW - fixed.pos - fixed.roll - fixed.sec - fixed.tot - fixed.pct - fixed.grd - subW * nSub;
  const cols = []; let x = M;
  const add = (key, w, align) => { cols.push({ key, x, w, align }); x += w; };
  add("pos", fixed.pos, "center"); add("roll", fixed.roll, "center");
  if (showSec) add("sec", fixed.sec, "center");
  add("name", rest / 2, "left"); add("father", rest / 2, "left");
  subjects.forEach((s, i) => add("s" + i, subW, "center"));
  add("tot", fixed.tot, "center"); add("pct", fixed.pct, "center"); add("grd", fixed.grd, "center");

  const top = HEAD_H + 14, hdrH = 46, maxH = 22, footH = 26;
  const avail = PAGE_H - top - hdrH - maxH - footH - 8;
  const rowH = Math.max(13, Math.min(30, avail / Math.max(rows.length, 1)));
  const fs = Math.max(9.5, Math.min(15, rowH * 0.62));

  ctx.fillStyle = colour ? accent : "#fff"; ctx.fillRect(M, top, tableW, hdrH);
  if (!colour) { ctx.fillStyle = accent; ctx.fillRect(M, top + hdrH - 2, tableW, 2); }
  const hInk = colour ? "#fff" : accent;
  const titles = { pos: "Pos", roll: "Roll", sec: "Section", name: "Student", father: "Father", pct: "%", grd: "Grade" };
  cols.forEach((c) => {
    const cx = c.align === "left" ? c.x + 8 : c.x + c.w / 2;
    if (c.key.startsWith("s") && c.key !== "sec") {
      const label = shortName(subjects[+c.key.slice(1)]);
      const sp = label.lastIndexOf(" ");
      if (label.length > 11 && sp > 0) {
        put(ctx, label.slice(0, sp), cx, top + hdrH / 2 - 9, F("bold", 13), hInk, "center");
        put(ctx, label.slice(sp + 1), cx, top + hdrH / 2 + 9, F("bold", 13), hInk, "center");
      } else put(ctx, label, cx, top + hdrH / 2, F("bold", 14), hInk, "center");
    } else if (c.key === "tot") {
      put(ctx, "Obtained", cx, top + hdrH / 2 - 9, F("bold", 13), hInk, "center");
      put(ctx, "/ Total", cx, top + hdrH / 2 + 9, F("bold", 13), hInk, "center");
    } else put(ctx, titles[c.key], cx, top + hdrH / 2, F("bold", 14), hInk, c.align);
  });

  const my = top + hdrH;
  ctx.fillStyle = "#EEF1F6"; ctx.fillRect(M, my, tableW, maxH);
  put(ctx, "Maximum marks", cols.find((c) => c.key === "name").x + 8, my + maxH / 2, F("bold", 12), MUTED);
  let maxSum = 0;
  cols.forEach((c) => {
    if (c.key.startsWith("s") && c.key !== "sec") {
      const m = unit.max[subjects[+c.key.slice(1)]];
      if (m != null) maxSum += Number(m);
      put(ctx, m ?? "—", c.x + c.w / 2, my + maxH / 2, F("bold", 13), INK, "center");
    }
  });
  put(ctx, maxSum || "", cols.find((c) => c.key === "tot").x + 56, my + maxH / 2, F("bold", 13), INK, "center");

  const y0 = my + maxH;
  rows.forEach((r, i) => {
    const y = y0 + i * rowH, cy = y + rowH / 2;
    if (i % 2 === 1) { ctx.fillStyle = colour ? accent + "14" : "#F6F7FA"; ctx.fillRect(M, y, tableW, rowH); }
    const band = bandFor(r.pct);
    cols.forEach((c) => {
      const cx = c.align === "left" ? c.x + 8 : c.x + c.w / 2;
      if (c.key === "pos") put(ctx, r.position ?? "—", cx, cy, F("bold", fs), accent, "center");
      else if (c.key === "roll") put(ctx, r.roll, cx, cy, F("normal", fs), INK, "center");
      else if (c.key === "sec") put(ctx, r.sectionName, cx, cy, F("normal", fs), INK, "center");
      else if (c.key === "name" || c.key === "father") {
        const str = c.key === "name" ? r.name : r.father, w = c.key === "name" ? "bold" : "normal";
        put(ctx, str, cx, cy, F(w, fit(ctx, str, c.w - 14, w, fs)), INK, "left");
      } else if (c.key === "tot") put(ctx, r.entered ? `${r.obtained} / ${r.outOf}` : "—", cx, cy, F("bold", fs), INK, "center");
      else if (c.key === "pct") put(ctx, fmt(r.pct), cx, cy, F("normal", fs), INK, "center");
      else if (c.key === "grd") {
        if (!band) put(ctx, "—", cx, cy, F("normal", fs), MUTED, "center");
        else if (colour) {
          const bw = Math.min(c.w - 10, 38), bh = Math.min(rowH - 3, 20);
          ctx.fillStyle = band.colour; ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 4) : ctx.rect(cx - bw / 2, cy - bh / 2, bw, bh);
          ctx.fill(); put(ctx, band.grade, cx, cy, F("bold", Math.min(fs, 13)), "#fff", "center");
        } else put(ctx, band.grade, cx, cy, F("bold", fs), band.colour, "center");
      } else {
        const sub = subjects[+c.key.slice(1)], v = r.marks[sub], mx = unit.max[sub];
        if (v === null || v === undefined) put(ctx, "—", cx, cy, F("normal", fs), MUTED, "center");
        else {
          const low = mx && (v / mx) * 100 < 40;
          put(ctx, v, cx, cy, F(low ? "bold" : "normal", fs), low ? RED : INK, "center");
        }
      }
    });
    ctx.fillStyle = HAIR; ctx.fillRect(M, y + rowH - 0.5, tableW, 0.6);
  });

  const tableH = hdrH + maxH + rowH * rows.length;
  ctx.strokeStyle = colour ? accent : "#9AA3B2"; ctx.lineWidth = 1.2; ctx.strokeRect(M, top, tableW, tableH);
  ctx.strokeStyle = HAIR; ctx.lineWidth = 0.7;
  cols.forEach((c, i) => { if (i) { ctx.beginPath(); ctx.moveTo(c.x, top + (colour ? hdrH : 0)); ctx.lineTo(c.x, top + tableH); ctx.stroke(); } });
  footer(ctx,
    `Marks below 40% of a subject's maximum are in red.  “—” = not entered.  Position is across the whole class` +
    (showSec ? ", listed in merit order." : "."), pageNo, pageCount);
}

function tableChrome(ctx, o, M, top, tableW, hdrH, totalH, accent) {
  const colour = o.style === "colour";
  ctx.fillStyle = colour ? accent : "#fff"; ctx.fillRect(M, top, tableW, hdrH);
  if (!colour) { ctx.fillStyle = accent; ctx.fillRect(M, top + hdrH - 2, tableW, 2); }
}

function drawSummary(ctx, spec, o) {
  const { rows, total, level, examLine, pageNo, pageCount } = spec;
  const colour = o.style === "colour", accent = NAVY, M = 30, W = PAGE_W;
  const HEAD_H = header(ctx, o, accent,
    `SUMMARY SHEET  ·  ${level === "class" ? "Class-wise" : "Section-wise"}`, "", "", o.logos);
  put(ctx, `${examLine}   |   Pass mark ${PASS_PCT}%`, W / 2, 90, F("normal", 15), colour ? "#ffffffcc" : MUTED, "center");

  const gradeKeys = ["A+", "A", "B", "C", "D", "E", "F", "FF"];
  const cols = []; let x = M; const tableW = W - M * 2;
  const widths = [["unit", 190, "left"], ["students", 78], ["appeared", 84], ["passed", 74], ["passPct", 76],
    ["avg", 80], ["highest", 84], ["lowest", 80], ...gradeKeys.map((g) => ["g" + g, 54]), ["top", 0, "left"]];
  const fixedSum = widths.reduce((a, w) => a + w[1], 0);
  widths.forEach(([k, w, al]) => { const ww = w || tableW - fixedSum; cols.push({ key: k, x, w: ww, align: al || "center" }); x += ww; });
  const titles = { unit: unitHead(level), students: "Students", appeared: "Appeared", passed: "Passed", passPct: "Pass %",
    avg: "Average %", highest: "Highest %", lowest: "Lowest %", top: "Top student" };
  gradeKeys.forEach((g) => (titles["g" + g] = g));

  const top = HEAD_H + 20, hdrH = 44;
  const all = rows.length + (total ? 1 : 0);
  const rowH = Math.min(36, (PAGE_H - top - hdrH - 70) / Math.max(all, 1));
  const fs = Math.min(15, rowH * 0.5);
  tableChrome(ctx, o, M, top, tableW, hdrH, 0, accent);
  const hInk = colour ? "#fff" : accent;
  cols.forEach((c) => put(ctx, titles[c.key], c.align === "left" ? c.x + 10 : c.x + c.w / 2, top + hdrH / 2, F("bold", 14), hInk, c.align));

  const drawRow = (r, i, isTotal) => {
    const y = top + hdrH + i * rowH, cy = y + rowH / 2, st = r.st;
    if (isTotal) { ctx.fillStyle = colour ? accent + "26" : "#E8ECF2"; ctx.fillRect(M, y, tableW, rowH); }
    else if (i % 2) { ctx.fillStyle = colour ? accent + "12" : "#F6F7FA"; ctx.fillRect(M, y, tableW, rowH); }
    const bold = isTotal ? "bold" : "normal";
    cols.forEach((c) => {
      const cx = c.align === "left" ? c.x + 10 : c.x + c.w / 2;
      let v = "";
      if (c.key === "unit") { put(ctx, r.unit.short, cx, cy, F("bold", fs), r.unit.accent === NAVY ? INK : r.unit.accent, "left"); return; }
      if (c.key === "students") v = st.students; else if (c.key === "appeared") v = st.appeared;
      else if (c.key === "passed") v = st.passed; else if (c.key === "passPct") v = fmt(st.passPct);
      else if (c.key === "avg") v = fmt(st.avg, 2); else if (c.key === "highest") v = fmt(st.highest);
      else if (c.key === "lowest") v = fmt(st.lowest);
      else if (c.key === "top") {
        const t = st.top; v = t ? `${t.name} (${fmt(t.pct)}%)` : "—";
        put(ctx, v, cx, cy, F(bold, fit(ctx, v, c.w - 16, bold, fs)), INK, "left"); return;
      } else v = st.grades[c.key.slice(1)] || 0;
      const faded = c.key.startsWith("g") && v === 0;
      put(ctx, v, cx, cy, F(c.key === "avg" || c.key === "passPct" ? "bold" : bold, fs), faded ? "#B8BCC8" : INK, "center");
    });
    ctx.fillStyle = HAIR; ctx.fillRect(M, y + rowH - 0.5, tableW, 0.6);
  };
  rows.forEach((r, i) => drawRow(r, i, false));
  if (total) drawRow(total, rows.length, true);

  const tableH = hdrH + rowH * all;
  ctx.strokeStyle = colour ? accent : "#9AA3B2"; ctx.lineWidth = 1.2; ctx.strokeRect(M, top, tableW, tableH);
  ctx.strokeStyle = HAIR; ctx.lineWidth = 0.7;
  cols.forEach((c, i) => { if (i) { ctx.beginPath(); ctx.moveTo(c.x, top + (colour ? hdrH : 0)); ctx.lineTo(c.x, top + tableH); ctx.stroke(); } });
  footer(ctx, `Appeared = students with at least one mark.  Passed = overall % of ${PASS_PCT} or more.  Average, highest and lowest are of students who appeared.`, pageNo, pageCount);
}

const unitHead = (level) => (level === "class" ? "Class" : "Section");

function heat(p, colour) {
  if (p === null || p === undefined) return null;
  const t = Math.max(0, Math.min(1, (p - 35) / 40));
  return `hsl(${Math.round(t * 120)}, 62%, ${colour ? 80 : 94}%)`;
}

function drawComparison(ctx, spec, o) {
  const { rows, subjects, level, examLine, pageNo, pageCount } = spec;
  const colour = o.style === "colour", accent = NAVY, M = 30, W = PAGE_W;
  const HEAD_H = header(ctx, o, accent,
    `COMPARISON SHEET  ·  Subject-wise average %  ·  ${level === "class" ? "Classes" : "Sections"}`, "", "", o.logos);
  put(ctx, `${examLine}   |   Average % of the marks entered in each subject   |   Green = stronger, red = weaker`,
      W / 2, 90, F("normal", 15), colour ? "#ffffffcc" : MUTED, "center");

  const tableW = W - M * 2, nSub = subjects.length;
  const unitW = 190, extraW = 96, subW = (tableW - unitW - extraW * 3) / nSub;
  const cols = []; let x = M;
  cols.push({ key: "unit", x, w: unitW }); x += unitW;
  subjects.forEach((s, i) => { cols.push({ key: "s" + i, x, w: subW }); x += subW; });
  ["overall", "pass", "rank"].forEach((k) => { cols.push({ key: k, x, w: extraW }); x += extraW; });

  const top = HEAD_H + 20, hdrH = 52;
  const nRows = rows.length + 1; // + best row
  const rowH = Math.min(40, (PAGE_H - top - hdrH - 70) / nRows);
  const fs = Math.min(16, rowH * 0.5);
  tableChrome(ctx, o, M, top, tableW, hdrH, 0, accent);
  const hInk = colour ? "#fff" : accent;
  cols.forEach((c) => {
    const cx = c.key === "unit" ? c.x + 10 : c.x + c.w / 2, al = c.key === "unit" ? "left" : "center";
    if (c.key.startsWith("s") && c.key !== "unit") {
      const label = shortName(subjects[+c.key.slice(1)]), sp = label.lastIndexOf(" ");
      if (label.length > 11 && sp > 0) {
        put(ctx, label.slice(0, sp), cx, top + hdrH / 2 - 9, F("bold", 14), hInk, al);
        put(ctx, label.slice(sp + 1), cx, top + hdrH / 2 + 9, F("bold", 14), hInk, al);
      } else put(ctx, label, cx, top + hdrH / 2, F("bold", 15), hInk, al);
    } else {
      const t = { unit: unitHead(level), overall: "Overall %", pass: "Pass %", rank: "Rank" }[c.key];
      put(ctx, t, cx, top + hdrH / 2, F("bold", 15), hInk, al);
    }
  });

  // best value per subject, for the bold highlight
  const best = subjects.map((s) => Math.max(...rows.map((r) => r.st.subj[s].avg ?? -1)));
  const bestOverall = Math.max(...rows.map((r) => r.st.avg ?? -1));
  const order = [...rows].sort((a, b) => (b.st.avg ?? -1) - (a.st.avg ?? -1));

  rows.forEach((r, i) => {
    const y = top + hdrH + i * rowH, cy = y + rowH / 2;
    cols.forEach((c) => {
      if (c.key === "unit") { put(ctx, r.unit.short, c.x + 10, cy, F("bold", fs), r.unit.accent === NAVY ? INK : r.unit.accent, "left"); return; }
      const cx = c.x + c.w / 2;
      if (c.key === "overall" || c.key === "pass" || c.key === "rank") {
        const val = c.key === "overall" ? r.st.avg : c.key === "pass" ? r.st.passPct : null;
        if (c.key === "rank") put(ctx, order.indexOf(r) + 1, cx, cy, F("bold", fs), accent, "center");
        else {
          const bg = c.key === "overall" ? heat(val, colour) : null;
          if (bg) { ctx.fillStyle = bg; ctx.fillRect(c.x + 1, y + 1, c.w - 2, rowH - 2); }
          put(ctx, fmt(val), cx, cy, F(c.key === "overall" && val === bestOverall ? "bold" : "normal", fs), INK, "center");
        }
        return;
      }
      const si = +c.key.slice(1), v = r.st.subj[subjects[si]].avg, bg = heat(v, colour);
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(c.x + 1, y + 1, c.w - 2, rowH - 2); }
      const isBest = v !== null && v === best[si];
      put(ctx, fmt(v), cx, cy, F(isBest ? "bold" : "normal", fs), v !== null && v < 40 ? RED : INK, "center");
      if (isBest) { ctx.fillStyle = colour ? "#14532D" : INK; ctx.beginPath(); ctx.arc(c.x + 10, cy, 3, 0, 7); ctx.fill(); }
    });
    ctx.fillStyle = HAIR; ctx.fillRect(M, y + rowH - 0.5, tableW, 0.6);
  });
  // "Best" row
  const by = top + hdrH + rows.length * rowH, bcy = by + rowH / 2;
  ctx.fillStyle = colour ? accent + "26" : "#E8ECF2"; ctx.fillRect(M, by, tableW, rowH);
  put(ctx, "Strongest", cols[0].x + 10, bcy, F("bold", fs), INK, "left");
  subjects.forEach((s, i) => {
    const w = rows.filter((r) => r.st.subj[s].avg === best[i]).map((r) => r.unit.short.replace(/^Class /, ""));
    const txt = w.length > 2 ? "tie" : w.join(" / ");
    const c = cols[i + 1];
    put(ctx, txt, c.x + c.w / 2, bcy, F("bold", fit(ctx, txt, c.w - 6, "bold", fs - 2)), INK, "center");
  });

  const tableH = hdrH + rowH * nRows;
  ctx.strokeStyle = colour ? accent : "#9AA3B2"; ctx.lineWidth = 1.2; ctx.strokeRect(M, top, tableW, tableH);
  ctx.strokeStyle = HAIR; ctx.lineWidth = 0.7;
  cols.forEach((c, i) => { if (i) { ctx.beginPath(); ctx.moveTo(c.x, top + (colour ? hdrH : 0)); ctx.lineTo(c.x, top + tableH); ctx.stroke(); } });
  footer(ctx, "Each cell is the average of (marks ÷ maximum) over students who have a mark in that subject.  ● marks the best in each subject.  Red text = below 40.", pageNo, pageCount);
}

// Bar-chart page: overall average, ranked, with the pass % beside it.
function drawRanking(ctx, spec, o) {
  const { rows, level, examLine } = spec;
  const colour = o.style === "colour", M = 30, W = PAGE_W, accent = NAVY;
  const HEAD_H = header(ctx, o, accent,
    `COMPARISON SHEET  ·  Overall ranking  ·  ${level === "class" ? "Classes" : "Sections"}`, "", "", o.logos);
  put(ctx, `${examLine}   |   Bar = overall average %   |   Marker = pass %`, W / 2, 90, F("normal", 15), colour ? "#ffffffcc" : MUTED, "center");

  const list = [...rows].sort((a, b) => (b.st.avg ?? -1) - (a.st.avg ?? -1));
  const top = HEAD_H + 34, bottom = PAGE_H - 70;
  const rowH = Math.min(46, (bottom - top) / Math.max(list.length, 1));
  const labelW = 190, chartX = M + labelW + 50, chartW = W - M - chartX - 90;
  // axis
  ctx.strokeStyle = HAIR; ctx.lineWidth = 1;
  for (let p = 0; p <= 100; p += 20) {
    const gx = chartX + (p / 100) * chartW;
    ctx.beginPath(); ctx.moveTo(gx, top - 8); ctx.lineTo(gx, top + rowH * list.length); ctx.stroke();
    put(ctx, p + "%", gx, top - 20, F("normal", 12), MUTED, "center");
  }
  list.forEach((r, i) => {
    const y = top + i * rowH, cy = y + rowH / 2, bh = Math.min(26, rowH * 0.6);
    put(ctx, String(i + 1), M + 14, cy, F("bold", 16), accent, "center");
    put(ctx, r.unit.short, M + 40, cy, F("bold", 17), r.unit.accent === NAVY ? INK : r.unit.accent, "left");
    const w = ((r.st.avg ?? 0) / 100) * chartW;
    ctx.fillStyle = colour ? r.unit.accent : "#9AA3B2"; ctx.globalAlpha = colour ? 0.9 : 1;
    ctx.fillRect(chartX, cy - bh / 2, w, bh); ctx.globalAlpha = 1;
    put(ctx, fmt(r.st.avg, 2) + "%", chartX + w + 8, cy, F("bold", 15), INK, "left");
    if (r.st.passPct !== null) {
      const px = chartX + (r.st.passPct / 100) * chartW;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(px, cy - bh / 2 - 5); ctx.lineTo(px - 5, cy - bh / 2 - 12); ctx.lineTo(px + 5, cy - bh / 2 - 12); ctx.closePath(); ctx.fill();
    }
  });
  footer(ctx, "Ranked by overall average % of the students who appeared.  ▼ = share of those students who passed (40% and above).", 1, 1);
}

// ------------------------------------------------------------ result cards

// One entry per student of the selected sections, with the card in exactly
// the shape drawResultCard() expects (same fields as /api/award-list/result-cards).
export function buildCards(data, selectedCodes) {
  const sel = new Set(selectedCodes);
  const out = [];
  data.classes.forEach((cl) => {
    const ranked = cl.sections.flatMap((s) => s.students)
      .filter((s) => s.entered > 0).sort((a, b) => b.obtained - a.obtained);
    const top3 = ranked.slice(0, 3).map((s) => ({
      name: s.name, father: s.father, score: `${s.obtained}/${s.outOf} (${s.pct.toFixed(2)}%)`,
    }));
    cl.sections.forEach((sec) => {
      if (!sel.has(sec.code)) return;
      sec.students.forEach((st) => out.push({
        classNum: cl.class, secCode: sec.code, secName: sec.name,
        accent: colourForSection(sec.label), position: st.position, roll: st.roll, name: st.name,
        card: {
          studentId: st.id, name: st.name, father: st.father, roll: st.roll,
          cls: `${cl.class} ${sec.name}`, sectionLabel: sec.label,
          exam: data.exam.name, examLine: data.examLine,
          position: st.entered > 0 ? `${st.position} / ${cl.ranked}` : "—",
          complete: st.entered === cl.subjects.length,
          subjects: cl.subjects.map((sub) => ({ name: sub, max: sec.max[sub] ?? null, obtained: st.marks[sub] ?? null })),
          top3,
          remark: st.pct === null ? "Result not yet complete." : overallRemark(st.pct),
        },
      }));
    });
  });
  return out;
}
