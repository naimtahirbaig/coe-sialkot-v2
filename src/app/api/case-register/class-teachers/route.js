import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest } from "@/lib/caseRegisterAuth";

export async function GET(request) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("case_register_class_teachers")
    .select("*")
    .order("grade", { ascending: true })
    .order("section", { ascending: true });

  if (error) {
    console.error("case-register class-teachers GET error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ classTeachers: data });
}
