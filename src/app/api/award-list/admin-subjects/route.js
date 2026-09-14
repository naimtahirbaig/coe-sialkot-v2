import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";

// GET /api/award-list/admin-subjects?code=6-Jinnah&adminPassword=...
// Returns every subject for this section's class, with its saved Total
// Marks and lock state — used by the admin page's expandable row.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const adminPassword = searchParams.get("adminPassword");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing section code" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: section, error: sectionErr } = await supabase
    .from("award_sections")
    .select("id, class")
    .eq("sheet_code", code)
    .single();

  if (sectionErr || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const { data: config } = await supabase
    .from("award_subject_config")
    .select("subject_name, total_marks, teacher_name, locked")
    .eq("section_id", section.id);

  const bySubject = {};
  (config || []).forEach((c) => (bySubject[c.subject_name] = c));

  const subjects = subjectsForClass(section.class).map((s) => ({
    subject: s,
    total_marks: bySubject[s]?.total_marks ?? null,
    teacher_name: bySubject[s]?.teacher_name ?? null,
    locked: bySubject[s]?.locked ?? false,
  }));

  return NextResponse.json({ subjects });
}
