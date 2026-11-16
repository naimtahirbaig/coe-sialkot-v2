import { route } from "@/lib/qbApi";
import { listPapers, generatePaper } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("any", ({ sb, user }) => listPapers(sb, user));
export const POST = route("any", ({ sb, user, body }) => generatePaper(sb, user, body));
