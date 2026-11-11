import { ImageResponse } from "next/og";

export const runtime = "edge";

// GET /api/online-test/og?c=8&s=Science&ch=Chapter 2&m=October 2026&n=52&p=15
// Optional &from=<ISO date>&to=<ISO date>: the test start time and the deadline are then
// printed large on the picture (Pakistan time).
// The picture WhatsApp shows when a test link is shared.
function when(v) {
  const t = new Date(v);
  if (!v || Number.isNaN(t.getTime())) return null;
  const tz = "Asia/Karachi";
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(t).replace(",", "");
  let time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(t).toUpperCase();
  if (time === "12:00 PM") time = "12:00 NOON";
  return { day, time };
}
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const c = (q.get("c") || "").slice(0, 3), s = (q.get("s") || "").slice(0, 40);
  const ch = (q.get("ch") || "").slice(0, 80), m = (q.get("m") || "").slice(0, 30);
  const r = Math.min(9, Math.max(1, Number(q.get("r")) || 1)), rt = ({ 1: "1ST", 2: "2ND", 3: "3RD" }[r] || `${r}TH`) + " TEST";
  const n = (q.get("n") || "").slice(0, 3), p = (q.get("p") || "").slice(0, 3);
  const from = when(q.get("from")), to = when(q.get("to")), dated = !!(from || to);
  const title = ch ? `${s} — ${ch}` : s;
  const fs = dated ? (title.length > 45 ? 34 : title.length > 28 ? 40 : 50) : (title.length > 28 ? 56 : 70);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#150F3F", padding: 34 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#241C63", border: "3px solid #F3B129", borderRadius: 18, color: "#fff" }}>
          <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: 3, display: "flex" }}>CENTRE OF EXCELLENCE SIALKOT (BOYS)</div>
          <div style={{ fontSize: 15, color: "#b8b4d8", letterSpacing: 2, marginTop: 8, display: "flex" }}>PUNJAB DAANISH SCHOOLS &amp; CENTRES OF EXCELLENCE AUTHORITY</div>
          <div style={{ marginTop: dated ? 14 : 26, background: "#E5705F", color: "#150F3F", fontSize: 24, fontWeight: 700, padding: "10px 28px", borderRadius: 30, display: "flex" }}>{`CLASS ${c}  ·  ${rt}`}</div>
          <div style={{ marginTop: dated ? 12 : 26, fontSize: fs, fontWeight: 700, display: "flex", textAlign: "center", padding: "0 50px" }}>{title}</div>
          <div style={{ marginTop: 8, fontSize: 27, color: "#ffd466", display: "flex" }}>{`MCQs Online Test  ·  ${m}`}</div>
          <div style={{ marginTop: dated ? 6 : 12, fontSize: 22, color: "#c3c0de", display: "flex" }}>{`${n} MCQs  ·  ${n} Marks  ·  ${p} seconds per question`}</div>
          {dated ? (
            <div style={{ marginTop: 18, display: "flex", gap: 22 }}>
              {[["TEST STARTS", from, "#2FB36D"], ["DEADLINE", to, "#F3B129"]].filter((b) => b[1]).map((b) => (
                <div key={b[0]} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#150F3F", border: `4px solid ${b[2]}`, borderRadius: 18, padding: "12px 26px", minWidth: 400 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: b[2], display: "flex" }}>{b[0]}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginTop: 2, display: "flex" }}>{b[1].day}</div>
                  <div style={{ fontSize: 54, fontWeight: 700, color: "#ffd466", display: "flex" }}>{b[1].time}</div>
                </div>
              ))}
            </div>
          ) : (
          <div style={{ marginTop: 26, background: "#F3B129", color: "#150F3F", fontSize: 26, fontWeight: 700, padding: "15px 36px", borderRadius: 40, display: "flex" }}>Start the Test — Result Card at the End</div>
          )}
          <div style={{ marginTop: dated ? 14 : 22, fontSize: 19, color: "#F3B129", fontWeight: 700, letterSpacing: 3, display: "flex" }}>COESIALKOT.COM</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
