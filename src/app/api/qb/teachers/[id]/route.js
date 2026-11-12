import { route, idOf } from "@/lib/qbApi";
import { updateTeacher } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// PATCH { active?: boolean, password?: string }
export const PATCH = route("admin", ({ sb, body, params }) => updateTeacher(sb, idOf(params), body));
