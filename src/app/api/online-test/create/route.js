import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanBank, slugify, monthSlug, MAX_PAPER } from "@/lib/onlineTestDefs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/online-test/create   (header x-admin-password)
// { classNum, subject, chapter, month, perQ, paperSize, questions:[{q,opts,correct}] }
export async function POST(req) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const classNum = Number(b.classNum);
  const subject = String(b.subject || "").trim().slice(0, 60);
  const chapter = String(b.chapter || "").trim().slice(0, 60);
  const month = String(b.month || "").trim().slice(0, 40);
  const perQ = Math.round(Number(b.perQ) || 15);
  if (!(classNum >= 1 && classNum <= 12) || !subject || !month) {
    return NextResponse.json({ error: "Class, subject and month are required." }, { status: 400 });
  }
  if (perQ < 5 || perQ > 120) return NextResponse.json({ error: "Seconds per question must be 5–120." }, { status: 400 });

  const { errors, bank } = cleanBank(b.questions);
  if (errors.length) return NextResponse.json({ error: errors.slice(0, 8).join(" ") }, { status: 400 });
  if (bank.length < 4) return NextResponse.json({ error: "At least 4 questions are needed." }, { status: 400 });
  const paperSize = Math.max(4, Math.min(Math.round(Number(b.paperSize) || bank.length), bank.length, MAX_PAPER));

  const supabase = getSupabaseAdmin();
  const base = [monthSlug(month), `class-${classNum}`, slugify(subject), slugify(chapter)].filter(Boolean).join("-");
  let slug = base, n = 2;
  for (; n < 50; n++) {
    const { data } = await supabase.from("online_test_defs").select("slug").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${n}`;
  }
  const title = `${subject}${chapter ? " — " + chapter : ""} (Class ${classNum}) — Online MCQs Test, ${month}`;
  const { error } = await supabase.from("online_test_defs").insert({
    slug, title, class_num: classNum, subject, chapter: chapter || null, month_label: month,
    per_q: perQ, paper_size: paperSize, questions: bank,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    slug, title, classNum, paperSize, bankSize: bank.length,
    url: `/t/${slug}`,
  });
}
