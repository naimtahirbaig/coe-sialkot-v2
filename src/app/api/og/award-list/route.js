import { ImageResponse } from "next/og";
import { readSlug } from "@/lib/examSlug";

export const runtime = "edge";

// GET /api/og/award-list?slug=revision-for-mid-term-tests-2026-nov-2026
// The link preview for one exam's award list: the exam name is printed large,
// over the site's Award Lists card (photo, logos and address stay the same).
// the site's own fonts (Josefin Sans for the exam name, Source Sans 3 for the rest)
const fonts = Promise.all([
  fetch(new URL("./josefin-700.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL("./sourcesans-400.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL("./sourcesans-600.woff", import.meta.url)).then((r) => r.arrayBuffer()),
]);

export async function GET(req) {
  const url = new URL(req.url);
  const [jos, ss4, ss6] = await fonts;
  const { name, period } = readSlug((url.searchParams.get("slug") || "").slice(0, 120));
  const bg = new URL("/og/award-list.jpg", url).toString();
  const len = name.length;
  const fs = len > 40 ? 56 : len > 28 ? 68 : len > 18 ? 78 : 92;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", fontFamily: "Source Sans 3" }}>
        <img src={bg} width={1200} height={630} style={{ position: "absolute", left: 0, top: 0 }} />
        {/* white panel over the left card text */}
        <div style={{ position: "absolute", left: 0, top: 138, width: 690, height: 418, background: "#FFFFFF", display: "flex", flexDirection: "column", padding: "10px 46px 0 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", background: "#C8364A", color: "#FFFFFF", fontSize: 24, fontWeight: 600, letterSpacing: 2, padding: "9px 20px", borderRadius: 8 }}>AWARD LIST</div>
            <div style={{ display: "flex", color: "#C8364A", fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>MARKS ENTRY OPEN</div>
          </div>
          <div style={{ display: "flex", marginTop: 20, fontFamily: "Josefin Sans", fontSize: fs, fontWeight: 700, lineHeight: 1.02, color: "#16154F", letterSpacing: -1 }}>{name}</div>
          {period && (
            <div style={{ display: "flex", marginTop: 22, alignSelf: "flex-start", background: "#E39C24", color: "#0C0C3C", fontFamily: "Josefin Sans", fontSize: 38, fontWeight: 700, padding: "12px 26px 6px", borderRadius: 10 }}>{period.toUpperCase()}</div>
          )}
          <div style={{ display: "flex", marginTop: "auto", marginBottom: 18, fontSize: 21, color: "#4E4C6B" }}>Subject teachers: open the link, enter your PIN and choose your section.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [
      { name: "Josefin Sans", data: jos, weight: 700, style: "normal" },
      { name: "Source Sans 3", data: ss4, weight: 400, style: "normal" },
      { name: "Source Sans 3", data: ss6, weight: 600, style: "normal" },
    ], headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } }
  );
}
