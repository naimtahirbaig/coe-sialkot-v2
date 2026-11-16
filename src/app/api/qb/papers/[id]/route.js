import { route, idOf } from "@/lib/qbApi";
import { getPaper, deletePaper } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("any", ({ sb, user, params }) => getPaper(sb, user, idOf(params)));
export const DELETE = route("any", ({ sb, user, params }) => deletePaper(sb, user, idOf(params)));
