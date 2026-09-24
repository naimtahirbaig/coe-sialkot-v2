import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/case-register/cases — list every case, newest first.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("case_register_cases")
    .select("*")
    .order("reported_at", { ascending: false });

  if (error) {
    console.error("case-register cases GET error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cases: data });
}

// POST /api/case-register/cases — file a new report.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.studentName || !body.invigilatorName || !body.description) {
    return NextResponse.json(
      { error: "studentName, invigilatorName and description are required." },
      { status: 400 }
    );
  }

  const year = new Date().getFullYear();
  const caseCode =
    "UMC-" + year + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();

  const row = {
    case_code: caseCode,
    student_id: body.studentId || null,
    student_name: body.studentName,
    roll_no: body.rollNo || "",
    grade: body.grade || "",
    section: body.section || "",
    custom_class: body.customClass || "",
    subject: body.subject || "",
    exam_date: body.examDate || "",
    room: body.room || "",
    reporter_id: body.reporterId || null,
    invigilator_name: body.invigilatorName,
    description: body.description,
    offense_types: Array.isArray(body.offenseTypes) ? body.offenseTypes : [],
    offense_other: body.offenseOther || "",
    invigilator_action: body.invigilatorAction || "",
    status: "reported",
    reported_at: new Date().toISOString(),
    student_photo_urls: Array.isArray(body.studentPhotoUrls) ? body.studentPhotoUrls : [],
    paper_photo_urls: Array.isArray(body.paperPhotoUrls) ? body.paperPhotoUrls : [],
    material_photo_urls: Array.isArray(body.materialPhotoUrls) ? body.materialPhotoUrls : [],
    notes: [],
    forwarded: null,
    recommendation: null,
    decision: null,
    closed_at: null,
  };

  const { data, error } = await supabaseAdmin
    .from("case_register_cases")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("case-register cases POST error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ case: data }, { status: 201 });
}
