"use client";
import { useState, useEffect, useCallback } from "react";
import { C, card, inp, lbl, btn, small, grid, th, td, Msg, api } from "./ui";

export default function TeachersTab() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setList((await api("/api/qb/teachers")).teachers); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    try {
      await api("/api/qb/teachers", { method: "POST", body: f });
      setMsg({ type: "ok", text: `Account '${f.username}' created. Give the teacher this username and password.` });
      setF({ name: "", username: "", password: "" }); load();
    } catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  async function patch(t, body, okText) {
    try { await api(`/api/qb/teachers/${t.id}`, { method: "PATCH", body }); setMsg({ type: "ok", text: okText }); load(); }
    catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  function reset(t) {
    const p = window.prompt(`New password for ${t.name} (8+ characters):`);
    if (p) patch(t, { password: p }, "Password reset.");
  }

  return (
    <div>
      <form onSubmit={add} style={card}>
        <h2 style={{ marginTop: 0 }}>Add a teacher</h2>
        <Msg m={msg} />
        <div style={grid()}>
          <div><label style={lbl}>Full name</label><input style={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div><label style={lbl}>Username</label><input style={inp} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required autoCapitalize="none" /></div>
          <div><label style={lbl}>Password (8+)</label><input style={inp} type="password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required autoComplete="new-password" /></div>
          <div><button style={btn()}>Add teacher</button></div>
        </div>
      </form>
      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Username</th><th style={{ ...th, textAlign: "right" }}>Questions</th><th style={th}>Status</th><th style={th}></th></tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.name}</td><td style={td}>{t.username}</td>
                <td style={{ ...td, textAlign: "right" }}>{t.questions}</td>
                <td style={{ ...td, color: t.active ? C.GREEN : C.RED, fontWeight: 700 }}>{t.active ? "Active" : "Disabled"}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button style={small} onClick={() => reset(t)}>Reset password</button>{" "}
                  <button style={small} onClick={() => patch(t, { active: !t.active }, t.active ? "Account disabled." : "Account enabled.")}>{t.active ? "Disable" : "Enable"}</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td style={td} colSpan={5}>No teachers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
