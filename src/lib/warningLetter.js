// Warning letters for students whose result is weak.
//
// A student gets a letter when EITHER
//   • overall percentage is below 50%, OR
//   • marks are below 50% in MORE THAN ONE subject (2 or more).
// "Overall" uses the same basis as the card and proformas: obtained / total
// of the subjects that have a mark. Students with no marks yet are skipped.

import { buildCards } from "./resultSheets";

export const WARN_PCT = 50;
export const WARN_MIN_SUBJECTS = 2;

const NAVY = "#1F4973";
const INK = "#14141C";
const MUTED = "#6B6B7B";
const GOLD = "#C9922A";
const RED = "#9B1C1C";
const HAIR = "#D7D7E1";
const PANEL = "#F4F6F9";

// ------------------------------------------------------------------ data

export function findWarnings(data, selectedCodes) {
  const out = [];
  buildCards(data, selectedCodes).forEach((it) => {
    const c = it.card;
    let obtained = 0, outOf = 0, entered = 0;
    const low = [];
    c.subjects.forEach((s) => {
      if (s.obtained === null || s.obtained === undefined) return;
      obtained += Number(s.obtained); outOf += Number(s.max || 0); entered++;
      const p = s.max ? (Number(s.obtained) / Number(s.max)) * 100 : null;
      if (p !== null && p < WARN_PCT) low.push({ name: s.name, max: s.max, obtained: s.obtained, pct: p });
    });
    if (!entered || !outOf) return;
    const pct = (obtained / outOf) * 100;
    const overallLow = pct < WARN_PCT;
    const manyLow = low.length >= WARN_MIN_SUBJECTS;
    if (!overallLow && !manyLow) return;
    out.push({
      key: String(c.studentId),
      secCode: it.secCode, secName: it.secName, classNum: it.classNum,
      incharge: it.incharge, name: c.name, father: c.father, roll: c.roll, cls: c.cls,
      examLine: c.examLine, position: c.position, sectionPosition: c.sectionPosition,
      obtained, outOf, pct, low, overallLow, manyLow, subjectsEntered: entered, subjectsTotal: c.subjects.length,
    });
  });
  return out;
}

export function reasonText(w) {
  const r = [];
  if (w.overallLow) r.push(`overall below ${WARN_PCT}%`);
  if (w.manyLow) r.push(`below ${WARN_PCT}% in ${w.low.length} subjects`);
  return r.join(" · ");
}

// -------------------------------------------------------------- drawing

const F = (w, s, italic) => `${italic ? "italic " : ""}${w} ${s}px Arial, Helvetica, sans-serif`;

function put(ctx, str, x, y, font, fill, align = "left") {
  ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(String(str ?? ""), x, y);
}

