import { route } from "@/lib/qbApi";
import { setTypeMarks } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const POST = route("any", ({ sb, user, body }) => setTypeMarks(sb, user, body));
