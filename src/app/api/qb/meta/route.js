import { route } from "@/lib/qbApi";
import { meta } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// Subjects, chapters and per-class/subject question counts (for dropdowns and the coverage table).
export const GET = route("any", ({ sb }) => meta(sb));
