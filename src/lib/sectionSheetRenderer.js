// Draws ONE page (A4 landscape) holding every student and every subject of
// a section. Same canvas approach as the result card, so PNG, PDF and Print
// all come from the same drawing.
//
// Row height shrinks to fit, so a section of 40 or 60 students still lands
// on a single page. At 4K the smallest text is still sharp.

import { bandFor, gradeFor } from "./resultCardConfig";

export const SHEET_W = 1754;   // A4 landscape on the same 1240-wide grid
export const SHEET_H = 1240;

const NAVY = "#1F4973";
const INK = "#14141C";
const MUTED = "#78788C";
const GOLD = "#C9922A";
const HAIRLINE = "#D7D7E1";
const RED = "#B91C1C";

const SHORT = {
  "Tarjuma-tul-Qur'an (THQ)": "THQ",
  "History & Geography": "Hist & Geo",
  "General Science": "Gen Science",
  "Computer Science": "Comp Science",
  "Computer Science / Biology": "CS / Biology",
  "Pakistan Studies": "Pak Studies",
};

const F = (w, s) => `${w} ${s}px Arial, Helvetica, sans-serif`;

function put(ctx, str, x, y, font, fill, align = "left") {
  ctx.font = font; ctx.fillStyle = fill;
  ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(String(str ?? ""), x, y);
}

// Shrink text until it fits the cell
function fit(ctx, str, maxW, weight, size) {
  let s = size;
  ctx.font = F(weight, s);
  while (s > 8 && ctx.measureText(str).width > maxW) { s -= 0.5; ctx.font = F(weight, s); }
  return s;
}

