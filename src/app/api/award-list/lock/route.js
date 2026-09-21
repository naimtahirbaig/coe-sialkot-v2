import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST { code, subject?, locked, adminPassword, examId? }
// With `subject`, locks/unlocks that one subject. Without it, every subject
// in the section. Always scoped to a single exam.
export async function POST(req) {
  const { code, subject, locked, adminPassword, examId, examSlug } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!code || typeof locked !== "boolean") {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { exam, error: examErr } = await resolveExam(supabase, examId, examSlug);
  if (examErr) return NextResponse.json({ error: examErr }, { status: 400 });

  const { data: section, error: sectionErr } = await supabase
    .from("award_sections")
    .select("id, class")
    .eq("sheet_code", code)
    .single();

  if (sectionErr || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const lockedAt = locked ? new Date().toISOString() : null;
  const subjectsToSet = subject ? [subject] : subjectsForClass(section.class);

  const rows = subjectsToSet.map((s) => ({
    exam_id: exam.id,
    section_id: section.id,
    subject_name: s,
    locked,
    locked_at: lockedAt,
  }));

  const { error } = await supabase
    .from("award_subject_config")
    .upsert(rows, { onConflict: "exam_id,section_id,subject_name" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Individual marks follow the subject. Unlocking reopens every mark so it
  // can be corrected; locking seals every mark that has a value.
  let q = supabase.from("award_marks")
    .update({ locked, locked_at: lockedAt })
    .eq("exam_id", exam.id)
    .eq("section_id", section.id)
    .in("subject_name", subjectsToSet);
  if (locked) q = q.not("marks_obtained", "is", null);
  const { error: markErr } = await q;
  if (markErr) return NextResponse.json({ error: markErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
