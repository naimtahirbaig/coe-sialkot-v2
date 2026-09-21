import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveExam } from "@/lib/resolveExam";

// Always compute fresh. Without this, Next.js may cache the response at
// build time and serve stale marks until the next deploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/award-list/sections[?examId=...]
// Public: enough to populate the "pick your section" dropdown. The
// "in progress" flag is per exam, derived from award_subject_config.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const examSlug = searchParams.get("examSlug");

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("award_sections")
    .select("id, sheet_code, class, section_label, class_incharge")
    .order("class", { ascending: true })
    .order("section_letter", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { exam } = await resolveExam(supabase, examId, examSlug);

  let startedIds = new Set();
  if (exam) {
    const { data: cfg } = await supabase
      .from("award_subject_config")
      .select("section_id")
      .eq("exam_id", exam.id);
    startedIds = new Set((cfg || []).map((c) => c.section_id));
  }

  const sections = (data || []).map((s) => ({
    ...s,
    submitted: startedIds.has(s.id),
  }));

  return NextResponse.json({ exam: exam || null, sections });
}
