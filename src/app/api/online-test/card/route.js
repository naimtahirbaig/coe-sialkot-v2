import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/card?id=<attempt id>&adminPassword=...  → the saved card image
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pw = searchParams.get("adminPassword");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data } = await getSupabaseAdmin()
    .from("online_test_attempts").select("card_image").eq("id", id).single();
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(data?.card_image || "");
  if (!m) return NextResponse.json({ error: "No card saved" }, { status: 404 });
  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "no-store" },
  });
}
