import { route } from "@/lib/qbApi";
import { changeOwnPassword } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const POST = route("any", ({ sb, user, body }) => changeOwnPassword(sb, user, body));
