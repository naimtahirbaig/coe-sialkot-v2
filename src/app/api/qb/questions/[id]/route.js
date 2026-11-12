import { route, idOf } from "@/lib/qbApi";
import { getQuestion, updateQuestion, deleteQuestion } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("any", ({ sb, user, params }) => getQuestion(sb, user, idOf(params)));
export const PUT = route("any", ({ sb, user, body, params }) => updateQuestion(sb, user, idOf(params), body));
export const DELETE = route("any", ({ sb, user, params }) => deleteQuestion(sb, user, idOf(params)));
