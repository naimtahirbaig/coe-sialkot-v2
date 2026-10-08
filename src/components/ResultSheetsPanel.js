"use client";

import { useState, useEffect, useRef } from "react";
import { examLabel } from "@/lib/awardListExams";
import { loadImage } from "@/lib/resultCardRenderer";
import { PAGE_W, PAGE_H, buildUnits, resultPages, summaryPages, comparisonPages } from "@/lib/resultSheets";

const NAVY = "#150F3F";
const GOLD = "#FCB629";

// Admin-only download centre on the Exams page.
//   Section-wise Results — one page per section, every student × every subject
//   Class-wise Results   — each class together, in merit order
//   Summary Sheet        — students / passed / average / grades per section or class
//   Comparison Sheet     — subject-wise averages side by side + overall ranking
// Choose any sections, whole classes, or everything, then download one PDF.

const RES = {
  std:   { label: "Standard (small file)", scale: 1.5 },
  print: { label: "Print 300 DPI", scale: 2 },
  "4k":  { label: "4K (largest)", scale: 3.0968 },
};

export default function ResultSheetsPanel() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [level, setLevel] = useState("section");
  const [style, setStyle] = useState("colour");
  const [res, setRes] = useState("std");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const logosRef = useRef(null);

  useEffect(() => {
    if (!open || exams.length) return;
    fetch("/api/award-list/exams").then((r) => r.json()).then((d) => {
      setExams(d.exams || []);
      if (d.current) setExamId(d.current.id);
    }).catch(() => setError("Could not load exams."));
  }, [open, exams.length]);

  async function load() {
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch("/api/award-list/results-data", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: pw, examId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load");
      setData(d);
      setSelected(new Set(d.classes.flatMap((c) => c.sections.map((s) => s.code))));
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const toggle = (code) => setSelected((p) => { const n = new Set(p); n.has(code) ? n.delete(code) : n.add(code); return n; });
  const classCodes = (c) => c.sections.map((s) => s.code);
  const toggleClass = (c) => setSelected((p) => {
    const n = new Set(p); const all = classCodes(c).every((x) => n.has(x));
    classCodes(c).forEach((x) => (all ? n.delete(x) : n.add(x))); return n;
  });
  const allCodes = data ? data.classes.flatMap(classCodes) : [];

  async function getLogos() {
    if (logosRef.current) return logosRef.current;
    const [authority, punjab] = await Promise.all([loadImage("/coe-logo.png"), loadImage("/punjab-logo.png")]);
    return (logosRef.current = { authority, punjab });
  }

  async function makePdf(kind, lvl) {
    if (!data || selected.size === 0) { setError("Select at least one section."); return; }
    setError("");
    try {
      const units = buildUnits(data, [...selected], lvl);
      const pages =
        kind === "results" ? resultPages(data, units)
        : kind === "summary" ? summaryPages(data, units, lvl)
        : comparisonPages(data, units, lvl);
      if (!pages.length) throw new Error("Nothing to print for that selection.");
      const logos = await getLogos();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pw2 = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const scale = RES[res].scale;
      for (let i = 0; i < pages.length; i++) {
        setBusy(`Building PDF… page ${i + 1} of ${pages.length}`);
        const cv = document.createElement("canvas");
        cv.width = Math.round(PAGE_W * scale); cv.height = Math.round(PAGE_H * scale);
        const ctx = cv.getContext("2d"); ctx.scale(scale, scale);
        pages[i].draw(ctx, { style, logos });
        if (i) pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw2, ph);
        cv.width = 0; cv.height = 0;
        await new Promise((r) => setTimeout(r, 0));
      }
      const tag = { results: lvl === "class" ? "Class-wise-Results" : "Section-wise-Results", summary: `Summary-${lvl}-wise`, comparison: `Comparison-${lvl}-wise` }[kind];
      const stem = data.examLine.replace(/[^\w]+/g, "-");
      pdf.save(`${tag}-${stem}.pdf`);
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  const input = "rounded-lg px-3 py-2.5 text-white border outline-none";
  const inStyle = { background: NAVY, borderColor: "#ffffff26" };
  const btn = (bg, color = NAVY) => ({ background: bg, color });
  const nSel = selected.size;

  return (
    <section className="mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: GOLD }}>Result sheets</h2>
      <p className="text-xs text-white/50 mb-3">
        One-page results, summary and comparison sheets for any sections, classes or the whole school. Admin password required.
      </p>

      {!open ? (
        <button onClick={() => setOpen(true)}
                className="w-full text-left rounded-xl px-4 py-3 border transition hover:brightness-125"
                style={{ borderColor: "#ffffff1a", background: "#ffffff06" }}>
          <div className="font-semibold">Open result sheets &rarr;</div>
          <div className="text-xs text-white/50">Section-wise · Class-wise · Summary · Comparison — PDF</div>
        </button>
      ) : (
        <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: `${GOLD}33`, background: "#ffffff06" }}>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Admin password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                     name="rs-admin" autoComplete="off" data-1p-ignore data-lpignore="true"
                     className={`${input} w-52`} style={inStyle} />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Exam</label>
              <select className={input} style={inStyle} value={examId} onChange={(e) => { setExamId(e.target.value); setData(null); }}>
                {exams.map((e) => <option key={e.id} value={e.id}>{examLabel(e)}</option>)}
              </select>
            </div>
            <button onClick={load} disabled={!pw || !examId || loading}
                    className="font-bold px-5 py-2.5 rounded-lg disabled:opacity-40" style={btn(GOLD)}>
              {loading ? "Loading…" : data ? "Reload" : "Unlock"}
            </button>
          </div>

          {error && <div className="px-4 py-3 rounded-lg border text-sm bg-red-500/10 border-red-500/40 text-red-300">{error}</div>}

          {data && (
            <>
              <div>
                <div className="flex items-center gap-4 mb-2 text-sm">
                  <span className="font-bold" style={{ color: GOLD }}>Choose sections</span>
                  <button className="underline" style={{ color: GOLD }} onClick={() => setSelected(new Set(allCodes))}>All</button>
                  <button className="underline" style={{ color: GOLD }} onClick={() => setSelected(new Set())}>None</button>
                  <span className="text-xs text-white/50">{nSel} of {allCodes.length} selected</span>
                </div>
                <div className="space-y-2">
                  {data.classes.map((c) => {
                    const all = classCodes(c).every((x) => selected.has(x));
                    return (
                      <div key={c.class} className="flex flex-wrap items-center gap-2">
                        <button onClick={() => toggleClass(c)}
                                className="text-sm font-bold rounded-lg px-3 py-1.5 border w-24"
                                style={all ? { background: GOLD, color: NAVY, borderColor: GOLD } : { color: GOLD, borderColor: `${GOLD}55` }}>
                          Class {c.class}
                        </button>
                        {c.sections.map((s) => (
                          <button key={s.code} onClick={() => toggle(s.code)}
                                  className="text-xs rounded-full px-3 py-1.5 border"
                                  style={selected.has(s.code)
                                    ? { background: "#ffffff22", borderColor: "#ffffffaa", color: "#fff" }
                                    : { borderColor: "#ffffff22", color: "#ffffff77" }}>
                            {s.name} <span className="opacity-60">({s.students.length})</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Style</label>
                  <div className="flex gap-2">
                    {[["colour", "Colourful"], ["ink", "Ink-friendly"]].map(([v, l]) => (
                      <button key={v} onClick={() => setStyle(v)} className="text-sm font-semibold px-3 py-2 rounded-lg border"
                              style={style === v ? { background: GOLD, color: NAVY, borderColor: GOLD } : { color: GOLD, borderColor: `${GOLD}55` }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Quality</label>
                  <select className={input} style={inStyle} value={res} onChange={(e) => setRes(e.target.value)}>
                    {Object.entries(RES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Summary &amp; comparison by</label>
                  <div className="flex gap-2">
                    {[["section", "Sections"], ["class", "Classes"]].map(([v, l]) => (
                      <button key={v} onClick={() => setLevel(v)} className="text-sm font-semibold px-3 py-2 rounded-lg border"
                              style={level === v ? { background: GOLD, color: NAVY, borderColor: GOLD } : { color: GOLD, borderColor: `${GOLD}55` }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button disabled={!!busy || !nSel} onClick={() => makePdf("results", "section")}
                        className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn("#1DB954")}>
                  Section-wise Results
                  <span className="block text-xs font-normal opacity-80">One page per section · all students, all subjects</span>
                </button>
                <button disabled={!!busy || !nSel} onClick={() => makePdf("results", "class")}
                        className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn("#1DB954")}>
                  Class-wise Results
                  <span className="block text-xs font-normal opacity-80">Whole class together · merit order</span>
                </button>
                <button disabled={!!busy || !nSel} onClick={() => makePdf("summary", level)}
                        className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn(GOLD)}>
                  Summary Sheet
                  <span className="block text-xs font-normal opacity-80">Passed · averages · grades · top student</span>
                </button>
                <button disabled={!!busy || !nSel} onClick={() => makePdf("comparison", level)}
                        className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn(GOLD)}>
                  Comparison Sheet
                  <span className="block text-xs font-normal opacity-80">Subject-wise averages · overall ranking</span>
                </button>
              </div>

              {busy && (
                <div className="rounded-lg px-4 py-3 text-sm border" style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}14` }}>{busy}</div>
              )}
              <p className="text-[11px] text-white/40 leading-relaxed">
                Built in your browser from live marks, so nothing is uploaded. Pass mark 40%. Positions are across the whole class.
                Many pages at 4K make a big file — Standard is sharp enough for screen and print.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
