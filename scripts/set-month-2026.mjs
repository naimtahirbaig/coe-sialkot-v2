// One-off: shows "2026" instead of "October 2026" in the tests already in the database
// (the month label and the title that appears on result cards and letters).
//   node scripts/set-month-2026.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
});
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await supabase.from("online_test_defs").select("slug,title,month_label").eq("month_label", "October 2026");
if (error) { console.error(error.message); process.exit(1); }
let n = 0;
for (const t of data) {
  const { error: e } = await supabase.from("online_test_defs")
    .update({ month_label: "2026", title: String(t.title).replace("October 2026", "2026") }).eq("slug", t.slug);
  if (e) { console.error(`FAILED ${t.slug}: ${e.message}`); process.exit(1); }
  n++;
}
console.log(`Done: ${n} tests now show 2026.`);
