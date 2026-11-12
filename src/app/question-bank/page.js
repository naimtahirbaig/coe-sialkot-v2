"use client";
// Question Bank & Paper Generator.
//   Teachers: log in, add questions (one by one or by CSV), see the bank.
//   Admin (username "admin" + the site admin password): everything above, plus teacher accounts,
//   paper generation (class, subject, marks, sections), swap, print/PDF and Word download.
import { useState, useEffect, useCallback } from "react";
import { C, QT, card, inp, lbl, btn, grid, th, td, Msg, api } from "@/components/qb/ui";
import QuestionForm from "@/components/qb/QuestionForm";
import QuestionsTab from "@/components/qb/QuestionsTab";
import ImportTab from "@/components/qb/ImportTab";
import GenerateTab from "@/components/qb/GenerateTab";
import PapersTab from "@/components/qb/PapersTab";
import PasswordTab from "@/components/qb/PasswordTab";
import TeachersTab from "@/components/qb/TeachersTab";

export default function QuestionBankPage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("overview");
  const [meta, setMeta] = useState(null);
  const [editing, setEditing] = useState(null);
  const [openPaper, setOpenPaper] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);

  const refreshMeta = useCallback(async () => {
    try { setMeta(await api("/api/qb/meta")); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }, []);

  useEffect(() => {
    const lost = () => { setUser(null); setMsg({ type: "err", text: "Your session ended. Please log in again." }); };
    window.addEventListener("qb-auth-lost", lost);
    (async () => {
      if (sessionStorage.getItem("qb_token")) {
        try { setUser((await api("/api/qb/me")).user); } catch { /* shows the login form */ }
      }
      setReady(true);
    })();
    return () => window.removeEventListener("qb-auth-lost", lost);
  }, []);
  useEffect(() => { if (user) refreshMeta(); }, [user, refreshMeta]);

  async function doLogin(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api("/api/qb/login", { method: "POST", body: login });
      sessionStorage.setItem("qb_token", r.token);
      setUser(r.user); setTab("overview"); setLogin({ username: "", password: "" });
    } catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  function logout() { sessionStorage.removeItem("qb_token"); setUser(null); setMeta(null); setMsg(null); }

  const wrap = { minHeight: "100vh", background: "#F4F3FA", fontFamily: "Inter, system-ui, sans-serif", color: C.INK };
  // the site's global reset removes heading styles, so restore them for this page
  const HEADINGS = `.qb-root h1,.qb-root h2,.qb-root h3{font-weight:800;color:${C.NAVY};margin:14px 0 8px}
.qb-root h1{font-size:24px}.qb-root h2{font-size:20px}.qb-root h3{font-size:17px}
.qb-root .qb-paper h2{font-size:18px;color:#000;margin:0}`;
  if (!ready) return <div style={wrap} />;

  if (!user) {
    return (
      <div style={wrap} className="qb-root">
        <style dangerouslySetInnerHTML={{ __html: HEADINGS }} />
        <form onSubmit={doLogin} style={{ ...card, maxWidth: 400, margin: "70px auto" }}>
          <h1 style={{ marginTop: 0, color: C.NAVY, fontSize: 24 }}>Question Bank</h1>
          <p style={{ color: C.MUTED }}>Teachers log in to add questions. The admin logs in with username <b>admin</b> to generate papers.</p>
          <Msg m={msg} />
          <label style={lbl}>Username</label>
          <input style={{ ...inp, marginBottom: 12 }} value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} autoCapitalize="none" autoFocus required />
          <label style={lbl}>Password</label>
          <input style={{ ...inp, marginBottom: 16 }} type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
          <button style={btn()}>Log in</button>
        </form>
      </div>
    );
  }

  const admin = user.role === "admin";
  const tabs = [
    ["overview", "Overview"], ["questions", "Question bank"], ["add", editing ? "Edit question" : "Add question"], ["import", "Bulk import"],
    ...(admin ? [["generate", "Generate paper"], ["papers", "Papers"], ["teachers", "Teachers"]] : [["password", "My password"]]),
  ];
  const go = (t) => { if (t !== "add") setEditing(null); if (t !== "papers") setOpenPaper(null); setTab(t); };

  return (
    <div style={wrap} className="qb-root">
      <style dangerouslySetInnerHTML={{ __html: HEADINGS }} />
      <div style={{ background: C.NAVY, color: "#fff", padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <b style={{ fontSize: 17 }}>Question Bank &amp; Paper Generator</b>
        <span>{user.name} <span style={{ background: "#334155", borderRadius: 10, padding: "1px 9px", fontSize: 12 }}>{user.role}</span>{" "}
          <button onClick={logout} style={{ background: "none", border: 0, color: C.GOLD, cursor: "pointer", fontWeight: 700 }}>Log out</button></span>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px 60px" }}>
        <div className="qb-noprint" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => go(k)} style={{ ...btn(tab === k), padding: "8px 14px", fontSize: 14 }}>{label}</button>
          ))}
        </div>
        <Msg m={tab === "overview" ? msg : null} />

        {tab === "overview" && <Overview meta={meta} admin={admin} go={go} />}
        {tab === "questions" && <QuestionsTab meta={meta} refreshMeta={refreshMeta} onEdit={(q) => { setEditing(q); setTab("add"); }} />}
        {tab === "add" && <QuestionForm key={editing ? editing.id : "new"} editing={editing} meta={meta}
          onDone={(leave = true) => { refreshMeta(); if (leave) { setEditing(null); setTab("questions"); } }} />}
        {tab === "import" && <ImportTab onImported={refreshMeta} />}
        {admin && tab === "generate" && <GenerateTab meta={meta} onGenerated={(id) => { setOpenPaper(id); setTab("papers"); }} />}
        {admin && tab === "papers" && <PapersTab openId={openPaper} setOpenId={setOpenPaper} />}
        {admin && tab === "teachers" && <TeachersTab />}
        {!admin && tab === "password" && <PasswordTab />}
      </div>
    </div>
  );
}

function Overview({ meta, admin, go }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ ...card, marginBottom: 0, minWidth: 180 }}><b style={{ fontSize: 30 }}>{meta ? meta.total : "…"}</b><div style={{ color: C.MUTED }}>questions in the bank</div></div>
      </div>
      <p>
        <button style={btn()} onClick={() => go("add")}>Add a question</button>{" "}
        <button style={btn(false)} onClick={() => go("import")}>Bulk import</button>{" "}
        {admin && <button style={btn(false)} onClick={() => go("generate")}>Generate a paper</button>}
      </p>
      <h2>Question bank coverage</h2>
      {meta && meta.coverage.length ? (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Class</th><th style={th}>Subject</th>{Object.entries(QT).map(([k, v]) => <th key={k} style={{ ...th, textAlign: "right" }}>{v}</th>)}<th style={{ ...th, textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {meta.coverage.map((r) => (
                <tr key={r.classNum + r.subject}>
                  <td style={td}>Class {r.classNum}</td><td style={td}>{r.subject}</td>
                  {Object.keys(QT).map((k) => <td key={k} style={{ ...td, textAlign: "right" }}>{r.counts[k] || 0}</td>)}
                  <td style={{ ...td, textAlign: "right" }}><b>{r.total}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: C.MUTED }}>{meta ? "The bank is empty. Add the first question to get started." : "Loading…"}</p>}
    </div>
  );
}
