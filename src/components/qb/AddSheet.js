"use client";
// Continuous "question sheet": the teacher picks class and subject once, sets the marks per question
// type once, then keeps scrolling and typing. Every question saves by itself a moment after typing
// stops, numbers continue (Q1, Q2, Q3 ...), and any saved question can be edited by just typing.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Rich from "./Rich";
import { C, QT, TYPE_COLOR, CLASSES, MARK_CHOICES, DIFF, inp, small, btn, Msg, api, fmt, fileToDataUrl } from "./ui";
import { normSubject } from "@/lib/qbFormats";

const BASE_SUBJECTS = ["English", "Urdu", "Mathematics", "Science", "Computer Science", "Islamiat", "History & Geography", "Tarjuma-tul-Quran-ul-Majeed"];
const DEFAULT_MARKS = { mcq: 1, true_false: 1, fill_blank: 1, short: 2, long: 5 };
const NEW = "__new__";

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } },
};

const sel = { ...inp, padding: "8px 10px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const tiny = { display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: C.MUTED, marginBottom: 3 };

const fromRow = (q) => ({
  qtype: q.qtype, chapter: q.chapter || "", difficulty: q.difficulty || "medium", marks: String(+Number(q.marks).toFixed(2)),
  text: q.text || "", opts: [0, 1, 2, 3].map((i) => (q.opts || [])[i] || ""), correct: q.correct || "",
  answer: q.answer || "", image: q.image || "", passageId: q.passage_id ? String(q.passage_id) : "",
});

// what is still missing before a question can be saved ("" = it can be saved)
function missing(n) {
  if (!n.text.trim()) return "type the question";
  if (n.qtype === "mcq") {
    if (!n.opts[0].trim() || !n.opts[1].trim()) return "fill options A and B";
    if (!n.correct) return "choose the correct answer";
    if (!n.opts["ABCD".indexOf(n.correct)].trim()) return "the correct option is empty";
  }
  if (n.qtype === "true_false" && !n.correct) return "choose True or False";
  if (!(Number(n.marks) > 0)) return "choose the marks";
  return "";
}

function Field({ label, children, style }) {
  return <label style={{ display: "block", ...style }}><span style={tiny}>{label}</span>{children}</label>;
}

function AutoText({ value, onChange, placeholder, autoFocus, minRows = 2, style }) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = Math.max(el.scrollHeight + 2, 24 * minRows) + "px"; } }, [value, minRows]);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return <textarea ref={ref} dir="auto" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    style={{ ...inp, resize: "none", overflow: "hidden", lineHeight: 1.5, fontSize: 16, ...style }} />;
}

