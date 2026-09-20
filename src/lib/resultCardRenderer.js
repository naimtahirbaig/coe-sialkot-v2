// Draws a result card onto a canvas.
//
// One renderer, two styles:
//   "colour" — section colour used as solid fills (title band, table
//              header, grand total, grading strip, position headers)
//   "ink"    — same layout, but nothing is a large solid block. Colour
//              appears only in headings, rules and key figures, so a long
//              print run barely touches the colour cartridge.
//
// PNG and PDF both come from this canvas, so the two can never diverge.

import { BASE_W, BASE_H, GRADE_BANDS, bandFor, remarkFor } from "./resultCardConfig";

const NAVY = "#1F4973";
const INK = "#14141C";
const MUTED = "#78788C";
const GOLD = "#C9922A";
const HAIRLINE = "#D7D7E1";
const PANEL = "#F4F6F9";

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circleImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

const F = (weight, size) => `${weight} ${size}px Arial, Helvetica, sans-serif`;

function text(ctx, str, x, y, { font, fill, align = "left", baseline = "middle" }) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(String(str ?? ""), x, y);
}

// Shrink a string until it fits maxW (names can be long)
function fitText(ctx, str, maxW, weight, size) {
  let s = size;
  ctx.font = F(weight, s);
  while (ctx.measureText(String(str ?? "")).width > maxW && s > 8) {
    s -= 1;
    ctx.font = F(weight, s);
  }
  return F(weight, s);
}

/**
 * @param ctx      canvas 2d context, already scaled
 * @param card     { examLine, name, roll, father, cls, exam, position,
 *                   subjects: [{name, max, obtained}], top3, remark }
 * @param opts     { accent, style: "colour"|"ink", logos: {punjab, authority} }
 */
