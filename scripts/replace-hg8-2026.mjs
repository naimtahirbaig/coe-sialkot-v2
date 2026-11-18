// Replaces the questions of the Class 8 History + Geography tests (1st–5th test of every chapter)
// with the updated book questions in supabase/hg8-2026-book-update.json.
// Links, Live/Closed switches, dates and all saved results stay exactly as they are.
//   node scripts/replace-hg8-2026.mjs --dry     (only shows what would change)
//   node scripts/replace-hg8-2026.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");
const env = {};
fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
});
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const banks = JSON.parse(fs.readFileSync(path.join(root, "supabase", "hg8-2026-book-update.json"), "utf8"));
const { data: defs, error } = await supabase.from("online_test_defs")
  .select("slug, subject, chapter, paper_size, questions").eq("class_num", 8).in("subject", ["History", "Geography"]).order("slug");
if (error) { console.error(error.message); process.exit(1); }

let changed = 0, same = 0;
for (const d of defs) {
  const n = Number((String(d.chapter).match(/\d+/) || [0])[0]);
  const bank = banks[`${d.subject}|${n}`];
  if (!bank) { console.error(`NO NEW QUESTIONS for ${d.slug} — left as it is`); continue; }
  if (JSON.stringify(bank) === JSON.stringify(d.questions)) { same++; continue; }
  const paper = Math.min(d.paper_size, bank.length);
  if (dry) { console.log(`would update  ${d.slug}  ${d.questions.length} → ${bank.length} questions`); changed++; continue; }
  const { error: e } = await supabase.from("online_test_defs").update({ questions: bank, paper_size: paper }).eq("slug", d.slug);
  if (e) { console.error(`FAILED ${d.slug}: ${e.message}`); process.exit(1); }
  console.log(`updated  ${d.slug}  ${d.questions.length} → ${bank.length} questions`);
  changed++;
}
console.log(`\n${dry ? "Would update" : "Updated"} ${changed} tests, ${same} already up to date (of ${defs.length}).`);
