import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest, ADVANCE_ROLE_FOR_STATUS } from "@/lib/caseRegisterAuth";

// Only these fields may be patched from the client, mapped to their
// actual column names. Anything else in the request body is ignored.
const ALLOWED = {
  status: "status",
  notes: "notes",
  forwarded: "forwarded",
  recommendation: "recommendation",
  decision: "decision",
  closedAt: "closed_at",
  studentPhotoUrls: "student_photo_urls",
  paperPhotoUrls: "paper_photo_urls",
  materialPhotoUrls: "material_photo_urls",
};

// Changing these moves the case to its next stage in the chain —
// restricted to whichever role currently holds that stage (or admin).
// Plain notes/evidence can be added by anyone logged in.
const STAGE_FIELDS = ["status", "forwarded", "recommendation", "decision", "closedAt"];

// PATCH /api/case-register/cases/:id — partial update.
export async function PATCH(request, { params }) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { id } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requestedKeys = Object.keys(body).filter((k) => ALLOWED[k] !== undefined);
  const isStageMove = requestedKeys.some((k) => STAGE_FIELDS.includes(k));

  if (isStageMove && role !== "admin") {
    const { data: current, error: readError } = await supabaseAdmin
      .from("case_register_cases")
      .select("status")
      .eq("id", id)
      .single();
    if (readError || !current) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    const requiredRole = ADVANCE_ROLE_FOR_STATUS[current.status];
    if (role !== requiredRole) {
      return NextResponse.json({ error: "This case isn't at your stage right now." }, { status: 403 });
    }
  }

  const patch = {};
  for (const key of requestedKeys) patch[ALLOWED[key]] = body[key];
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No recognized fields to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("case_register_cases")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("case-register case PATCH error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ case: data });
}
