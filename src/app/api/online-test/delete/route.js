import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/delete { test }  (header x-admin-password)
// Removes a test made from the admin page — only while NOBODY has started it.
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b?.test) return NextResponse.json({ error: "Missing test" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from("online_test_attempts")
    .select("id", { count: "exact", head: true }).eq("test_slug", b.test);
  if (count > 0) {
    return NextResponse.json({ error: `${count} student(s) already started this test, so it cannot be deleted. Close it instead.` }, { status: 409 });
  }
  const { error } = await supabase.from("online_test_defs").delete().eq("slug", b.test);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("online_test_settings").delete().eq("test_slug", b.test);
  return NextResponse.json({ ok: true });
}
