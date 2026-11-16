import { NextResponse } from "next/server";
import { getSupabaseFast, cleanError } from "@/lib/supabaseFast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/check-student  { roll }
// Is this the roll number of a COE Sialkot (Boys) student?  → { ok: true } or 404.
// Only yes/no is returned (never a name), so the list of students cannot be read through it.
export async function POST(req) {
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const roll = String(b?.roll ?? "").replace(/\s+/g, "").slice(0, 12);
  const slow = () => new Promise((r) => setTimeout(r, 600));   // makes guessing many numbers slow
  if (!/^\d{1,8}$/.test(roll)) { await slow(); return NextResponse.json({ error: "Write your roll number (digits only)." }, { status: 400 }); }
  try {
    const { data, error } = await getSupabaseFast().from("award_students").select("id").eq("roll_no", roll).limit(1);
    if (error) throw new Error(error.message);
    if (!data || !data.length) { await slow(); return NextResponse.json({ error: "This roll number was not found. Please check it and try again." }, { status: 404 }); }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: cleanError(e) }, { status: 503 });
  }
}
