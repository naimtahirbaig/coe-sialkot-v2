import { ImageResponse } from "next/og";

export const runtime = "edge";

// GET /api/online-test/og?c=8&s=Science&ch=Chapter 2&m=October 2026&n=52&p=15
// The picture WhatsApp shows when a test link is shared.
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const c = (q.get("c") || "").slice(0, 3), s = (q.get("s") || "").slice(0, 40);
  const ch = (q.get("ch") || "").slice(0, 50), m = (q.get("m") || "").slice(0, 30);
  const n = (q.get("n") || "").slice(0, 3), p = (q.get("p") || "").slice(0, 3);
  const title = ch ? `${s} — ${ch}` : s;
  const fs = title.length > 28 ? 56 : 70;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#150F3F", padding: 34 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#241C63", border: "3px solid #F3B129", borderRadius: 18, color: "#fff" }}>
          <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: 3, display: "flex" }}>CENTRE OF EXCELLENCE SIALKOT (BOYS)</div>
          <div style={{ fontSize: 15, color: "#b8b4d8", letterSpacing: 2, marginTop: 8, display: "flex" }}>PUNJAB DAANISH SCHOOLS &amp; CENTRES OF EXCELLENCE AUTHORITY</div>
          <div style={{ marginTop: 26, background: "#E5705F", color: "#150F3F", fontSize: 24, fontWeight: 700, padding: "10px 28px", borderRadius: 30, display: "flex" }}>{`CLASS ${c}`}</div>
          <div style={{ marginTop: 26, fontSize: fs, fontWeight: 700, display: "flex", textAlign: "center", padding: "0 50px" }}>{title}</div>
          <div style={{ marginTop: 8, fontSize: 27, color: "#ffd466", display: "flex" }}>{`MCQs Online Test  ·  ${m}`}</div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#c3c0de", display: "flex" }}>{`${n} MCQs  ·  ${n} Marks  ·  ${p} seconds per question`}</div>
          <div style={{ marginTop: 26, background: "#F3B129", color: "#150F3F", fontSize: 26, fontWeight: 700, padding: "15px 36px", borderRadius: 40, display: "flex" }}>Start the Test — Result Card at the End</div>
          <div style={{ marginTop: 22, fontSize: 19, color: "#F3B129", fontWeight: 700, letterSpacing: 3, display: "flex" }}>COESIALKOT.COM</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
