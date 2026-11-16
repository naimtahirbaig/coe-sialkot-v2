"use client";
import { useState, useEffect, useMemo } from "react";
import { C, DIFF, CLASSES, card, inp, lbl, btn, small, grid, Msg, api, fmt } from "./ui";
import { SBA_TITLE, SCHOOL_LINE, PART_TYPES, SUBJECTS, formatFor, sectionsFor, normSubject, sortChapters } from "@/lib/qbFormats";

const uid = () => Math.random().toString(36).slice(2);
const big = (on, color = C.NAVY) => ({ padding: "12px 20px", minHeight: 50, fontSize: 16, fontWeight: 800, borderRadius: 12, border: `3px solid ${color}`, background: on ? color : "#fff", color: on ? "#fff" : color, cursor: "pointer", boxShadow: on ? "0 3px 0 rgba(0,0,0,.25)" : "0 2px 0 rgba(0,0,0,.08)", textAlign: "left", lineHeight: 1.25 });
const Step = ({ n, title, hint }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 10px" }}>
    <span style={{ width: 34, height: 34, borderRadius: 17, background: C.GOLD, color: C.NAVY, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18 }}>{n}</span>
    <div><div style={{ fontSize: 18, fontWeight: 800, color: C.NAVY }}>{title}</div>{hint && <div style={{ fontSize: 13, color: C.MUTED }}>{hint}</div>}</div>
  </div>
);
const CT = [["mcq", "MCQs", C.BLUE], ["short", "Short Questions", C.GREEN], ["long", "Long Questions", "#7A2FBF"]];
const mkBlocks = (tpl) => tpl.map((b) => ({ key: uid(), parts: b.parts.map((p) => ({ key: uid(), marks: String(p.marks), qtype: p.qtype, section: p.section || "" })) }));

const TEST_TITLE = "CLASS TEST";
const testLayout = () => ({ partA: { count: "10", marks: "1", passageSize: "0" }, partB: [{ parts: [{ marks: 5, qtype: "crq" }, { marks: 5, qtype: "crq" }] }] });

