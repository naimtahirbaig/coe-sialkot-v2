// Warning / advisory letter for the online MCQ tests (parent copy, A4 portrait).
// Same letterhead and frame as the exam warning letter (warningLetter.js),
// but the wording is about ONE online test — it does not mention demotion.
// Optional bilingual mode: every paragraph is followed by its Urdu translation.

const NAVY = "#1F4973", INK = "#14141C", MUTED = "#6B6B7B", GOLD = "#C9922A";
const RED = "#9B1C1C", HAIR = "#D7D7E1", PANEL = "#F4F6F9";
export const OT_LETTER_W = 1240, OT_LETTER_H = 1754;
const L = 85, R = 1155;
const F = (w, s) => `${w} ${s}px Arial, Helvetica, sans-serif`;
const U = (w, s) => `${w} ${s}px COEUrdu, "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Geeza Pro", Arial, sans-serif`;

// Loads the embedded Urdu font (served from /fonts) so the canvas can use it.
let urduFontP = null;
export function loadUrduFont() {
  if (typeof document === "undefined" || typeof FontFace === "undefined") return Promise.resolve(false);
  if (!urduFontP) {
    urduFontP = Promise.all([
      new FontFace("COEUrdu", "url(/fonts/noto-nastaliq-urdu-400.woff2)", { weight: "400" }).load(),
      new FontFace("COEUrdu", "url(/fonts/noto-nastaliq-urdu-700.woff2)", { weight: "700" }).load(),
    ]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); return true; }).catch(() => false);
  }
  return urduFontP;
}

function put(ctx, str, x, y, font, fill, align = "left") {
  ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(String(str ?? ""), x, y);
}
function putU(ctx, str, x, y, font, fill, align = "right") {
  ctx.direction = "rtl";
  put(ctx, str, x, y, font, fill, align);
  ctx.direction = "ltr";
}
function wrap(ctx, str, maxW) {
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
  ctx.font = font;
  const lines = wrap(ctx, str, maxW);
  lines.forEach((l, i) => put(ctx, l, x, y + i * lh, font, fill));
  return y + lines.length * lh;
}
// Urdu paragraph: right-aligned at xRight, wrapped to maxW.
function paraU(ctx, str, xRight, y, maxW, font, fill, lh) {
  ctx.font = font; ctx.direction = "rtl";
  const lines = wrap(ctx, str, maxW);
  lines.forEach((l, i) => put(ctx, l, xRight, y + i * lh, font, fill, "right"));
  ctx.direction = "ltr";
  return y + lines.length * lh;
}

