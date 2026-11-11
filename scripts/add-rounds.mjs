// Adds the 2nd, 3rd, 4th and 5th test for every chapter test (same questions, own link,
// own Live/Closed switch, own dates and results). Each new test starts CLOSED.
// Safe to run again: tests that already exist are skipped, and any test added later gets its rounds too.
//   node scripts/add-rounds.mjs --dry     (only shows what would be added)
//   node scripts/add-rounds.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");
const ORD = { 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
const env = {};
try {
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch { console.error("Could not read .env.local"); process.exit(1); }
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: defs, error } = await supabase.from("online_test_defs").select("*");
if (error) { console.error(error.message); process.exit(1); }
const have = new Set(defs.map((d) => d.slug));
const bases = defs.filter((d) => !/-test-[2-9]$/.test(d.slug)).map((d) => ({
  slug: d.slug, title: d.title, class_num: d.class_num, subject: d.subject, chapter: d.chapter,
  month_label: d.month_label, per_q: d.per_q, paper_size: d.paper_size, questions: d.questions,
}));
// the original Class 8 Geography Chapter 3 page has no row in the table: take its questions from a file
const geo = path.join(root, "supabase", "geo8-ch3-bank.json");
if (fs.existsSync(geo)) {
  bases.push({
    slug: "online-tests-2026-class-8-geography-chapter-3", title: "Geography — Chapter 3 (Class 8) — Online MCQs Test, 2026",
    class_num: 8, subject: "Geography", chapter: "Chapter 3", month_label: "2026", per_q: 15, paper_size: 52,
    questions: JSON.parse(fs.readFileSync(geo, "utf8")),
  });
}

let added = 0, skipped = 0;
for (const b of bases) {
  for (const r of [2, 3, 4, 5]) {
    const slug = `${b.slug}-test-${r}`;
    if (have.has(slug)) { skipped++; continue; }
    if (dry) { console.log(`would add  ${slug}`); added++; continue; }
    const { error: e1 } = await supabase.from("online_test_defs").insert({
      slug, title: `${b.title} — ${ORD[r]} Test`, class_num: b.class_num, subject: b.subject, chapter: b.chapter,
      month_label: b.month_label, per_q: b.per_q, paper_size: b.paper_size, questions: b.questions,
    });
    if (e1) { console.error(`FAILED ${slug}: ${e1.message}`); process.exit(1); }
    const { error: e2 } = await supabase.from("online_test_settings").upsert({ test_slug: slug, is_open: false, updated_at: new Date().toISOString() });
    if (e2) { console.error(`Added ${slug} but could not close it: ${e2.message}`); process.exit(1); }
    added++; console.log(`added  ${slug}  (closed)`);
  }
}
console.log(`\n${dry ? "Dry run: " : ""}${added} ${dry ? "would be added" : "added"}, ${skipped} already there.`);
