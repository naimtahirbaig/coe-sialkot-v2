import { route } from "@/lib/qbApi";
import { listTeachers, addTeacher } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("admin", ({ sb }) => listTeachers(sb));
export const POST = route("admin", ({ sb, body }) => addTeacher(sb, body));