export default function GenerateTab({ meta, user, onGenerated }) {
  const admin = user?.role === "admin";
  const [kind, setKind] = useState(admin ? "sba" : "test"); // teachers only make class tests (no PECTAA logo)
  const isTest = kind === "test";
  const [f, setF] = useState({ classNum: "", subject: "", title: admin ? SBA_TITLE : TEST_TITLE, school: SCHOOL_LINE, subjectTitle: "", lang: "en", qr: "", difficulty: "", chapters: [], totalMarks: "" });
  const [partA, setPartA] = useState({ count: "10", marks: "1.5", passageSize: "0" });
  const [partB, setPartB] = useState(mkBlocks([{ parts: [{ marks: 5, qtype: "crq" }, { marks: 5, qtype: "crq" }] }]));
  const [totalTouched, setTotalTouched] = useState(false);
  const [versions, setVersions] = useState(1);
  const [contents, setContents] = useState({ mcq: true, short: true, long: true });
  const [stats, setStats] = useState([]);
  const [avail, setAvail] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const chapters = useMemo(() => sortChapters(stats.length ? stats.map((x) => x.chapter) : (meta?.chapters || {})[`${f.classNum}|${f.subject}`] || []), [stats, meta, f.classNum, f.subject]);
  const statOf = (c) => stats.find((x) => x.chapter === c) || { mcq: 0, short: 0, long: 0 };
  const chosen = f.chapters.length ? f.chapters : chapters;
  const have = (k) => chosen.reduce((t, c) => t + (statOf(c)[k] || 0), 0);
  const subjectOptions = useMemo(() => { const seen = new Map(); [...SUBJECTS, ...(meta?.subjects || [])].forEach((x) => { const k = normSubject(x); if (k && !seen.has(k)) seen.set(k, x); }); return [...seen.values()]; }, [meta]);
  const sections = sectionsFor(f.subject);

  const aTotal = (parseInt(partA.count, 10) || 0) * (Number(partA.marks) || 0);
  const bTotal = partB.reduce((t, b) => t + b.parts.reduce((x, p) => x + (Number(p.marks) || 0), 0), 0);
  const sum = aTotal + bTotal;
  const target = totalTouched ? Number(f.totalMarks) : sum;
  const matches = target > 0 && Math.abs(sum - target) < 0.001;
  const startNo = (parseInt(partA.count, 10) || 0) + 1;

  // choosing class + subject loads that subject's standard paper layout, logo QR and language
  function pick(classNum, subject) {
    const fmtd = formatFor(classNum, subject);
    setContents({ mcq: true, short: true, long: true });
    setF((p) => ({ ...p, classNum, subject, chapters: [], subjectTitle: subject ? fmtd.display : "", lang: fmtd.lang, qr: isTest ? "" : fmtd.qr }));
    if (classNum && subject) { applyLayout(classNum, subject, isTest); }
  }
  function applyLayout(classNum, subject, test) {
    const t = test ? testLayout() : formatFor(classNum, subject).template;
    setPartA({ count: String(t.partA.count), marks: String(t.partA.marks), passageSize: String(t.partA.passageSize) });
    setPartB(mkBlocks(t.partB));
    setTotalTouched(false);
  }
  function chooseKind(k) {
    setKind(k);
    const test = k === "test";
    setF((p) => ({ ...p, title: test ? TEST_TITLE : SBA_TITLE, qr: test || !p.classNum || !p.subject ? "" : formatFor(p.classNum, p.subject).qr }));
    setContents({ mcq: true, short: true, long: true });
    if (f.classNum && f.subject) applyLayout(f.classNum, f.subject, test);
  }

  useEffect(() => {
    setStats([]);
    if (!f.classNum || !f.subject) return;
    let off = false;
    api(`/api/qb/chapter-stats?classNum=${f.classNum}&subject=${encodeURIComponent(f.subject)}`).then((r) => { if (!off) setStats(r.chapters || []); }).catch(() => {});
    return () => { off = true; };
  }, [f.classNum, f.subject]);

  // content buttons: switch MCQs / short / long questions on or off in the layout
  function toggleContent(k) {
    const next = { ...contents, [k]: !contents[k] };
    if (!next.mcq && !next.short && !next.long) return;
    setContents(next);
    if (k === "mcq") {
      const t = (isTest ? testLayout() : formatFor(f.classNum, f.subject).template).partA;
      setPartA((a) => ({ ...a, count: next.mcq ? String(t.count) : "0", passageSize: next.mcq ? String(t.passageSize) : "0" }));
      return;
    }
    setPartB((blocks) => blocks.map((b) => ({ ...b, parts: b.parts.flatMap((p) => {
      if (p.qtype === "crq") return next.short && next.long ? [p] : next.short ? [{ ...p, qtype: "short" }] : next.long ? [{ ...p, qtype: "long" }] : [];
      if (p.qtype === "short" || p.qtype === "long") return next[p.qtype] ? [p] : [];
      return [p];
    }) })).filter((b) => b.parts.length));
  }
  function allContents() {
    setContents({ mcq: true, short: true, long: true });
    if (f.classNum && f.subject) {
      applyLayout(f.classNum, f.subject, isTest);
    }
  }

  // live "N available" for every slot, after a short pause while typing
  const slots = useMemo(() => [
    { id: "A", kind: "mcq", section: "" },
    ...partB.flatMap((b) => b.parts.map((p) => ({ id: p.key, kind: p.qtype, section: p.section || "" }))),
  ], [partB]);
  const availKey = JSON.stringify([f.classNum, f.subject, f.difficulty, f.chapters, slots]);
  useEffect(() => {
    if (!f.classNum || !f.subject) { setAvail({}); return; }
    const t = setTimeout(async () => {
      const out = {};
      await Promise.all(slots.map(async (s) => {
        const qs = new URLSearchParams({ classNum: f.classNum, subject: f.subject, kind: s.kind, section: s.section, difficulty: f.difficulty });
        f.chapters.forEach((c) => qs.append("chapters", c));
        try { out[s.id] = await api(`/api/qb/availability?${qs}`); } catch { out[s.id] = null; }
      }));
      setAvail(out);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [availKey]);

  const updPart = (bk, pk, k, v) => setPartB((a) => a.map((b) => (b.key !== bk ? b : { ...b, parts: b.parts.map((p) => (p.key === pk ? { ...p, [k]: v } : p)) })));
  const addPart = (bk) => setPartB((a) => a.map((b) => (b.key !== bk || b.parts.length >= 8 ? b : { ...b, parts: [...b.parts, { key: uid(), marks: "5", qtype: "crq", section: "" }] })));
  const rmPart = (bk, pk) => setPartB((a) => a.map((b) => (b.key !== bk || b.parts.length < 2 ? b : { ...b, parts: b.parts.filter((p) => p.key !== pk) })));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const body = {
        ...f, totalMarks: String(target), versions, kind,
        partA, partB: partB.map((b) => ({ parts: b.parts.map((p) => ({ marks: p.marks, qtype: p.qtype, section: p.section })) })),
      };
      const r = await api("/api/qb/papers", { method: "POST", body }); onGenerated(r.ids || [r.id]);
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
      <h2 style={{ marginTop: 0 }}>{isTest ? "Make a class test" : "Generate a question paper"}</h2>
      {admin && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" style={big(!isTest, C.NAVY)} onClick={() => chooseKind("sba")}>PECTAA SBA paper<div style={{ fontSize: 12, fontWeight: 600 }}>with PECTAA logo and QR</div></button>
          <button type="button" style={big(isTest, "#B07A00")} onClick={() => chooseKind("test")}>Class test<div style={{ fontSize: 12, fontWeight: 600 }}>no PECTAA logo</div></button>
        </div>
      )}
      {isTest && !admin && <p style={{ color: C.MUTED, marginTop: 0 }}>Pick the class, subject and chapters, then the questions are chosen for you. The test has the school name but no PECTAA logo.</p>}
      <Msg m={msg} />
      <div style={grid()}>
        <div><label style={lbl}>Class</label>
          <select style={inp} value={f.classNum} onChange={(e) => pick(e.target.value, f.subject)} required>
            <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
        <div><label style={lbl}>Subject</label>
          <select style={inp} value={f.subject} onChange={(e) => pick(f.classNum, e.target.value)} required>
            <option value="">Choose…</option>{subjectOptions.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Subject name on paper</label><input style={inp} value={f.subjectTitle} onChange={(e) => set("subjectTitle", e.target.value)} required /></div>
        <div><label style={lbl}>Paper language</label>
          <select style={inp} value={f.lang} onChange={(e) => set("lang", e.target.value)}><option value="en">English (left to right)</option><option value="ur">اردو (right to left)</option></select></div>
      </div>
      <div style={{ ...grid(300), marginTop: 12 }}>
        <div><label style={lbl}>{isTest ? "Test title" : "Assessment title"}</label><input style={inp} value={f.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div><label style={lbl}>School name line</label><input style={inp} value={f.school} onChange={(e) => set("school", e.target.value)} /></div>
      </div>

      {!isTest && (
        <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
          <div style={{ width: 90, height: 90, border: `1px dashed ${C.LINE}`, display: "grid", placeItems: "center", background: "#fff" }}>
            {f.qr ? <img src={f.qr} alt="QR" style={{ width: 84, height: 84, imageRendering: "pixelated" }} /> : <span style={{ color: C.MUTED, fontSize: 12 }}>no QR</span>}
          </div>
          <div style={{ fontSize: 13, color: C.MUTED, maxWidth: 520 }}>
            {f.qr ? "Official PECTAA QR code for this subject (from the Grade 8 sample papers)." : f.classNum && f.subject ? "No QR code is stored for this class and subject." : "The QR code appears when you choose class and subject."}
          </div>
        </div>
      )}

      <div style={grid()}>
        <div><label style={lbl}>Difficulty</label>
          <select style={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="">Any (mixed)</option>{DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></div>
      </div>
      <Step n="1" title="Choose the chapters" hint="Tap one chapter or many. Nothing tapped = questions from every chapter." />
      {!f.classNum || !f.subject ? <p style={{ color: C.MUTED }}>Choose a class and a subject above to see its chapters.</p> : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <button type="button" style={big(f.chapters.length === 0, C.GREEN)} onClick={() => set("chapters", [])}>✓ All chapters</button>
            <button type="button" style={big(false, C.NAVY)} onClick={() => set("chapters", [...chapters])} disabled={!chapters.length}>Select every chapter</button>
            <button type="button" style={big(false, C.RED)} onClick={() => set("chapters", [])}>Clear</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
            {chapters.map((c) => {
              const on = f.chapters.includes(c), st = statOf(c);
              return (
                <button type="button" key={c} style={big(on, C.NAVY)} aria-pressed={on}
                  onClick={() => set("chapters", on ? f.chapters.filter((x) => x !== c) : [...f.chapters, c])}>
                  <div>{on ? "✓ " : ""}{c}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, marginTop: 3 }}>MCQ {st.mcq} · Short {st.short} · Long {st.long}</div>
                </button>
              );
            })}
            {!chapters.length && <span style={{ color: C.MUTED }}>No chapters in the bank for this subject yet.</span>}
          </div>
        </>
      )}

      <Step n="2" title="Choose the contents" hint="Switch on what the paper should contain, taken from the chapters above." />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={big(contents.mcq && contents.short && contents.long, "#B07A00")} onClick={allContents}>All contents</button>
        {CT.map(([k, label, col]) => (
          <button type="button" key={k} style={big(contents[k], col)} aria-pressed={contents[k]} onClick={() => toggleContent(k)}>
            {contents[k] ? "✓ " : ""}{label}
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{f.classNum && f.subject ? `${have(k)} in chosen chapters` : "—"}</div>
          </button>
        ))}
      </div>

      <Step n="3" title="How many versions of the paper?" hint="Each version gets different questions. No question appears in two versions." />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} style={{ ...big(versions === n, C.NAVY), textAlign: "center", minWidth: 96 }} aria-pressed={versions === n} onClick={() => setVersions(n)}>
            {n}<div style={{ fontSize: 12, fontWeight: 600 }}>{n === 1 ? "version" : "versions"}</div>
          </button>
        ))}
      </div>
      {versions > 1 && <p style={{ color: C.MUTED, fontSize: 13, margin: "8px 0 0" }}>Versions are named A–{"ABCDE"[versions - 1]}. You need at least {versions}× the questions of one paper in the chosen chapters.</p>}

      <Step n="4" title="Set the paper layout" hint="Marks and number of questions in each part." />
      <h3>Part A — Objective (MCQs)</h3>
      <div style={{ ...grid(150), border: `1px solid ${C.LINE}`, borderRadius: 10, padding: 12, background: "#FBFCFD" }}>
        <div><label style={lbl}>Number of MCQs</label><input style={inp} type="number" min="0" max="60" value={partA.count} onChange={(e) => setPartA({ ...partA, count: e.target.value })} /></div>
        <div><label style={lbl}>Marks of each MCQ <span style={{ fontWeight: 400, color: C.MUTED }}>(allotted now)</span></label><input style={inp} type="number" step="0.5" min="0.5" value={partA.marks} onChange={(e) => setPartA({ ...partA, marks: e.target.value })} /></div>
        <div><label style={lbl}>Questions from a reading passage</label><input style={inp} type="number" min="0" value={partA.passageSize} onChange={(e) => setPartA({ ...partA, passageSize: e.target.value })} /></div>
        <div style={{ fontSize: 13, paddingBottom: 10 }}><AV id="A" need={((parseInt(partA.count, 10) || 0) - (parseInt(partA.passageSize, 10) || 0)) * versions} passage />
          <div style={{ color: C.MUTED }}>Part A = {fmt(aTotal)} marks</div></div>
      </div>

      <h3>Part B — Subjective (CRQs)</h3>
      <p style={{ color: C.MUTED, fontSize: 13, marginTop: 0 }}>Each question has parts (a, b, c). Give every part its marks here — questions in the bank have no marks of their own. For English and Urdu, choose which section each part draws from.</p>
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
            <div key={p.key} style={{ ...grid(sections.length ? 140 : 120), marginBottom: 6 }}>
              <div style={{ paddingBottom: 10, fontWeight: 700 }}>{b.parts.length > 1 ? ["a", "b", "c", "d", "e", "f", "g", "h"][pj] + " )" : "Part"}</div>
              <div><label style={lbl}>Marks</label><input style={inp} type="number" step="0.5" min="0.5" value={p.marks} onChange={(e) => updPart(b.key, p.key, "marks", e.target.value)} /></div>
              <div><label style={lbl}>Type</label>
                <select style={inp} value={p.qtype} onChange={(e) => updPart(b.key, p.key, "qtype", e.target.value)}>{Object.entries(PART_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              {sections.length > 0 && (
                <div><label style={lbl}>Section</label>
                  <select style={inp} value={p.section || ""} onChange={(e) => updPart(b.key, p.key, "section", e.target.value)}>
                    <option value="">Any section</option>{sections.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
              )}
              <div style={{ paddingBottom: 10, fontSize: 13 }}><AV id={p.key} need={versions} /></div>
              <div style={{ paddingBottom: 6 }}>{b.parts.length > 1 && <button type="button" style={small} onClick={() => rmPart(b.key, p.key)}>Remove</button>}</div>
            </div>
          ))}
        </div>
      ))}
      <p><button type="button" style={btn(false)} onClick={() => setPartB((a) => [...a, { key: uid(), parts: [{ key: uid(), marks: "5", qtype: "crq", section: "" }] }])}>+ Add question</button></p>

      <div style={grid(200)}>
        <div><label style={lbl}>Total marks</label>
          <input style={inp} type="number" step="0.5" min="1" value={totalTouched ? f.totalMarks : String(sum || "")} onChange={(e) => { setTotalTouched(true); set("totalMarks", e.target.value); }} required /></div>
        <div style={{ paddingBottom: 10, color: C.MUTED, fontSize: 13 }}>Leave as is to use Part A + Part B. Type a different total and the paper will only generate when the parts add up to it.</div>
      </div>
      <div style={{ padding: "10px 14px", borderRadius: 10, margin: "10px 0 14px", border: `1.5px solid ${matches ? C.GREEN : C.RED}`, background: matches ? "#E8F6EE" : "#FBEAEA" }}>
        Part A <b>{fmt(aTotal)}</b> + Part B <b>{fmt(bTotal)}</b> = <b>{fmt(sum)}</b> marks · total <b>{target > 0 ? fmt(target) : "–"}</b>
      </div>
      <button style={{ ...big(!busy, C.GREEN), textAlign: "center", width: "100%", fontSize: 18 }} disabled={busy}>{busy ? "Generating…" : versions > 1 ? `Generate ${versions} versions` : "Generate paper"}</button>
    </form>
  );
}
