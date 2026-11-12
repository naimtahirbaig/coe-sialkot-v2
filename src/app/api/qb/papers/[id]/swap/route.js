import { route, idOf } from "@/lib/qbApi";
import { swapQuestion } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// POST { section: 0, index: 2 } replaces that question with another of the same type and marks
export const POST = route("admin", ({ sb, body, params }) =>
  swapQuestion(sb, idOf(params), Number(body.section), Number(body.index)));
