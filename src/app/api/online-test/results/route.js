import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAll } from "@/lib/fetchAll";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/online-test/results?test=...&adminPassword=...   (office only)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pw = req.headers.get("x-admin-password") || searchParams.get("adminPassword");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 401 });
  }
  const test = searchParams.get("test");
  const supabase = getSupabaseAdmin();
  let q = supabase.from("online_test_attempts")
    .select("id, test_slug, student_id, student_name, roll_no, class, section_label, teacher_name, status, started_at, finished_at, correct, wrong, skipped, percentage, grade, tab_switches, camera_dropped")
    .order("section_label").order("roll_no");
  if (test) q = q.eq("test_slug", test);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Whole class roster (with father's name and class teacher) so the office
  // page can also list students who never started the test.
  let roster = [];
  const cls = Number(searchParams.get("class"));
  if (cls) {
    const { data: secs } = await supabase.from("award_sections")
      .select("id, class, section_label, class_incharge").eq("class", cls);
    const ids = (secs || []).map((x) => x.id);
    try {
      const studs = await fetchAll((opts) =>
        supabase.from("award_students")
          .select("id, section_id, s_no, roll_no, student_name, father_name", opts)
          .in("section_id", ids).order("s_no", { ascending: true }).order("id", { ascending: true })
      );
      roster = studs.map((st) => {
        const sec = secs.find((x) => x.id === st.section_id);
        return {
          student_id: String(st.id), roll_no: st.roll_no, student_name: st.student_name,
          father_name: st.father_name, section_label: `${sec.class} ${String(sec.section_label).split("(")[0].trim()}`.replace(/^\d+ /, ""),
          class: sec.class, incharge: sec.class_incharge || "",
        };
      });
    } catch (e) {
      return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
    }
  }
  return NextResponse.json({ results: data, roster });
}
