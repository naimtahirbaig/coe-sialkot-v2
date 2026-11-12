"use client";
import { useState, useEffect, useCallback } from "react";
import { C, card, btn, small, th, td, Msg, api, fmt } from "./ui";

const PRINT_CSS = `
@font-face{font-family:COEUrdu;src:url(/fonts/noto-nastaliq-urdu-400.woff2) format("woff2");font-weight:400}
@font-face{font-family:COEUrdu;src:url(/fonts/noto-nastaliq-urdu-700.woff2) format("woff2");font-weight:700}
.qb-paper{background:#fff;color:#000;max-width:820px;margin:0 auto;padding:36px 46px;border:1px solid #ccc;font-family:"Times New Roman",COEUrdu,"Noto Nastaliq Urdu",serif;font-size:16px;line-height:1.5}
.qb-paper .opts{display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;margin:4px 0 0 42px}
@media (max-width:640px){.qb-paper{padding:18px}.qb-paper .opts{grid-template-columns:1fr}}
@media print{
  body *{visibility:hidden}
  .qb-paper,.qb-paper *{visibility:visible}
  .qb-paper{position:absolute;left:0;top:0;width:100%;border:0;padding:0;max-width:none}
  .qb-noprint{display:none!important}
  @page{margin:18mm 16mm}
}`;

export default function PapersTab({ openId, setOpenId }) {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setList((await api("/api/qb/papers")).papers); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }, []);
  useEffect(() => { if (!openId) load(); }, [openId, load]);

  if (openId) return <PaperView id={openId} onBack={() => setOpenId(null)} />;
  return (
    <div>
      <Msg m={msg} />
      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>#</th><th style={th}>Title</th><th style={th}>Class</th><th style={th}>Subject</th><th style={{ ...th, textAlign: "right" }}>Marks</th><th style={th}>Created</th><th style={th}></th></tr></thead>
          <tbody>
            {(list || []).map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.id}</td><td style={td}><b>{p.title}</b></td><td style={td}>Class {p.classNum}</td><td style={td}>{p.subject}</td>
                <td style={{ ...td, textAlign: "right" }}>{fmt(p.totalMarks)}</td>
                <td style={td}>{new Date(p.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td style={td}><button style={small} onClick={() => setOpenId(p.id)}>Open</button></td>
              </tr>
            ))}
            {list && !list.length && <tr><td style={td} colSpan={7}>No papers yet. Use “Generate paper”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaperView({ id, onBack }) {
  const [p, setP] = useState(null);
  const [key, setKey] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setP((await api(`/api/qb/papers/${id}`)).paper); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function swap(si, qi) {
    try {
      const r = await api(`/api/qb/papers/${id}/swap`, { method: "POST", body: { section: si, index: qi } });
      setMsg({ type: "ok", text: "Question replaced. " + (r.note || "") });
      load();
    } catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  async function word() {
    try {
      const blob = await api(`/api/qb/papers/${id}/docx${key ? "?key=1" : ""}`, { blob: true });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${p.title}-Class${p.classNum}-${p.subject}${key ? "-KEY" : ""}.docx`.replace(/[^A-Za-z0-9._-]+/g, "_");
      a.click();
    } catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  async function del() {
    if (!window.confirm("Delete this paper?")) return;
    try { await api(`/api/qb/papers/${id}`, { method: "DELETE" }); onBack(); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }

  if (!p) return <div><Msg m={msg} /><p style={{ color: C.MUTED }}>Loading…</p></div>;
  let qno = 0;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="qb-noprint" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button style={btn(false)} onClick={onBack}>‹ All papers</button>
        <button style={btn()} onClick={() => window.print()}>Print / Save as PDF</button>
        <button style={btn(false)} onClick={word}>Download Word</button>
        <button style={btn(false)} onClick={() => setKey(!key)}>{key ? "Hide answer key" : "Show answer key"}</button>
        <button style={btn(false, C.RED)} onClick={del}>Delete</button>
      </div>
      <div className="qb-noprint"><Msg m={msg} /><p style={{ color: C.MUTED, fontSize: 13 }}>Use ↻ to replace a question you don’t want. The toolbar and ↻ buttons are not printed.</p></div>

      <article className="qb-paper">
        <header style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 12, position: "relative" }}>
          {p.school && <div style={{ fontSize: 26, fontWeight: 700 }}>{p.school}</div>}
          <div style={{ fontSize: 19, fontWeight: 700 }}>{p.title}</div>
          <div style={{ fontSize: 17 }}>Class {p.classNum} &nbsp;·&nbsp; {p.subject}</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
            <span>{p.duration ? `Time: ${p.duration} minutes` : ""}</span><span>Total Marks: {fmt(p.totalMarks)}</span>
          </div>
          {key && <div style={{ position: "absolute", right: 0, top: 0, border: "2px solid #B3202A", color: "#B3202A", font: "700 12px sans-serif", padding: "2px 8px" }}>ANSWER KEY</div>}
        </header>
        {p.instructions && <p dir="auto"><b>Instructions:</b> {p.instructions}</p>}
        {p.sections.map((s, si) => (
          <section key={si}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 22, borderBottom: "1px solid #000" }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#000" }}>{s.title}</h2>
              <span>({s.attempt} × {fmt(s.marksEach)} = {fmt(s.attempt * s.marksEach)} marks)</span>
            </div>
            <p dir="auto" style={{ margin: "4px 0 10px" }}><i>{s.instructions}</i></p>
            {s.questions.map((q, qi) => {
              qno++;
              return (
                <div key={q.qid + "-" + qi} style={{ marginBottom: 12, breakInside: "avoid" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <b style={{ minWidth: 34 }}>Q{qno}.</b>
                    <span dir="auto" style={{ flex: 1, whiteSpace: "pre-line" }}>{q.text}</span>
                    <b>[{fmt(q.marks)}]</b>
                    <button className="qb-noprint" style={{ ...small, border: "none", fontSize: 16 }} title="Replace with another question" onClick={() => swap(si, qi)}>↻</button>
                  </div>
                  {q.qtype === "mcq" && <div className="opts" dir="auto">{q.opts.map((o, i) => o && <span key={i} style={key && q.correct === "ABCD"[i] ? { color: C.GREEN, fontWeight: 700 } : undefined}>({"abcd"[i]}) {o}</span>)}</div>}
                  {q.qtype === "true_false" && <div className="opts"><span>(True / False)</span></div>}
                  {key && (
                    <div dir="auto" style={{ margin: "4px 0 0 42px", color: C.GREEN, fontStyle: "italic", whiteSpace: "pre-line" }}>
                      Answer: {q.qtype === "mcq" || q.qtype === "true_false" ? q.correct : ""} {q.answer || (q.qtype !== "mcq" && q.qtype !== "true_false" ? "(no model answer stored)" : "")}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
        <p style={{ textAlign: "center", marginTop: 26, fontStyle: "italic" }}>— End of paper —</p>
      </article>
    </div>
  );
}
