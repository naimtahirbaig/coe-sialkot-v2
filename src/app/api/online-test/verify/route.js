import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/verify   (header x-admin-password) → { ok: true }
// Used by the guided setup page to check the admin password before it goes any further.
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 700)); // slows down password guessing
    return NextResponse.json({ error: "That password is not correct." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