// Urdu wording, matching the English wording line for line.
function urdu(w, adv, title) {
  const absent = w.kind === "absent";
  const q = `"${title}"`;
  const pass = `${w.passPct} فیصد`;
  return {
    title: adv ? "تعلیمی مشاورتی نوٹس" : "تعلیمی تنبیہی نوٹس",
    to: "بخدمت: والدین / سرپرست",
    dear: "محترم والدین / سرپرست،",
    subject: adv
      ? (absent ? "مشاورتی نوٹس: آن لائن ٹیسٹ مکمل نہیں کیا گیا" : "آن لائن ٹیسٹ کے نتیجے پر مشاورت — آئیے مل کر آپ کے بیٹے کی مدد کریں")
      : (absent ? "آن لائن ٹیسٹ نہیں دیا / مکمل نہیں کیا" : "آن لائن ٹیسٹ میں غیر تسلی بخش نتیجہ"),
    intro: adv
      ? (absent
        ? `ہمارے ریکارڈ کے مطابق آپ کے بیٹے نے آن لائن ٹیسٹ ${q} نہیں دیا یا مکمل نہیں کیا۔ براہِ کرم اس سے بات کریں اور اسے حوصلہ دیں کہ وہ اگلا ٹیسٹ مکمل طور پر دے۔`
        : `ہم آپ کے بیٹے کا آن لائن ٹیسٹ ${q} کا نتیجہ آپ کے ساتھ شیئر کر رہے ہیں تاکہ ہم مل کر اس کی مدد کر سکیں۔ اس کا نتیجہ ${pass} سے کم ہے جو ہم دیکھنا چاہتے ہیں، لیکن ہمیں یقین ہے کہ گھر پر باقاعدہ مشق سے وہ بہت بہتر کارکردگی دکھا سکتا ہے۔ اس کا نتیجہ درج ذیل ہے:`)
      : (absent
        ? `آپ کو مطلع کیا جاتا ہے کہ آپ کے بیٹے نے آن لائن ٹیسٹ ${q} جو اس کی جماعت کے لیے منعقد ہوا، نہیں دیا یا مکمل نہیں کیا۔ ہر طالب علم کے لیے یہ ٹیسٹ دینا لازمی ہے، اس لیے اسے ناکامی شمار کیا گیا ہے۔`
        : `آپ کی توجہ اس طرف دلائی جاتی ہے کہ آپ کے بیٹے کا آن لائن ٹیسٹ ${q} میں نتیجہ غیر تسلی بخش ہے۔ اس نے مطلوبہ کم از کم ${pass} سے کم نمبر حاصل کیے، اور اس کا نتیجہ درج ذیل ہے:`),
    head: adv ? "آپ کس طرح مدد کر سکتے ہیں" : "مطلوبہ اقدامات",
    asks: adv ? [
      "براہِ کرم گھر پر مطالعے اور دہرائی کے لیے ایک مقررہ وقت رکھیں اور ہر ہفتے اس کی کاپیوں پر ایک نظر ڈالیں۔",
      "براہِ کرم اسے حوصلہ دیں کہ وہ باب دوبارہ پڑھے اور جو موضوع مشکل لگے اس کے بارے میں متعلقہ مضمون کے استاد سے پوچھے۔",
      "براہِ کرم متعلقہ مضمون کے استاد سے واٹس ایپ پیغام کے ذریعے رابطہ کریں اور وجہ بیان کریں تاکہ ہم مل کر اس کی مدد کا منصوبہ بنا سکیں۔",
    ] : [
      "براہِ کرم یقینی بنائیں کہ آپ کا بیٹا اس ٹیسٹ میں شامل باب کا گھر پر باقاعدگی سے مطالعہ اور دہرائی کرے۔",
      "براہِ کرم جلد از جلد کلاس ٹیچر سے ملاقات کریں تاکہ بہتری کے طریقوں پر بات ہو سکے۔",
      "ٹیسٹوں اور امتحانات میں کمزور نتائج اس کی مجموعی تعلیمی حیثیت پر اثر ڈال سکتے ہیں، اس لیے اب سے مسلسل بہتری متوقع ہے۔",
    ],
    thanks: "آپ کے تعاون کا شکریہ۔ ہم آپ کے ساتھ شراکت کی قدر کرتے ہیں اور ہمیں یقین ہے کہ آپ کی حوصلہ افزائی سے آپ کا بیٹا آئندہ ٹیسٹوں میں اچھی کارکردگی دکھائے گا۔",
  };
}

