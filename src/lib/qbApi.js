// Small wrapper that every /api/qb/* route uses: login check, JSON body, clean errors.
import { NextResponse } from "next/server";
import { getSupabaseFast, cleanError } from "@/lib/supabaseFast";
import { authenticate } from "@/lib/qbService";
import { QbError } from "@/lib/questionBank";

const NO_STORE = { "Cache-Control": "no-store" };

// role: "public" (no login) | "any" (teacher or admin) | "admin"
export function route(role, fn) {
  return async (req, ctx) => {
    try {
      const sb = getSupabaseFast();
      let user = null;
      if (role !== "public") {
        user = await authenticate(req, sb);
        if (!user) throw new QbError(401, "Please log in again.");
        if (role === "admin" && user.role !== "admin") throw new QbError(403, "Only the admin can do that.");
      }
      let body = {};
      if (req.method !== "GET" && req.method !== "DELETE") { try { body = await req.json(); } catch { body = {}; } }
      const out = await fn({ sb, user, req, body, params: ctx?.params || {}, query: new URL(req.url).searchParams });
      if (out instanceof Response) return out;
      return NextResponse.json(out, { headers: NO_STORE });
    } catch (e) {
      if (e instanceof QbError) return NextResponse.json({ error: e.message }, { status: e.status, headers: NO_STORE });
      const msg = String(e?.message || e);
      if (/qb_(teachers|questions|papers)|schema cache|does not exist/i.test(msg)) {
        return NextResponse.json({ error: "The question bank tables are missing. Run supabase/migration-question-bank.sql in the Supabase SQL Editor." }, { status: 500, headers: NO_STORE });
      }
      const clean = cleanError(e);
      return NextResponse.json({ error: clean === msg ? "Something went wrong. Please try again." : clean }, { status: clean === msg ? 500 : 503, headers: NO_STORE });
    }
  };
}

export const idOf = (params) => {
  const n = Number(params.id);
  if (!Number.isInteger(n) || n < 1) throw new QbError(404, "Not found.");
  return n;
};
