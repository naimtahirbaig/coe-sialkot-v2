import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";
import { resolveExam } from "@/lib/resolveExam";

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
  return NextResponse.json({ ok: true });
}
