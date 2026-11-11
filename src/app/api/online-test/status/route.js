import { NextResponse } from "next/server";
import { getSupabaseFast, cleanError } from "@/lib/supabaseFast";
import { testState } from "@/lib/onlineTestStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/status?test=...   (public)  → { open, state, opensAt, closesAt }
export async function GET(req) {
  const test = new URL(req.url).searchParams.get("test");
  if (!test) return NextResponse.json({ error: "Missing test" }, { status: 400 });
  try {
    const s = await testState(getSupabaseFast(), test);
    return NextResponse.json(s, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: cleanError(e), dbDown: true }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

// POST /api/online-test/status   (header x-admin-password)
// { test | tests:[..], open?: boolean, goLive?: boolean, opensAt?: iso|null, closesAt?: iso|null }
//   open     → Live (true) / Closed by hand (false)
//   goLive   → make live NOW: removes a future opening date and a passed closing date
//   opensAt / closesAt → the date slots (null clears one; leave out to keep it)
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const slugs = (Array.isArray(b?.tests) ? b.tests : b?.test ? [b.test] : []).map(String).filter(Boolean).slice(0, 200);
  if (!slugs.length) return NextResponse.json({ error: "Missing details" }, { status: 400 });

  const date = (v) => {
    if (v === null) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  };
  const hasO = "opensAt" in b, hasC = "closesAt" in b;
  const o = hasO ? date(b.opensAt) : undefined, c = hasC ? date(b.closesAt) : undefined;
  if ((hasO && o === undefined) || (hasC && c === undefined)) return NextResponse.json({ error: "That date is not valid." }, { status: 400 });
  if (o && c && new Date(c) <= new Date(o)) return NextResponse.json({ error: "The closing time must be after the opening time." }, { status: 400 });

  const supabase = getSupabaseFast();
  const now = Date.now();
  const { data: have, error: readErr } = await supabase.from("online_test_settings").select("*").in("test_slug", slugs);
  if (readErr) return NextResponse.json({ error: cleanError(readErr), dbDown: true }, { status: 503 });
  const byId = {}; (have || []).forEach((r) => { byId[r.test_slug] = r; });

  const rows = slugs.map((slug) => {
    const cur = byId[slug] || {};
    const row = { test_slug: slug, updated_at: new Date().toISOString() };
    if (typeof b.open === "boolean") row.is_open = b.open;
    if (b.goLive) {
      row.is_open = true;
      if (cur.opens_at && new Date(cur.opens_at).getTime() > now) row.opens_at = null;
      if (cur.closes_at && new Date(cur.closes_at).getTime() <= now) row.closes_at = null;
    }
    if (hasO) row.opens_at = o;
    if (hasC) row.closes_at = c;
    if (row.opens_at && row.closes_at && new Date(row.closes_at) <= new Date(row.opens_at)) row.closes_at = null;
    return row;
  });
  const { error } = await supabase.from("online_test_settings").upsert(rows);
  if (error) {
    const missing = /opens_at|closes_at/.test(error.message);
    return NextResponse.json({ error: missing ? "Run the new SQL (dates) in Supabase first." : cleanError(error) }, { status: missing ? 500 : 503 });
  }
  return NextResponse.json({ ok: true, count: rows.length });
}
