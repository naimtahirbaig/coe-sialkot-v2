"use client";
import { useState, useEffect } from "react";
import { C, QT, DIFF, CLASSES, card, inp, lbl, btn, small, grid, Msg, api, fmt, fileToDataUrl } from "./ui";
import Rich from "./Rich";

const blank = { classNum: "", subject: "", chapter: "", qtype: "mcq", text: "", opts: ["", "", "", ""], correct: "", answer: "", marks: "1", difficulty: "medium", image: "", passageId: "" };

const fromRow = (q) => ({
  classNum: String(q.class_num), subject: q.subject, chapter: q.chapter || "", qtype: q.qtype, text: q.text,
  opts: [0, 1, 2, 3].map((i) => (q.opts || [])[i] || ""), correct: q.correct || "", answer: q.answer || "",
  marks: fmt(q.marks), difficulty: q.difficulty, image: q.image || "", passageId: q.passage_id ? String(q.passage_id) : "",
});

export default function QuestionForm({ editing, meta, onDone }) {
  const [f, setF] = useState(editing ? fromRow(editing) : blank);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chapters = (meta?.chapters || {})[`${f.classNum}|${f.subject}`] || [];
  const [passages, setPassages] = useState([]);
  const [np, setNp] = useState(null); // new-passage form, or null

  // the list view leaves pictures out, so fetch the picture when editing
  useEffect(() => {
    if (editing?.has_image) api(`/api/qb/questions/${editing.id}`).then((r) => set("image", r.question.image || "")).catch(() => {});
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    if (f.qtype !== "mcq" || !f.classNum || !f.subject) { setPassages([]); return; }
    api(`/api/qb/passages?classNum=${f.classNum}&subject=${encodeURIComponent(f.subject)}`).then((r) => setPassages(r.passages)).catch(() => setPassages([]));
  }, [f.qtype, f.classNum, f.subject]);

  async function pickImage(e, setter) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try { setter(await fileToDataUrl(file)); } catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  async function savePassage() {
    try {
      const r = await api("/api/qb/passages", { method: "POST", body: { ...np, classNum: f.classNum, subject: f.subject, chapter: f.chapter } });
      setPassages((a) => [r.passage, ...a]); set("passageId", String(r.passage.id)); setNp(null);
      setMsg({ type: "ok", text: "Passage saved and selected." });
    } catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  async function deletePassage() {
    if (!f.passageId || !window.confirm("Delete this passage? Its MCQs stay in the bank but are no longer linked to it.")) return;
    try { await api(`/api/qb/passages/${f.passageId}`, { method: "DELETE" }); setPassages((a) => a.filter((p) => String(p.id) !== f.passageId)); set("passageId", ""); }
    catch (err) { setMsg({ type: "err", text: err.message }); }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api(editing ? `/api/qb/questions/${editing.id}` : "/api/qb/questions", { method: editing ? "PUT" : "POST", body: f });
      if (editing) { onDone(); return; }
      setMsg({ type: "ok", text: "Question saved. Class, subject and type are kept so you can add the next one." });
      setF((p) => ({ ...p, text: "", opts: ["", "", "", ""], correct: "", answer: "", image: "" }));
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

      <label style={{ ...lbl, marginTop: 14 }}>Question text {f.qtype === "fill_blank" && <span style={{ color: C.MUTED, fontWeight: 400 }}>(use _____ for the blank) </span>}<span style={{ color: C.MUTED, fontWeight: 400 }}>Maths: write it between dollar signs, e.g. $\frac{49}{64}$ or $x^2 + 1$</span></label>
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

      {f.qtype === "mcq" && f.classNum && f.subject && (
        <div style={{ margin: "12px 0", padding: 12, border: `1px dashed ${C.LINE}`, borderRadius: 10 }}>
          <label style={lbl}>Reading passage <span style={{ color: C.MUTED, fontWeight: 400 }}>(optional: for MCQs that all refer to one paragraph or poem)</span></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select style={{ ...inp, width: "auto", minWidth: 260 }} value={f.passageId} onChange={(e) => set("passageId", e.target.value)}>
              <option value="">None</option>
              {passages.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.text.slice(0, 60)}</option>)}
            </select>
            <button type="button" style={small} onClick={() => setNp({ instruction: "", text: "", image: "" })}>+ New passage</button>
            {f.passageId && <button type="button" style={{ ...small, color: C.RED, borderColor: C.RED }} onClick={deletePassage}>Delete passage</button>}
          </div>
          {np && (
            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Instruction <span style={{ color: C.MUTED, fontWeight: 400 }}>(e.g. Read the following poem carefully and answer the questions)</span></label>
              <input style={inp} dir="auto" value={np.instruction} onChange={(e) => setNp({ ...np, instruction: e.target.value })} />
              <label style={{ ...lbl, marginTop: 8 }}>Passage text</label>
              <textarea style={{ ...inp, minHeight: 120 }} dir="auto" value={np.text} onChange={(e) => setNp({ ...np, text: e.target.value })} />
              <div style={{ margin: "8px 0" }}>
                <label style={{ ...small, display: "inline-block" }}>Add a picture<input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => pickImage(e, (v) => setNp((x) => ({ ...x, image: v })))} /></label>
                {np.image && <img src={np.image} alt="" style={{ height: 60, marginLeft: 10, verticalAlign: "middle" }} />}
              </div>
              <button type="button" style={btn()} onClick={savePassage}>Save passage</button>{" "}
              <button type="button" style={btn(false)} onClick={() => setNp(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      <div style={{ margin: "12px 0" }}>
        <label style={{ ...small, display: "inline-block" }}>{f.image ? "Change picture" : "Add a picture / figure (optional)"}
          <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => pickImage(e, (v) => set("image", v))} /></label>
        {f.image && <><img src={f.image} alt="" style={{ height: 70, marginLeft: 10, verticalAlign: "middle", border: `1px solid ${C.LINE}` }} />{" "}
          <button type="button" style={small} onClick={() => set("image", "")}>Remove picture</button></>}
      </div>

      {(f.text.includes("$") || f.opts.some((o) => o.includes("$"))) && (
        <div style={{ margin: "8px 0", padding: 10, background: "#F7F7FB", borderRadius: 8 }}>
          <div style={{ color: C.MUTED, fontSize: 12, marginBottom: 4 }}>Preview</div>
          <div><Rich text={f.text} /></div>
          {f.qtype === "mcq" && <div style={{ marginTop: 4 }}>{f.opts.map((o, i) => o && <span key={i} style={{ marginRight: 16 }}>({"abcd"[i]}) <Rich text={o} /></span>)}</div>}
        </div>
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