export function drawResultCard(ctx, card, { accent, style = "colour", logos }) {
  const ink = style === "ink";
  const W = BASE_W, H = BASE_H;
  const L = 85, Rx = W - 85;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Top / bottom rules
  if (ink) {
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = accent; ctx.fillRect(0, H - 6, W, 6);
  } else {
    ctx.fillStyle = GOLD;   ctx.fillRect(0, 0, W, 22);
    ctx.fillStyle = accent; ctx.fillRect(0, 22, W, 12);
    ctx.fillStyle = accent; ctx.fillRect(0, H - 22, W, 22);
  }

  if (logos?.punjab) circleImage(ctx, logos.punjab, 110, 78, 110);
  if (logos?.authority) circleImage(ctx, logos.authority, W - 220, 78, 110);

  text(ctx, "CENTER OF EXCELLENCE", W / 2, 112, { font: F(700, 50), fill: NAVY, align: "center" });
  text(ctx, "BOYS SIALKOT", W / 2, 168, { font: F(700, 28), fill: INK, align: "center" });

  // Title band
  if (ink) {
    ctx.strokeStyle = accent; ctx.lineWidth = 4;
    roundRect(ctx, L, 214, Rx - L, 70, 6); ctx.stroke();
    text(ctx, "PROGRESS REPORT CARD", W / 2, 249, { font: F(700, 38), fill: accent, align: "center" });
  } else {
    ctx.fillStyle = accent;
    roundRect(ctx, L, 214, Rx - L, 70, 6); ctx.fill();
    text(ctx, "PROGRESS REPORT CARD", W / 2, 249, { font: F(700, 38), fill: "#FFFFFF", align: "center" });
  }
  text(ctx, card.examLine, W / 2, 312, { font: F(400, 24), fill: INK, align: "center" });

  // Student info table
  let y = 342;
  const rh = 44, c1 = 300, c2 = 620, c3 = 900;
  const infoRows = [
    ["Student Name:", card.name, "Roll Number:", card.roll],
    ["Father's Name:", card.father, "Class:", card.cls],
    ["Examination:", card.exam, "Position in Class:", card.position],
  ];
  infoRows.forEach((row, i) => {
    const yy = y + i * rh;
    if (i === 2 && !ink) {
      ctx.fillStyle = "#FAF0BE";
      ctx.fillRect(c3 + 2, yy + 2, Rx - c3 - 4, rh - 4);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeRect(L, yy, Rx - L, rh);
    [c1, c2, c3].forEach((cx) => {
      ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx, yy + rh); ctx.stroke();
    });
    const mid = yy + rh / 2;
    text(ctx, row[0], L + 16, mid, { font: F(700, 21), fill: INK });
    text(ctx, row[1], c1 + 16, mid, { font: fitText(ctx, row[1], c2 - c1 - 32, 400, 21), fill: INK });
    text(ctx, row[2], c2 + 16, mid, { font: F(700, 21), fill: INK });
    text(ctx, row[3], c3 + 16, mid, {
      font: F(i === 2 ? 700 : 400, 21),
      fill: i === 2 && ink ? accent : INK,
    });
  });

  // Academic performance
  y = y + 3 * rh + 26;
  text(ctx, "ACADEMIC PERFORMANCE", L, y + 14, { font: F(700, 28), fill: accent });
  y += 40;

  const COL = { num: [L, 150], subj: [150, 530], max: [530, 640], obt: [640, 750],
                pct: [750, 860], grade: [860, 990], rem: [990, Rx] };
  const mid = ([a, b]) => (a + b) / 2;

  if (ink) {
    ctx.strokeStyle = accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(Rx, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L, y + 44); ctx.lineTo(Rx, y + 44); ctx.stroke();
  } else {
    ctx.fillStyle = NAVY; ctx.fillRect(L, y, Rx - L, 44);
  }
  const headFill = ink ? INK : "#FFFFFF";
  text(ctx, "#", mid(COL.num), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "SUBJECT", mid(COL.subj), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "MAX", mid(COL.max), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "OBT.", mid(COL.obt), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "%", mid(COL.pct), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "GRADE", mid(COL.grade), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  text(ctx, "REMARKS", mid(COL.rem), y + 22, { font: F(700, 19), fill: headFill, align: "center" });
  y += 44;

  let totMax = 0, totObt = 0;
  card.subjects.forEach((s, i) => {
    const h = 40;
    if (!ink && i % 2 === 0) { ctx.fillStyle = PANEL; ctx.fillRect(L, y, Rx - L, h); }
    ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L, y + h); ctx.lineTo(Rx, y + h); ctx.stroke();

    const has = s.obtained !== null && s.obtained !== undefined && s.obtained !== "";
    const pc = has && s.max ? (Number(s.obtained) / Number(s.max)) * 100 : null;
    const band = pc === null ? null : bandFor(pc);
    const rc = ink ? "#46465A" : (band?.colour ? shade(band.colour) : INK);
    const m = y + h / 2;

    text(ctx, i + 1, mid(COL.num), m, { font: F(400, 19), fill: INK, align: "center" });
    text(ctx, s.name, COL.subj[0] + 20, m, { font: fitText(ctx, s.name, 350, 400, 20), fill: INK });
    text(ctx, s.max ?? "—", mid(COL.max), m, { font: F(400, 19), fill: INK, align: "center" });
    text(ctx, has ? s.obtained : "—", mid(COL.obt), m, { font: F(ink ? 700 : 400, 19), fill: INK, align: "center" });
    text(ctx, pc === null ? "—" : `${Math.round(pc)}%`, mid(COL.pct), m, { font: F(400, 19), fill: INK, align: "center" });
    text(ctx, band?.grade || "—", mid(COL.grade), m, { font: F(700, 20), fill: ink ? INK : rc, align: "center" });
    text(ctx, pc === null ? "Not entered" : remarkFor(pc), mid(COL.rem), m,
         { font: F(ink ? 400 : 700, 18), fill: rc, align: "center" });

    if (has) { totObt += Number(s.obtained); totMax += Number(s.max || 0); }
    y += h;
  });

  // Grand total — out of the subjects actually marked
  const gp = totMax ? (totObt / totMax) * 100 : 0;
  if (ink) {
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(L, y, Rx - L, 46);
  } else {
    ctx.fillStyle = NAVY; ctx.fillRect(L, y, Rx - L, 46);
  }
  const gFill = ink ? INK : "#FFFFFF";
  text(ctx, "GRAND TOTAL", COL.subj[0] + 20, y + 23, { font: F(700, 20), fill: ink ? accent : "#FFFFFF" });
  text(ctx, totMax, mid(COL.max), y + 23, { font: F(700, 19), fill: gFill, align: "center" });
  text(ctx, totObt, mid(COL.obt), y + 23, { font: F(700, 19), fill: gFill, align: "center" });
  text(ctx, `${gp.toFixed(2)}%`, mid(COL.pct), y + 23, { font: F(700, 19), fill: gFill, align: "center" });
  text(ctx, bandFor(gp)?.grade || "", mid(COL.grade), y + 23,
       { font: F(700, 21), fill: ink ? accent : GOLD, align: "center" });
  text(ctx, "Overall", mid(COL.rem), y + 23, { font: F(700, 18), fill: gFill, align: "center" });
  y += 46 + 26;

  // Grading criteria
  text(ctx, "GRADING CRITERIA", L, y + 14, { font: F(700, 28), fill: accent });
  y += 40;
  const bw = (Rx - L) / GRADE_BANDS.length;
  GRADE_BANDS.forEach((b, i) => {
    const x = L + i * bw;
    if (ink) {
      ctx.strokeStyle = "#9696A5"; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, 42);
    } else {
      ctx.fillStyle = b.colour; ctx.fillRect(x, y, bw, 42);
    }
    const lab = b.grade === "FF" ? "FF (<33)" : `${b.grade} (${b.min}-${b.max})`;
    text(ctx, lab, x + bw / 2, y + 21, { font: F(700, 15), fill: ink ? INK : "#FFFFFF", align: "center" });
  });
  y += 42 + 26;

  // Top three
  text(ctx, "TOP THREE POSITIONS", L, y + 14, { font: F(700, 28), fill: accent });
  y += 40;
  const tw = (Rx - L) / 3;
  const shades = [NAVY, "#3A6EA5", "#6C9ECD"];
  const labels = ["1st Position", "2nd Position", "3rd Position"];
  for (let i = 0; i < 3; i++) {
    const t = card.top3?.[i];
    const x = L + i * tw;
    if (ink) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(x, y, tw, 40);
      text(ctx, labels[i], x + tw / 2, y + 20, { font: F(700, 19), fill: accent, align: "center" });
    } else {
      ctx.fillStyle = shades[i]; ctx.fillRect(x, y, tw, 40);
      text(ctx, labels[i], x + tw / 2, y + 20, { font: F(700, 19), fill: "#FFFFFF", align: "center" });
    }
    ctx.strokeStyle = "#BEBECD"; ctx.lineWidth = 2; ctx.strokeRect(x, y + 40, tw, 86);
    if (t) {
      text(ctx, t.name, x + tw / 2, y + 66, { font: fitText(ctx, t.name, tw - 30, 700, 21), fill: INK, align: "center" });
      text(ctx, `S/O: ${t.father || ""}`, x + tw / 2, y + 92,
           { font: fitText(ctx, `S/O: ${t.father || ""}`, tw - 30, 400, 16), fill: MUTED, align: "center" });
      text(ctx, t.score, x + tw / 2, y + 114, { font: F(700, 18), fill: INK, align: "center" });
    } else {
      text(ctx, "—", x + tw / 2, y + 83, { font: F(400, 20), fill: MUTED, align: "center" });
    }
  }
  y += 126 + 26;

  // Teacher's remarks
  text(ctx, "TEACHER'S REMARKS", L, y + 14, { font: F(700, 28), fill: accent });
  y += 40;
  if (ink) {
    ctx.strokeStyle = "#BEBECD"; ctx.lineWidth = 2; ctx.strokeRect(L, y, Rx - L, 66);
    text(ctx, card.remark, L + 30, y + 33, { font: fitText(ctx, card.remark, Rx - L - 60, 400, 22), fill: INK });
  } else {
    ctx.fillStyle = "#E9F6EC"; ctx.fillRect(L, y, Rx - L, 66);
    text(ctx, card.remark, L + 30, y + 33, { font: fitText(ctx, card.remark, Rx - L - 60, 400, 22), fill: "#236437" });
  }

  // Signatures, anchored to the foot so they can never overflow
  const sy = H - 176;
  const blocks = [
    ["Class Teacher", ["Date: ___/___/2026"]],
    ["Dr Naim Tahir Baig", ["Senior Coordinator", "Date: ___/___/2026"]],
    ["Sir Shahbaz Hassan", ["Principal", "School Stamp"]],
  ];
  const bw2 = (Rx - L) / 3;
  blocks.forEach(([nm, subs], i) => {
    const cx = L + i * bw2 + bw2 / 2;
    ctx.strokeStyle = "#8C8CA0"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 130, sy); ctx.lineTo(cx + 130, sy); ctx.stroke();
    text(ctx, nm, cx, sy + 24, { font: F(700, 20), fill: INK, align: "center" });
    subs.forEach((s, j) => text(ctx, s, cx, sy + 52 + j * 24, { font: F(400, 17), fill: MUTED, align: "center" }));
  });
  text(ctx, "This is a computer-generated document. Parent's signature is required.",
       W / 2, H - 46, { font: F(400, 17), fill: MUTED, align: "center" });
}

// Darken a band colour a little so remark text stays readable on white
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.78);
  const g = Math.round(((n >> 8) & 255) * 0.78);
  const b = Math.round((n & 255) * 0.78);
  return `rgb(${r},${g},${b})`;
}
