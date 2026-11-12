"use client";
import { useState, useEffect, useMemo } from "react";
import { C, DIFF, CLASSES, card, inp, lbl, btn, small, grid, Msg, api, fmt, fileToDataUrl } from "./ui";
import { SBA_TITLE, SCHOOL_LINE, PART_TYPES, formatFor } from "@/lib/qbFormats";

const uid = () => Math.random().toString(36).slice(2);
const mkBlocks = (tpl) => tpl.map((b) => ({ key: uid(), parts: b.parts.map((p) => ({ key: uid(), marks: String(p.marks), qtype: p.qtype })) }));

export default function GenerateTab({ meta, onGenerated }) {
  const [f, setF] = useState({ classNum: "", subject: "", title: SBA_TITLE, school: SCHOOL_LINE, subjectTitle: "", lang: "en", qr: "", difficulty: "", chapters: [], totalMarks: "" });
  const [partA, setPartA] = useState({ count: "10", marks: "1.5", passageSize: "0" });
  const [partB, setPartB] = useState(mkBlocks([{ parts: [{ marks: 5, qtype: "crq" }, { marks: 5, qtype: "crq" }] }]));
  const [totalTouched, setTotalTouched] = useState(false);
  const [avail, setAvail] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chapters = (meta?.chapters || {})[`${f.classNum}|${f.subject}`] || [];

  const aTotal = (parseInt(partA.count, 10) || 0) * (Number(partA.marks) || 0);
  const bTotal = partB.reduce((t, b) => t + b.parts.reduce((x, p) => x + (Number(p.marks) || 0), 0), 0);
  const sum = aTotal + bTotal;
  const target = totalTouched ? Number(f.totalMarks) : sum;
  const matches = target > 0 && Math.abs(sum - target) < 0.001;
  const startNo = (parseInt(partA.count, 10) || 0) + 1;

  // choosing class + subject loads that subject's standard paper layout, logo QR and language
  function pick(classNum, subject) {
    const fmtd = formatFor(classNum, subject);
    setF((p) => ({ ...p, classNum, subject, chapters: [], subjectTitle: subject ? fmtd.display : "", lang: fmtd.lang, qr: fmtd.qr }));
    if (classNum && subject) {
      setPartA({ count: String(fmtd.template.partA.count), marks: String(fmtd.template.partA.marks), passageSize: String(fmtd.template.partA.passageSize) });
      setPartB(mkBlocks(fmtd.template.partB));
      setTotalTouched(false);
    }
  }

  // live "N available" for every slot, after a short pause while typing
  const slots = useMemo(() => [
    { id: "A", kind: "mcq", marks: partA.marks },
    ...partB.flatMap((b) => b.parts.map((p) => ({ id: p.key, kind: p.qtype, marks: p.marks }))),
  ], [partA.marks, partB]);
  const availKey = JSON.stringify([f.classNum, f.subject, f.difficulty, f.chapters, slots]);
  useEffect(() => {
    if (!f.classNum || !f.subject) { setAvail({}); return; }
    const t = setTimeout(async () => {
      const out = {};
      await Promise.all(slots.map(async (s) => {
        const qs = new URLSearchParams({ classNum: f.classNum, subject: f.subject, kind: s.kind, marks: s.marks, difficulty: f.difficulty });
        f.chapters.forEach((c) => qs.append("chapters", c));
        try { out[s.id] = await api(`/api/qb/availability?${qs}`); } catch { out[s.id] = null; }
      }));
      setAvail(out);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [availKey]);

  const updPart = (bk, pk, k, v) => setPartB((a) => a.map((b) => (b.key !== bk ? b : { ...b, parts: b.parts.map((p) => (p.key === pk ? { ...p, [k]: v } : p)) })));
  const addPart = (bk) => setPartB((a) => a.map((b) => (b.key !== bk || b.parts.length >= 8 ? b : { ...b, parts: [...b.parts, { key: uid(), marks: "5", qtype: "crq" }] })));
  const rmPart = (bk, pk) => setPartB((a) => a.map((b) => (b.key !== bk || b.parts.length < 2 ? b : { ...b, parts: b.parts.filter((p) => p.key !== pk) })));

  async function uploadQr(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try { set("qr", await fileToDataUrl(file, 400, "image/png")); } catch (err) { setMsg({ type: "err", text: err.message }); }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const body = {
        ...f, totalMarks: String(target),
        partA, partB: partB.map((b) => ({ parts: b.parts.map((p) => ({ marks: p.marks, qtype: p.qtype })) })),
      };
      onGenerated((await api("/api/qb/papers", { method: "POST", body })).id);
    } catch (err) { setMsg({ type: "err", text: err.message }); window.scrollTo({ top: 0, behavior: "smooth" }); }
    setBusy(false);
  }

  const AV = ({ id, need = 1, passage = false }) => {
    const a = avail[id];
    if (!f.classNum || !f.subject) return <span style={{ color: C.MUTED }}>Choose class and subject.</span>;
    if (!a) return <span style={{ color: C.MUTED }}>…</span>;
    const n = a.available;
    return <span style={{ color: n >= need ? C.GREEN : C.RED }}>{n} available{passage ? ` · best passage has ${a.inPassages} MCQs` : ""}</span>;
  };

  return (
    <form onSubmit={submit} style={card}>
      <h2 style={{ marginTop: 0 }}>Generate a question paper</h2>
      <Msg m={msg} />
      <div style={grid()}>
        <div><label style={lbl}>Class</label>
          <select style={inp} value={f.classNum} onChange={(e) => pick(e.target.value, f.subject)} required>
            <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
        <div><label style={lbl}>Subject</label>
          <select style={inp} value={f.subject} onChange={(e) => pick(f.classNum, e.target.value)} required>
            <option value="">Choose…</option>{(meta?.subjects || []).map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Subject name on paper</label><input style={inp} value={f.subjectTitle} onChange={(e) => set("subjectTitle", e.target.value)} required /></div>
        <div><label style={lbl}>Paper language</label>
          <select style={inp} value={f.lang} onChange={(e) => set("lang", e.target.value)}><option value="en">English (left to right)</option><option value="ur">اردو (right to left)</option></select></div>
      </div>
      <div style={{ ...grid(300), marginTop: 12 }}>
        <div><label style={lbl}>Assessment title</label><input style={inp} value={f.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div><label style={lbl}>School name line</label><input style={inp} value={f.school} onChange={(e) => set("school", e.target.value)} /></div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <div style={{ width: 90, height: 90, border: `1px dashed ${C.LINE}`, display: "grid", placeItems: "center", background: "#fff" }}>
          {f.qr ? <img src={f.qr} alt="QR" style={{ width: 84, height: 84, imageRendering: "pixelated" }} /> : <span style={{ color: C.MUTED, fontSize: 12 }}>no QR</span>}
        </div>
        <div style={{ fontSize: 13, color: C.MUTED, maxWidth: 520 }}>
          {f.qr && f.qr.startsWith("/qb/") ? "Official PECTAA QR code for this subject (from the Grade 8 sample papers)." : f.qr ? "Uploaded QR code." : f.classNum && f.subject ? "No QR code is stored for this class and subject." : "The QR code appears when you choose class and subject."}
          <div style={{ marginTop: 6 }}>
            <label style={{ ...small, display: "inline-block" }}>Upload a QR picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadQr} style={{ display: "none" }} /></label>{" "}
            {f.qr && <button type="button" style={small} onClick={() => set("qr", "")}>Remove QR</button>}
          </div>
        </div>
      </div>

      <div style={grid()}>
        <div><label style={lbl}>Difficulty</label>
          <select style={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="">Any (mixed)</option>{DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></div>
      </div>
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

      <h3>Part A — Objective (MCQs)</h3>
      <div style={{ ...grid(150), border: `1px solid ${C.LINE}`, borderRadius: 10, padding: 12, background: "#FBFCFD" }}>
        <div><label style={lbl}>Number of MCQs</label><input style={inp} type="number" min="0" max="60" value={partA.count} onChange={(e) => setPartA({ ...partA, count: e.target.value })} /></div>
        <div><label style={lbl}>Marks of each MCQ</label><input style={inp} type="number" step="0.5" min="0.5" value={partA.marks} onChange={(e) => setPartA({ ...partA, marks: e.target.value })} /></div>
        <div><label style={lbl}>Questions from a reading passage</label><input style={inp} type="number" min="0" value={partA.passageSize} onChange={(e) => setPartA({ ...partA, passageSize: e.target.value })} /></div>
        <div style={{ fontSize: 13, paddingBottom: 10 }}><AV id="A" need={(parseInt(partA.count, 10) || 0) - (parseInt(partA.passageSize, 10) || 0)} passage />
          <div style={{ color: C.MUTED }}>Part A = {fmt(aTotal)} marks</div></div>
      </div>

      <h3>Part B — Subjective (CRQs)</h3>
      <p style={{ color: C.MUTED, fontSize: 13, marginTop: 0 }}>Each question has parts (a, b, c). Every part takes one bank question worth exactly those marks.</p>
      {partB.map((b, bi) => (
        <div key={b.key} style={{ border: `1px solid ${C.LINE}`, borderRadius: 10, padding: 12, marginBottom: 10, background: "#FBFCFD" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <b>Question No: {startNo + bi}</b>
            <span>
              <button type="button" style={small} onClick={() => addPart(b.key)}>+ Add part</button>{" "}
              <button type="button" style={{ ...small, color: C.RED, borderColor: C.RED }} onClick={() => setPartB((a) => a.filter((x) => x.key !== b.key))}>Remove question</button>
            </span>
          </div>
          {b.parts.map((p, pj) => (
            <div key={p.key} style={{ ...grid(120), marginBottom: 6 }}>
              <div style={{ paddingBottom: 10, fontWeight: 700 }}>{b.parts.length > 1 ? ["a", "b", "c", "d", "e", "f", "g", "h"][pj] + " )" : "Part"}</div>
              <div><label style={lbl}>Marks</label><input style={inp} type="number" step="0.5" min="0.5" value={p.marks} onChange={(e) => updPart(b.key, p.key, "marks", e.target.value)} /></div>
              <div><label style={lbl}>Type</label>
                <select style={inp} value={p.qtype} onChange={(e) => updPart(b.key, p.key, "qtype", e.target.value)}>{Object.entries(PART_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div style={{ paddingBottom: 10, fontSize: 13 }}><AV id={p.key} /></div>
              <div style={{ paddingBottom: 6 }}>{b.parts.length > 1 && <button type="button" style={small} onClick={() => rmPart(b.key, p.key)}>Remove</button>}</div>
            </div>
          ))}
        </div>
      ))}
      <p><button type="button" style={btn(false)} onClick={() => setPartB((a) => [...a, { key: uid(), parts: [{ key: uid(), marks: "5", qtype: "crq" }] }])}>+ Add question</button></p>

      <div style={grid(200)}>
        <div><label style={lbl}>Total marks</label>
          <input style={inp} type="number" step="0.5" min="1" value={totalTouched ? f.totalMarks : String(sum || "")} onChange={(e) => { setTotalTouched(true); set("totalMarks", e.target.value); }} required /></div>
        <div style={{ paddingBottom: 10, color: C.MUTED, fontSize: 13 }}>Leave as is to use Part A + Part B. Type a different total and the paper will only generate when the parts add up to it.</div>
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 10, margin: "10px 0 14px", border: `1.5px solid ${matches ? C.GREEN : C.RED}`, background: matches ? "#E8F6EE" : "#FBEAEA" }}>
        Part A <b>{fmt(aTotal)}</b> + Part B <b>{fmt(bTotal)}</b> = <b>{fmt(sum)}</b> marks · total <b>{target > 0 ? fmt(target) : "–"}</b>
      </div>
      <button style={btn(!busy)} disabled={busy}>{busy ? "Generating…" : "Generate paper"}</button>
    </form>
  );
}
