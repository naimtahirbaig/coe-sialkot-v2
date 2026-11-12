import { route } from "@/lib/qbApi";
import { listQuestions, createQuestion } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("any", ({ sb, user, query }) => listQuestions(sb, user, query));
export const POST = route("any", ({ sb, user, body }) => createQuestion(sb, user, body));