function wrap(ctx, str, maxW, font) {
  ctx.font = font;
  const words = String(str).split(/\s+/), lines = [];
  let cur = "";
  words.forEach((w) => {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}

function para(ctx, str, x, y, maxW, font, fill, lh) {
  const lines = wrap(ctx, str, maxW, font);
  lines.forEach((l, i) => put(ctx, l, x, y + i * lh, font, fill));
  return y + lines.length * lh;
}

const WIDTH = 1240, HEIGHT = 1754, L = 85, R = 1155;

export function drawWarningLetter(ctx, w, { style = "colour", logos = {}, date = "" } = {}) {
  const ink = style === "ink";
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Frame bars (match the result card)
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, WIDTH, 22);
  ctx.fillStyle = NAVY; ctx.fillRect(0, 22, WIDTH, 12);
  ctx.fillStyle = NAVY; ctx.fillRect(0, HEIGHT - 22, WIDTH, 22);

  // ---- Letterhead
  if (logos.punjab) ctx.drawImage(logos.punjab, L, 62, 108, 108);
  if (logos.authority) {
    ctx.save(); ctx.beginPath(); ctx.arc(R - 54, 116, 54, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logos.authority, R - 108, 62, 108, 108); ctx.restore();
  }
  put(ctx, "CENTRE OF EXCELLENCE SIALKOT", WIDTH / 2, 98, F("bold", 44), NAVY, "center");
  put(ctx, "BOYS CAMPUS", WIDTH / 2, 144, F("bold", 26), INK, "center");
  put(ctx, "Punjab Daanish Schools & Centres of Excellence Authority", WIDTH / 2, 180, F("normal", 18), MUTED, "center");
  ctx.fillStyle = GOLD; ctx.fillRect(L, 206, R - L, 3);
  ctx.fillStyle = NAVY; ctx.fillRect(L, 212, R - L, 1.5);

  // ---- Reference + date
  const yr = (String(date).match(/\d{4}/) || [""])[0];
  const ref = `COE/WL/${yr}/${w.classNum}-${String(w.secName).slice(0, 3).toUpperCase()}-${w.roll}`;
  put(ctx, `Ref. No.: ${ref}`, L, 244, F("bold", 20), INK);
  put(ctx, `Date: ${date}`, R, 244, F("bold", 20), INK, "right");

  // ---- Title
  if (ink) {
    ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.strokeRect(L, 274, R - L, 66);
    put(ctx, "ACADEMIC WARNING NOTICE", WIDTH / 2, 308, F("bold", 38), RED, "center");
  } else {
    ctx.fillStyle = RED; ctx.fillRect(L, 274, R - L, 66);
    ctx.fillStyle = GOLD; ctx.fillRect(L, 336, R - L, 4);
    put(ctx, "ACADEMIC WARNING NOTICE", WIDTH / 2, 306, F("bold", 38), "#fff", "center");
  }

  // ---- Addressee + student particulars
  put(ctx, "To,", L, 380, F("bold", 22), INK);
  put(ctx, "The Parent / Guardian", L + 48, 380, F("bold", 22), INK);
  const rows = [["Student Name:", w.name, "Roll No.:", w.roll], ["Father's Name:", w.father, "Class:", w.cls]];
  const c1 = 300, c2 = 700, c3 = 860, rh = 42, ty = 404;
  rows.forEach((row, i) => {
    const y = ty + i * rh;
    if (!ink) { ctx.fillStyle = PANEL; ctx.fillRect(L, y, R - L, rh); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(L, y, R - L, rh);
    [c1, c2, c3].forEach((cx) => { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + rh); ctx.stroke(); });
    put(ctx, row[0], L + 14, y + rh / 2, F("bold", 21), INK);
    put(ctx, row[1], c1 + 14, y + rh / 2, F("normal", 21), INK);
    put(ctx, row[2], c2 + 14, y + rh / 2, F("bold", 21), INK);
    put(ctx, row[3], c3 + 14, y + rh / 2, F("normal", 21), INK);
  });

  // ---- Subject + salutation
  let y = 524;
  put(ctx, "Subject:", L, y, F("bold", 23), INK);
  put(ctx, "WARNING REGARDING UNSATISFACTORY ACADEMIC PERFORMANCE", L + 105, y, F("bold", 23), RED);
  ctx.fillStyle = RED; ctx.fillRect(L + 105, y + 17, 905, 2);
  y += 52;
  put(ctx, "Dear Parent / Guardian,", L, y, F("normal", 22), INK);
  y += 36;
  y = para(ctx, `This is to bring to your notice that the performance of your son in the ${w.examLine} has been found unsatisfactory and below the standard expected at this institution. His result is as follows:`,
    L, y, R - L, F("normal", 22), INK, 34);

  // ---- Result boxes
  y += 12;
  const bw = (R - L - 40) / 3, bh = 100;
  const boxes = [
    ["OVERALL RESULT", `${w.pct.toFixed(1)}%`, `${w.obtained} / ${w.outOf} marks`, true],
    ["POSITION IN SECTION", w.sectionPosition || "—", "", false],
    ["POSITION IN CLASS", w.position || "—", "", false],
  ];
  boxes.forEach((b, i) => {
    const bx = L + i * (bw + 20);
    const hot = b[3] && w.overallLow;
    if (!ink) { ctx.fillStyle = hot ? "#FBEAEA" : PANEL; ctx.fillRect(bx, y, bw, bh); }
    ctx.strokeStyle = hot ? RED : NAVY; ctx.lineWidth = hot ? 2.5 : 1.5; ctx.strokeRect(bx, y, bw, bh);
    put(ctx, b[0], bx + bw / 2, y + 22, F("bold", 15), MUTED, "center");
    put(ctx, b[1], bx + bw / 2, y + 54, F("bold", 36), hot ? RED : NAVY, "center");
    if (b[2]) put(ctx, b[2], bx + bw / 2, y + 85, F("normal", 15), MUTED, "center");
  });
  y += bh + 30;

  // ---- Reasons
  put(ctx, "Reason for this warning", L, y, F("bold", 24), NAVY);
  ctx.fillStyle = NAVY; ctx.fillRect(L, y + 16, 270, 2.5);
  y += 42;
  const reasons = [];
  if (w.overallLow) reasons.push(`Overall result is ${w.pct.toFixed(1)}%, which is below the minimum of ${WARN_PCT}%.`);
  if (w.manyLow) reasons.push(`Marks are below ${WARN_PCT}% in ${w.low.length} subjects, as shown below.`);
  reasons.forEach((r) => {
    ctx.fillStyle = RED; ctx.fillRect(L + 6, y - 5, 10, 10);
    y = para(ctx, r, L + 32, y, R - L - 32, F("normal", 22), INK, 32);
  });

  // ---- Subjects below 50%
  const lowSorted = [...w.low].sort((a, b) => a.pct - b.pct);
  const tableBottom = 1272;
  if (lowSorted.length) {
    y += 8;
    const rowH = Math.max(24, Math.min(36, (tableBottom - y) / (lowSorted.length + 1)));
    const fs = Math.max(15, Math.min(20, rowH * 0.56));
    const cols = [[L, 725], [725, 885], [885, 1045], [1045, R]];
    ctx.fillStyle = ink ? "#fff" : NAVY; ctx.fillRect(L, y, R - L, rowH);
    if (ink) { ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.strokeRect(L, y, R - L, rowH); }
    const hf = ink ? NAVY : "#fff";
    put(ctx, "SUBJECT", L + 16, y + rowH / 2, F("bold", fs - 1), hf);
    put(ctx, "MAX", (cols[1][0] + cols[1][1]) / 2, y + rowH / 2, F("bold", fs - 1), hf, "center");
    put(ctx, "OBTAINED", (cols[2][0] + cols[2][1]) / 2, y + rowH / 2, F("bold", fs - 1), hf, "center");
    put(ctx, "%", (cols[3][0] + cols[3][1]) / 2, y + rowH / 2, F("bold", fs - 1), hf, "center");
    y += rowH;
    lowSorted.forEach((s, i) => {
      if (!ink && i % 2 === 0) { ctx.fillStyle = PANEL; ctx.fillRect(L, y, R - L, rowH); }
      ctx.fillStyle = HAIR; ctx.fillRect(L, y + rowH - 1, R - L, 1);
      const m = y + rowH / 2;
      put(ctx, s.name, L + 16, m, F("normal", fs), INK);
      put(ctx, s.max, (cols[1][0] + cols[1][1]) / 2, m, F("normal", fs), INK, "center");
      put(ctx, s.obtained, (cols[2][0] + cols[2][1]) / 2, m, F("bold", fs), RED, "center");
      put(ctx, `${s.pct.toFixed(1)}%`, (cols[3][0] + cols[3][1]) / 2, m, F("bold", fs), RED, "center");
      y += rowH;
    });
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.2; ctx.strokeRect(L, y - rowH * (lowSorted.length + 1), R - L, rowH * (lowSorted.length + 1));
  }

  // ---- The warning
  const wy = Math.min(1296, y + 44), wh = 112;
  if (!ink) { ctx.fillStyle = "#FBEAEA"; ctx.fillRect(L, wy, R - L, wh); }
  ctx.strokeStyle = RED; ctx.lineWidth = 3.5; ctx.strokeRect(L, wy, R - L, wh);
  ctx.fillStyle = RED; ctx.fillRect(L, wy, 12, wh);
  put(ctx, "If the student continues with this result in the next examination,", WIDTH / 2 + 6, wy + 38, F("bold", 26), INK, "center");
  put(ctx, "he will be DEMOTED to the PREVIOUS CLASS.", WIDTH / 2 + 6, wy + 80, F("bold", 34), RED, "center");

  // ---- Request to parents
  para(ctx,
    "You are requested to meet the Class Teacher at the earliest, to ensure regular study and revision at home, and to support your son so that he can improve his performance in the coming examination.",
    L, wy + wh + 36, R - L, F("normal", 20), INK, 30);

  // ---- Signatures
  const sy = 1560, colW = (R - L) / 3;
  const sigs = [
    ["Class Teacher", w.incharge || ""],
    ["Dr Naim Tahir Baig", "Senior Coordinator"],
    ["Sir Shahbaz Hassan", "Principal"],
  ];
  sigs.forEach((s, i) => {
    const cx = L + colW * i + colW / 2;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 150, sy); ctx.lineTo(cx + 150, sy); ctx.stroke();
    if (i === 0) {
      put(ctx, "Class Teacher", cx, sy + 26, F("bold", 21), INK, "center");
      if (s[1]) put(ctx, s[1], cx, sy + 52, F("normal", 18), MUTED, "center");
    } else {
      put(ctx, s[0], cx, sy + 26, F("bold", 21), INK, "center");
      put(ctx, s[1], cx, sy + 52, F("normal", 18), MUTED, "center");
    }
  });
  put(ctx, "School Stamp", R - colW / 2, sy + 72, F("normal", 16, true), MUTED, "center");

  // ---- Parent acknowledgement + footer
  ctx.strokeStyle = HAIR; ctx.lineWidth = 1.5; ctx.strokeRect(L, 1652, R - L, 44);
  put(ctx, "Received by Parent / Guardian —   Name: ______________________   Signature: ______________   Date: ___ / ___ / ______",
    L + 14, 1674, F("normal", 16), INK);
  put(ctx, "This is a computer-generated notice and is valid only when signed and stamped.", WIDTH / 2, 1717, F("normal", 14), MUTED, "center");
}

export const LETTER_W = WIDTH;
export const LETTER_H = HEIGHT;
