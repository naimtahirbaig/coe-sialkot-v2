import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";
import { TEACHER_NAMES } from "@/lib/awardListTeachers";
import { isTestOpen } from "@/lib/onlineTestStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/roster?class=8&test=oct-2026-class-8-geography-ch3
// Public. Names and roll numbers only (no father names), plus which
// students have already attempted this test so they can be greyed out.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cls = Number(searchParams.get("class"));
  const test = searchParams.get("test");
  if (!cls || !test) return NextResponse.json({ error: "Missing class or test" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: sections, error } = await supabase
    .from("award_sections")
    .select("id, class, section_label, section_letter")
    .eq("class", cls)
    .order("section_letter", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (sections || []).map((s) => s.id);

  let students = [], attempts = [];
  try {
    students = await fetchAll((opts) =>
      supabase.from("award_students")
        .select("id, section_id, s_no, roll_no, student_name", opts)
        .in("section_id", ids)
        .order("s_no", { ascending: true })
        .order("id", { ascending: true })
    );
    attempts = await fetchAll((opts) =>
      supabase.from("online_test_attempts")
        .select("id, student_id, status", opts)
        .eq("test_slug", test)
        .order("id", { ascending: true })
    );
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
  const done = new Set(attempts.filter((a) => a.status === "submitted").map((a) => String(a.student_id)));
  const resume = new Set(attempts.filter((a) => a.status !== "submitted").map((a) => String(a.student_id)));

  const out = (sections || []).map((s) => ({
    id: s.id,
    label: `${s.class} ${String(s.section_label).split("(")[0].trim()}`,
    students: students
      .filter((st) => st.section_id === s.id)
      .map((st) => ({
        id: st.id,
        roll: st.roll_no,
        name: st.student_name,
        done: done.has(String(st.id)),
        resume: resume.has(String(st.id)),
      })),
  }));

  return NextResponse.json(
    { sections: out, teachers: TEACHER_NAMES, open: await isTestOpen(supabase, test) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
