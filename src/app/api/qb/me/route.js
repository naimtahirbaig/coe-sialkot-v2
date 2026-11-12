import { route } from "@/lib/qbApi";

export const dynamic = "force-dynamic";

// GET /api/qb/me -> the logged-in user (used to restore a session)
export const GET = route("any", ({ user }) => ({ user }));
