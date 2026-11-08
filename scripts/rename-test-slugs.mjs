// One-off: renames the October 2026 tests' addresses from  oct-2026-…  to  online-tests-2026-…
//   node scripts/rename-test-slugs.mjs --dry   (only shows what would change)
//   node scripts/rename-test-slugs.mjs         (renames)
// Safe to run twice. Results, settings and dates stay with each test.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");
const env = {};
try {
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch { console.error("Could not read .env.local"); process.exit(1); }
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: defs, error } = await supabase.from("online_test_defs").select("slug").like("slug", "oct-2026-%");
if (error) { console.error(error.message); process.exit(1); }
let done = 0;
for (const { slug } of defs) {
  if (slug === "oct-2026-class-8-geography-ch3") continue; // the original page keeps its internal name
  const next = "online-tests-2026-" + slug.slice("oct-2026-".length);
  const { data: clash } = await supabase.from("online_test_defs").select("slug").eq("slug", next).maybeSingle();
  if (clash) { console.log(`skip   ${slug} (${next} already exists)`); continue; }
  if (dry) { console.log(`would rename  ${slug}  →  ${next}`); continue; }
  for (const [table, col] of [["online_test_defs", "slug"], ["online_test_settings", "test_slug"], ["online_test_attempts", "test_slug"]]) {
    const { error: e } = await supabase.from(table).update({ [col]: next }).eq(col, slug);
    if (e) { console.error(`FAILED ${table} for ${slug}: ${e.message}`); process.exit(1); }
  }
  done++; console.log(`renamed ${slug}  →  ${next}`);
}
console.log(dry ? "\nDry run only." : `\nDone: ${done} renamed.`);
