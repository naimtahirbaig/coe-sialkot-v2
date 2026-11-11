import { NextResponse } from "next/server";
import { getSupabaseFast, cleanError } from "@/lib/supabaseFast";
import { allStates, stateOf } from "@/lib/onlineTestStatus";
import { roundOf, baseSlug } from "@/lib/onlineTestDefs";

// rounds 2–5 of the original Geography page belong under it
const ALIAS = { "online-tests-2026-class-8-geography-chapter-3": "oct-2026-class-8-geography-ch3" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/list[?month=October 2026]  (public; no questions)
export async function GET(req) {
  const month = new URL(req.url).searchParams.get("month");
  const supabase = getSupabaseFast();
  let q = supabase.from("online_test_defs")
    .select("slug, title, class_num, subject, chapter, month_label, per_q, paper_size, created_at")
    .order("class_num").order("created_at");
  if (month) q = q.eq("month_label", month);
  const { data, error } = await q;
  let states;
  try {
    if (error) throw new Error(error.message);
    states = await allStates(supabase);
  } catch (e) {
    return NextResponse.json({ tests: [], error: cleanError(e), dbDown: true }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({
    states,
    tests: (data || []).map((t) => ({
      slug: t.slug, title: t.title, classNum: t.class_num, subject: t.subject, chapter: t.chapter,
      month: t.month_label, perQ: t.per_q, total: t.paper_size, url: `/t/${t.slug}`, round: roundOf(t.slug), base: ALIAS[baseSlug(t.slug)] || baseSlug(t.slug),
      ...(({ open, state, opensAt, closesAt }) => ({ open, state, opensAt, closesAt }))(states[t.slug] || stateOf(null)),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
