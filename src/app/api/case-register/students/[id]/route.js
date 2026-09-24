import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest } from "@/lib/caseRegisterAuth";

export async function DELETE(request, { params }) {
  const role = roleFromRequest(request);
  if (role !== "admin") return NextResponse.json({ error: "Only an admin can do that." }, { status: 403 });

  const { id } = params;
  const { error } = await supabaseAdmin
    .from("case_register_students")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("case-register student DELETE error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
