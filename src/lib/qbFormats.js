// The look and default layout of the School-Based Assessment (SBA) paper, per subject.
// Safe to import from both server and browser code.

export const SBA_TITLE = "FIRST TERM SCHOOL-BASED ASSESSMENT (SBA) 2026-27";
export const SCHOOL_LINE = "COE Govt. Boys Pilot Secondary School  (EMIS: coesialkot_boys)";
export const LOGO = "/qb/pectaa-logo.jpg";

// Part B question types a part can draw from. "crq" = short or long.
export const PART_TYPES = {
  crq: "Short or Long (any)",
  short: "Short",
  long: "Long",
  fill_blank: "Fill in the Blanks",
  true_false: "True / False",
};
export const PART_QTYPES = { crq: ["short", "long"], short: ["short"], long: ["long"], fill_blank: ["fill_blank"], true_false: ["true_false"] };

const parts = (...m) => ({ parts: m.map((marks) => ({ marks, qtype: "crq" })) });
// a part that only draws from one section of the subject (English / Urdu)
const secParts = (...x) => ({ parts: x.map(([marks, section]) => ({ marks, qtype: "crq", section })) });
const std = (partB) => ({ partA: { count: 10, marks: 1.5, passageSize: 0 }, partB });

// QR codes are the official PECTAA codes from the Grade 8 sample papers (public/qb/qr).
// Other classes have no QR here: upload one in the generator.
const GRADE8 = [
  { names: ["english"], display: "ENGLISH", lang: "en", qr: "english", template: std([secParts([12, "Title & Summary Writing"]), secParts([15, "Reading Comprehension"]), secParts([8, "Listening & Speaking"])]) },
  { names: ["urdu"], display: "URDU", lang: "ur", qr: "urdu", template: std([secParts([15, "Short Answers from the Lesson - مختصر جوابات"]), secParts([10, "Sentence Making - جملہ سازی"]), secParts([10, "Essay Writing - مضمون نویسی"])]) },
  { names: ["mathematics", "maths", "math"], display: "MATHEMATICS", lang: "en", qr: "mathematics", template: std([parts(5, 5), parts(5, 5), parts(7, 8)]) },
  { names: ["science"], display: "SCIENCE", lang: "en", qr: "science", template: std([parts(2, 3, 5), parts(2, 4, 4), parts(2, 5, 8)]) },
  { names: ["computerscience", "computer", "computers"], display: "COMPUTER SCIENCE", lang: "en", qr: "computer-science", template: std([parts(2, 4, 4), parts(2, 4, 4), parts(5, 5, 5)]) },
  { names: ["islamiat", "islamiyat", "islamicstudies"], display: "ISLAMIAT", lang: "ur", qr: "islamiat", template: std([parts(4, 2, 4), parts(3, 4, 3), parts(3, 6, 6)]) },
  { names: ["historyandgeography", "historygeography", "historyandgeographycombined"], display: "HISTORY & GEOGRAPHY", lang: "en", qr: "history-geography", template: std([parts(5, 5), parts(5, 5), parts(8, 7)]) },
  { match: (k) => k.includes("tarjuma"), display: "TARJUMA-TUL-QURAN-UL MAJEED", lang: "ur", qr: "tarjuma-tul-quran",
    template: { partA: { count: 5, marks: 1, passageSize: 0 }, partB: [parts(10), parts(10)] } },
];

