import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { subjectsForClass } from "@/lib/awardListConfig";

// POST { code: "6-Jinnah", subject: "English", locked: true, adminPassword }
//   -> locks/unlocks just that one subject
// POST { code: "6-Jinnah", locked: true, adminPassword }   (no `subject`)
//   -> locks/unlocks every subject for that section (bulk convenience)
export async function POST(req) {
  const { code, subject, locked, adminPassword } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!code || typeof locked !== "boolean") {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
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

  const lockedAt = locked ? new Date().toISOString() : null;

  if (subject) {
    const { error } = await supabase.from("award_subject_config").upsert(
      { section_id: section.id, subject_name: subject, locked, locked_at: lockedAt },
      { onConflict: "section_id,subject_name" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const subjects = subjectsForClass(section.class);
    const rows = subjects.map((s) => ({
      section_id: section.id,
      subject_name: s,
      locked,
      locked_at: lockedAt,
    }));
    const { error } = await supabase
      .from("award_subject_config")
      .upsert(rows, { onConflict: "section_id,subject_name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
