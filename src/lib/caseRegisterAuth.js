// Simple two-tier password gate for the case register: a "teacher"
// password (file reports, add notes/evidence) and an "admin" password
// (everything, including forwarding/recommending/deciding cases and
// managing the student/staff rosters).
//
// Deliberately lightweight: no per-person accounts, just two shared
// passwords, matching how the paper register worked (anyone with the
// register book could write in it). If you need to know exactly which
// staff member did what, that's a bigger change — this only gates
// teacher vs. admin actions.

import crypto from "crypto";

const SECRET = process.env.CASE_REGISTER_AUTH_SECRET || "dev-only-insecure-secret-change-me";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function checkPassword(password) {
  const teacherPw = process.env.CASE_REGISTER_TEACHER_PASSWORD || "";
  const adminPw = process.env.CASE_REGISTER_ADMIN_PASSWORD || "";
  if (adminPw && password === adminPw) return "admin";
  if (teacherPw && password === teacherPw) return "teacher";
  return null;
}

export function signToken(role) {
  const payload = role + "." + (Date.now() + TOKEN_TTL_MS);
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload + "." + sig).toString("base64url");
}

// Returns "teacher" | "admin" | null
export function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [role, expStr, sig] = parts;
    const expected = crypto.createHmac("sha256", SECRET).update(role + "." + expStr).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() > parseInt(expStr, 10)) return null;
    if (role !== "teacher" && role !== "admin") return null;
    return role;
  } catch (e) {
    return null;
  }
}

// Pulls the role out of a request's Authorization: Bearer <token> header.
export function roleFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return verifyToken(token);
}
