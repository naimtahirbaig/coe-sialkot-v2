// Imports the October 2026 History + Geography tests (Classes 6, 7, 8) into the
// online_test_defs table, one test per chapter. Safe to run twice: tests that
// already exist are skipped.
//   node scripts/import-tests.mjs --dry     (only shows what would be added)
//   node scripts/import-tests.mjs           (adds them)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");
const tests = JSON.parse(fs.readFileSync(path.join(root, "supabase", "tests-october-2026.json"), "utf8"));

const slugify = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const monthSlug = (m) => {
  const names = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const p = String(m).trim().split(/\s+/), i = names.indexOf((p[0] || "").toLowerCase());
  return `${i >= 0 ? p[0].slice(0, 3).toLowerCase() : slugify(p[0])}-${(String(m).match(/\d{4}/) || [""])[0]}`.replace(/-$/, "");
};
const yearOf = (m) => (String(m).match(/\d{4}/) || [""])[0];
const slugOf = (t) => [yearOf(t.month) ? `online-tests-${yearOf(t.month)}` : monthSlug(t.month), `class-${t.classNum}`, slugify(t.subject), slugify(t.chapter)].filter(Boolean).join("-");

if (dry) {
  tests.forEach((t) => console.log(`Class ${t.classNum}  ${t.subject} — ${t.chapter}  (${t.questions.length} questions)  → /t/${slugOf(t)}`));
  console.log(`\n${tests.length} tests would be added.`);
  process.exit(0);
}

const env = {};
try {
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch { console.error("Could not read .env.local"); process.exit(1); }
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Supabase keys are missing in .env.local"); process.exit(1); }
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, key, { auth: { persistSession: false } });

let added = 0, skipped = 0;
for (const t of tests) {
  const slug = slugOf(t);
  const { data: have, error: e1 } = await supabase.from("online_test_defs").select("slug").eq("slug", slug).maybeSingle();
  if (e1) { console.error("Database error:", e1.message, "— has the online_test_defs table been created?"); process.exit(1); }
  if (have) { skipped++; console.log(`skip   ${slug} (already there)`); continue; }
  const title = `${t.subject}${t.chapter ? " — " + t.chapter : ""} (Class ${t.classNum}) — Online MCQs Test, ${t.month}`;
  const bank = t.questions.map((x) => [x.q, x.opts, x.correct]);
  const { error } = await supabase.from("online_test_defs").insert({
    slug, title, class_num: t.classNum, subject: t.subject, chapter: t.chapter || null, month_label: t.month,
    per_q: t.perQ, paper_size: Math.min(t.paperSize, bank.length), questions: bank,
  });
  if (error) { console.error(`FAILED ${slug}: ${error.message}`); process.exit(1); }
  // a new test stays CLOSED until the admin makes it live
  const { error: e2 } = await supabase.from("online_test_settings").upsert({ test_slug: slug, is_open: false, updated_at: new Date().toISOString() });
  if (e2) { console.error(`Added ${slug} but could not close it: ${e2.message}`); process.exit(1); }
  added++; console.log(`added  ${slug}  (closed)`);
}
console.log(`\nDone: ${added} added, ${skipped} skipped. Check https://www.coesialkot.com/online-tests-october-2026.html`);
