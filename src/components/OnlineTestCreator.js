"use client";
import { useState } from "react";
import { cleanBank, MAX_PAPER } from "@/lib/onlineTestDefs";

const navy = "#150F3F", gold = "#F3B129", green = "#007a3a", red = "#B3261E";
const btn = { padding: "7px 14px", borderRadius: 6, border: `1px solid ${navy}`, background: "#fff", color: navy, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnGo = { ...btn, background: navy, color: "#fff" };
const inp = { padding: 8, border: "1px solid #bdbad0", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

// Reads a sheet: Question | A | B | C | D | Correct   (headers optional)
function readRows(rows) {
  const clean = rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  if (!clean.length) return [];
  const norm = (v) => String(v).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const h = clean[0].map(norm);
  const hasHeader = h.some((x) => /^(q|qno|question|mcq)/.test(x)) && h.some((x) => /^(correct|answer|ans|key|right)/.test(x));
  let qi = 0, ci = -1, oi = [1, 2, 3, 4];
  if (hasHeader) {
    qi = h.findIndex((x) => /^(q|question|mcq)/.test(x) && !/^qno/.test(x));
    if (qi < 0) qi = 0;
    ci = h.findIndex((x) => /^(correct|answer|ans|key|right)/.test(x));
    const opts = [];
    h.forEach((x, i) => { if (/^(option|opt)?[a-e1-5]$/.test(x) && i !== qi && i !== ci) opts.push(i); });
    if (opts.length) oi = opts;
  } else ci = 5;
  const body = hasHeader ? clean.slice(1) : clean;
  return body.map((r) => {
    const opts = oi.map((i) => String(r[i] ?? "").trim());
    const raw = String(r[ci] ?? "").trim();
    let correct = -1;
    if (/^[a-eA-E]$/.test(raw)) correct = raw.toUpperCase().charCodeAt(0) - 65;
    else if (/^[1-5]$/.test(raw)) correct = Number(raw) - 1;
    else if (raw) correct = opts.findIndex((o) => o.toLowerCase() === raw.toLowerCase());
    return { q: String(r[qi] ?? "").trim(), opts, correct };
  });
}

export default function OnlineTestCreator({ pw, defaultMonth, onCreated, onClose }) {
  const [f, setF] = useState({ classNum: "8", subject: "", chapter: "", month: defaultMonth || "October 2026", perQ: "15", paperSize: "" });
  const [questions, setQuestions] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function template() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["Question", "A", "B", "C", "D", "Correct"],
      ["The air that surrounds the Earth is called the:", "atmosphere", "hydrosphere", "lithosphere", "biosphere", "A"],
      ["Which gas do plants take in?", "Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen", "B"],
    ]);
    ws["!cols"] = [{ wch: 60 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 10 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "Online_Test_Questions_Template.xlsx");
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    setQuestions(null); setErrors([]); setMsg(""); setDone(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
      const qs = readRows(rows);
      const { errors: errs, bank } = cleanBank(qs);
      setQuestions(qs); setErrors(errs);
      if (!errs.length) setF((x) => ({ ...x, paperSize: String(Math.min(bank.length, MAX_PAPER)) }));
    } catch (err) { setErrors([`Could not read that file (${err.message}).`]); }
  }

  const bankOk = questions && !errors.length ? cleanBank(questions).bank : [];

  async function create() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/online-test/create", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ ...f, classNum: Number(f.classNum), perQ: Number(f.perQ), paperSize: Number(f.paperSize) || undefined, questions }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setDone(j); onCreated && onCreated(j, f);
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  }

  const ready = f.subject.trim() && f.month.trim() && bankOk.length >= 4 && !busy;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div style={{ border: `2px solid ${gold}`, borderRadius: 10, padding: 16, margin: "0 0 18px", background: "#fffdf6" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <b style={{ fontSize: 18, marginRight: "auto" }}>Create a new test</b>
        <button style={btn} onClick={onClose}>Close</button>
      </div>

      {done ? (
        <div>
          <p style={{ color: green, fontWeight: 700, margin: "0 0 6px" }}>✓ Test created — {done.bankSize} questions in the bank, {done.paperSize} per paper.</p>
          <p style={{ margin: "0 0 8px", fontSize: 14 }}>Share this link with students:<br />
            <a href={done.url} target="_blank" rel="noreferrer" style={{ color: navy, fontWeight: 700 }}>{origin}{done.url}</a>
          </p>
          <button style={btnGo} onClick={() => navigator.clipboard && navigator.clipboard.writeText(origin + done.url)}>Copy link</button>{" "}
          <button style={btn} onClick={() => { setDone(null); setQuestions(null); setFileName(""); setF((x) => ({ ...x, subject: "", chapter: "", paperSize: "" })); }}>Create another</button>
          <p style={{ fontSize: 13, color: "#5b5a70" }}>The test is <b>Active</b>. It also appears on the Online Tests page and in the list above.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, fontSize: 13 }}>
            <label>Class<br />
              <select value={f.classNum} onChange={set("classNum")} style={{ ...inp, width: "100%" }}>
                {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>Class {n}</option>)}
              </select></label>
            <label>Subject<br /><input value={f.subject} onChange={set("subject")} placeholder="e.g. Science" style={{ ...inp, width: "100%" }} /></label>
            <label>Chapter (optional)<br /><input value={f.chapter} onChange={set("chapter")} placeholder="e.g. Chapter 2" style={{ ...inp, width: "100%" }} /></label>
            <label>Month<br /><input value={f.month} onChange={set("month")} style={{ ...inp, width: "100%" }} /></label>
            <label>Seconds per question<br /><input value={f.perQ} onChange={set("perQ")} style={{ ...inp, width: "100%" }} /></label>
            <label>Questions per paper<br /><input value={f.paperSize} onChange={set("paperSize")} placeholder={`max ${MAX_PAPER}`} style={{ ...inp, width: "100%" }} /></label>
          </div>

          <div style={{ marginTop: 14, fontSize: 13 }}>
            <b>Question file</b> (Excel .xlsx or .csv): columns <code>Question, A, B, C, D, Correct</code> — Correct is the letter (A–D).{" "}
            <button style={btn} onClick={template}>Download template</button>
            <div style={{ marginTop: 8 }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} />
            </div>
            <p style={{ margin: "6px 0 0", color: "#5b5a70" }}>Put more questions in the file than one paper needs — each student then gets a different random set, in a random order.</p>
          </div>

          {questions && !errors.length && (
            <div style={{ marginTop: 10, fontSize: 14 }}>
              <b style={{ color: green }}>✓ {bankOk.length} questions read from {fileName}.</b>
              <ol style={{ margin: "6px 0 0 18px", color: "#3b3a52" }}>
                {bankOk.slice(0, 3).map((b, i) => <li key={i}>{b[0]} <span style={{ color: green }}>→ {b[1][b[2]]}</span></li>)}
              </ol>
            </div>
          )}
          {errors.length > 0 && (
            <div style={{ marginTop: 10, color: red, fontSize: 14 }}>
              <b>Fix these in the file, then choose it again:</b>
              <ul style={{ margin: "4px 0 0 18px" }}>{errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
              {errors.length > 10 && <div>…and {errors.length - 10} more.</div>}
            </div>
          )}
          {msg && <p style={{ color: red, fontWeight: 600 }}>{msg}</p>}
          <div style={{ marginTop: 14 }}>
            <button style={{ ...btnGo, opacity: ready ? 1 : 0.5 }} disabled={!ready} onClick={create}>{busy ? "Creating…" : "Create test"}</button>
          </div>
        </>
      )}
    </div>
  );
}
