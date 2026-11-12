// Question Bank: shared constants, validation and login tokens (no database access here).
import crypto from "crypto";

export const QTYPES = {
  mcq: "Multiple Choice (MCQ)",
  true_false: "True / False",
  fill_blank: "Fill in the Blanks",
  short: "Short Question",
  long: "Long Question",
};
export const QTYPE_PLURAL = {
  mcq: "Multiple Choice Questions (MCQs)",
  true_false: "True / False Statements",
  fill_blank: "Fill in the Blanks",
  short: "Short Questions",
  long: "Long Questions",
};
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const PER_PAGE = 25;
export const MAX_IMPORT_ROWS = 1000;

export class QbError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const letter = (i) => String.fromCharCode(65 + i);
export const fmtNum = (v) => { const n = Number(v); return Number.isFinite(n) ? String(+n.toFixed(2)) : String(v ?? ""); };

// ---------- login tokens (HMAC-signed, no extra env variable needed) ----------
function secretKey() {
  const a = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const b = process.env.ADMIN_PASSWORD || "";
  if (!a && !b) throw new Error("Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY / ADMIN_PASSWORD).");
  return crypto.createHash("sha256").update(`qb-session|${a}|${b}`).digest();
}
const sign = (body) => crypto.createHmac("sha256", secretKey()).update(body).digest("base64url");

export function signToken(payload, ttlSec = 12 * 3600) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const good = sign(body);
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p && p.exp > Math.floor(Date.now() / 1000) ? p : null;
  } catch { return null; }
}
export function safeEqual(x, y) {
  const h = (s) => crypto.createHash("sha256").update(String(s ?? "")).digest();
  return crypto.timingSafeEqual(h(x), h(y));
}

// ---------- question validation ----------
const clean = (v, max) => String(v ?? "").trim().slice(0, max);

export function parseClassNum(v) {
  const m = String(v ?? "").match(/\d{1,2}/);
  const n = m ? Number(m[0]) : NaN;
  return n >= 1 && n <= 12 ? n : null;
}

