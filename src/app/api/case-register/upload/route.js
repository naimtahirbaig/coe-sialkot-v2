import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { roleFromRequest } from "@/lib/caseRegisterAuth";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = ["student", "paper", "material"];
const BUCKET = "case-evidence";

// POST /api/case-register/upload — multipart form data: file, category
export async function POST(request) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const category = form.get("category");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = (file.name && file.name.includes(".")) ? file.name.split(".").pop() : "jpg";
  const path = `${category}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    console.error("case-register upload error", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path }, { status: 201 });
}

// DELETE /api/case-register/upload  { path }  — remove a draft photo the
// user attached and then removed before saving.
export async function DELETE(request) {
  const role = roleFromRequest(request);
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.path) {
    return NextResponse.json({ error: "path is required." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([body.path]);
  if (error) {
    console.error("case-register upload DELETE error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
