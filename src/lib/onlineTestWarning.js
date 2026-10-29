// Warning letter for the online MCQ tests (parent copy, A4 portrait).
// Same letterhead and frame as the exam warning letter (warningLetter.js),
// but the wording is about ONE online test — it does not mention demotion.

const NAVY = "#1F4973", INK = "#14141C", MUTED = "#6B6B7B", GOLD = "#C9922A";
const RED = "#9B1C1C", HAIR = "#D7D7E1", PANEL = "#F4F6F9";
export const OT_LETTER_W = 1240, OT_LETTER_H = 1754;
const L = 85, R = 1155;
const F = (w, s) => `${w} ${s}px Arial, Helvetica, sans-serif`;

function put(ctx, str, x, y, font, fill, align = "left") {
  ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(String(str ?? ""), x, y);
}
function para(ctx, str, x, y, maxW, font, fill, lh) {
  ctx.font = font;
  const words = String(str).split(/\s+/), lines = [];
  let cur = "";
  words.forEach((w) => {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  lines.forEach((l, i) => put(ctx, l, x, y + i * lh, font, fill));
  return y + lines.length * lh;
}

// w: { name, father, roll, cls, incharge, kind: "failed" | "absent",
//      correct, total, pct, grade, passPct }
export function drawOnlineTestWarning(ctx, w, { logos = {}, date = "", testTitle = "" } = {}) {
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, OT_LETTER_W, OT_LETTER_H);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, OT_LETTER_W, 22);
  ctx.fillStyle = NAVY; ctx.fillRect(0, 22, OT_LETTER_W, 12);
  ctx.fillStyle = NAVY; ctx.fillRect(0, OT_LETTER_H - 22, OT_LETTER_W, 22);

  if (logos.punjab) ctx.drawImage(logos.punjab, L, 62, 108, 108);
  if (logos.authority) {
    ctx.save(); ctx.beginPath(); ctx.arc(R - 54, 116, 54, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logos.authority, R - 108, 62, 108, 108); ctx.restore();
  }
  put(ctx, "CENTRE OF EXCELLENCE SIALKOT", OT_LETTER_W / 2, 98, F("bold", 44), NAVY, "center");
  put(ctx, "BOYS CAMPUS", OT_LETTER_W / 2, 144, F("bold", 26), INK, "center");
  put(ctx, "Punjab Daanish Schools & Centres of Excellence Authority", OT_LETTER_W / 2, 180, F("normal", 18), MUTED, "center");
  ctx.fillStyle = GOLD; ctx.fillRect(L, 206, R - L, 3);
  ctx.fillStyle = NAVY; ctx.fillRect(L, 212, R - L, 1.5);

  const yr = (String(date).match(/\d{4}/) || [""])[0];
  const ref = `COE/OT/${yr}/${String(w.cls).replace(/\s+/g, "-")}-${w.roll}`;
  put(ctx, `Ref. No.: ${ref}`, L, 244, F("bold", 20), INK);
  put(ctx, `Date: ${date}`, R, 244, F("bold", 20), INK, "right");

  ctx.fillStyle = RED; ctx.fillRect(L, 274, R - L, 66);
  ctx.fillStyle = GOLD; ctx.fillRect(L, 336, R - L, 4);
  put(ctx, "ACADEMIC WARNING NOTICE", OT_LETTER_W / 2, 306, F("bold", 38), "#fff", "center");

  put(ctx, "To,", L, 390, F("bold", 22), INK);
  put(ctx, "The Parent / Guardian", L + 48, 390, F("bold", 22), INK);
  const rows = [["Student Name:", w.name, "Roll No.:", w.roll], ["Father's Name:", w.father || "", "Class:", w.cls]];
  const c1 = 300, c2 = 700, c3 = 860, rh = 44, ty = 416;
  rows.forEach((row, i) => {
    const y = ty + i * rh;
    ctx.fillStyle = PANEL; ctx.fillRect(L, y, R - L, rh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(L, y, R - L, rh);
    [c1, c2, c3].forEach((cx) => { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + rh); ctx.stroke(); });
    put(ctx, row[0], L + 14, y + rh / 2, F("bold", 21), INK);
    put(ctx, row[1], c1 + 14, y + rh / 2, F("normal", 21), INK);
    put(ctx, row[2], c2 + 14, y + rh / 2, F("bold", 21), INK);
    put(ctx, row[3], c3 + 14, y + rh / 2, F("normal", 21), INK);
  });

  let y = 556;
  put(ctx, "Subject:", L, y, F("bold", 23), INK);
  put(ctx, w.kind === "absent" ? "ONLINE TEST NOT ATTEMPTED / NOT COMPLETED" : "UNSATISFACTORY RESULT IN ONLINE TEST", L + 105, y, F("bold", 23), RED);
  ctx.fillStyle = RED; ctx.fillRect(L + 105, y + 17, 760, 2);
  y += 54;
  put(ctx, "Dear Parent / Guardian,", L, y, F("normal", 22), INK);
  y += 38;
  const intro = w.kind === "absent"
    ? `This is to inform you that your son did not attempt, or did not complete, the online test "${testTitle}" that was held for his class. Every student is required to sit this test, so it has been recorded as a failure.`
    : `This is to bring to your notice that your son's result in the online test "${testTitle}" is unsatisfactory. He scored below the required minimum of ${w.passPct}%, and his result is as follows:`;
  y = para(ctx, intro, L, y, R - L, F("normal", 22), INK, 34);

  y += 20;
  const bw = (R - L - 40) / 3, bh = 112;
  const boxes = w.kind === "absent"
    ? [["MARKS OBTAINED", "0", `out of ${w.total}`], ["PERCENTAGE", "0%", ""], ["STATUS", "Not taken", ""]]
    : [["MARKS OBTAINED", String(w.correct), `out of ${w.total}`], ["PERCENTAGE", `${Number(w.pct).toFixed(1)}%`, `required ${w.passPct}%`], ["GRADE", w.grade || "F", ""]];
  boxes.forEach((b, i) => {
    const bx = L + i * (bw + 20);
    ctx.fillStyle = i === 1 || i === 2 ? "#FBEAEA" : PANEL; ctx.fillRect(bx, y, bw, bh);
    ctx.strokeStyle = i === 0 ? NAVY : RED; ctx.lineWidth = i === 0 ? 1.5 : 2.5; ctx.strokeRect(bx, y, bw, bh);
    put(ctx, b[0], bx + bw / 2, y + 24, F("bold", 15), MUTED, "center");
    put(ctx, b[1], bx + bw / 2, y + 63, F("bold", 38), i === 0 ? NAVY : RED, "center");
    if (b[2]) put(ctx, b[2], bx + bw / 2, y + 95, F("normal", 15), MUTED, "center");
  });
  y += bh + 44;

  put(ctx, "What is required", L, y, F("bold", 24), NAVY);
  ctx.fillStyle = NAVY; ctx.fillRect(L, y + 16, 230, 2.5);
  y += 46;
  const asks = [
    "Please ensure that your son studies and revises the chapter covered in this test regularly at home.",
    "Please meet the Class Teacher at the earliest to discuss how he can improve.",
    "Poor results in tests and examinations may affect his overall academic standing, so steady improvement is expected from now on.",
  ];
  asks.forEach((a) => {
    ctx.fillStyle = RED; ctx.fillRect(L + 6, y - 5, 10, 10);
    y = para(ctx, a, L + 32, y, R - L - 32, F("normal", 22), INK, 33) + 10;
  });

  const sy = 1560, colW = (R - L) / 3;
  const sigs = [["Class Teacher", w.incharge || ""], ["Dr Naim Tahir Baig", "Senior Coordinator"], ["Sir Shahbaz Hassan", "Principal"]];
  sigs.forEach((s, i) => {
    const cx = L + colW * i + colW / 2;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 150, sy); ctx.lineTo(cx + 150, sy); ctx.stroke();
    put(ctx, s[0], cx, sy + 26, F("bold", 21), INK, "center");
    if (s[1]) put(ctx, s[1], cx, sy + 52, F("normal", 18), MUTED, "center");
  });
  put(ctx, "School Stamp", R - colW / 2, sy + 72, "italic 16px Arial, sans-serif", MUTED, "center");

  ctx.strokeStyle = HAIR; ctx.lineWidth = 1.5; ctx.strokeRect(L, 1652, R - L, 44);
  put(ctx, "Received by Parent / Guardian —   Name: ______________________   Signature: ______________   Date: ___ / ___ / ______", L + 14, 1674, F("normal", 16), INK);
  put(ctx, "This is a computer-generated notice and is valid only when signed and stamped.", OT_LETTER_W / 2, 1717, F("normal", 14), MUTED, "center");
}