export const MAX_IMAGE_CHARS = 400000; // ~300 KB picture
export function cleanImage(v) {
  const s = String(v || "");
  if (!s) return "";
  if (s.length > MAX_IMAGE_CHARS || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return null;
  return s;
}

// input: { classNum, subject, chapter, qtype, text, opts[], correct, answer, marks, difficulty, image, passageId }
export function parseQuestion(input) {
  const errors = [];
  const d = {};
  d.class_num = parseClassNum(input.classNum);
  if (!d.class_num) errors.push("Choose a class (1–12).");
  d.subject = clean(input.subject, 60).replace(/\s+/g, " ");
  if (!d.subject) errors.push("Enter a subject.");
  d.chapter = clean(input.chapter, 100);
  d.qtype = String(input.qtype || "");
  if (!QTYPES[d.qtype]) errors.push("Choose a question type.");
  d.text = clean(input.text, 4000);
  if (!d.text) errors.push("Question text is required.");
  const marks = Number(input.marks);
  if (!(marks > 0 && marks <= 100)) errors.push("Marks must be a number between 0 and 100.");
  d.marks = marks;
  d.difficulty = DIFFICULTIES.includes(input.difficulty) ? input.difficulty : "medium";
  d.answer = clean(input.answer, 4000);
  const img = cleanImage(input.image);
  if (img === null) errors.push("The picture must be a PNG, JPEG or WebP under 300 KB.");
  d.image = img || "";
  d.passage_id = null;
  if (input.passageId && d.qtype === "mcq" && Number.isInteger(Number(input.passageId))) d.passage_id = Number(input.passageId);
  d.opts = [];
  d.correct = "";
  if (d.qtype === "mcq") {
    const opts = [0, 1, 2, 3].map((i) => clean((input.opts || [])[i], 500));
    if (!opts[0] || !opts[1]) errors.push("An MCQ needs at least options A and B.");
    const c = String(input.correct || "").trim().toUpperCase();
    if (!"ABCD".includes(c) || c.length !== 1 || !opts["ABCD".indexOf(c)]) errors.push("Pick the correct option (it must not be empty).");
    else d.correct = c;
    d.opts = opts;
  } else if (d.qtype === "true_false") {
    const c = String(input.correct || "").trim().toLowerCase();
    if (c === "true" || c === "false") d.correct = c === "true" ? "True" : "False";
    else errors.push("Choose True or False as the correct answer.");
  }
  return { errors, data: d };
}

// ---------- CSV import ----------
const TYPE_ALIASES = {
  mcq: "mcq", mcqs: "mcq", "multiple choice": "mcq",
  short: "short", "short question": "short", "short questions": "short",
  long: "long", "long question": "long", "long questions": "long",
  true_false: "true_false", "true/false": "true_false", "true / false": "true_false", tf: "true_false", "true false": "true_false",
  fill_blank: "fill_blank", fill: "fill_blank", "fill in the blanks": "fill_blank", "fill in the blank": "fill_blank",
};
export const CSV_COLUMNS = ["class", "subject", "chapter", "type", "question", "option_a", "option_b", "option_c", "option_d", "correct", "answer", "marks", "difficulty"];

// row: object with lower-case CSV headers. Returns { errors, data }
export function parseImportRow(raw) {
  const row = {};
  for (const [k, v] of Object.entries(raw || {})) row[String(k).trim().toLowerCase()] = String(v ?? "").trim();
  const qtype = TYPE_ALIASES[(row.type || "").toLowerCase()];
  if (!qtype) return { errors: [`unknown type '${row.type || ""}'`] };
  return parseQuestion({
    classNum: row.class, subject: row.subject, chapter: row.chapter, qtype, text: row.question,
    opts: [row.option_a, row.option_b, row.option_c, row.option_d], correct: row.correct,
    answer: row.answer, marks: row.marks, difficulty: (row.difficulty || "medium").toLowerCase(),
  });
}

// ---------- paper specification (SBA layout) ----------
// body: { title, school, classNum, subject, subjectTitle, lang, qr, totalMarks, chapters[], difficulty,
//         partA:{count, marks, passageSize}, partB:[{ parts:[{ marks, qtype }] }] }
export const PART_QTYPE_KEYS = ["crq", "short", "long", "fill_blank", "true_false"];

export function parsePaperSpec(body) {
  const errors = [];
  const form = {
    title: clean(body.title, 150), school: clean(body.school, 200),
    classNum: parseClassNum(body.classNum), subject: clean(body.subject, 60),
    subjectTitle: clean(body.subjectTitle, 80), lang: body.lang === "ur" ? "ur" : "en",
    qr: String(body.qr || ""),
    totalMarks: Number(body.totalMarks),
    difficulty: DIFFICULTIES.includes(body.difficulty) ? body.difficulty : "",
    chapters: Array.isArray(body.chapters) ? body.chapters.map((c) => clean(c, 100)).filter(Boolean).slice(0, 100) : [],
  };
  if (!form.classNum || !form.subject) errors.push("Choose a class and a subject.");
  if (!form.title) errors.push("Enter the assessment title.");
  if (!form.subjectTitle) form.subjectTitle = form.subject.toUpperCase();
  if (!(form.totalMarks > 0)) errors.push("Enter the total marks.");
  // QR: one of our own bundled files, or an uploaded picture (checked like any other picture)
  if (form.qr && !/^\/qb\/qr\/[a-z0-9-]+\.png$/.test(form.qr)) {
    const img = cleanImage(form.qr);
    if (!img) { errors.push("The QR picture must be a PNG, JPEG or WebP under 300 KB."); form.qr = ""; } else form.qr = img;
  }

  const a = body.partA || {};
  const partA = { count: parseInt(a.count, 10), marks: Number(a.marks), passageSize: parseInt(a.passageSize, 10) || 0 };
  if (!(partA.count >= 0 && partA.count <= 60) || (partA.count > 0 && !(partA.marks > 0 && partA.marks <= 100))) errors.push("Part A: check the number of MCQs and the marks of each.");
  else if (partA.passageSize < 0 || partA.passageSize > partA.count) errors.push("Part A: the passage questions cannot be more than the number of MCQs.");

  const partB = [];
  (Array.isArray(body.partB) ? body.partB : []).slice(0, 12).forEach((blk, i) => {
    const parts = (Array.isArray(blk.parts) ? blk.parts : []).slice(0, 8).map((p) => ({ marks: Number(p.marks), qtype: PART_QTYPE_KEYS.includes(p.qtype) ? p.qtype : "crq" }));
    if (!parts.length || parts.some((p) => !(p.marks > 0 && p.marks <= 100))) errors.push(`Part B, question ${i + 1}: add at least one part, each with marks.`);
    else partB.push({ parts });
  });
  if (!partA.count && !partB.length && !errors.length) errors.push("Add Part A and/or Part B questions.");

  if (!errors.length) {
    const total = partA.count * partA.marks + partB.reduce((t, q) => t + q.parts.reduce((x, p) => x + p.marks, 0), 0);
    if (Math.abs(total - form.totalMarks) > 0.001) {
      errors.push(`Part A and Part B add up to ${fmtNum(total)} marks, but the total is ${fmtNum(form.totalMarks)}. Adjust the marks or the total.`);
    }
  }
  return { errors, form, partA, partB };
}

// Fresh (never used in an earlier paper) questions first, then the rest; both shuffled.
export function chooseIds(candidateIds, usedBefore, exclude, count, rand = Math.random) {
  const ok = candidateIds.filter((id) => !exclude.has(id));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fresh = shuffle(ok.filter((id) => !usedBefore.has(id)));
  const stale = shuffle(ok.filter((id) => usedBefore.has(id)));
  return { ids: fresh.concat(stale).slice(0, count), available: ok.length };
}
