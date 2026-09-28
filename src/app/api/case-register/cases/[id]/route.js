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

// DELETE /api/case-register/cases/:id?reason=...
//
// Admin only. Removes a case from the active register.
//
// Before deleting, the whole case row is copied into
// case_register_deletions along with who deleted it and why. A
// disciplinary record about a named student should not be able to
// vanish without trace: if a parent or the authority later asks what
// happened to a case, that log is the answer. The case itself is gone
// from the register either way.
//
// Evidence photos in storage are NOT removed here — see the note at the
// end of README-CASE-DELETE.md.
export async function DELETE(request, { params }) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can delete a case." },
      { status: 403 }
    );
  }

  const { id } = params;
  const reason = (new URL(request.url).searchParams.get("reason") || "").trim();

  // Read the case first: it is the snapshot, and it confirms the case exists.
  const { data: existing, error: readError } = await supabaseAdmin
    .from("case_register_cases")
    .select("*")
    .eq("id", id)
    .single();

  if (readError || !existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  // Log first, delete second. If the log write fails we stop, so a case is
  // never removed without a record of it.
  const { error: logError } = await supabaseAdmin
    .from("case_register_deletions")
    .insert({
      case_id: existing.id,
      case_code: existing.case_code ?? null,
      student_name: existing.student_name ?? null,
      status_at_deletion: existing.status ?? null,
      snapshot: existing,
      deleted_by_role: role,
      reason: reason || null,
    });

  if (logError) {
    console.error("case-register delete log error", logError);
    return NextResponse.json(
      { error: "Could not record the deletion, so the case was not deleted." },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("case_register_cases")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("case-register case DELETE error", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      id: existing.id,
      case_code: existing.case_code ?? null,
      student_name: existing.student_name ?? null,
    },
  });
}
