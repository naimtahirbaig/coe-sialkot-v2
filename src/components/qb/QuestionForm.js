"use client";
import { useState } from "react";
import { C, QT, DIFF, CLASSES, card, inp, lbl, btn, grid, Msg, api, fmt } from "./ui";

const blank = { classNum: "", subject: "", chapter: "", qtype: "mcq", text: "", opts: ["", "", "", ""], correct: "", answer: "", marks: "1", difficulty: "medium" };

const fromRow = (q) => ({
  classNum: String(q.class_num), subject: q.subject, chapter: q.chapter || "", qtype: q.qtype, text: q.text,
  opts: [0, 1, 2, 3].map((i) => (q.opts || [])[i] || ""), correct: q.correct || "", answer: q.answer || "",
  marks: fmt(q.marks), difficulty: q.difficulty,
});

export default function QuestionForm({ editing, meta, onDone }) {
  const [f, setF] = useState(editing ? fromRow(editing) : blank);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chapters = (meta?.chapters || {})[`${f.classNum}|${f.subject}`] || [];

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api(editing ? `/api/qb/questions/${editing.id}` : "/api/qb/questions", { method: editing ? "PUT" : "POST", body: f });
      if (editing) { onDone(); return; }
      setMsg({ type: "ok", text: "Question saved. Class, subject and type are kept so you can add the next one." });
      setF((p) => ({ ...p, text: "", opts: ["", "", "", ""], correct: "", answer: "" }));
      onDone(false);
    } catch (err) { setMsg({ type: "err", text: err.message }); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} style={card}>
      <h2 style={{ marginTop: 0 }}>{editing ? `Edit question #${editing.id}` : "Add a question"}</h2>
      <Msg m={msg} />
      <div style={grid()}>
        <div><label style={lbl}>Class</label>
          <select style={inp} value={f.classNum} onChange={(e) => set("classNum", e.target.value)} required>
            <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select></div>
        <div><label style={lbl}>Subject</label>
          <input style={inp} list="qb-subjects" value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Mathematics" required />
          <datalist id="qb-subjects">{(meta?.subjects || []).map((s) => <option key={s} value={s} />)}</datalist></div>
        <div><label style={lbl}>Chapter / topic</label>
          <input style={inp} list="qb-chapters" value={f.chapter} onChange={(e) => set("chapter", e.target.value)} maxLength={100} placeholder="e.g. Algebra" />
          <datalist id="qb-chapters">{chapters.map((s) => <option key={s} value={s} />)}</datalist></div>
        <div><label style={lbl}>Question type</label>
          <select style={inp} value={f.qtype} onChange={(e) => set("qtype", e.target.value)}>
            {Object.entries(QT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
      </div>

      <label style={{ ...lbl, marginTop: 14 }}>Question text {f.qtype === "fill_blank" && <span style={{ color: C.MUTED, fontWeight: 400 }}>(use _____ for the blank)</span>}</label>
      <textarea style={{ ...inp, minHeight: 80 }} dir="auto" value={f.text} onChange={(e) => set("text", e.target.value)} required />

      {f.qtype === "mcq" && (
        <div style={{ margin: "12px 0", padding: 12, border: `1px dashed ${C.LINE}`, borderRadius: 10 }}>
          <div style={{ color: C.MUTED, fontSize: 13, marginBottom: 6 }}>Fill at least options A and B, then tick the correct one.</div>
          {["A", "B", "C", "D"].map((L, i) => (
            <div key={L} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="radio" name="correct" checked={f.correct === L} onChange={() => set("correct", L)} aria-label={`Option ${L} is correct`} />
              <b style={{ width: 16 }}>{L}</b>
              <input style={inp} dir="auto" value={f.opts[i]} onChange={(e) => set("opts", f.opts.map((o, j) => (j === i ? e.target.value : o)))} placeholder={`Option ${L}`} />
            </div>
          ))}
        </div>
      )}
      {f.qtype === "true_false" && (
        <div style={{ margin: "12px 0" }}>
          <span style={lbl}>Correct answer</span>
          {["True", "False"].map((v) => (
            <label key={v} style={{ marginRight: 18, fontWeight: 400 }}>
              <input type="radio" name="tf" checked={f.correct === v} onChange={() => set("correct", v)} /> {v}
            </label>
          ))}
        </div>
      )}
      {f.qtype !== "mcq" && f.qtype !== "true_false" && (
        <>
          <label style={{ ...lbl, marginTop: 12 }}>Model answer <span style={{ color: C.MUTED, fontWeight: 400 }}>(optional, shown in the answer key)</span></label>
          <textarea style={{ ...inp, minHeight: 60 }} dir="auto" value={f.answer} onChange={(e) => set("answer", e.target.value)} />
        </>
      )}

      <div style={{ ...grid(160), margin: "14px 0" }}>
        <div><label style={lbl}>Marks</label>
          <input style={inp} type="number" step="0.5" min="0.5" max="100" value={f.marks} onChange={(e) => set("marks", e.target.value)} required /></div>
        <div><label style={lbl}>Difficulty</label>
          <select style={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            {DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
          </select></div>
      </div>
      <button style={btn(!busy)} disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save question"}</button>
      {editing && <button type="button" style={{ ...btn(false), marginLeft: 10 }} onClick={() => onDone()}>Cancel</button>}
    </form>
  );
}
