import { route } from "@/lib/qbApi";
import { login } from "@/lib/qbService";

export const dynamic = "force-dynamic";

// POST /api/qb/login  { username, password }  -> { token, user }
// username "admin" + the site's ADMIN_PASSWORD signs in as admin.
export const POST = route("public", ({ sb, body }) => login(sb, body));
