"use client";
import { useState, useEffect, useCallback } from "react";
import Rich from "./Rich";
import { C, QT, DIFF, CLASSES, card, inp, lbl, btn, small, grid, th, td, Msg, api, fmt } from "./ui";

export default function QuestionsTab({ meta, onEdit, refreshMeta }) {
  const [f, setF] = useState({ classNum: "", subject: "", qtype: "", difficulty: "", search: "", mine: false });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = page, filters = f) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: p });
      Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v === true ? "1" : v); });
      setData(await api(`/api/qb/questions?${qs}`));
      setMsg(null);
    } catch (e) { setMsg({ type: "err", text: e.message }); }
    setLoading(false);
  }, [page, f]);

  useEffect(() => { load(1, f); setPage(1); /* eslint-disable-next-line */ }, [f]);

  async function del(q) {
    if (!window.confirm("Delete this question? Papers already generated keep their copy.")) return;
    try { await api(`/api/qb/questions/${q.id}`, { method: "DELETE" }); load(); refreshMeta(); }
    catch (e) { setMsg({ type: "err", text: e.message }); }
  }
  const go = (p) => { setPage(p); load(p); };
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div>
      <div style={{ ...card, ...grid(140) }}>
        <div><label style={lbl}>Class</label><select style={inp} value={f.classNum} onChange={(e) => set("classNum", e.target.value)}><option value="">All</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
        <div><label style={lbl}>Subject</label><select style={inp} value={f.subject} onChange={(e) => set("subject", e.target.value)}><option value="">All</option>{(meta?.subjects || []).map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Type</label><select style={inp} value={f.qtype} onChange={(e) => set("qtype", e.target.value)}><option value="">All</option>{Object.entries(QT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={lbl}>Difficulty</label><select style={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="">All</option>{DIFF.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div><label style={lbl}>Search</label><input style={inp} value={f.search} onChange={(e) => set("search", e.target.value)} placeholder="words in the question" /></div>
        <label style={{ fontWeight: 400, paddingBottom: 10 }}><input type="checkbox" checked={f.mine} onChange={(e) => set("mine", e.target.checked)} /> Only mine</label>
      </div>
      <Msg m={msg} />
      {data && (
        <>
          <p style={{ color: C.MUTED }}>{data.total} question{data.total === 1 ? "" : "s"}{loading ? " · loading…" : ""}</p>
          {data.rows.length ? (
            <div style={{ ...card, padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>#</th><th style={th}>Class / subject</th><th style={th}>Type</th><th style={th}>Question</th><th style={th}>By</th><th style={th}></th></tr></thead>
                <tbody>
                  {data.rows.map((q) => (
                    <tr key={q.id}>
                      <td style={td}>{q.id}</td>
                      <td style={td}>Class {q.class_num}<br /><span style={{ color: C.MUTED }}>{q.subject}{q.chapter ? ` · ${q.chapter}` : ""}{q.section ? ` · ${q.section}` : ""}</span></td>
                      <td style={td}>{QT[q.qtype]}<br /><span style={{ color: C.MUTED }}>{q.difficulty}</span></td>
                      <td style={{ ...td, maxWidth: 420, whiteSpace: "pre-line" }} dir="auto"><Rich text={q.text} />{q.has_image && <span title="has a picture"> 🖼</span>}{q.passage_id && <span style={{ color: C.MUTED }}> · passage #{q.passage_id}</span>}
                        {q.qtype === "mcq" && <div style={{ fontSize: 13, color: C.MUTED }} dir="auto">{q.opts.map((o, i) => o && <span key={i} style={{ marginRight: 12, ...("ABCD"[i] === q.correct ? { color: C.GREEN, fontWeight: 700 } : {}) }}>{"ABCD"[i]}) <Rich text={o} /></span>)}</div>}
                        {q.qtype === "true_false" && <div style={{ fontSize: 13, color: C.MUTED }}>Answer: {q.correct}</div>}
                      </td>
                      <td style={td}>{q.created_by_name}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {q.canEdit && <><button style={small} onClick={() => onEdit(q)}>Edit</button>{" "}<button style={{ ...small, color: C.RED, borderColor: C.RED }} onClick={() => del(q)}>Delete</button></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: C.MUTED }}>No questions match.</p>}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {page > 1 && <button style={btn(false)} onClick={() => go(page - 1)}>‹ Previous</button>}
            <span style={{ color: C.MUTED }}>Page {data.page} of {data.pages}</span>
            {page < data.pages && <button style={btn(false)} onClick={() => go(page + 1)}>Next ›</button>}
          </div>
        </>
      )}
    </div>
  );
}
