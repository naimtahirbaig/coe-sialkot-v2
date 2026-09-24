import { NextResponse } from "next/server";
import { checkPassword, signToken } from "@/lib/caseRegisterAuth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const role = checkPassword(body.password || "");
  if (!role) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  return NextResponse.json({ token: signToken(role), role });
}
