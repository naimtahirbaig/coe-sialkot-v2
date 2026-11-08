"use client";
// "All tests" panel for the online-test results page: Live / Closed switch and
// opens / closes date slots for every test, plus a shortcut to its result cards.
import { useState, useEffect, useCallback } from "react";

const navy = "#150F3F", gold = "#C98B0E", green = "#0B7A3E", red = "#B3202A";
const btn = { padding: "6px 12px", border: `1.5px solid ${navy}`, background: "#fff", color: navy, borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13 };
const btnGo = { ...btn, background: navy, color: "#fff" };
const th = { textAlign: "left", padding: "8px 10px", background: "#EEF0F7", color: navy, fontSize: 13, borderBottom: "1px solid #C9CCDC", whiteSpace: "nowrap" };
const td = { padding: "7px 10px", borderBottom: "1px solid #E3E5EF", fontSize: 13, color: "#1c1b2e", verticalAlign: "middle" };
const inp = { padding: 5, fontSize: 13, border: "1px solid #9A9DB5", borderRadius: 5, background: "#fff", color: "#1c1b2e" };

const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const toIso = (v) => (v ? new Date(v).toISOString() : null);
const nice = (iso) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const BADGE = {
  live: ["● LIVE", green, "#E8F6EE"],
  closed: ["● CLOSED", red, "#FBEAEA"],
  scheduled: ["● SCHEDULED", gold, "#FFF6DC"],
  ended: ["● ENDED", red, "#FBEAEA"],
};

