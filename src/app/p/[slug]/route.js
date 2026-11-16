import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { baseSlug } from "@/lib/onlineTestDefs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const notFound = () => new Response("<!doctype html><meta charset=utf-8><title>Practice test not found</title><body style='font-family:sans-serif;padding:40px'><h2>Practice test not found</h2><p>Please open it from the <a href='/practice-tests-2026.html'>practice tests page</a>.</p>", {
  status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
});

// GET /p/<slug> — the PRACTICE version of a chapter test.
// Same page, same questions and timer as /t/<slug>, but: always open, no camera,
// nothing is saved to the result portal, and it can be taken again and again.
export async function GET(req, { params }) {
  const slug = baseSlug(params.slug);
  const sb = getSupabaseAdmin();
  const cols = "slug, class_num, subject, chapter, month_label, per_q, paper_size, questions";
  let { data: t } = await sb.from("online_test_defs").select(cols).eq("slug", slug).maybeSingle();
  // a chapter whose 1st test is a separate page (Geography Ch 3, Class 8): use its 2nd test's questions
  if (!t) ({ data: t } = await sb.from("online_test_defs").select(cols).eq("slug", `${slug}-test-2`).maybeSingle());
  if (!t) return notFound();

  const origin = new URL(req.url).origin;
  const tplRes = await fetch(`${origin}/online-tests/runner-template.html`, { cache: "no-store" });
  if (!tplRes.ok) return new Response("Template missing", { status: 500 });
  let html = await tplRes.text();

  const label = t.chapter ? `${t.subject} — ${t.chapter}` : t.subject;
  const total = t.paper_size;
  // practice uses its own slug, so it never touches the real test's attempts
  const def = { slug: `practice-${slug}`, practice: true, classNum: t.class_num, subject: t.subject, label, month: `${t.month_label} — Practice`, perQ: t.per_q, total, bank: t.questions };
  const json = JSON.stringify(def).split("<").join("\\u003c").split(String.fromCharCode(8232)).join(" ").split(String.fromCharCode(8233)).join(" ");

  const ogImg = `${origin}/api/online-test/og?mode=practice&c=${t.class_num}&s=${encodeURIComponent(t.subject)}&ch=${encodeURIComponent(t.chapter || "")}&m=${encodeURIComponent(t.month_label)}&n=${total}&p=${t.per_q}`;
  const ogTitle = `PRACTICE: ${label} — Class ${t.class_num} MCQs`;
  const ogDesc = `Centre of Excellence Sialkot (Boys). Practice test: ${total} MCQs, ${t.per_q} seconds per question. No camera, not saved — practise as many times as you like.`;
  const og = [
    ["property", "og:type", "website"], ["property", "og:site_name", "Centre of Excellence Sialkot (Boys)"],
    ["property", "og:title", ogTitle], ["property", "og:description", ogDesc],
    ["property", "og:url", `${origin}/p/${slug}`], ["property", "og:image", ogImg],
    ["property", "og:image:width", "1200"], ["property", "og:image:height", "630"],
    ["name", "twitter:card", "summary_large_image"], ["name", "twitter:title", ogTitle],
    ["name", "twitter:description", ogDesc], ["name", "twitter:image", ogImg],
  ].map(([k, n, v]) => `<meta ${k}="${n}" content="${esc(v)}">`).join("\n");

  const fill = { __TITLE__: `PRACTICE — ${label} — Class ${t.class_num}`, __OG__: og, __MONTH__: `${t.month_label} — Practice`,
    __CLASS__: t.class_num, __SUBJECT__: label, __TOTAL__: total, __PERQ__: t.per_q };
  for (const [k, v] of Object.entries(fill)) html = html.split(k).join(k === "__OG__" ? v : esc(v));
  html = html.replace("/*__DEF__*/ null", () => json);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
