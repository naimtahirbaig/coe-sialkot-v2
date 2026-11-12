import { route, idOf } from "@/lib/qbApi";
import { deletePassage } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const DELETE = route("any", ({ sb, user, params }) => deletePassage(sb, user, idOf(params)));
