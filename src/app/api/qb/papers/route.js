import { route } from "@/lib/qbApi";
import { listPapers, generatePaper } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("admin", ({ sb }) => listPapers(sb));
export const POST = route("admin", ({ sb, user, body }) => generatePaper(sb, user, body));
