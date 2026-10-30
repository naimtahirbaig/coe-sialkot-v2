import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/list[?month=October 2026]  (public; no questions)
export async function GET(req) {
  const month = new URL(req.url).searchParams.get("month");
  const supabase = getSupabaseAdmin();
  let q = supabase.from("online_test_defs")
    .select("slug, title, class_num, subject, chapter, month_label, per_q, paper_size, created_at")
    .order("class_num").order("created_at");
  if (month) q = q.eq("month_label", month);
  const { data, error } = await q;
  if (error) return NextResponse.json({ tests: [] }, { headers: { "Cache-Control": "no-store" } });
  const { data: st } = await supabase.from("online_test_settings").select("test_slug, is_open");
  const closed = new Set((st || []).filter((x) => x.is_open === false).map((x) => x.test_slug));
  return NextResponse.json({
    tests: (data || []).map((t) => ({
      slug: t.slug, title: t.title, classNum: t.class_num, subject: t.subject, chapter: t.chapter,
      month: t.month_label, perQ: t.per_q, total: t.paper_size, open: !closed.has(t.slug), url: `/t/${t.slug}`,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
