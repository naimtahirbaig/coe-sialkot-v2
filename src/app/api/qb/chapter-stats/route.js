import { route } from "@/lib/qbApi";
import { chapterStats } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("admin", ({ sb, query }) => chapterStats(sb, query));
