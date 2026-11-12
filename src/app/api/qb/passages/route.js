import { route } from "@/lib/qbApi";
import { listPassages, createPassage } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// Reading passages ("Paragraph Instruction") that a group of MCQs can share.
export const GET = route("any", ({ sb, query }) => listPassages(sb, query));
export const POST = route("any", ({ sb, user, body }) => createPassage(sb, user, body));
