import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Public: just enough info to populate the "pick your section" dropdown.
// No marks or student names are returned here.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("award_sections")
    .select("sheet_code, class, section_label, class_incharge, locked, submitted")
    .order("class", { ascending: true })
    .order("section_letter", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sections: data });
}