// ---- subjects, question types and sections ----
export const SUBJECTS = [
  "English", "Urdu", "Mathematics", "Science", "Computer Science", "Islamiat", "History & Geography",
  "Tarjuma-tul-Quran-ul-Majeed", "Fine Arts", "Physics", "Chemistry", "Biology",
];
export const QTYPE_LABEL = { mcq: "MCQ (Multiple Choice)", short: "Short Question", long: "Long Question", fill_blank: "Fill in the Blanks", true_false: "True / False" };
// English and Urdu use every type and have sections; every other subject has MCQs, short and long questions only.
export const LANG_SUBJECTS = ["english", "urdu"];
export const typesFor = (subject) => (LANG_SUBJECTS.includes(normSubject(subject)) ? ["mcq", "short", "long", "fill_blank", "true_false"] : ["mcq", "short", "long"]);
// Sections follow the Grade 8 SBA sample papers.
export const SECTIONS = {
  english: [
    "Grammar & Vocabulary (MCQs)",      // figures of speech, pronouns, tenses, phrases ...
    "Reading Passage / Poem (MCQs)",    // MCQs that refer to a paragraph or poem
    "Title & Summary Writing",          // read the paragraph, create a title, summarise
    "Reading Comprehension",            // read the paragraph and answer the questions
    "Listening & Speaking",             // instructions for the student / teacher activity
  ],
  urdu: [
    "Vocabulary & Grammar (MCQs) - لغت و قواعد",
    "Lesson & Poem (MCQs) - سبق / نظم",
    "Reading Passage (MCQs) - عبارت",
    "Short Answers from the Lesson - مختصر جوابات",
    "Sentence Making - جملہ سازی",
    "Essay Writing - مضمون نویسی",
  ],
};
export const sectionsFor = (subject) => SECTIONS[normSubject(subject)] || [];

// ---- chapters: a number box and a name box, stored together as "Ch 3: Algebra" ----
export function chapterLabel(no, name) {
  const n = String(no || "").trim().replace(/[^0-9A-Za-z.\-]/g, "").slice(0, 8);
  const t = String(name || "").trim().replace(/\s+/g, " ").slice(0, 80);
  return n && t ? `Ch ${n}: ${t}` : n ? `Ch ${n}` : t;
}
export function parseChapter(s) {
  const m = /^Ch\s+([0-9A-Za-z.\-]+)(?::\s*(.*))?$/.exec(String(s || "").trim());
  return m ? { no: m[1], name: m[2] || "" } : { no: "", name: String(s || "") };
}
// chapters in book order: by number, then by name
export const sortChapters = (list) => [...list].sort((a, b) => {
  const x = parseChapter(a), y = parseChapter(b);
  const nx = parseFloat(x.no), ny = parseFloat(y.no);
  if (Number.isFinite(nx) && Number.isFinite(ny) && nx !== ny) return nx - ny;
  if (Number.isFinite(nx) !== Number.isFinite(ny)) return Number.isFinite(nx) ? -1 : 1;
  return a.localeCompare(b);
});

export const normSubject = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");

export function formatFor(classNum, subject) {
  const key = normSubject(subject);
  const hit = Number(classNum) === 8 ? GRADE8.find((f) => (f.match ? f.match(key) : f.names.includes(key))) : null;
  const generic = Number(classNum) === 8 ? null : GRADE8.find((f) => (f.match ? f.match(key) : f.names.includes(key)));
  const src = hit || generic;
  return {
    display: src ? src.display : String(subject || "").toUpperCase(),
    lang: src ? src.lang : "en",
    qr: hit ? `/qb/qr/${hit.qr}.png` : "",
    template: src ? src.template : std([parts(5, 5), parts(5, 5), parts(7, 8)]),
    known: !!hit,
  };
}

// ---- helpers shared by the generator and the paper sheet ----
export const labelFor = (i, lang) => (lang === "ur" ? ["i", "ii", "iii", "iv", "v", "vi"][i] : "abcdefgh"[i]) + (lang === "ur" ? ")" : " )");

// How to lay out the 4 options of an MCQ inside its half-width column:
// all short -> 4 in a row; medium -> 2 x 2; long -> one per line.
export function optionLayout(opts) {
  const lens = (opts || []).filter(Boolean).map((o) => String(o).replace(/\$[^$]*\$/g, "xxxxxx").length);
  const max = Math.max(0, ...lens);
  return max <= 11 ? "row" : max <= 34 ? "grid" : "list";
}
