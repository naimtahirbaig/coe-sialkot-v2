// Proforma computation.
//
// Both proformas are derived ENTIRELY from award list marks — nothing is
// stored separately, so they can never drift out of sync with what
// teachers enter. Recomputed on every request.
//
// Pass mark: 40%.
//
// Column G — "Result %" (Proforma 1) / "Subject pass %" (Proforma 2) — is
// the computed pass percentage, for every class 6–10. The proforma
// originally said "Board Result %", but that wording was dropped: for this
// school these are simply the normal results, entered through the award
// lists like every other class.

export const PASS_PCT = 40;

const r2 = (n) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n * 100) / 100);

// Proforma 1 bands: 90+, 80s, 70s, 60s, 50s, 40s, below 40
export function band1(pct) {
  if (pct >= 90) return "b90";
  if (pct >= 80) return "b80";
  if (pct >= 70) return "b70";
  if (pct >= 60) return "b60";
  if (pct >= 50) return "b50";
  if (pct >= 40) return "b40";
  return "below40";
}

// Proforma 2 bands: 90+, 80s, 70s, 60s, 50s, 40s, 33-39, below 33
export function band2(pct) {
  if (pct >= 90) return "b90";
  if (pct >= 80) return "b80";
  if (pct >= 70) return "b70";
  if (pct >= 60) return "b60";
  if (pct >= 50) return "b50";
  if (pct >= 40) return "b40";
  if (pct >= 33) return "b33";
  return "below33";
}

const EMPTY1 = () => ({ b90: 0, b80: 0, b70: 0, b60: 0, b50: 0, b40: 0, below40: 0 });
const EMPTY2 = () => ({ b90: 0, b80: 0, b70: 0, b60: 0, b50: 0, b40: 0, b33: 0, below33: 0 });

/**
 * Proforma 1 — overall class/section wise result.
 * One row per section.
 */
export function buildProforma1({ sections, studentsBySection, configBySection, marksBySection }) {
  return sections.map((section, i) => {
    const students = studentsBySection[section.id] || [];
    const config = configBySection[section.id] || {};     // { subject: total_marks }
    const marks = marksBySection[section.id] || {};       // { studentId: { subject: value } }

    // Full paper total, reported in the "Total Marks" column.
    const totalMarks = Object.values(config).reduce((a, b) => a + (Number(b) || 0), 0);

    const pcts = [];
    students.forEach((st) => {
      const sm = marks[st.id] || {};
      const entered = Object.keys(config).filter(
        (sub) => sm[sub] !== null && sm[sub] !== undefined && sm[sub] !== ""
      );
      if (entered.length === 0) return;                   // did not appear

      const obtained = entered.reduce((a, sub) => a + Number(sm[sub] || 0), 0);

      // Percentage is out of the subjects this student ACTUALLY has marks
      // in — not every subject that happens to have a total set. Otherwise
      // a student would be scored as if they had failed every paper a
      // teacher simply hasn't entered yet, and mid-entry everyone reads 0%.
      //
      // A blank therefore means "not entered yet"; enter 0 for a student
      // who was absent or genuinely scored nothing.
      const outOf = entered.reduce((a, sub) => a + (Number(config[sub]) || 0), 0);
      if (outOf > 0) pcts.push({ obtained, pct: (obtained / outOf) * 100 });
    });

    const appeared = pcts.length;
    const passed = pcts.filter((p) => p.pct >= PASS_PCT).length;
    const avgMarks = appeared ? pcts.reduce((a, p) => a + p.obtained, 0) / appeared : null;

    const bands = EMPTY1();
    pcts.forEach((p) => bands[band1(p.pct)]++);

    const above70 = bands.b90 + bands.b80 + bands.b70;
    const below70 = bands.b60 + bands.b50 + bands.b40 + bands.below40;
    const passPct = appeared ? (passed / appeared) * 100 : null;

    return {
      sr: i + 1,
      incharge: section.class_incharge,
      className: `${section.class}-${section.section_label}`,
      class: section.class,
      appeared,
      passed,
      passPct: r2(passPct),
      resultPct: r2(passPct),
      avgMarks: r2(avgMarks),
      totalMarks: totalMarks || null,
      // Mean of the students' own percentages. Dividing the average mark
      // by the full paper total would understate the class whenever some
      // subjects are still unentered.
      avgPct: appeared ? r2(pcts.reduce((a, p) => a + p.pct, 0) / appeared) : null,
      bands,
      above70,
      below70,
      diff70: above70 - below70,
      above70Pct: appeared ? r2((above70 / appeared) * 100) : null,
    };
  });
}

