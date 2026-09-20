// Result card configuration — colours, grading scale, remarks.
//
// NOTE ON THE GRADING SCALE
// This follows the sample Progress Report Card supplied by the school:
//     A+ 90-100 | A 80-89 | B 70-79 | C 60-69
//     D  50-59  | E 40-49 | F 33-39 | FF below 33
//
// The award list page and the proformas currently use a different scale
// (D 40-59, E 33-39, F below 33) from lib/awardListConfig.js. A student on
// 45% therefore prints as E here but shows as D there. To make everything
// agree, change gradeForPercentage() in lib/awardListConfig.js to match
// the bands below — this file is the single place the card's scale lives.

export const SECTION_COLOURS = {
  Jinnah:  "#1D4ED8",   // blue
  Iqbal:   "#15803D",   // green
  Sirsyed: "#CA8A04",   // yellow
  Liaqat:  "#B91C1C",   // red
  Tipu:    "#6D28D9",   // purple
  Babar:   "#EA580C",   // orange
  Abdali:  "#78350F",   // brown
};

export const DEFAULT_COLOUR = "#1F4973";

// "Jinnah (A)" -> "#1D4ED8"
export function colourForSection(sectionLabel) {
  const key = String(sectionLabel || "").split("(")[0].trim();
  return SECTION_COLOURS[key] || DEFAULT_COLOUR;
}

export const GRADE_BANDS = [
  { grade: "A+", min: 90, max: 100, colour: "#4CA05A", remark: "Excellent" },
  { grade: "A",  min: 80, max: 89,  colour: "#6EBE78", remark: "Very Good" },
  { grade: "B",  min: 70, max: 79,  colour: "#F0C850", remark: "Good" },
  { grade: "C",  min: 60, max: 69,  colour: "#EBA046", remark: "Satisfactory" },
  { grade: "D",  min: 50, max: 59,  colour: "#DC8C3C", remark: "Needs Improvement" },
  { grade: "E",  min: 40, max: 49,  colour: "#D76455", remark: "Weak" },
  { grade: "F",  min: 33, max: 39,  colour: "#BE3C37", remark: "Poor" },
  { grade: "FF", min: 0,  max: 32,  colour: "#8C2826", remark: "Very Poor" },
];

export function bandFor(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  return GRADE_BANDS.find((b) => pct >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
}

export function gradeFor(pct) {
  return bandFor(pct)?.grade || "";
}

export function remarkFor(pct) {
  return bandFor(pct)?.remark || "";
}

// Overall comment printed in the Teacher's Remarks box.
export function overallRemark(pct) {
  if (pct >= 90) return "Outstanding performance! Keep up the excellent work.";
  if (pct >= 80) return "Very good result. A little more effort will take you to the top.";
  if (pct >= 70) return "Good performance. Keep working consistently.";
  if (pct >= 60) return "Satisfactory result. More regular study is needed.";
  if (pct >= 50) return "Fair result. Please give more attention to weaker subjects.";
  if (pct >= 40) return "Needs improvement. Regular study and revision are necessary.";
  if (pct >= 33) return "Weak performance. Extra support and daily practice are required.";
  return "Very weak performance. Immediate attention from parents and teachers is needed.";
}

// Output sizes. The card is drawn on a 1240 x 1754 grid (A4 proportions)
// and scaled up, so every size below is the same artwork.
export const SIZES = {
  "4k":    { label: "4K (3840 × 5432)",       scale: 3.0968 },
  "print": { label: "Print 300 DPI (2480 × 3508)", scale: 2 },
  "screen":{ label: "Screen (1240 × 1754)",   scale: 1 },
};

export const BASE_W = 1240;
export const BASE_H = 1754;
