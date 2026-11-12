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
const std = (partB) => ({ partA: { count: 10, marks: 1.5, passageSize: 0 }, partB });

// QR codes are the official PECTAA codes from the Grade 8 sample papers (public/qb/qr).
// Other classes have no QR here: upload one in the generator.
const GRADE8 = [
  { names: ["english"], display: "ENGLISH", lang: "en", qr: "english", template: std([parts(12), parts(15), parts(8)]) },
  { names: ["urdu"], display: "URDU", lang: "ur", qr: "urdu", template: std([parts(15), parts(10), parts(10)]) },
  { names: ["mathematics", "maths", "math"], display: "MATHEMATICS", lang: "en", qr: "mathematics", template: std([parts(5, 5), parts(5, 5), parts(7, 8)]) },
  { names: ["science"], display: "SCIENCE", lang: "en", qr: "science", template: std([parts(2, 3, 5), parts(2, 4, 4), parts(2, 5, 8)]) },
  { names: ["computerscience", "computer", "computers"], display: "COMPUTER SCIENCE", lang: "en", qr: "computer-science", template: std([parts(2, 4, 4), parts(2, 4, 4), parts(5, 5, 5)]) },
  { names: ["islamiat", "islamiyat", "islamicstudies"], display: "ISLAMIAT", lang: "ur", qr: "islamiat", template: std([parts(4, 2, 4), parts(3, 4, 3), parts(3, 6, 6)]) },
  { names: ["historyandgeography", "historygeography", "historyandgeographycombined"], display: "HISTORY & GEOGRAPHY", lang: "en", qr: "history-geography", template: std([parts(5, 5), parts(5, 5), parts(8, 7)]) },
  { match: (k) => k.includes("tarjuma"), display: "TARJUMA-TUL-QURAN-UL MAJEED", lang: "ur", qr: "tarjuma-tul-quran",
    template: { partA: { count: 5, marks: 1, passageSize: 0 }, partB: [parts(10), parts(10)] } },
];

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