export function drawSectionSheet(ctx, data, { accent, style = "colour", logos }) {
  const W = SHEET_W, H = SHEET_H, M = 30;
  const colour = style === "colour";
  const cards = data.cards;
  const subjects = cards[0] ? cards[0].subjects.map((s) => s.name) : [];
  const maxes = cards[0] ? cards[0].subjects.map((s) => s.max) : [];

  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

  // ---- Header ----
  const HEAD_H = 112;
  if (colour) { ctx.fillStyle = accent; ctx.fillRect(0, 0, W, HEAD_H); }
  else { ctx.fillStyle = accent; ctx.fillRect(0, HEAD_H - 4, W, 4); }
  const headInk = colour ? "#fff" : INK;
  const headSub = colour ? "#ffffffcc" : MUTED;

  const logoS = 80;
  if (logos?.authority) {
    ctx.save(); ctx.beginPath(); ctx.arc(M + logoS / 2, HEAD_H / 2 - 2, logoS / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logos.authority, M, HEAD_H / 2 - 2 - logoS / 2, logoS, logoS); ctx.restore();
  }
  if (logos?.punjab) {
    ctx.save(); ctx.beginPath(); ctx.arc(W - M - logoS / 2, HEAD_H / 2 - 2, logoS / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logos.punjab, W - M - logoS, HEAD_H / 2 - 2 - logoS / 2, logoS, logoS); ctx.restore();
  }
  put(ctx, "CENTRE OF EXCELLENCE SIALKOT (BOYS)", W / 2, 28, F("bold", 26), headInk, "center");
  put(ctx, `SECTION RESULT SHEET  ·  Class ${data.section.class} — ${data.section.section_label}`,
      W / 2, 60, F("bold", 21), headInk, "center");
  const monthLine = cards[0]?.examLine || "";
  put(ctx, `${monthLine}   |   Class Incharge: ${data.section.class_incharge || "—"}   |   Students: ${cards.length}`,
      W / 2, 90, F("normal", 15), headSub, "center");

  // ---- Columns ----
  const tableW = W - M * 2;
  const fixed = { pos: 62, roll: 56, tot: 112, pct: 70, grd: 52 };
  const nSub = subjects.length || 1;
  const subW = 92;
  const rest = tableW - fixed.pos - fixed.roll - fixed.tot - fixed.pct - fixed.grd - subW * nSub;
  const nameW = rest * 0.5, fatherW = rest * 0.5;
  const cols = [];
  let x = M;
  const add = (key, w, align) => { cols.push({ key, x, w, align }); x += w; };
  add("pos", fixed.pos, "center");
  add("roll", fixed.roll, "center");
  add("name", nameW, "left");
  add("father", fatherW, "left");
  subjects.forEach((s, i) => add("s" + i, subW, "center"));
  add("tot", fixed.tot, "center");
  add("pct", fixed.pct, "center");
  add("grd", fixed.grd, "center");

  // ---- Header rows (title + max marks) ----
  const top = HEAD_H + 14;
  const hdrH = 46, maxH = 22;
  const footH = 26;
  const avail = H - top - hdrH - maxH - footH - 8;
  const rowH = Math.max(13, Math.min(30, avail / Math.max(cards.length, 1)));
  const fs = Math.max(9.5, Math.min(15, rowH * 0.62));

  // header fill
  ctx.fillStyle = colour ? accent : "#fff";
  ctx.fillRect(M, top, tableW, hdrH);
  if (!colour) { ctx.fillStyle = accent; ctx.fillRect(M, top + hdrH - 2, tableW, 2); }
  const hInk = colour ? "#fff" : accent;

  const titles = { pos: "Pos", roll: "Roll", name: "Student", father: "Father", tot: "Obtained / Total", pct: "%", grd: "Grade" };
  cols.forEach((c) => {
    const cx = c.align === "left" ? c.x + 8 : c.x + c.w / 2;
    if (c.key.startsWith("s")) {
      const label = SHORT[subjects[+c.key.slice(1)]] || subjects[+c.key.slice(1)];
      const parts = label.length > 11 && label.includes(" ") ? [label.slice(0, label.lastIndexOf(" ")), label.slice(label.lastIndexOf(" ") + 1)] : [label];
      if (parts.length === 2) {
        put(ctx, parts[0], cx, top + hdrH / 2 - 9, F("bold", 13), hInk, "center");
        put(ctx, parts[1], cx, top + hdrH / 2 + 9, F("bold", 13), hInk, "center");
      } else put(ctx, parts[0], cx, top + hdrH / 2, F("bold", 14), hInk, "center");
    } else if (c.key === "tot") {
      put(ctx, "Obtained", cx, top + hdrH / 2 - 9, F("bold", 13), hInk, "center");
      put(ctx, "/ Total", cx, top + hdrH / 2 + 9, F("bold", 13), hInk, "center");
    } else put(ctx, titles[c.key], cx, top + hdrH / 2, F("bold", 14), hInk, c.align);
  });

  // max-marks row
  const my = top + hdrH;
  ctx.fillStyle = "#EEF1F6"; ctx.fillRect(M, my, tableW, maxH);
  put(ctx, "Maximum marks", cols[2].x + 8, my + maxH / 2, F("bold", 12), MUTED);
  let maxSum = 0;
  cols.forEach((c) => {
    if (c.key.startsWith("s")) {
      const m = maxes[+c.key.slice(1)];
      if (m != null) maxSum += Number(m);
      put(ctx, m ?? "—", c.x + c.w / 2, my + maxH / 2, F("bold", 13), INK, "center");
    }
  });
  put(ctx, maxSum || "", cols.find((c) => c.key === "tot").x + 56, my + maxH / 2, F("bold", 13), INK, "center");

  // ---- Student rows ----
  const y0 = my + maxH;
  cards.forEach((card, i) => {
    const y = y0 + i * rowH, cy = y + rowH / 2;
    if (i % 2 === 1) { ctx.fillStyle = colour ? accent + "14" : "#F6F7FA"; ctx.fillRect(M, y, tableW, rowH); }

    let obt = 0, out = 0, entered = 0;
    card.subjects.forEach((s) => {
      if (s.obtained === null || s.obtained === undefined) return;
      obt += Number(s.obtained); out += Number(s.max || 0); entered++;
    });
    const pct = out > 0 ? (obt / out) * 100 : null;
    const band = bandFor(pct);
    const posNum = String(card.position).split("/")[0].trim();

    cols.forEach((c) => {
      const cx = c.align === "left" ? c.x + 8 : c.x + c.w / 2;
      if (c.key === "pos") put(ctx, posNum, cx, cy, F("bold", fs), accent, "center");
      else if (c.key === "roll") put(ctx, card.roll, cx, cy, F("normal", fs), INK, "center");
      else if (c.key === "name" || c.key === "father") {
        const str = c.key === "name" ? card.name : card.father;
        const w = c.key === "name" ? "bold" : "normal";
        const sz = fit(ctx, str, c.w - 14, w, fs);
        put(ctx, str, cx, cy, F(w, sz), INK, "left");
      } else if (c.key.startsWith("s")) {
        const s = card.subjects[+c.key.slice(1)];
        const v = s.obtained;
        if (v === null || v === undefined) put(ctx, "—", cx, cy, F("normal", fs), MUTED, "center");
        else {
          const low = s.max && (Number(v) / Number(s.max)) * 100 < 40;
          put(ctx, v, cx, cy, F(low ? "bold" : "normal", fs), low ? RED : INK, "center");
        }
      } else if (c.key === "tot") put(ctx, entered ? `${obt} / ${out}` : "—", cx, cy, F("bold", fs), INK, "center");
      else if (c.key === "pct") put(ctx, pct === null ? "—" : pct.toFixed(1), cx, cy, F("normal", fs), INK, "center");
      else if (c.key === "grd") {
        if (band) {
          if (colour) {
            ctx.fillStyle = band.colour;
            const bw = Math.min(c.w - 10, 38), bh = Math.min(rowH - 3, 20);
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 4) : ctx.rect(cx - bw / 2, cy - bh / 2, bw, bh);
            ctx.fill();
            put(ctx, band.grade, cx, cy, F("bold", Math.min(fs, 13)), "#fff", "center");
          } else put(ctx, band.grade, cx, cy, F("bold", fs), band.colour, "center");
        } else put(ctx, "—", cx, cy, F("normal", fs), MUTED, "center");
      }
    });
    ctx.fillStyle = HAIRLINE; ctx.fillRect(M, y + rowH - 0.5, tableW, 0.6);
  });

  // table frame + column rules
  const tableH = hdrH + maxH + rowH * cards.length;
  ctx.strokeStyle = colour ? accent : "#9AA3B2"; ctx.lineWidth = 1.2;
  ctx.strokeRect(M, top, tableW, tableH);
  ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 0.7;
  cols.forEach((c, i) => {
    if (i === 0) return;
    ctx.beginPath(); ctx.moveTo(c.x, top + (colour ? hdrH : 0)); ctx.lineTo(c.x, top + tableH); ctx.stroke();
  });

  // ---- Footer ----
  const fy = H - 16;
  put(ctx, "Marks below 40% of a subject's maximum are shown in red.  “—” = not yet entered.  Position is across the whole class.",
      M, fy, F("normal", 12), MUTED);
  put(ctx, "coesialkot.com", W - M, fy, F("bold", 12), GOLD, "right");
}
