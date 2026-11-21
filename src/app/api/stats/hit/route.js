import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// POST /api/stats/hit  { k: "visitor" | "view" | "day" | "download" | "practice" }
// Counts one event. Sent by the site header (visits, downloads) and the practice-test page.
const KEYS = { visitor: "visitors", view: "page_views", download: "downloads", practice: "practice_tests" };
const pkDay = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); // Pakistan date

export async function POST(req) {
  let k = "";
  try { k = (await req.json()).k; } catch { try { k = new URL(req.url).searchParams.get("k"); } catch { /* ignore */ } }
  const key = k === "day" ? `visitors_day:${pkDay()}` : KEYS[k];
  if (!key) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await getSupabaseAdmin().rpc("bump_counter", { k: key, n: 1 });
  } catch { /* counting must never break the page */ }
  return NextResponse.json({ ok: true });
}
