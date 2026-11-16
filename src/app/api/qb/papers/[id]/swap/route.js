import { route, idOf } from "@/lib/qbApi";
import { swapQuestion } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// POST { path: ["A","plain",2] | ["A","passage",1] | ["B",0,1] }
// replaces that question with another of the same type and marks
export const POST = route("any", ({ sb, user, body, params }) => swapQuestion(sb, user, idOf(params), body.path));