// Everything from the "Subject:" line down to the end of the text. k scales
// font sizes and spacing, so a bilingual letter can shrink to fit one page.
// Returns the y where the text ends.
function body(ctx, w, o, k) {
  const { adv, ACC, bi, testTitle, ur } = o;
  const eF = F("normal", 22 * k), eB = F("bold", 23 * k), eL = 33 * k;
  const uF = U("normal", 24 * k), uB = U("bold", 24 * k), uL = 58 * k;
  let y = 556;

  put(ctx, "Subject:", L, y, eB, INK);
  const subj = adv
    ? (w.kind === "absent" ? "ADVISORY: ONLINE TEST NOT COMPLETED" : "ADVISORY ON ONLINE TEST RESULT — LET US HELP YOUR SON")
    : (w.kind === "absent" ? "ONLINE TEST NOT ATTEMPTED / NOT COMPLETED" : "UNSATISFACTORY RESULT IN ONLINE TEST");
  put(ctx, subj, L + 105, y, eB, ACC);
  ctx.fillStyle = ACC; ctx.fillRect(L + 105, y + 17 * k, 760, 2);
  y += 54 * k;
  if (bi) { putU(ctx, ur.subject, R, y + 6 * k, uB, ACC); y += 58 * k; }
  put(ctx, "Dear Parent / Guardian,", L, y, eF, INK);
  if (bi) putU(ctx, ur.dear, R, y + 2, uF, INK);
  y += 38 * k;

  const intro = adv
    ? (w.kind === "absent"
      ? `We are writing to let you know that our records show your son did not attempt, or did not complete, the online test "${testTitle}". We would be grateful if you could talk to him about it and encourage him to take the next test in full.`
      : `We are writing to share your son's result in the online test "${testTitle}", so that we can support him together. His result is below the ${w.passPct}% we hope to see, but we are confident that with some regular practice at home he can do much better. His result is as follows:`)
    : w.kind === "absent"
    ? `This is to inform you that your son did not attempt, or did not complete, the online test "${testTitle}" that was held for his class. Every student is required to sit this test, so it has been recorded as a failure.`
    : `This is to bring to your notice that your son's result in the online test "${testTitle}" is unsatisfactory. He scored below the required minimum of ${w.passPct}%, and his result is as follows:`;
  y = para(ctx, intro, L, y, R - L, eF, INK, eL);
  if (bi) y = paraU(ctx, ur.intro, R, y + 18 * k, R - L, uF, NAVY, uL) - 14 * k;

  y += 20 * k;
  const bw = (R - L - 40) / 3, bh = (bi ? 152 : 112) * Math.max(k, 0.82);
  const boxes = w.kind === "absent"
    ? [["MARKS OBTAINED", "0", `out of ${w.total}`], ["PERCENTAGE", "0%", ""], ["STATUS", "Not taken", ""]]
    : [["MARKS OBTAINED", String(w.correct), `out of ${w.total}`], ["PERCENTAGE", `${Number(w.pct).toFixed(1)}%`, `required ${w.passPct}%`], ["GRADE", w.grade || "F", ""]];
  const bu = ["حاصل کردہ نمبر", "فیصد", w.kind === "absent" ? "ٹیسٹ نہیں دیا" : "گریڈ"];
  boxes.forEach((b, i) => {
    const bx = L + i * (bw + 20);
    ctx.fillStyle = i === 1 || i === 2 ? (adv ? "#FFF6DC" : "#FBEAEA") : PANEL; ctx.fillRect(bx, y, bw, bh);
    ctx.strokeStyle = i === 0 ? NAVY : (adv ? GOLD : RED); ctx.lineWidth = i === 0 ? 1.5 : 2.5; ctx.strokeRect(bx, y, bw, bh);
    const cy = (f) => y + bh * f;
    put(ctx, b[0], bx + bw / 2, cy(bi ? 0.13 : 0.21), F("bold", 15), MUTED, "center");
    if (bi) putU(ctx, bu[i], bx + bw / 2, cy(0.4), U("bold", 17), MUTED, "center");
    put(ctx, b[1], bx + bw / 2, cy(bi ? 0.68 : 0.56), F("bold", 38 * Math.max(k, 0.85)), i === 0 || adv ? NAVY : RED, "center");
    if (b[2]) put(ctx, b[2], bx + bw / 2, cy(bi ? 0.9 : 0.85), F("normal", 15), MUTED, "center");
  });
  y += bh + 44 * k;

  put(ctx, adv ? "How you can help" : "What is required", L, y, F("bold", 24 * k), NAVY);
  if (bi) putU(ctx, ur.head, R, y + 4, U("bold", 25 * k), NAVY);
  ctx.fillStyle = NAVY; ctx.fillRect(L, y + 16 * k, 230, 2.5);
  y += 46 * k;
  const asks = adv ? [
    "Please set aside a regular time for study and revision at home, and take a short look at his notebooks each week.",
    "Please encourage him to go through the chapter again and to ask his subject teacher about any topic he finds difficult.",
    "Please contact the subject teacher through a WhatsApp message and explain the reason, so that we can plan together how to help him.",
  ] : [
    "Please ensure that your son studies and revises the chapter covered in this test regularly at home.",
    "Please meet the Class Teacher at the earliest to discuss how he can improve.",
    "Poor results in tests and examinations may affect his overall academic standing, so steady improvement is expected from now on.",
  ];
  asks.forEach((a, i) => {
    ctx.fillStyle = adv ? GOLD : RED; ctx.fillRect(L + 6, y - 5, 10, 10);
    y = para(ctx, a, L + 32, y, R - L - 32, eF, INK, eL);
    if (bi) {
      ctx.fillStyle = adv ? GOLD : RED; ctx.fillRect(R - 16, y + 18 * k - 5, 10, 10);
      y = paraU(ctx, ur.asks[i], R - 32, y + 18 * k, R - L - 32, uF, NAVY, uL) - 14 * k;
    }
    y += 10 * k;
  });
  if (adv) {
    y = para(ctx, "Thank you for your cooperation. We value our partnership with you and are confident that, with your encouragement, your son will do well in the coming tests.", L, y + 18 * k, R - L, eF, INK, eL);
    if (bi) y = paraU(ctx, ur.thanks, R, y + 18 * k, R - L, uF, NAVY, uL) - 14 * k;
  }
  return y;
}

