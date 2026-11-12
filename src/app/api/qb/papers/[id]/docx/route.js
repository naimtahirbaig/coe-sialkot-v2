import { route, idOf } from "@/lib/qbApi";
import { getPaper } from "@/lib/qbService";
import { buildDocx } from "@/lib/qbDocx";

export const dynamic = "force-dynamic";

// GET ?key=1 adds the answer key. Called with fetch() + the login token, then saved as a file by the page.
export const GET = route("admin", async ({ sb, params, query }) => {
  const { paper } = await getPaper(sb, idOf(params));
  const withKey = !!query.get("key");
  const buf = await buildDocx(paper, withKey);
  const name = `${paper.title}-Class${paper.classNum}-${paper.subject}${withKey ? "-KEY" : ""}`.replace(/[^A-Za-z0-9_-]+/g, "_");
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${name}.docx"`,
      "Cache-Control": "no-store",
    },
  });
});
