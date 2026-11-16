import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/check-student  { password }
// Password asked before a student leaves the Practice page for the real Online Tests.
// For the time being one shared password; it can be changed in Vercel with the
// REAL_TESTS_PASSWORD environment variable without changing any code.
const PASSWORD = () => process.env.REAL_TESTS_PASSWORD || "coerealtests2026";

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const given = String(b?.password ?? "").trim().toLowerCase();
  if (given && given === PASSWORD().toLowerCase()) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  await new Promise((r) => setTimeout(r, 700));   // makes guessing slow
  return NextResponse.json({ error: "That password is not correct. Please ask your teacher." }, { status: 401 });
}
