import { route, idOf } from "@/lib/qbApi";
import { updateQuestion, deleteQuestion } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const PUT = route("any", ({ sb, user, body, params }) => updateQuestion(sb, user, idOf(params), body));
export const DELETE = route("any", ({ sb, user, params }) => deleteQuestion(sb, user, idOf(params)));
