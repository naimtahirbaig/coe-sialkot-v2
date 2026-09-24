import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest } from "@/lib/caseRegisterAuth";

export async function GET(request) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("case_register_teachers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("case-register teachers GET error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ teachers: data });
}

// POST body is either:
//   { name, role, classTeacherGrade, classTeacherSection }   -> add one
//   { bulk: [{ name, role, classTeacherGrade, classTeacherSection }, ...] }
// Admin only — roster management.
export async function POST(request) {
  const role = roleFromRequest(request);
  if (role !== "admin") return NextResponse.json({ error: "Only an admin can do that." }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (Array.isArray(body.bulk)) {
    const rows = body.bulk
      .filter((t) => t && t.name)
      .map((t) => ({
        name: t.name,
        role: t.role || "Invigilator",
        class_teacher_grade: t.classTeacherGrade || "",
        class_teacher_section: t.classTeacherSection || "",
      }));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("case_register_teachers")
      .insert(rows)
      .select();

    if (error) {
      console.error("case-register teachers bulk POST error", error);
      return NextResponse.json({ inserted: 0, failed: rows.length, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ inserted: data.length, failed: rows.length - data.length }, { status: 201 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("case_register_teachers")
    .insert({
      name: body.name,
      role: body.role || "Invigilator",
      class_teacher_grade: body.classTeacherGrade || "",
      class_teacher_section: body.classTeacherSection || "",
    })
    .select()
    .single();

  if (error) {
    console.error("case-register teachers POST error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ teacher: data }, { status: 201 });
}