// w: { name, father, roll, cls, incharge, kind: "failed" | "absent",
//      correct, total, pct, grade, passPct }
// bilingual: add the Urdu translation under each paragraph (call loadUrduFont() first).
export function drawOnlineTestWarning(ctx, w, { logos = {}, date = "", testTitle = "", tone = "warning", bilingual = false } = {}) {
  // tone "advisory" = the lenient version: friendly wording, navy and gold only.
  const adv = tone === "advisory";
  const ACC = adv ? NAVY : RED;
  const bi = !!bilingual;
  const ur = bi ? urdu(w, adv, testTitle) : null;
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
  const ref = `COE/${adv ? "OT-ADV" : "OT"}/${yr}/${String(w.cls).replace(/\s+/g, "-")}-${w.roll}`;
  put(ctx, `Ref. No.: ${ref}`, L, 244, F("bold", 20), INK);
  put(ctx, `Date: ${date}`, R, 244, F("bold", 20), INK, "right");

  ctx.fillStyle = ACC; ctx.fillRect(L, 274, R - L, 66);
  ctx.fillStyle = GOLD; ctx.fillRect(L, 336, R - L, 4);
  const title = adv ? "ACADEMIC ADVISORY NOTICE" : "ACADEMIC WARNING NOTICE";
  if (bi) {
    put(ctx, title, L + 26, 306, F("bold", 33), "#fff", "left");
    putU(ctx, ur.title, R - 26, 316, U("bold", 26), "#fff");
  } else put(ctx, title, OT_LETTER_W / 2, 306, F("bold", 38), "#fff", "center");

  put(ctx, "To,", L, 390, F("bold", 22), INK);
  put(ctx, "The Parent / Guardian", L + 48, 390, F("bold", 22), INK);
  if (bi) putU(ctx, ur.to, R, 388, U("bold", 21), INK);
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

  const o = { adv, ACC, bi, testTitle, ur };
  if (bi) {
    // fit to one page: measure on a scratch canvas, shrinking until it fits
    const scratch = document.createElement("canvas").getContext("2d");
    let k = 1;
    while (k > 0.66 && body(scratch, w, o, k) > 1520) k = Math.round((k - 0.04) * 100) / 100;
    body(ctx, w, o, k);
  } else body(ctx, w, o, 1);

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
