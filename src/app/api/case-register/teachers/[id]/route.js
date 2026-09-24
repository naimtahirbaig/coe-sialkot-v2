import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(request, { params }) {
  const { id } = params;
  const { error } = await supabaseAdmin
    .from("case_register_teachers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("case-register teacher DELETE error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
