"use client";
// Shared look and fetch helper for the Question Bank pages (client side only).
export const C = { NAVY: "#150F3F", GOLD: "#F3B129", GREEN: "#0B7A3E", RED: "#B3202A", INK: "#1c1b2e", MUTED: "#5b5a70", LINE: "#DCDAEA" };
export const QT = {
  mcq: "Multiple Choice (MCQ)", true_false: "True / False", fill_blank: "Fill in the Blanks",
  short: "Short Question", long: "Long Question",
};
export const DIFF = ["easy", "medium", "hard"];
export const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const card = { background: "#fff", border: `1px solid ${C.LINE}`, borderRadius: 14, boxShadow: "0 2px 14px rgba(21,15,63,.07)", padding: 18, marginBottom: 16, color: C.INK };
export const inp = { padding: "10px 12px", fontSize: 15, border: "1.5px solid #9A9DB5", borderRadius: 9, background: "#fff", color: C.INK, width: "100%", boxSizing: "border-box" };
export const lbl = { display: "block", fontWeight: 700, fontSize: 13, color: C.INK, marginBottom: 4 };
export const btn = (on = true, color = C.NAVY) => ({ padding: "10px 18px", fontSize: 15, fontWeight: 700, borderRadius: 10, border: `2px solid ${color}`, background: on ? color : "#fff", color: on ? "#fff" : color, cursor: "pointer" });
export const small = { padding: "4px 10px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${C.NAVY}`, background: "#fff", color: C.NAVY, cursor: "pointer" };
export const grid = (min = 190) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: "12px 14px", alignItems: "end" });
export const th = { textAlign: "left", padding: "8px 10px", background: "#EEF0F7", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 };
export const td = { padding: "8px 10px", borderTop: `1px solid ${C.LINE}`, verticalAlign: "top", fontSize: 14 };

export function Msg({ m }) {
  if (!m) return null;
  const ok = m.type === "ok";
  return <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 12, border: `1.5px solid ${ok ? C.GREEN : C.RED}`, background: ok ? "#E8F6EE" : "#FBEAEA", color: ok ? C.GREEN : C.RED, fontWeight: 600, whiteSpace: "pre-line" }}>{m.text}</div>;
}

// fetch with the login token; clear messages; never shows raw HTML
export async function api(path, { method = "GET", body, blob } = {}) {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("qb_token") : null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(path, {
      method, cache: "no-store", signal: ctl.signal,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok && blob) return await r.blob();
    const txt = await r.text();
    let j = {};
    try { j = JSON.parse(txt); } catch { /* not JSON */ }
    if (!r.ok) {
      if (r.status === 401 && !path.endsWith("/login")) {
        sessionStorage.removeItem("qb_token");
        window.dispatchEvent(new Event("qb-auth-lost"));
      }
      throw new Error(j.error || "The server did not answer properly. Please try again.");
    }
    return j;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("The server is taking too long. Please try again in a minute.");
    if (e instanceof TypeError) throw new Error("No internet connection. Please check and try again.");
    throw e;
  } finally { clearTimeout(timer); }
}

export const fmt = (v) => { const n = Number(v); return Number.isFinite(n) ? String(+n.toFixed(2)) : String(v ?? ""); };

// Reads a picture file and shrinks it so it stays small enough to store (about 100-200 KB).
export function fileToDataUrl(file, maxSide = 700, mime = "image/jpeg") {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Choose a PNG, JPEG or WebP picture."));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      const g = c.getContext("2d");
      if (mime === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.85, out = c.toDataURL(mime, q);
      while (out.length > 380000 && q > 0.4) { q -= 0.1; out = c.toDataURL(mime, q); }
      out.length > 395000 ? reject(new Error("That picture is too large. Try a smaller one.")) : resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that picture.")); };
    img.src = url;
  });
}
