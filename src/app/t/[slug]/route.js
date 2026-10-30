import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// GET /t/<slug> — a test made from the admin page. The page template is
// /online-tests/runner-template.html; this fills in the details, the
// questions and the WhatsApp/Open Graph preview tags.
export async function GET(req, { params }) {
  const { slug } = params;
  const { data: t } = await getSupabaseAdmin().from("online_test_defs").select("*").eq("slug", slug).maybeSingle();
  if (!t) {
    return new Response("<!doctype html><meta charset=utf-8><title>Test not found</title><body style='font-family:sans-serif;padding:40px'><h2>Test not found</h2><p>Please check the link with your teacher.</p>", {
      status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  const origin = new URL(req.url).origin;
  const tplRes = await fetch(`${origin}/online-tests/runner-template.html`, { cache: "no-store" });
  if (!tplRes.ok) return new Response("Template missing", { status: 500 });
  let html = await tplRes.text();

  const label = t.chapter ? `${t.subject} — ${t.chapter}` : t.subject;
  const total = t.paper_size;
  const def = { slug: t.slug, classNum: t.class_num, subject: t.subject, label, month: t.month_label, perQ: t.per_q, total, bank: t.questions };
  const json = JSON.stringify(def).split("<").join("\\u003c").split(String.fromCharCode(8232)).join(" ").split(String.fromCharCode(8233)).join(" ");

  const ogImg = `${origin}/api/online-test/og?c=${t.class_num}&s=${encodeURIComponent(t.subject)}&ch=${encodeURIComponent(t.chapter || "")}&m=${encodeURIComponent(t.month_label)}&n=${total}&p=${t.per_q}`;
  const ogTitle = `${label} — Class ${t.class_num} MCQs Online Test`;
  const ogDesc = `Centre of Excellence Sialkot (Boys). ${total} MCQs, ${total} marks, ${t.per_q} seconds per question. Result card at the end.`;
  const og = [
    ["property", "og:type", "website"], ["property", "og:site_name", "Centre of Excellence Sialkot (Boys)"],
    ["property", "og:title", ogTitle], ["property", "og:description", ogDesc],
    ["property", "og:url", `${origin}/t/${t.slug}`], ["property", "og:image", ogImg],
    ["property", "og:image:width", "1200"], ["property", "og:image:height", "630"],
    ["name", "twitter:card", "summary_large_image"], ["name", "twitter:title", ogTitle],
    ["name", "twitter:description", ogDesc], ["name", "twitter:image", ogImg],
  ].map(([k, n, v]) => `<meta ${k}="${n}" content="${esc(v)}">`).join("\n");

  const fill = { __TITLE__: `${label} — MCQs Online Test ${t.month_label} — Class ${t.class_num}`, __OG__: og, __MONTH__: t.month_label,
    __CLASS__: t.class_num, __SUBJECT__: label, __TOTAL__: total, __PERQ__: t.per_q };
  for (const [k, v] of Object.entries(fill)) html = html.split(k).join(k === "__OG__" ? v : esc(v));
  html = html.replace("/*__DEF__*/ null", () => json);

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
