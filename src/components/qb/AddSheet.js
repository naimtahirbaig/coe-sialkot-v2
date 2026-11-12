"use client";
// Continuous "question sheet": the teacher picks class, subject and chapter once, then keeps scrolling and typing. Every question saves by itself a moment after typing
// stops, numbers continue (Q1, Q2, Q3 ...), and any saved question can be edited by just typing.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Rich from "./Rich";
import { C, TYPE_COLOR, CLASSES, DIFF, inp, small, btn, Msg, api, fileToDataUrl } from "./ui";
import { normSubject, SUBJECTS, QTYPE_LABEL, typesFor, sectionsFor, chapterLabel, parseChapter, sortChapters } from "@/lib/qbFormats";
import { parseBulk } from "@/lib/qbPaste";


const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } },
};

const sel = { ...inp, padding: "8px 10px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const tiny = { display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: C.MUTED, marginBottom: 3 };

const fromRow = (q) => ({
  qtype: q.qtype, chapter: q.chapter || "", section: q.section || "", difficulty: q.difficulty || "medium",
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
function Card({ cardKey, row, initType, preset, autoFocus, serial, sc, defaults, chapters, passages, highlight, onStarted, onType, onRemove, onPending, onSaved, register }) {
  const init = useMemo(() => (row ? fromRow(row) : {
    qtype: initType, chapter: defaults.chapter, section: defaults.section, difficulty: defaults.difficulty,
    text: "", opts: ["", "", "", ""], correct: "", answer: "", image: "", passageId: "", ...(preset || {}),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState(init);
  const fRef = useRef(init);
  const idRef = useRef(row ? row.id : null);
  const [status, setStatus] = useState(row ? "saved" : preset ? "dirty" : "idle");
  const [hint, setHint] = useState("");
  const [more, setMore] = useState(!!(row && (row.image || row.passage_id || row.answer)));
  const timer = useRef(null), busy = useRef(false), again = useRef(false), dirty = useRef(!!preset), started = useRef(!!row || !!preset);
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

  // lets the page wait for this card to finish saving (used before leaving the page)
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

  // cards made by "Paste many" save themselves (or say what is missing)
  useEffect(() => {
    if (!preset) return;
    const miss = missing(fRef.current);
    if (miss) { setStatus("invalid"); setHint(miss); onPending(cardKey, true); }
    else { onPending(cardKey, true); timer.current = setTimeout(flush, preset.delay || 200); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // an untouched blank card follows the chapter / section / difficulty chosen at the top
  useEffect(() => {
    if (started.current || row) return;
    const n = { ...fRef.current, chapter: defaults.chapter, section: defaults.section, difficulty: defaults.difficulty };
    fRef.current = n; setF(n);
  }, [defaults.chapter, defaults.section, defaults.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const setType = (t) => {
    onType(t);
    edit({ qtype: t, correct: t === f.qtype && (t === "mcq" || t === "true_false") ? f.correct : "" });
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
  const sections = sectionsFor(sc.subject);
  const typeList = typesFor(sc.subject);
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
            {(typeList.includes(f.qtype) ? typeList : [...typeList, f.qtype]).map((k) => <option key={k} value={k}>{QTYPE_LABEL[k]}</option>)}
          </select></Field>
        {sections.length > 0 && (
          <Field label="Section" style={{ minWidth: 220 }}>
            <select style={sel} value={f.section} onChange={(e) => edit({ section: e.target.value })}>
              <option value="">— none —</option>{(f.section && !sections.includes(f.section) ? [f.section, ...sections] : sections).map((x) => <option key={x} value={x}>{x}</option>)}
            </select></Field>
        )}
        <Field label="Chapter" style={{ minWidth: 160 }}>
          <select style={sel} value={f.chapter} onChange={(e) => edit({ chapter: e.target.value })}>
            <option value="">— none —</option>{chapterList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></Field>
        <Field label="Difficulty">
          <select style={sel} value={f.difficulty} onChange={(e) => edit({ difficulty: e.target.value })}>
            {DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
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
  const startCh = scope ? { no: "", name: "" } : parseChapter(saved.chapter || "");
  const [chNo, setChNo] = useState(startCh.no);
  const [chName, setChName] = useState(startCh.name);
  const [section, setSection] = useState(scope ? "" : saved.section || "");
  const [difficulty, setDifficulty] = useState(saved.difficulty || "medium");
  const [cards, setCards] = useState(null);
  const [passages, setPassages] = useState([]);
  const [msg, setMsg] = useState(null);
  const [focusId, setFocusId] = useState(scope ? scope.focusId : null);
  const [paste, setPaste] = useState({ open: false, qtype: "mcq", text: "", oneLine: undefined });
  const seq = useRef(0), epoch = useRef(0), loadId = useRef(0), pending = useRef(new Set()), flushers = useRef({}), draftType = useRef("mcq"), metaTimer = useRef(null);

  const chapter = chapterLabel(chNo, chName);
  const sc = useMemo(() => ({ classNum, subject }), [classNum, subject]);
  const scopeKey = `${classNum}|${subject}`;
  const ready = !!(classNum && subject);
  const sections = sectionsFor(subject);
  const typeList = typesFor(subject);

  useEffect(() => { store.set("qb_setup", { classNum, subject, chapter, section, difficulty }); }, [classNum, subject, chapter, section, difficulty]);
  useEffect(() => {
    const warn = (e) => { if (pending.current.size) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const subjects = useMemo(() => {
    const seen = new Map();
    [...SUBJECTS, ...(meta?.subjects || []), subject].forEach((x) => { const k = normSubject(x); if (k && !seen.has(k)) seen.set(k, x); });
    return [...seen.values()];
  }, [meta, subject]);
  const chapters = useMemo(() => sortChapters([...new Set([...((meta?.chapters || {})[scopeKey] || []), ...(chapter ? [chapter] : [])])]), [meta, scopeKey, chapter]);
  const chapterNames = useMemo(() => [...new Set(chapters.map((c) => parseChapter(c).name).filter(Boolean))], [chapters]);

  function pickChapterNo(v) {
    setChNo(v);
    const hit = chapters.map(parseChapter).find((c) => c.no && c.no === v.trim());
    if (hit && !chName.trim()) setChName(hit.name);
  }
  function pickChapterName(v) {
    setChName(v);
    const hit = chapters.map(parseChapter).find((c) => c.name && c.name === v.trim());
    if (hit && !chNo.trim()) setChNo(hit.no);
  }

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
      if (all.length && typesFor(subject).includes(all[all.length - 1].qtype)) draftType.current = all[all.length - 1].qtype;
      setCards([...all.map((r) => ({ key: `e${epoch.current}-q${r.id}`, row: r })), blank()]);
      setMsg(null);
    } catch (e) { if (id === loadId.current) setMsg({ type: "err", text: e.message }); }
  }, [ready, classNum, subject, user.role, blank]);

  useEffect(() => {
    setSection((x) => (sectionsFor(subject).includes(x) ? x : ""));
    if (!typesFor(subject).includes(draftType.current)) draftType.current = "mcq";
    setPaste((p) => ({ ...p, qtype: typesFor(subject).includes(p.qtype) ? p.qtype : "mcq" }));
    load(false);
  }, [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps
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

  const savedCount = cards ? cards.filter((c) => c.row).length : 0;
  const stickyBox = { background: "#fff", border: `1px solid ${C.LINE}`, borderTop: `4px solid ${C.GOLD}`, borderRadius: 14, padding: "12px 16px 14px", boxShadow: "0 4px 18px rgba(21,15,63,.12)" };

  const pasted = useMemo(() => (paste.open ? parseBulk(paste.text, paste.qtype, paste.oneLine) : []), [paste.open, paste.text, paste.qtype, paste.oneLine]);
  const needAnswer = pasted.filter((q) => (q.qtype === "mcq" && (!q.correct || !q.opts["ABCD".indexOf(q.correct)] || !q.opts[0] || !q.opts[1])) || (q.qtype === "true_false" && !q.correct)).length;
  function addPasted() {
    if (!pasted.length) return;
    const items = pasted.map((q, i) => ({
      key: `n${++seq.current}`, row: null, type: q.qtype,
      preset: { ...q, chapter, section, difficulty, delay: 150 + i * 160 },
    }));
    draftType.current = paste.qtype;
    setCards((c) => [...c.slice(0, -1), ...items, c[c.length - 1]]);
    setPaste((p) => ({ ...p, text: "", open: false }));
    setMsg({ type: "ok", text: `${items.length} question${items.length === 1 ? "" : "s"} added below. They save by themselves${needAnswer ? `; ${needAnswer} still need the correct answer (choose it from the dropdown)` : ""}.` });
    setTimeout(() => document.getElementById(`q-${items[0].key}`)?.scrollIntoView({ block: "start", behavior: "smooth" }), 250);
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: "@media(min-width:900px){.qb-sticky{position:sticky;top:8px;z-index:30}}" }} />
      <div className="qb-sticky" style={{ ...stickyBox, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", alignItems: "flex-end" }}>
          <Field label="1 · Class">
            <select style={{ ...sel, width: 120 }} value={classNum} onChange={(e) => { setClassNum(e.target.value); setChNo(""); setChName(""); }}>
              <option value="">Choose…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select></Field>
          <Field label="2 · Subject">
            <select style={{ ...sel, minWidth: 220 }} value={subject} onChange={(e) => { setSubject(e.target.value); setChNo(""); setChName(""); }}>
              <option value="">Choose…</option>{subjects.map((x) => <option key={x} value={x}>{x}</option>)}
            </select></Field>
          {sections.length > 0 && (
            <Field label="Section">
              <select style={{ ...sel, minWidth: 240 }} value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">— none —</option>{sections.map((x) => <option key={x} value={x}>{x}</option>)}
              </select></Field>
          )}
          <Field label="3 · Chapter No.">
            <input style={{ ...sel, fontWeight: 500, width: 84 }} inputMode="numeric" maxLength={8} placeholder="e.g. 3" value={chNo} disabled={!ready} onChange={(e) => pickChapterNo(e.target.value)} /></Field>
          <Field label="Chapter name">
            <input style={{ ...sel, fontWeight: 500, width: 250 }} list="qb-chapter-names" maxLength={80} placeholder="e.g. Parts of Speech" dir="auto" value={chName} disabled={!ready} onChange={(e) => pickChapterName(e.target.value)} />
            <datalist id="qb-chapter-names">{chapterNames.map((x) => <option key={x} value={x} />)}</datalist></Field>
          <Field label="Difficulty">
            <select style={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFF.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
            </select></Field>
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
          <div style={{ background: "#fff", border: `2px solid ${C.NAVY}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
            <button type="button" onClick={() => setPaste((p) => ({ ...p, open: !p.open }))}
              style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 800, fontSize: 15, color: C.NAVY, padding: 0 }}>
              {paste.open ? "▼" : "▶"} Paste many questions at once <span style={{ fontWeight: 500, color: C.MUTED }}>— type or paste 10, 20 or more of the same type</span>
            </button>
            {paste.open && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", alignItems: "flex-end", marginBottom: 8 }}>
                  <Field label="Type of all these questions">
                    <select style={{ ...sel, minWidth: 200, borderColor: TYPE_COLOR[paste.qtype], color: TYPE_COLOR[paste.qtype] }} value={paste.qtype} onChange={(e) => setPaste({ ...paste, qtype: e.target.value })}>
                      {typeList.map((k) => <option key={k} value={k}>{QTYPE_LABEL[k]}</option>)}
                    </select></Field>
                  <div style={{ fontSize: 14, color: C.MUTED, paddingBottom: 8 }}>Added to <b style={{ color: C.NAVY }}>Class {classNum} · {subject}</b>{chapter ? <> · <b style={{ color: C.NAVY }}>{chapter}</b></> : ""}{section ? <> · <b style={{ color: C.NAVY }}>{section}</b></> : ""}</div>
                </div>
                <textarea dir="auto" value={paste.text} onChange={(e) => setPaste({ ...paste, text: e.target.value })} rows={9}
                  placeholder={paste.qtype === "mcq"
                    ? "1. Which word is a noun?\na) run\nb) table*\nc) quickly\nd) and\n\n2. Choose the verb:\n(a) happy (b) jump (c) blue (d) very\nAnswer: B"
                    : "1. Define a noun.\n2. What is a pronoun? Give two examples.\n3. Name the three tenses."}
                  style={{ ...inp, fontSize: 15, lineHeight: 1.5, fontFamily: "inherit" }} />
                <div style={{ fontSize: 13, color: C.MUTED, margin: "6px 0 10px" }}>
                  {paste.qtype === "mcq" ? "Put each question after a blank line (or number it). Options start with a) b) c) d). Mark the right option with * at its end, or add a line “Answer: B”." : "Put each question on its own line, or after a blank line, or number it 1. 2. 3. A line “Answer: …” becomes the model answer."}
                  {paste.qtype !== "mcq" && <label style={{ marginLeft: 12 }}><input type="checkbox" checked={paste.oneLine === undefined ? pasted.length > 1 && !paste.text.includes("\n\n") : paste.oneLine} onChange={(e) => setPaste({ ...paste, oneLine: e.target.checked })} /> every line is a separate question</label>}
                </div>
                {paste.text.trim() && (
                  <div style={{ background: C.SOFT, border: `1px solid ${C.LINE}`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, maxHeight: 220, overflow: "auto" }}>
                    <b style={{ color: C.NAVY }}>{pasted.length} question{pasted.length === 1 ? "" : "s"} found</b>
                    {needAnswer > 0 && <span style={{ color: "#9A5B00", fontWeight: 700 }}> · {needAnswer} without a correct answer yet (you can choose it after adding)</span>}
                    <ol style={{ margin: "6px 0 0", paddingLeft: 22, fontSize: 14 }}>
                      {pasted.map((q, i) => <li key={i} dir="auto" style={{ marginBottom: 3 }}>{q.text.split("\n")[0].slice(0, 110)}{q.qtype === "mcq" && <span style={{ color: C.MUTED }}> — {q.opts.filter(Boolean).length} options{q.correct ? `, answer ${q.correct}` : ", no answer"}</span>}</li>)}
                    </ol>
                  </div>
                )}
                <button type="button" style={btn(pasted.length > 0)} disabled={!pasted.length} onClick={addPasted}>Add {pasted.length || ""} question{pasted.length === 1 ? "" : "s"} to the sheet</button>
              </div>
            )}
          </div>
          <PassagePanel sc={sc} chapter={chapter} passages={passages} setPassages={setPassages} />
          {cards.map((c, i) => (
            <Card key={c.key} cardKey={c.key} row={c.row} initType={c.type} preset={c.preset} autoFocus={c.autoFocus} serial={i + 1} sc={sc}
              defaults={{ chapter, section, difficulty }} chapters={chapters} passages={passages} highlight={!!c.row && c.row.id === focusId}
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
