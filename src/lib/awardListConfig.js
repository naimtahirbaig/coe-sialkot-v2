// Subject lists per class band, in the exact order used on the printed
// award list. Keep this as the single source of truth — the entry page,
// the Excel export, and the PDF export all import from here.

export const SUBJECTS_BY_CLASS = {
  6: ["English", "Urdu", "Islamiyat", "Tarjuma-tul-Qur'an (THQ)", "History & Geography", "Maths", "General Science", "Computer Science", "Fine Arts"],
  7: ["English", "Urdu", "Islamiyat", "Tarjuma-tul-Qur'an (THQ)", "History & Geography", "Maths", "General Science", "Computer Science", "Fine Arts"],
  8: ["English", "Urdu", "Islamiyat", "Tarjuma-tul-Qur'an (THQ)", "History & Geography", "Maths", "General Science", "Computer Science", "Fine Arts"],
  9: ["English", "Urdu", "Islamiyat", "Tarjuma-tul-Qur'an (THQ)", "Pakistan Studies", "Maths", "Physics", "Computer Science / Biology", "Chemistry"],
  10: ["English", "Urdu", "Islamiyat", "Tarjuma-tul-Qur'an (THQ)", "Pakistan Studies", "Maths", "Physics", "Computer Science / Biology", "Chemistry"],
};

export function subjectsForClass(classNum) {
  return SUBJECTS_BY_CLASS[Number(classNum)] || [];
}

// Grading scale from the original workbook header note.
// A+ >=90, A >=80, B >=70, C >=60, D >=40, E 33-39, F <33 (pass mark 33%)
export function gradeForPercentage(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "";
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 40) return "D";
  if (pct >= 33) return "E";
  return "F";
}

// obtained/total marks for one student, given per-subject marks + config
export function computeTotals(marksBySubject, subjectConfig) {
  let obtained = 0;
  let total = 0;
  let anyEntered = false;
  for (const subject of Object.keys(subjectConfig)) {
    const max = Number(subjectConfig[subject] || 0);
    total += max;
    const val = marksBySubject[subject];
    if (val !== null && val !== undefined && val !== "") {
      obtained += Number(val);
      anyEntered = true;
    }
  }
  const pct = total > 0 && anyEntered ? (obtained / total) * 100 : null;
  return {
    obtained: anyEntered ? obtained : null,
    total,
    percentage: pct === null ? null : Math.round(pct * 100) / 100,
    grade: pct === null ? "" : gradeForPercentage(pct),
  };
}

// Standard competition ranking (1, 2, 2, 4, ...) by obtained marks, descending.
// Students with no marks entered at all are left unranked ("-").
export function assignPositions(students) {
  // students: [{ id, obtained }]
  const ranked = students
    .filter((s) => s.obtained !== null && s.obtained !== undefined)
    .sort((a, b) => b.obtained - a.obtained);

  const positions = {};
  let lastScore = null;
  let lastRank = 0;
  ranked.forEach((s, i) => {
    if (s.obtained !== lastScore) {
      lastRank = i + 1;
      lastScore = s.obtained;
    }
    positions[s.id] = lastRank;
  });
  return positions; // { studentId: rank }
}
