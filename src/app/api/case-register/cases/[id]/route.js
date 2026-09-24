import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest } from "@/lib/caseRegisterAuth";

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

// Changing these effectively moves the case through the workflow
// (forward / recommend / decide / reopen) — restricted to admins.
// Notes and evidence can be added by a teacher.
const ADMIN_ONLY_FIELDS = ["status", "forwarded", "recommendation", "decision", "closedAt"];

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
  const needsAdmin = requestedKeys.some((k) => ADMIN_ONLY_FIELDS.includes(k));
  if (needsAdmin && role !== "admin") {
    return NextResponse.json({ error: "Only an admin can do that." }, { status: 403 });
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
