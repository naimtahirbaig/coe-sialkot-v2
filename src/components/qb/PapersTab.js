"use client";
import { useState, useEffect, useCallback } from "react";
import { C, card, btn, small, th, td, Msg, api, fmt } from "./ui";
import SbaSheet, { SHEET_CSS } from "./SbaSheet";

// Printing: only the paper is shown, on an A3 page, exactly like the sample SBA papers.
const PAGE_CSS = `${SHEET_CSS}
@media print{ html,body{background:#fff!important} body *{visibility:hidden} .sba,.sba *{visibility:visible} .qb-noprint{display:none!important} .qb-zoomwrap{zoom:1!important;border:0!important} }`;

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
  const [keyOn, setKeyOn] = useState(false);
  const [msg, setMsg] = useState(null);
  const [zoom, setZoom] = useState(1);

  const load = useCallback(async () => {
    try { setP((await api(`/api/qb/papers/${id}`)).paper); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // the sheet is A3 wide (842pt); shrink it on screen so it fits the window
  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerWidth - 24) / (842 * 96 / 72)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  async function swap(path) {
    try {
      const r = await api(`/api/qb/papers/${id}/swap`, { method: "POST", body: { path } });
      setMsg({ type: "ok", text: "Question replaced. " + (r.note || "") });
      load();
    } catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  async function del() {
    if (!window.confirm("Delete this paper?")) return;
    try { await api(`/api/qb/papers/${id}`, { method: "DELETE" }); onBack(); } catch (e) { setMsg({ type: "err", text: e.message }); }
  }

  if (!p) return <div><Msg m={msg} /><p style={{ color: C.MUTED }}>Loading…</p></div>;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="qb-noprint" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button style={btn(false)} onClick={onBack}>‹ All papers</button>
        <button style={btn()} onClick={() => window.print()}>Print / Save as PDF (A3)</button>
        <button style={btn(false)} onClick={() => setKeyOn(!keyOn)}>{keyOn ? "Hide answer key" : "Show answer key"}</button>
        <button style={btn(false, C.RED)} onClick={del}>Delete</button>
      </div>
      <div className="qb-noprint">
        <Msg m={msg} />
        <p style={{ color: C.MUTED, fontSize: 13, marginTop: 0 }}>Use ↻ on a question to replace it. In the print window choose paper size <b>A3</b>, scale 100%, and turn <b>Headers and footers</b> off.</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div className="qb-zoomwrap" style={{ zoom, width: "fit-content", margin: "0 auto", border: "1px solid #ccc", background: "#fff" }}>
          <SbaSheet doc={p.body} keyOn={keyOn} onSwap={swap} />
        </div>
      </div>
    </div>
  );
}
