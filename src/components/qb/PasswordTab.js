"use client";
import { useState } from "react";
import { card, inp, lbl, btn, Msg, api } from "./ui";

export default function PasswordTab() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function save(e) {
    e.preventDefault();
    if (f.next !== f.again) return setMsg({ type: "err", text: "The two new passwords do not match." });
    setBusy(true); setMsg(null);
    try {
      await api("/api/qb/password", { method: "POST", body: { current: f.current, next: f.next } });
      setF({ current: "", next: "", again: "" });
      setMsg({ type: "ok", text: "Your password has been changed. Use the new one next time you log in." });
    } catch (err) { setMsg({ type: "err", text: err.message }); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} style={{ ...card, maxWidth: 420 }} autoComplete="off">
      <h2 style={{ marginTop: 0 }}>Change my password</h2>
      <Msg m={msg} />
      <label style={lbl}>Current password</label>
      <input style={inp} type="password" value={f.current} onChange={(e) => set("current", e.target.value)} required autoComplete="current-password" />
      <label style={{ ...lbl, marginTop: 12 }}>New password <span style={{ fontWeight: 400 }}>(at least 8 characters)</span></label>
      <input style={inp} type="password" value={f.next} onChange={(e) => set("next", e.target.value)} required minLength={8} autoComplete="new-password" />
      <label style={{ ...lbl, marginTop: 12 }}>New password again</label>
      <input style={inp} type="password" value={f.again} onChange={(e) => set("again", e.target.value)} required minLength={8} autoComplete="new-password" />
      <div style={{ marginTop: 16 }}><button style={btn(!busy)} disabled={busy}>{busy ? "Saving…" : "Change password"}</button></div>
    </form>
  );
}