export default function OnlineTestSchedule({ pw, tests, onOpenCards }) {
  const [st, setSt] = useState({});   // slug -> { state, opensAt, closesAt }
  const [edit, setEdit] = useState({}); // slug -> { o, c } (datetime-local strings)
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPanel, setOpenPanel] = useState(true);
  const [scope, setScope] = useState("all");
  const [bo, setBo] = useState(""), [bc, setBc] = useState("");

  const refresh = useCallback(async () => {
    const out = {};
    try {
      const d = await fetch("/api/online-test/list", { cache: "no-store" }).then((r) => r.json());
      (d.tests || []).forEach((t) => { out[t.slug] = { state: t.state || (t.open ? "live" : "closed"), opensAt: t.opensAt, closesAt: t.closesAt }; });
    } catch {}
    await Promise.all(tests.filter((t) => !t.custom).map(async (t) => {
      try { const s = await fetch(`/api/online-test/status?test=${encodeURIComponent(t.slug)}`, { cache: "no-store" }).then((r) => r.json()); out[t.slug] = s; } catch {}
    }));
    setSt(out);
    const e = {}; Object.entries(out).forEach(([k, v]) => { e[k] = { o: toLocal(v.opensAt), c: toLocal(v.closesAt) }; });
    setEdit(e);
  }, [tests.length]); // eslint-disable-line
  useEffect(() => { refresh(); }, [refresh]);

  async function post(slugs, body, done) {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/online-test/status", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw }, body: JSON.stringify({ tests: slugs, ...body }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save");
      setMsg(done || "Saved."); await refresh();
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  }
  const inScope = () => tests.filter((t) => scope === "all" || String(t.classNum) === scope).map((t) => t.slug);
  const classes = [...new Set(tests.map((t) => t.classNum))].sort((a, b) => a - b);
  const counts = { live: 0, closed: 0, scheduled: 0 };
  tests.forEach((t) => { const s = (st[t.slug] || { state: "live" }).state; if (s === "live") counts.live++; else if (s === "scheduled") counts.scheduled++; else counts.closed++; });

  return (
    <div style={{ margin: "14px 0 20px", border: "1.5px solid #C9CCDC", borderRadius: 10, background: "#fff", color: "#1c1b2e" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", cursor: "pointer" }} onClick={() => setOpenPanel(!openPanel)}>
        <b style={{ fontSize: 16, color: navy, marginRight: "auto" }}>All tests — Live / Closed &amp; dates, result cards</b>
        <span style={{ fontSize: 13 }}>{counts.live} live · {counts.scheduled} scheduled · {counts.closed} closed</span>
        <span style={{ fontSize: 18 }}>{openPanel ? "▾" : "▸"}</span>
      </div>
      {openPanel && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end", padding: 10, background: "#F4F6F9", borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
            <label>Apply to<br />
              <select value={scope} onChange={(e) => setScope(e.target.value)} style={inp}>
                <option value="all">All tests</option>
                {classes.map((c) => <option key={c} value={String(c)}>Class {c} tests</option>)}
              </select>
            </label>
            <label>Opens (date &amp; time)<br /><input type="datetime-local" value={bo} onChange={(e) => setBo(e.target.value)} style={inp} /></label>
            <label>Closes (date &amp; time)<br /><input type="datetime-local" value={bc} onChange={(e) => setBc(e.target.value)} style={inp} /></label>
            <button style={btnGo} disabled={busy} onClick={() => post(inScope(), { opensAt: toIso(bo), closesAt: toIso(bc) }, `Dates set for ${inScope().length} test(s). A blank slot means no limit.`)}>Set dates</button>
            <button style={btn} disabled={busy} onClick={() => post(inScope(), { goLive: true }, `${inScope().length} test(s) are live now.`)}>Make live now</button>
            <button style={{ ...btn, color: red, borderColor: red }} disabled={busy}
              onClick={() => { if (window.confirm(`Close ${inScope().length} test(s)? Students who have not started can no longer begin. Anyone already taking a test can finish.`)) post(inScope(), { open: false }, `${inScope().length} test(s) closed.`); }}>Close now</button>
          </div>
          {msg && <p style={{ margin: "0 0 8px", fontWeight: 600, color: /saved|set for|live now|closed\./i.test(msg) ? green : red, fontSize: 13 }}>{msg}</p>}
          <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
              <thead><tr>{["Test", "Status", "Opens", "Closes", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {tests.map((t) => {
                  const s = st[t.slug] || { state: "live" }, b = BADGE[s.state] || BADGE.live, e = edit[t.slug] || { o: "", c: "" };
                  const dirty = e.o !== toLocal(s.opensAt) || e.c !== toLocal(s.closesAt);
                  return (
                    <tr key={t.slug}>
                      <td style={{ ...td, fontWeight: 600 }}>{t.label}</td>
                      <td style={td}>
                        <span style={{ background: b[2], color: b[1], border: `1px solid ${b[1]}`, borderRadius: 999, padding: "3px 10px", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{b[0]}</span>
                        {s.state === "scheduled" && s.opensAt && <div style={{ fontSize: 11, color: "#5b5a70" }}>opens {nice(s.opensAt)}</div>}
                        {s.state === "live" && s.closesAt && <div style={{ fontSize: 11, color: "#5b5a70" }}>closes {nice(s.closesAt)}</div>}
                      </td>
                      <td style={td}><input type="datetime-local" value={e.o} onChange={(x) => setEdit({ ...edit, [t.slug]: { ...e, o: x.target.value } })} style={inp} /></td>
                      <td style={td}><input type="datetime-local" value={e.c} onChange={(x) => setEdit({ ...edit, [t.slug]: { ...e, c: x.target.value } })} style={inp} /></td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {dirty && <button style={btnGo} disabled={busy} onClick={() => post([t.slug], { opensAt: toIso(e.o), closesAt: toIso(e.c) }, "Dates saved.")}>Save dates</button>}{" "}
                        {s.state === "live"
                          ? <button style={{ ...btn, color: red, borderColor: red }} disabled={busy} onClick={() => post([t.slug], { open: false }, "Test closed.")}>Close</button>
                          : <button style={btn} disabled={busy} onClick={() => post([t.slug], { goLive: true }, "Test is live.")}>Make live</button>}{" "}
                        <button style={btn} onClick={() => onOpenCards(t.slug)}>Result cards</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: "#5b5a70", margin: "8px 0 0" }}>
            Times are in this computer’s time zone. A test opens and closes by itself at the times shown. “Close” shuts it by hand and beats the dates; “Make live” opens it now.
            Students already taking a test can always finish it.
          </p>
        </div>
      )}
    </div>
  );
}
