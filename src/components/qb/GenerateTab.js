"use client";
import { useState, useEffect, useMemo } from "react";
import { C, QT, DIFF, CLASSES, card, inp, lbl, btn, small, grid, Msg, api, fmt } from "./ui";

const newSec = (o = {}) => ({ key: Math.random().toString(36).slice(2), qtype: "mcq", count: "10", attempt: "", marks: "1", instr: "", ...o });
const PRESET = [newSec({ qtype: "mcq", count: "10", marks: "1" }), newSec({ qtype: "short", count: "8", attempt: "5", marks: "2" }), newSec({ qtype: "long", count: "4", attempt: "3", marks: "5" })];

export default function GenerateTab({ meta, onGenerated }) {
  const [f, setF] = useState({ title: "", school: "", classNum: "", subject: "", totalMarks: "", duration: "", difficulty: "", instructions: "Attempt all questions as directed. Write neatly.", chapters: [] });
  const [secs, setSecs] = useState([newSec()]);
  const [avail, setAvail] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chapters = (meta?.chapters || {})[`${f.classNum}|${f.subject}`] || [];

  const total = useMemo(() => secs.reduce((t, s) => t + (parseInt(s.attempt, 10) || parseInt(s.count, 10) || 0) * (Number(s.marks) || 0), 0), [secs]);
  const target = Number(f.totalMarks);
  const matches = target > 0 && Math.abs(total - target) < 0.001;

  // live "N available" per section, after a short pause while typing
  const availKey = JSON.stringify([f.classNum, f.subject, f.difficulty, f.chapters, secs.map((s) => [s.key, s.qtype, s.marks])]);
  useEffect(() => {
    if (!f.classNum || !f.subject) { setAvail({}); return; }
    const t = setTimeout(async () => {
      const out = {};
      await Promise.all(secs.map(async (s) => {
        const qs = new URLSearchParams({ classNum: f.classNum, subject: f.subject, qtype: s.qtype, marks: s.marks, difficulty: f.difficulty });
        f.chapters.forEach((c) => qs.append("chapters", c));
        try { out[s.key] = (await api(`/api/qb/availability?${qs}`)).available; } catch { out[s.key] = null; }
      }));
      setAvail(out);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [availKey]);

  const upd = (key, k, v) => setSecs((a) => a.map((s) => (s.key === key ? { ...s, [k]: v } : s)));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await api("/api/qb/papers", { method: "POST", body: { ...f, sections: secs } });
      onGenerated(r.id);
    } catch (err) { setMsg({ type: "err", text: err.message }); window.scrollTo({ top: 0, behavior: "smooth" }); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={card}>
      <h2 style={{ marginTop: 0 }}>Generate a question paper</h2>
      <Msg m={msg} />
      <div style={grid()}>
        <div><label style={lbl}>Exam title</label><input style={inp} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Annual Examination 2026" required /></div>
        <div><label style={lbl}>School name (optional)</label><input style={inp} value={f.school} onChange={(e) => set("school", e.target.value)} /></div>
        <div><label style={lbl}>Class</label>
          <select style={inp} value={f.classNum} onChange={(e) => setF((p) => ({ ...p, classNum: e.target.value, chapters: [] }))} required>
            <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
        <div><label style={lbl}>Subject</label>
          <select style={inp} value={f.subject} onChange={(e) => setF((p) => ({ ...p, subject: e.target.value, chapters: [] }))} required>
            <option value="">Choose…</option>{(meta?.subjects || []).map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <div style={{ ...grid(), marginTop: 12 }}>
        <div><label style={lbl}>Total marks</label><input style={inp} type="number" step="0.5" min="1" value={f.totalMarks} onChange={(e) => set("totalMarks", e.target.value)} required /></div>
        <div><label style={lbl}>Time (minutes)</label><input style={inp} type="number" min="0" value={f.duration} onChange={(e) => set("duration", e.target.value)} /></div>
        <div><label style={lbl}>Difficulty</label>
          <select style={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="">Any (mixed)</option>{DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></div>
      </div>
      <label style={{ ...lbl, marginTop: 12 }}>General instructions</label>
      <textarea style={{ ...inp, minHeight: 56 }} dir="auto" value={f.instructions} onChange={(e) => set("instructions", e.target.value)} />

      {chapters.length > 0 && (
        <fieldset style={{ border: `1px dashed ${C.LINE}`, borderRadius: 10, margin: "14px 0", padding: 12 }}>
          <legend style={{ fontWeight: 700, fontSize: 13 }}>Limit to chapters <span style={{ fontWeight: 400, color: C.MUTED }}>(none ticked = every chapter)</span></legend>
          {chapters.map((c) => (
            <label key={c} style={{ fontWeight: 400, marginRight: 16, display: "inline-block" }}>
              <input type="checkbox" checked={f.chapters.includes(c)} onChange={(e) => set("chapters", e.target.checked ? [...f.chapters, c] : f.chapters.filter((x) => x !== c))} /> {c}
            </label>
          ))}
        </fieldset>
      )}

      <h3>Sections</h3>
      <p style={{ color: C.MUTED, fontSize: 13, marginTop: 0 }}>Each section picks random questions of one type and mark value. Use “Attempt” for choice, e.g. 7 questions, attempt any 5. Questions not used in an earlier paper for this class and subject are preferred.</p>
      {secs.map((s, i) => (
        <div key={s.key} style={{ ...grid(170), border: `1px solid ${C.LINE}`, borderRadius: 10, padding: 12, marginBottom: 10, background: "#FBFCFD" }}>
          <div><label style={lbl}>Section {String.fromCharCode(65 + i)} type</label>
            <select style={inp} value={s.qtype} onChange={(e) => upd(s.key, "qtype", e.target.value)}>{Object.entries(QT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label style={lbl}>No. of questions</label><input style={inp} type="number" min="1" value={s.count} onChange={(e) => upd(s.key, "count", e.target.value)} required /></div>
          <div><label style={lbl}>Attempt (blank = all)</label><input style={inp} type="number" min="1" value={s.attempt} onChange={(e) => upd(s.key, "attempt", e.target.value)} /></div>
          <div><label style={lbl}>Marks each</label><input style={inp} type="number" step="0.5" min="0.5" value={s.marks} onChange={(e) => upd(s.key, "marks", e.target.value)} required /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Custom instruction (optional)</label><input style={inp} dir="auto" value={s.instr} onChange={(e) => upd(s.key, "instr", e.target.value)} /></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: avail[s.key] == null ? C.MUTED : avail[s.key] >= (parseInt(s.count, 10) || 0) ? C.GREEN : C.RED }}>
              {!f.classNum || !f.subject ? "Choose class and subject to see availability." : avail[s.key] == null ? "…" : `${avail[s.key]} available in the bank`}
            </span>
            {secs.length > 1 && <button type="button" style={{ ...small, color: C.RED, borderColor: C.RED }} onClick={() => setSecs((a) => a.filter((x) => x.key !== s.key))}>Remove</button>}
          </div>
        </div>
      ))}
      <p>
        <button type="button" style={btn(false)} onClick={() => setSecs((a) => [...a, newSec()])}>+ Add section</button>{" "}
        <button type="button" style={btn(false)} onClick={() => { setSecs(PRESET.map((p) => ({ ...p, key: Math.random().toString(36).slice(2) }))); set("totalMarks", "35"); }}>Fill a standard layout</button>
      </p>
      <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, border: `1.5px solid ${matches ? C.GREEN : C.RED}`, background: matches ? "#E8F6EE" : "#FBEAEA" }}>
        Sections total: <b>{fmt(total)}</b> / target <b>{target > 0 ? fmt(target) : "–"}</b>
      </div>
      <button style={btn(!busy)} disabled={busy}>{busy ? "Generating…" : "Generate paper"}</button>
    </form>
  );
}
