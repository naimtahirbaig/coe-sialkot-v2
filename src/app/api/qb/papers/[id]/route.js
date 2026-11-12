import { route, idOf } from "@/lib/qbApi";
import { getPaper, deletePaper } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("admin", ({ sb, params }) => getPaper(sb, idOf(params)));
export const DELETE = route("admin", ({ sb, params }) => deletePaper(sb, idOf(params)));