// ------------------------------------------------------------------ one question
function Card({ cardKey, row, initType, autoFocus, serial, sc, defaults, marks, chapters, passages, highlight, onStarted, onType, onRemove, onPending, onSaved, register }) {
  const init = useMemo(() => (row ? fromRow(row) : {
    qtype: initType, chapter: defaults.chapter, difficulty: defaults.difficulty, marks: String(marks[initType]),
    text: "", opts: ["", "", "", ""], correct: "", answer: "", image: "", passageId: "",
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState(init);
  const fRef = useRef(init);
  const idRef = useRef(row ? row.id : null);
  const [status, setStatus] = useState(row ? "saved" : "idle");
  const [hint, setHint] = useState("");
  const [more, setMore] = useState(!!(row && (row.image || row.passage_id || row.answer)));
  const timer = useRef(null), busy = useRef(false), again = useRef(false), dirty = useRef(false), started = useRef(!!row);
  const scRef = useRef(sc); scRef.current = sc;

  const flush = useCallback(async () => {
    clearTimeout(timer.current); timer.current = null;
    if (busy.current) { again.current = true; return; }
    const cur = fRef.current;
    if (missing(cur)) return;
    busy.current = true; dirty.current = false; setStatus("saving");
    try {
      const body = { ...cur, classNum: scRef.current.classNum, subject: scRef.current.subject };
      if (idRef.current) await api(`/api/qb/questions/${idRef.current}`, { method: "PUT", body });
      else { const r = await api("/api/qb/questions", { method: "POST", body }); idRef.current = r.id; }
      if (!dirty.current) { setStatus("saved"); onPending(cardKey, false); }
      onSaved();
    } catch (e) { setStatus("error"); setHint(e.message); dirty.current = true; }
    busy.current = false;
    if (again.current) { again.current = false; if (dirty.current && !missing(fRef.current)) flush(); }
  }, [cardKey, onPending, onSaved]);

  // lets the page wait for this card to finish saving (used before changing marks etc.)
  useEffect(() => {
    register(cardKey, async () => {
      if (timer.current || (dirty.current && !missing(fRef.current))) await flush();
      for (let i = 0; i < 100 && busy.current; i++) await new Promise((r) => setTimeout(r, 50));
    });
    return () => { register(cardKey, null); if (dirty.current && !missing(fRef.current)) flush(); };
  }, [cardKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (patch) => {
    const n = { ...fRef.current, ...patch };
    fRef.current = n; setF(n); dirty.current = true;
    if (!started.current && n.text.trim()) { started.current = true; onStarted(cardKey); }
    clearTimeout(timer.current); timer.current = null;
    const miss = missing(n);
    if (miss) {
      if (n.text.trim() || idRef.current) { setStatus("invalid"); setHint(miss); onPending(cardKey, true); }
      else { setStatus("idle"); onPending(cardKey, false); }
      return;
    }
    setStatus("dirty"); onPending(cardKey, true);
    timer.current = setTimeout(flush, 900);
  };

  // an untouched blank card follows the chapter / difficulty / marks chosen at the top
  useEffect(() => {
    if (started.current || row) return;
    const n = { ...fRef.current, chapter: defaults.chapter, difficulty: defaults.difficulty, marks: String(marks[fRef.current.qtype]) };
    fRef.current = n; setF(n);
  }, [defaults.chapter, defaults.difficulty, marks]); // eslint-disable-line react-hooks/exhaustive-deps

  const setType = (t) => {
    onType(t);
    edit({ qtype: t, marks: String(marks[t]), correct: t === f.qtype && (t === "mcq" || t === "true_false") ? f.correct : "" });
  };
  async function remove() {
    if (idRef.current) {
      if (!window.confirm("Delete this question? Papers already made keep their own copy.")) return;
      try { await api(`/api/qb/questions/${idRef.current}`, { method: "DELETE" }); } catch (e) { setStatus("error"); setHint(e.message); return; }
      clearTimeout(timer.current); dirty.current = false; onPending(cardKey, false); onSaved();
    } else { clearTimeout(timer.current); dirty.current = false; onPending(cardKey, false); }
    onRemove(cardKey);
  }
  async function pickImage(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try { edit({ image: await fileToDataUrl(file) }); } catch (err) { setStatus("error"); setHint(err.message); }
  }

  const color = TYPE_COLOR[f.qtype];
  const chapterList = f.chapter && !chapters.includes(f.chapter) ? [f.chapter, ...chapters] : chapters;
  const markList = MARK_CHOICES.includes(Number(f.marks)) ? MARK_CHOICES : [...MARK_CHOICES, Number(f.marks)].sort((a, b) => a - b);
  const statusUI = {
    idle: null,
    saved: <span style={{ color: C.GREEN, fontWeight: 700 }}>✓ Saved</span>,
    saving: <span style={{ color: C.MUTED, fontWeight: 700 }}>Saving…</span>,
    dirty: <span style={{ color: C.MUTED, fontWeight: 700 }}>Typing…</span>,
    invalid: <span style={{ color: "#9A5B00", fontWeight: 700 }}>Not saved yet: {hint}</span>,
    error: <span style={{ color: C.RED, fontWeight: 700 }}>⚠ {hint}</span>,
  }[status];

  return (
    <div id={`q-${row ? row.id : cardKey}`} style={{
      background: "#fff", border: `1px solid ${C.LINE}`, borderLeft: `8px solid ${color}`, borderRadius: 14, padding: "14px 16px 16px",
      marginBottom: 16, boxShadow: highlight ? `0 0 0 4px ${C.GOLD}` : "0 2px 10px rgba(21,15,63,.07)",
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 12px", alignItems: "flex-end", marginBottom: 12 }}>
        <div style={{ background: color, color: "#fff", fontWeight: 800, fontSize: 18, borderRadius: 10, padding: "6px 14px", minWidth: 56, textAlign: "center", alignSelf: "center" }}>Q{serial}</div>
        <Field label="Type" style={{ minWidth: 180 }}>
          <select style={{ ...sel, borderColor: color, color }} value={f.qtype} onChange={(e) => setType(e.target.value)}>
            {Object.entries(QT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></Field>
        <Field label="Chapter / topic" style={{ minWidth: 160 }}>
          <select style={sel} value={f.chapter} onChange={(e) => edit({ chapter: e.target.value })}>
            <option value="">— none —</option>{chapterList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></Field>
        <Field label="Difficulty">
          <select style={sel} value={f.difficulty} onChange={(e) => edit({ difficulty: e.target.value })}>
            {DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
          </select></Field>
        <Field label="Marks">
          <select style={{ ...sel, width: 84 }} value={f.marks} onChange={(e) => edit({ marks: e.target.value })}>
            {markList.map((m) => <option key={m} value={String(m)}>{fmt(m)}</option>)}
          </select></Field>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
          {statusUI}
          <button type="button" title="Delete this question" onClick={remove} style={{ ...small, color: C.RED, borderColor: C.RED }}>Delete</button>
        </div>
      </div>

      <AutoText value={f.text} onChange={(v) => edit({ text: v })} autoFocus={autoFocus} minRows={2}
        placeholder={f.qtype === "fill_blank" ? "Type the sentence, use _____ for the blank" : "Type the question here…"} />

      {f.qtype === "mcq" && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
          {["A", "B", "C", "D"].map((L, i) => (
            <div key={L} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, flex: "none", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
                background: f.correct === L ? C.GREEN : C.SOFT, color: f.correct === L ? "#fff" : C.INK, border: `1.5px solid ${f.correct === L ? C.GREEN : "#8A90AE"}` }}>{L}</span>
              <input dir="auto" style={inp} value={f.opts[i]} placeholder={`Option ${L}`} onChange={(e) => edit({ opts: f.opts.map((o, j) => (j === i ? e.target.value : o)) })} />
            </div>
          ))}
          <Field label="Correct answer" style={{ gridColumn: "1 / -1", maxWidth: 220 }}>
            <select style={{ ...sel, borderColor: f.correct ? C.GREEN : "#8A90AE" }} value={f.correct} onChange={(e) => edit({ correct: e.target.value })}>
              <option value="">Choose…</option>{["A", "B", "C", "D"].map((L) => <option key={L} value={L}>Option {L}</option>)}
            </select></Field>
        </div>
      )}
      {f.qtype === "true_false" && (
        <Field label="Correct answer" style={{ marginTop: 10, maxWidth: 220 }}>
          <select style={{ ...sel, borderColor: f.correct ? C.GREEN : "#8A90AE" }} value={f.correct} onChange={(e) => edit({ correct: e.target.value })}>
            <option value="">Choose…</option><option>True</option><option>False</option>
          </select></Field>
      )}

      {(f.text.includes("$") || f.opts.some((o) => o.includes("$"))) && (
        <div style={{ margin: "10px 0 0", padding: "8px 12px", background: C.SOFT, borderRadius: 8, border: `1px dashed ${C.LINE}` }}>
          <span style={tiny}>Maths preview</span>
          <Rich text={f.text} />
          {f.qtype === "mcq" && <div style={{ marginTop: 4 }}>{f.opts.map((o, i) => o && <span key={i} style={{ marginRight: 18 }}>({"abcd"[i]}) <Rich text={o} /></span>)}</div>}
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={() => setMore(!more)} style={{ ...small, borderColor: C.LINE, color: C.MUTED }}>{more ? "▲ Fewer options" : "▼ More: picture, passage, model answer"}</button>
      </div>
      {more && (
        <div style={{ marginTop: 10, padding: 12, background: C.SOFT, borderRadius: 10, display: "grid", gap: 12 }}>
          <Field label="Model answer / marking note (optional, shown in the answer key)">
            <AutoText value={f.answer} onChange={(v) => edit({ answer: v })} minRows={1} style={{ fontSize: 15 }} />
          </Field>
          <div>
            <span style={tiny}>Picture / figure (optional)</span>
            <label style={{ ...small, display: "inline-block" }}>{f.image ? "Change picture" : "Add picture"}
              <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={pickImage} /></label>
            {f.image && <><img src={f.image} alt="" style={{ height: 70, margin: "0 10px", verticalAlign: "middle", border: `1px solid ${C.LINE}`, background: "#fff" }} />
              <button type="button" style={small} onClick={() => edit({ image: "" })}>Remove</button></>}
          </div>
          {f.qtype === "mcq" && (
            <Field label="Reading passage (for MCQs that all refer to one paragraph or poem)" style={{ maxWidth: 420 }}>
              <select style={sel} value={f.passageId} onChange={(e) => edit({ passageId: e.target.value })}>
                <option value="">— none —</option>
                {passages.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.text.slice(0, 55)}</option>)}
              </select></Field>
          )}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------- reading passages
function PassagePanel({ sc, chapter, passages, setPassages }) {
  const [open, setOpen] = useState(false);
  const [np, setNp] = useState(null);
  const [msg, setMsg] = useState(null);
  async function save() {
    try {
      const r = await api("/api/qb/passages", { method: "POST", body: { ...np, classNum: sc.classNum, subject: sc.subject, chapter } });
      setPassages((a) => [r.passage, ...a]); setNp(null); setMsg({ type: "ok", text: "Passage saved. Pick it under “More” on any MCQ." });
    } catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  async function del(p) {
    if (!window.confirm("Delete this passage? Its MCQs stay in the bank but are no longer linked to it.")) return;
    try { await api(`/api/qb/passages/${p.id}`, { method: "DELETE" }); setPassages((a) => a.filter((x) => x.id !== p.id)); }
    catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  async function pick(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (file) try { const image = await fileToDataUrl(file); setNp((x) => ({ ...x, image })); } catch (err) { setMsg({ type: "err", text: err.message }); }
  }
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.LINE}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 800, fontSize: 14, color: C.NAVY, padding: 0 }}>
        {open ? "▼" : "▶"} Reading passages for this subject ({passages.length}) <span style={{ fontWeight: 500, color: C.MUTED }}>— optional, for “read the paragraph and answer” MCQs</span>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <Msg m={msg} />
          {passages.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderTop: `1px solid ${C.LINE}` }}>
              <b>#{p.id}</b><span dir="auto" style={{ flex: 1, fontSize: 14 }}>{p.text.slice(0, 120)}{p.text.length > 120 ? "…" : ""}</span>
              <button type="button" style={{ ...small, color: C.RED, borderColor: C.RED }} onClick={() => del(p)}>Delete</button>
            </div>
          ))}
          {np ? (
            <div style={{ marginTop: 8 }}>
              <span style={tiny}>Instruction (e.g. Read the following poem carefully and answer the questions)</span>
              <input style={inp} dir="auto" value={np.instruction} onChange={(e) => setNp({ ...np, instruction: e.target.value })} />
              <span style={{ ...tiny, marginTop: 8 }}>Passage text</span>
              <AutoText value={np.text} onChange={(v) => setNp({ ...np, text: v })} minRows={4} />
              <div style={{ margin: "8px 0" }}>
                <label style={{ ...small, display: "inline-block" }}>Add a picture<input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={pick} /></label>
                {np.image && <img src={np.image} alt="" style={{ height: 50, marginLeft: 10, verticalAlign: "middle" }} />}
              </div>
              <button type="button" style={btn()} onClick={save}>Save passage</button>{" "}
              <button type="button" style={btn(false)} onClick={() => setNp(null)}>Cancel</button>
            </div>
          ) : <button type="button" style={{ ...small, marginTop: 8 }} onClick={() => setNp({ instruction: "", text: "", image: "" })}>+ New passage</button>}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the sheet
export default function AddSheet({ meta, user, scope, refreshMeta }) {
  const saved = useMemo(() => store.get("qb_setup", {}), []);
  const [classNum, setClassNum] = useState(scope ? String(scope.classNum) : saved.classNum || "");
  const [subject, setSubject] = useState(scope ? scope.subject : saved.subject || "");
  const [chapter, setChapter] = useState(scope ? "" : saved.chapter || "");
  const [difficulty, setDifficulty] = useState(saved.difficulty || "medium");
  const [marks, setMarks] = useState({ ...DEFAULT_MARKS, ...store.get("qb_marks", {}) });
  const [extraSubjects, setExtraSubjects] = useState([]);
  const [extraChapters, setExtraChapters] = useState({});
  const [adding, setAdding] = useState(null); // { what: "subject"|"chapter", value }
  const [cards, setCards] = useState(null);
  const [passages, setPassages] = useState([]);
  const [msg, setMsg] = useState(null);
  const [focusId, setFocusId] = useState(scope ? scope.focusId : null);
  const seq = useRef(0), epoch = useRef(0), loadId = useRef(0), pending = useRef(new Set()), flushers = useRef({}), draftType = useRef("mcq"), metaTimer = useRef(null);

  const sc = useMemo(() => ({ classNum, subject }), [classNum, subject]);
  const scopeKey = `${classNum}|${subject}`;
  const ready = !!(classNum && subject);

  useEffect(() => { store.set("qb_setup", { classNum, subject, chapter, difficulty }); }, [classNum, subject, chapter, difficulty]);
  useEffect(() => { store.set("qb_marks", marks); }, [marks]);
  useEffect(() => {
    const warn = (e) => { if (pending.current.size) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const subjects = useMemo(() => {
    const seen = new Map();
    [...(meta?.subjects || []), ...extraSubjects, ...BASE_SUBJECTS, subject].forEach((s) => { const k = normSubject(s); if (k && !seen.has(k)) seen.set(k, s); });
    return [...seen.values()];
  }, [meta, extraSubjects, subject]);
  const chapters = useMemo(() => [...new Set([...((meta?.chapters || {})[scopeKey] || []), ...(extraChapters[scopeKey] || []), ...(chapter ? [chapter] : [])])].sort(), [meta, extraChapters, scopeKey, chapter]);

  const blank = useCallback((autoFocus = false) => ({ key: `n${++seq.current}`, row: null, type: draftType.current, autoFocus }), []);

  const load = useCallback(async (keepScreen) => {
    if (!ready) { setCards(null); return; }
    const id = ++loadId.current;
    if (!keepScreen) setCards(null);
    try {
      let all = [], page = 1, pages = 1;
      do {
        const qs = new URLSearchParams({ page, classNum, subject });
        if (user.role !== "admin") qs.set("mine", "1");
        const r = await api(`/api/qb/questions?${qs}`);
        all = all.concat(r.rows); pages = r.pages; page++;
      } while (page <= pages && page <= 40);
      all.sort((a, b) => a.id - b.id);
      await Promise.all(all.filter((q) => q.has_image).map(async (q) => { try { q.image = (await api(`/api/qb/questions/${q.id}`)).question.image || ""; } catch { /* keep going */ } }));
      if (id !== loadId.current) return;
      epoch.current++;
      draftType.current = all.length ? all[all.length - 1].qtype : draftType.current;
      setCards([...all.map((r) => ({ key: `e${epoch.current}-q${r.id}`, row: r })), blank()]);
      setMsg(null);
    } catch (e) { if (id === loadId.current) setMsg({ type: "err", text: e.message }); }
  }, [ready, classNum, subject, user.role, blank]);

  useEffect(() => { load(false); }, [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ready) { setPassages([]); return; }
    api(`/api/qb/passages?classNum=${classNum}&subject=${encodeURIComponent(subject)}`).then((r) => setPassages(r.passages)).catch(() => setPassages([]));
  }, [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (focusId && cards) { const el = document.getElementById(`q-${focusId}`); if (el) el.scrollIntoView({ block: "center" }); const t = setTimeout(() => setFocusId(null), 3500); return () => clearTimeout(t); }
  }, [focusId, cards && cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPending = useCallback((key, on) => { if (on) pending.current.add(key); else pending.current.delete(key); }, []);
  const register = useCallback((key, fn) => { if (fn) flushers.current[key] = fn; else delete flushers.current[key]; }, []);
  const onSaved = useCallback(() => { clearTimeout(metaTimer.current); metaTimer.current = setTimeout(() => refreshMeta && refreshMeta(), 1500); }, [refreshMeta]);
  const onType = useCallback((t) => { draftType.current = t; }, []);
  const onStarted = useCallback((key) => setCards((c) => (c && c[c.length - 1].key === key ? [...c, blank()] : c)), [blank]);
  const onRemove = useCallback((key) => setCards((c) => {
    const rest = c.filter((x) => x.key !== key);
    return rest.length && !rest[rest.length - 1].row && !pending.current.has(rest[rest.length - 1].key) ? rest : [...rest, blank()];
  }), [blank]);
  const flushAll = () => Promise.all(Object.values(flushers.current).map((fn) => fn()));

  async function changeMarks(t, v) {
    const m = Number(v);
    setMarks((x) => ({ ...x, [t]: m }));
    if (!ready) return;
    if (window.confirm(`Marks for ${QT[t]} are now ${fmt(m)}.\n\nAlso change the marks of the ${QT[t]} questions you already saved in this class and subject to ${fmt(m)}?\n\nOK = change them too.  Cancel = only new questions.`)) {
      try {
        await flushAll();
        await api("/api/qb/marks", { method: "POST", body: { classNum, subject, qtype: t, marks: m } });
        await load(true);
        setMsg({ type: "ok", text: `All ${QT[t]} questions here now carry ${fmt(m)} marks.` });
      } catch (e) { setMsg({ type: "err", text: e.message }); }
    }
  }

  function confirmNew() {
    const v = (adding.value || "").trim().replace(/\s+/g, " ").slice(0, adding.what === "subject" ? 60 : 100);
    if (v) {
      if (adding.what === "subject") { setExtraSubjects((a) => [...a, v]); setSubject(v); setChapter(""); }
      else { setExtraChapters((m) => ({ ...m, [scopeKey]: [...(m[scopeKey] || []), v] })); setChapter(v); }
    }
    setAdding(null);
  }

  const savedCount = cards ? cards.filter((c) => c.row).length : 0;
  const stickyBox = { background: "#fff", border: `1px solid ${C.LINE}`, borderTop: `4px solid ${C.GOLD}`, borderRadius: 14, padding: "12px 16px 14px", boxShadow: "0 4px 18px rgba(21,15,63,.12)" };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: "@media(min-width:900px){.qb-sticky{position:sticky;top:8px;z-index:30}}" }} />
      <div className="qb-sticky" style={{ ...stickyBox, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", alignItems: "flex-end" }}>
          <Field label="1 · Class">
            <select style={{ ...sel, width: 120 }} value={classNum} onChange={(e) => { setClassNum(e.target.value); setChapter(""); }}>
              <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select></Field>
          <Field label="2 · Subject">
            <select style={{ ...sel, minWidth: 210 }} value={adding?.what === "subject" ? NEW : subject}
              onChange={(e) => { if (e.target.value === NEW) setAdding({ what: "subject", value: "" }); else { setAdding(null); setSubject(e.target.value); setChapter(""); } }}>
              <option value="">Choose…</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}<option value={NEW}>+ Add a new subject…</option>
            </select></Field>
          <Field label="3 · Chapter / topic">
            <select style={{ ...sel, minWidth: 190 }} value={adding?.what === "chapter" ? NEW : chapter} disabled={!ready}
              onChange={(e) => { if (e.target.value === NEW) setAdding({ what: "chapter", value: "" }); else { setAdding(null); setChapter(e.target.value); } }}>
              <option value="">— none —</option>{chapters.map((c) => <option key={c} value={c}>{c}</option>)}<option value={NEW}>+ Add a new chapter…</option>
            </select></Field>
          <Field label="Difficulty">
            <select style={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
            </select></Field>
          {adding && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <Field label={`New ${adding.what}`}><input style={{ ...sel, fontWeight: 500, width: 220 }} autoFocus dir="auto" value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmNew(); } }} /></Field>
              <button type="button" style={btn()} onClick={confirmNew}>Add</button>
              <button type="button" style={btn(false)} onClick={() => setAdding(null)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ ...stickyBox, borderTop: `1px solid ${C.LINE}`, boxShadow: "none", marginBottom: 16 }}>
        <div>
          <span style={{ ...tiny, marginBottom: 6 }}>Marks per question type — set once, used automatically for every question of that type</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(QT).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, border: `2px solid ${TYPE_COLOR[k]}`, borderRadius: 10, padding: "4px 6px 4px 12px", background: "#fff" }}>
                <b style={{ color: TYPE_COLOR[k], fontSize: 13 }}>{v}</b>
                <select style={{ ...sel, width: 78, padding: "5px 8px" }} value={String(marks[k])} onChange={(e) => changeMarks(k, e.target.value)}>
                  {(MARK_CHOICES.includes(marks[k]) ? MARK_CHOICES : [...MARK_CHOICES, marks[k]].sort((a, b) => a - b)).map((m) => <option key={m} value={String(m)}>{fmt(m)}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Msg m={msg} />
      {!ready && (
        <div style={{ background: "#fff", border: `2px dashed ${C.LINE}`, borderRadius: 14, padding: 36, textAlign: "center", color: C.MUTED, fontSize: 16 }}>
          <b style={{ color: C.NAVY, fontSize: 18 }}>Start here ↑</b><br />Choose the <b>class</b> and <b>subject</b>. Your questions appear below and everything you type is saved automatically.
        </div>
      )}
      {ready && !cards && !msg && <p style={{ color: C.MUTED }}>Loading…</p>}
      {ready && cards && (
        <>
          <p style={{ margin: "0 0 12px", color: C.MUTED }}>
            <b style={{ color: C.NAVY }}>Class {classNum} · {subject}</b> — {savedCount} question{savedCount === 1 ? "" : "s"} saved. Keep typing in the last card; a new one appears by itself.
          </p>
          <PassagePanel sc={sc} chapter={chapter} passages={passages} setPassages={setPassages} />
          {cards.map((c, i) => (
            <Card key={c.key} cardKey={c.key} row={c.row} initType={c.type} autoFocus={c.autoFocus} serial={i + 1} sc={sc}
              defaults={{ chapter, difficulty }} marks={marks} chapters={chapters} passages={passages} highlight={!!c.row && c.row.id === focusId}
              onStarted={onStarted} onType={onType} onRemove={onRemove} onPending={onPending} onSaved={onSaved} register={register} />
          ))}
          <button type="button" style={{ ...btn(), width: "100%", padding: "14px", fontSize: 16 }}
            onClick={() => {
              const last = cards[cards.length - 1];
              if (last && !last.row && !pending.current.has(last.key)) { // an empty card is already waiting: jump to it
                const el = document.getElementById(`q-${last.key}`);
                if (el) { el.scrollIntoView({ block: "center" }); el.querySelector("textarea")?.focus(); }
              } else setCards((c) => [...c, blank(true)]);
            }}>
            + Add another question
          </button>
          <p style={{ color: C.MUTED, fontSize: 13, textAlign: "center" }}>Nothing to press “Save” — each question saves about a second after you stop typing.</p>
        </>
      )}
    </div>
  );
}
