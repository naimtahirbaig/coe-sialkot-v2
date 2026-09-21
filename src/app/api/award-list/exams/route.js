import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";
import { makeSlug, cleanSlug } from "@/lib/awardListExams";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/award-list/exams
// Public — the teacher page shows which exam is currently open.
// Returns every exam plus a per-exam count of how many subjects have data,
// so the admin screens can show progress without extra round trips.
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: exams, error } = await supabase
    .from("award_exams")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // How many subject-config rows exist per exam (i.e. work started)
  // Grows with every exam (31 sections × 9 subjects each), so paged.
  let cfg = [];
  try {
    cfg = await fetchAll((opts) =>
      supabase.from("award_subject_config").select("id, exam_id", opts).order("id", { ascending: true })
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  const counts = {};
  (cfg || []).forEach((c) => (counts[c.exam_id] = (counts[c.exam_id] || 0) + 1));

  const withCounts = (exams || []).map((e) => ({ ...e, subjects_started: counts[e.id] || 0 }));
  const current = withCounts.find((e) => e.is_current) || null;

  return NextResponse.json({ exams: withCounts, current });
}

// POST /api/award-list/exams
// { action: "create" | "set_current" | "delete", adminPassword, ... }
export async function POST(req) {
  const body = await req.json();
  const { action, adminPassword } = body || {};

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (action === "create") {
    const { year, month, name } = body;
    if (!year || !month || !name || !String(name).trim()) {
      return NextResponse.json({ error: "Year, month and exam name are all required." }, { status: 400 });
    }

    // Slug comes from the admin if they edited it, otherwise generated.
    const slug = cleanSlug(body.slug) || makeSlug(name, month, year);
    if (!slug) {
      return NextResponse.json({ error: "Could not build a link from that name." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("award_exams")
      .insert({
        year: Number(year),
        month: Number(month),
        name: String(name).trim(),
        slug,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An exam with that name or link already exists. Try a different link." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, exam: data });
  }

  if (action === "set_current") {
    const { examId } = body;
    if (!examId) return NextResponse.json({ error: "Missing examId" }, { status: 400 });

    // Clear the old current first — a partial unique index allows only one.
    await supabase.from("award_exams").update({ is_current: false }).eq("is_current", true);
    const { error } = await supabase.from("award_exams").update({ is_current: true }).eq("id", examId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { examId } = body;
    if (!examId) return NextResponse.json({ error: "Missing examId" }, { status: 400 });

    // Refuse to delete an exam that already holds marks — deleting would
    // cascade and destroy them. Admin must clear it deliberately instead.
    const { count } = await supabase
      .from("award_marks")
      .select("id", { count: "exact", head: true })
      .eq("exam_id", examId);

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `This exam has ${count} saved marks. It can't be deleted.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("award_exams").delete().eq("id", examId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
