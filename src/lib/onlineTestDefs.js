// Shared helpers for tests created from the admin page.

export const MAX_BANK = 1000;
export const MAX_PAPER = 52;   // the result card's answer grid holds 52 boxes

export function slugify(str) {
  return String(str || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function monthSlug(month) {
  const m = String(month || "").trim().split(/\s+/);
  const names = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const i = names.indexOf((m[0] || "").toLowerCase());
  const yr = (String(month).match(/\d{4}/) || [""])[0];
  return `${i >= 0 ? m[0].slice(0, 3).toLowerCase() : slugify(m[0])}-${yr}`.replace(/-$/, "");
}

// questions: [{ q, opts: [..], correct: index }]  →  validated bank rows
export function cleanBank(questions) {
  const errors = [], bank = [];
  if (!Array.isArray(questions)) return { errors: ["No questions found."], bank };
  questions.slice(0, MAX_BANK + 1).forEach((x, i) => {
    const n = i + 1;
    const q = String(x?.q ?? "").trim();
    const opts = (Array.isArray(x?.opts) ? x.opts : []).map((o) => String(o ?? "").trim()).filter(Boolean);
    const c = Number(x?.correct);
    if (!q) errors.push(`Question ${n}: the question text is empty.`);
    else if (q.length > 600) errors.push(`Question ${n}: too long (600 characters max).`);
    else if (opts.length < 2 || opts.length > 5) errors.push(`Question ${n}: needs 2 to 5 options.`);
    else if (opts.some((o) => o.length > 300)) errors.push(`Question ${n}: an option is too long.`);
    else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) errors.push(`Question ${n}: two options are the same.`);
    else if (!Number.isInteger(c) || c < 0 || c >= (Array.isArray(x?.opts) ? x.opts.length : 0)) errors.push(`Question ${n}: the correct answer is missing or invalid.`);
    else {
      const rawOpts = x.opts.map((o) => String(o ?? "").trim());
      const correctText = rawOpts[c];
      if (!correctText) errors.push(`Question ${n}: the correct answer points to an empty option.`);
      else bank.push([q, opts, opts.indexOf(correctText)]);
    }
  });
  if (questions.length > MAX_BANK) errors.push(`Too many questions (${MAX_BANK} max).`);
  return { errors, bank };
}
