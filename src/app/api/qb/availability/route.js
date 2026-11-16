import { route } from "@/lib/qbApi";
import { availability } from "@/lib/qbService";

export const dynamic = "force-dynamic";

export const GET = route("any", ({ sb, query }) => availability(sb, query));