/**
 * Proforma 2 — teacher wise, per subject.
 * Returns { [subject]: rows[] }, one row per section that has data.
 */
export function buildProforma2({ sections, studentsBySection, configBySection, teacherBySection, marksBySection, subjectsBySection }) {
  const out = {};

  sections.forEach((section) => {
    const students = studentsBySection[section.id] || [];
    const config = configBySection[section.id] || {};
    const teachers = teacherBySection[section.id] || {};
    const marks = marksBySection[section.id] || {};
    const subjects = subjectsBySection[section.id] || [];

    subjects.forEach((subject) => {
      const total = Number(config[subject] || 0);
      const vals = [];
      students.forEach((st) => {
        const v = (marks[st.id] || {})[subject];
        if (v === null || v === undefined || v === "") return;
        vals.push(Number(v));
      });
      if (vals.length === 0 && !total) return;            // nothing entered

      const appeared = vals.length;
      const pcts = total > 0 ? vals.map((v) => (v / total) * 100) : [];
      const passed = pcts.filter((p) => p >= PASS_PCT).length;
      const avg = appeared ? vals.reduce((a, b) => a + b, 0) / appeared : null;

      const bands = EMPTY2();
      pcts.forEach((p) => bands[band2(p)]++);

      const above70 = bands.b90 + bands.b80 + bands.b70;
      const below70 = bands.b60 + bands.b50 + bands.b40 + bands.b33 + bands.below33;
      const passPct = appeared ? (passed / appeared) * 100 : null;

      out[subject] = out[subject] || [];
      out[subject].push({
        sr: out[subject].length + 1,
        teacher: teachers[subject] || "",
        className: `${section.class}-${section.section_label}`,
        class: section.class,
        appeared,
        passed,
        passPct: r2(passPct),
        resultPct: r2(passPct),
        totalMarks: total || null,
        avgMarks: r2(avg),
        avgPct: total && avg !== null ? r2((avg / total) * 100) : null,   // single subject: total is exact
        bands,
        above70,
        below70,
        diff70: above70 - below70,
        above70Pct: appeared ? r2((above70 / appeared) * 100) : null,
      });
    });
  });

  return out;
}

// Column headings, kept here so the page and the Excel export agree.
export const P1_HEADERS = [
  "Sr. No", "Name of Class Incharge", "Name of Class with section",
  "No. of Students appeared", "No. of Students Passed", "Passed %",
  "Result %", "Average Student Marks", "Total Marks", "Average marks %",
  "90% above", "80% above", "70% above", "60% above", "50% above", "40% above", "Below 40%",
  "70 % & above", "Below 70 %", "Difference 70 % Above & Below", "70% & above Grade %",
];

export const P2_HEADERS = [
  "Sr. No", "Name of Teacher", "Class with section",
  "No of Students appeared", "No of Students Passed", "Pass %",
  "Subject pass %", "Total Marks of Subject",
  "Average Student Marks in Subject", "Average marks %",
  "90 % & above", "80 % & above", "70 % & above", "60 % & above",
  "50 % & above", "40 % & above", "33 % & above", "33 % & Below",
  "No of 70% & above Grades", "No of Below 70% Grades",
  "Difference 70 % Above & Below Grades", "70% Above %",
];
