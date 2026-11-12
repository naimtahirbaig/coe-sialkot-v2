import { route } from "@/lib/qbApi";
import { importQuestions } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// POST { rows: [ {class, subject, chapter, type, question, option_a..d, correct, answer, marks, difficulty}, ... ] }
export const POST = route("any", ({ sb, user, body }) => importQuestions(sb, user, body));
