// Four-tier password gate for the case register, matching the review
// chain: "invigilator" (files reports), "coordinator" (Class Coordinator
// — adds remarks, forwards), "senior" (Senior Coordinator — final
// decision, closes the case), and "admin" (everything — full case list,
// roster management, and can act at any stage as a fallback/override).
//
// Deliberately lightweight: no per-person accounts, just four shared
// passwords. If you need to know exactly which staff member did
// something, that's a bigger change (real per-person logins) — this only
// gates which stage of the chain a password can act on.

import crypto from "crypto";

const SECRET = process.env.CASE_REGISTER_AUTH_SECRET || "dev-only-insecure-secret-change-me";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const ROLES = ["invigilator", "coordinator", "senior", "admin"];

const ROLE_ENV_VARS = {
  invigilator: "CASE_REGISTER_INVIGILATOR_PASSWORD",
  coordinator: "CASE_REGISTER_COORDINATOR_PASSWORD",
  senior: "CASE_REGISTER_SENIOR_PASSWORD",
  admin: "CASE_REGISTER_ADMIN_PASSWORD",
};

export function checkPassword(password) {
  if (!password) return null;
  for (const role of ROLES) {
    const expected = process.env[ROLE_ENV_VARS[role]] || "";
    if (expected && password === expected) return role;
  }
  return null;
}

export function signToken(role) {
  const payload = role + "." + (Date.now() + TOKEN_TTL_MS);
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload + "." + sig).toString("base64url");
}

// Returns "invigilator" | "coordinator" | "senior" | "admin" | null
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
    if (!ROLES.includes(role)) return null;
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

// Which role is allowed to move a case OFF this status (besides admin,
// who can always act as a fallback/override).
export const ADVANCE_ROLE_FOR_STATUS = {
  reported: "invigilator",
  coordinator_review: "coordinator",
  senior_review: "senior",
};
