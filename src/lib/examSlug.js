// Exam name and month from an award-list address, e.g.
// "first-term-sba-sep-2026" -> { name: "First Term SBA", period: "September 2026" }
const SHORT_MONTHS = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

// Words with a fixed spelling, rather than plain title-casing.
const SPECIAL_WORDS = {
  sba: "SBA", mcq: "MCQ", mcqs: "MCQs", thq: "THQ",
  ict: "ICT", pe: "PE", hod: "HOD", coe: "COE", sst: "SST",
};

// "first-term-sba-sep-2026" -> { name: "First Term SBA", period: "September 2026" }
export function readSlug(slug) {
  const parts = String(slug || "").split("-").filter(Boolean);
  const year = parts.length && /^\d{4}$/.test(parts[parts.length - 1])
    ? parts.pop()
    : null;
  const month = parts.length && SHORT_MONTHS[parts[parts.length - 1]]
    ? SHORT_MONTHS[parts.pop()]
    : null;

  const name = parts
    .map((w) => SPECIAL_WORDS[w] || w[0].toUpperCase() + w.slice(1))
    .join(" ");

  const period = [month, year].filter(Boolean).join(" ");
  return { name: name || "Award List", period };
}

