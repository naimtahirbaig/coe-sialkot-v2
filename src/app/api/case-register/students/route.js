import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("case_register_students")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("case-register students GET error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ students: data });
}

// POST body is either:
//   { name, rollNo, grade, section, customClass }        -> add one
//   { bulk: [{ name, rollNo, grade, section }, ...] }     -> import many
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (Array.isArray(body.bulk)) {
    const rows = body.bulk
      .filter((s) => s && s.name)
      .map((s) => ({
        name: s.name,
        roll_no: s.rollNo || "",
        grade: s.grade || "6",
        section: s.section || "",
        custom_class: s.customClass || "",
      }));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("case_register_students")
      .insert(rows)
      .select();

    if (error) {
      console.error("case-register students bulk POST error", error);
      return NextResponse.json({ inserted: 0, failed: rows.length, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ inserted: data.length, failed: rows.length - data.length }, { status: 201 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("case_register_students")
    .insert({
      name: body.name,
      roll_no: body.rollNo || "",
      grade: body.grade || "",
      section: body.section || "",
      custom_class: body.customClass || "",
    })
    .select()
    .single();

  if (error) {
    console.error("case-register students POST error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ student: data }, { status: 201 });
}
