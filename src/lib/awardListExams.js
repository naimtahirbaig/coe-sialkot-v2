// Shared helpers for the Exams section.

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Year dropdown range, per the school's requirement.
export const YEARS = [2026, 2027, 2028, 2029, 2030];

export function monthName(m) {
  return MONTHS[Number(m) - 1] || "";
}

// "September 2026 — Monthly Test"
export function examLabel(exam) {
  if (!exam) return "";
  return `${monthName(exam.month)} ${exam.year} — ${exam.name}`;
}

// "September 2026"
export function periodLabel(exam) {
  if (!exam) return "";
  return `${monthName(exam.month)} ${exam.year}`;
}

// Group a flat list of exams into { "2026": { 9: [exam, ...] } } for the
// Year → Month → Exam navigation.
export function groupExams(exams) {
  const out = {};
  (exams || []).forEach((e) => {
    out[e.year] = out[e.year] || {};
    out[e.year][e.month] = out[e.year][e.month] || [];
    out[e.year][e.month].push(e);
  });
  return out;
}

const SHORT_MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

// "Online MCQs" + Sep 2026  ->  "online-mcqs-sep-2026"
// Used for the per-exam URL: /award-list/online-mcqs-sep-2026
export function makeSlug(name, month, year) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const m = SHORT_MONTHS[Number(month) - 1] || "";
  return [base, m, year].filter(Boolean).join("-");
}

// Tidy a slug the admin typed by hand
export function cleanSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Common exam names offered when creating a new one (free text still allowed).
export const SUGGESTED_EXAM_NAMES = [
  "Monthly Test",
  "Mid Term",
  "Final Term",
  "Send Up",
  "Class Test",
];
