import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET /api/stats — the live numbers shown on the website.
// Visitors, downloads and practice tests come from site_counters;
// online tests taken and papers generated are counted straight from their tables.
const pkDay = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
let cache = { at: 0, data: null };

export async function GET() {
  if (cache.data && Date.now() - cache.at < 30000) return send(cache.data);
  const sb = getSupabaseAdmin();
  const count = async (q) => { try { const { count: n, error } = await q; return error ? 0 : n || 0; } catch { return 0; } };
  const [counters, online, retakes, papers] = await Promise.all([
    sb.from("site_counters").select("key,value").in("key", ["visitors", "page_views", "downloads", "practice_tests", `visitors_day:${pkDay()}`])
      .then(({ data }) => data || [], () => []),
    count(sb.from("online_test_attempts").select("id", { count: "exact", head: true }).eq("status", "submitted")),
    count(sb.from("online_test_attempt_history").select("*", { count: "exact", head: true })),
    count(sb.from("qb_papers").select("id", { count: "exact", head: true })),
  ]);
  const c = Object.fromEntries(counters.map((r) => [r.key.startsWith("visitors_day:") ? "today" : r.key, Number(r.value) || 0]));
  const data = {
    visitors: c.visitors || 0,
    visitorsToday: c.today || 0,
    pageViews: c.page_views || 0,
    downloads: c.downloads || 0,
    onlineTests: online + retakes,
    practiceTests: c.practice_tests || 0,
    testsTaken: online + retakes + (c.practice_tests || 0),
    papers,
  };
  cache = { at: Date.now(), data };
  return send(data);
}
const send = (d) => NextResponse.json(d, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
