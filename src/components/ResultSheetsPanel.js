"use client";

import { useState, useEffect, useRef } from "react";
import { examLabel } from "@/lib/awardListExams";
import { loadImage, drawResultCard } from "@/lib/resultCardRenderer";
import { BASE_W, BASE_H } from "@/lib/resultCardConfig";
import { findWarnings, drawWarningLetter, reasonText, LETTER_W, LETTER_H, WARN_PCT } from "@/lib/warningLetter";
import { PdfContext } from "@/lib/pdfVectorContext";
import { PAGE_W, PAGE_H, buildUnits, resultPages, summaryPages, comparisonPages, buildCards } from "@/lib/resultSheets";

const NAVY = "#150F3F";
const GOLD = "#FCB629";

// Admin-only download centre on the Exams page.
//   Section-wise Results — one page per section, every student × every subject
//   Class-wise Results   — each class together, in merit order
//   Summary Sheet        — students / passed / average / grades per section or class
//   Comparison Sheet     — subject-wise averages side by side + overall ranking
// Choose any sections, whole classes, or everything, then download one PDF.

const RES = {
  light: { label: "Light — tiny file, sharp print (recommended)", scale: 0 },
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
  const [res, setRes] = useState("light");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const logosRef = useRef(null);
  const [cardSec, setCardSec] = useState("");
  const [cardStudent, setCardStudent] = useState("");
  const [combine, setCombine] = useState(false);
  const [skipWarn, setSkipWarn] = useState(new Set());   // students un-ticked from the warning list
  const [showWarn, setShowWarn] = useState(false);
  const [letterDate, setLetterDate] = useState(() =>
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

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
      const light = res === "light";
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: light });
      const pw2 = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const scale = RES[res].scale;
      for (let i = 0; i < pages.length; i++) {
        setBusy(`Building PDF… page ${i + 1} of ${pages.length}`);
        if (light) {
          // Vector page: real text and lines, a few KB each
          if (i) pdf.addPage();
          pages[i].draw(new PdfContext(pdf, pw2 / PAGE_W), { style, logos });
          if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
          continue;
        }
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


  // ------------------------------------------------------- result cards
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // Draw one card to a canvas (picture qualities and PNG)
  function cardCanvas(item, scale, logos) {
    const cv = document.createElement("canvas");
    cv.width = Math.round(BASE_W * scale); cv.height = Math.round(BASE_H * scale);
    const ctx = cv.getContext("2d"); ctx.scale(scale, scale);
    drawResultCard(ctx, item.card, { accent: item.accent, style, logos });
    return cv;
  }

  // Items -> one PDF (Blob). Light = vector; otherwise a picture per page.
  async function cardsToPdf(items, label) {
    const logos = await getLogos();
    const { jsPDF } = await import("jspdf");
    const light = res === "light";
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: light });
    const pw2 = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < items.length; i++) {
      if (i) pdf.addPage();
      if (light) {
        drawResultCard(new PdfContext(pdf, pw2 / BASE_W), items[i].card, { accent: items[i].accent, style, logos });
      } else {
        const cv = cardCanvas(items[i], RES[res].scale, logos);
        pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw2, ph);
        cv.width = 0; cv.height = 0;
      }
      if (i % (light ? 10 : 1) === (light ? 9 : 0)) {
        setBusy(`${label} ${i + 1}/${items.length}`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return pdf.output("blob");
  }

  const safe = (t) => String(t).replace(/[^\w\-]+/g, "-");

  // Section-wise: a PDF per selected section.  Class-wise: a PDF per class, merit order.
  // "Combine" puts everything in one PDF; otherwise several PDFs come as a ZIP.
  async function downloadCards(mode) {
    if (!data || selected.size === 0) { setError("Select at least one section."); return; }
    setError("");
    try {
      const items = buildCards(data, [...selected]);
      if (!items.length) throw new Error("No students in that selection.");
      const groups = [];
      items.forEach((it) => {
        const key = mode === "section" ? it.secCode : "c" + it.classNum;
        let g = groups.find((x) => x.key === key);
        if (!g) groups.push((g = { key, items: [],
          name: mode === "section" ? `${it.classNum}-${it.secName}` : `Class-${it.classNum}` }));
        g.items.push(it);
      });
      if (mode === "class") groups.forEach((g) => g.items.sort((a, b) =>
        (a.position ?? 1e9) - (b.position ?? 1e9) || a.secName.localeCompare(b.secName)));
      const stem = safe(data.examLine);
      if (groups.length === 1 || combine) {
        const blob = await cardsToPdf(groups.flatMap((g) => g.items), "Building cards…");
        saveBlob(blob, groups.length === 1
          ? `Result-Cards-${groups[0].name}-${stem}.pdf`
          : `Result-Cards-${mode}-wise-${stem}.pdf`);
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (let i = 0; i < groups.length; i++) {
          const blob = await cardsToPdf(groups[i].items, `Building ${groups[i].name} (${i + 1}/${groups.length})…`);
          zip.file(`Result-Cards-${groups[i].name}.pdf`, blob);
        }
        setBusy("Compressing…");
        saveBlob(await zip.generateAsync({ type: "blob" }), `Result-Cards-${mode}-wise-${stem}.zip`);
      }
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  const cardList = data && cardSec ? buildCards(data, [cardSec]) : [];
  const oneItem = cardList.find((c) => String(c.card.studentId) === String(cardStudent));

  async function downloadOneCard(kind) {
    if (!oneItem) return;
    setError(""); setBusy("Building card…");
    try {
      const stem = `${oneItem.classNum}-${oneItem.secName}-${oneItem.roll}-${oneItem.name}`.replace(/[^\w\-]+/g, "-");
      if (kind === "pdf") saveBlob(await cardsToPdf([oneItem], "Building card…"), `${stem}.pdf`);
      else {
        const cv = cardCanvas(oneItem, res === "light" ? 2 : RES[res].scale, await getLogos());
        const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
        saveBlob(blob, `${stem}.png`);
      }
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  // ------------------------------------------------------ warning letters
  const warnings = data ? findWarnings(data, [...selected]) : [];
  const warnPick = warnings.filter((w) => !skipWarn.has(w.key));
  const toggleWarn = (k) => setSkipWarn((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  async function lettersToPdf(list, label) {
    const logos = await getLogos();
    const { jsPDF } = await import("jspdf");
    const light = res === "light";
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: light });
    const pw2 = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < list.length; i++) {
      if (i) pdf.addPage();
      if (light) {
        drawWarningLetter(new PdfContext(pdf, pw2 / LETTER_W), list[i], { style, logos, date: letterDate });
      } else {
        const sc = RES[res].scale;
        const cv = document.createElement("canvas");
        cv.width = Math.round(LETTER_W * sc); cv.height = Math.round(LETTER_H * sc);
        const ctx = cv.getContext("2d"); ctx.scale(sc, sc);
        drawWarningLetter(ctx, list[i], { style, logos, date: letterDate });
        pdf.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw2, ph);
        cv.width = 0; cv.height = 0;
      }
      if (i % (light ? 10 : 1) === (light ? 9 : 0)) {
        setBusy(`${label} ${i + 1}/${list.length}`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return pdf.output("blob");
  }

  // One PDF per section (ZIP), or everything in one PDF when "combine" is ticked.
  async function downloadWarnings() {
    if (!warnPick.length) { setError("No students to warn in this selection."); return; }
    setError("");
    try {
      const groups = [];
      warnPick.forEach((w) => {
        let g = groups.find((x) => x.key === w.secCode);
        if (!g) groups.push((g = { key: w.secCode, name: `${w.classNum}-${w.secName}`, items: [] }));
        g.items.push(w);
      });
      const stem = safe(data.examLine);
      if (groups.length === 1 || combine) {
        const blob = await lettersToPdf(groups.flatMap((g) => g.items), "Building letters…");
        saveBlob(blob, groups.length === 1
          ? `Warning-Letters-${groups[0].name}-${stem}.pdf` : `Warning-Letters-${stem}.pdf`);
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (let i = 0; i < groups.length; i++) {
          zip.file(`Warning-Letters-${groups[i].name}.pdf`,
            await lettersToPdf(groups[i].items, `Building ${groups[i].name} (${i + 1}/${groups.length})…`));
        }
        setBusy("Compressing…");
        saveBlob(await zip.generateAsync({ type: "blob" }), `Warning-Letters-${stem}.zip`);
      }
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  async function downloadOneWarning(w) {
    setError(""); setBusy("Building letter…");
    try {
      saveBlob(await lettersToPdf([w], "Building letter…"),
        `Warning-Letter-${w.classNum}-${w.secName}-${w.roll}-${w.name}`.replace(/[^\w\-]+/g, "-") + ".pdf");
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


              {/* ---------------- Result cards ---------------- */}
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#ffffff1a", background: "#ffffff05" }}>
                <div>
                  <div className="font-bold" style={{ color: GOLD }}>Result cards</div>
                  <p className="text-xs text-white/50">
                    Uses the sections ticked above, plus the Style and Quality you chose. Light PDF is the smallest file.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button disabled={!!busy || !nSel} onClick={() => downloadCards("section")}
                          className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn("#1DB954")}>
                    Section-wise Cards
                    <span className="block text-xs font-normal opacity-80">Every student of each selected section</span>
                  </button>
                  <button disabled={!!busy || !nSel} onClick={() => downloadCards("class")}
                          className="font-bold px-4 py-3 rounded-lg disabled:opacity-40 text-left" style={btn("#1DB954")}>
                    Class-wise Cards
                    <span className="block text-xs font-normal opacity-80">Whole class together · merit order</span>
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={combine} onChange={(e) => setCombine(e.target.checked)} className="accent-[#FCB629]" />
                  Put everything in one PDF (otherwise several sections or classes come as a ZIP of PDFs)
                </label>

                <div className="pt-3 border-t" style={{ borderColor: "#ffffff14" }}>
                  <div className="text-sm font-semibold mb-2">Individual card</div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Section</label>
                      <select className={input} style={inStyle} value={cardSec}
                              onChange={(e) => { setCardSec(e.target.value); setCardStudent(""); }}>
                        <option value="">Select…</option>
                        {data.classes.flatMap((c) => c.sections.map((s) => (
                          <option key={s.code} value={s.code}>Class {c.class} — {s.label}</option>
                        )))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Student</label>
                      <select className={input} style={inStyle} value={cardStudent} disabled={!cardSec}
                              onChange={(e) => setCardStudent(e.target.value)}>
                        <option value="">Select…</option>
                        {cardList.map((c) => (
                          <option key={c.card.studentId} value={c.card.studentId}>{c.roll} · {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button disabled={!!busy || !oneItem} onClick={() => downloadOneCard("pdf")}
                            className="font-bold px-4 py-2.5 rounded-lg disabled:opacity-40" style={btn("#1DB954")}>
                      Card PDF
                    </button>
                    <button disabled={!!busy || !oneItem} onClick={() => downloadOneCard("png")}
                            className="font-bold px-4 py-2.5 rounded-lg disabled:opacity-40" style={btn(GOLD)}>
                      Card PNG
                    </button>
                  </div>
                </div>
              </div>


              {/* ---------------- Warning letters ---------------- */}
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#ef444455", background: "#ef44440d" }}>
                <div>
                  <div className="font-bold" style={{ color: "#fca5a5" }}>Warning letters</div>
                  <p className="text-xs text-white/50">
                    For students with overall below {WARN_PCT}%, or below {WARN_PCT}% in 2 or more subjects. Based on the marks entered so far,
                    for the sections ticked above. Signed by Class Teacher, Senior Coordinator and Principal.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Date on letters</label>
                    <input value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={`${input} w-48`} style={inStyle} />
                  </div>
                  <button disabled={!!busy || !warnPick.length} onClick={downloadWarnings}
                          className="font-bold px-4 py-2.5 rounded-lg disabled:opacity-40" style={btn("#ef4444", "#fff")}>
                    Warning Letters ({warnPick.length})
                  </button>
                  <button onClick={() => setShowWarn(!showWarn)} className="text-sm underline" style={{ color: "#fca5a5" }}>
                    {showWarn ? "Hide list" : `Show list (${warnings.length})`}
                  </button>
                </div>
                <p className="text-[11px] text-white/40">
                  {warnings.length} student{warnings.length === 1 ? "" : "s"} qualify in the selected sections.
                  Several sections come as a ZIP of PDFs unless “one PDF” above is ticked.
                </p>
                {showWarn && (
                  <div className="rounded-lg border max-h-72 overflow-y-auto divide-y" style={{ borderColor: "#ffffff1a" }}>
                    {warnings.length === 0 && <div className="p-3 text-sm text-white/50">Nobody qualifies in this selection.</div>}
                    {warnings.map((w) => (
                      <div key={w.key} className="flex items-center gap-3 px-3 py-2 text-sm" style={{ borderColor: "#ffffff10" }}>
                        <input type="checkbox" checked={!skipWarn.has(w.key)} onChange={() => toggleWarn(w.key)} className="accent-[#ef4444]" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{w.roll} · {w.name} <span className="text-white/40">({w.classNum} {w.secName})</span></div>
                          <div className="text-[11px] text-white/50">{w.pct.toFixed(1)}% · {reasonText(w)}</div>
                        </div>
                        <button disabled={!!busy} onClick={() => downloadOneWarning(w)}
                                className="text-xs rounded px-2 py-1 border disabled:opacity-40" style={{ borderColor: "#fca5a566", color: "#fca5a5" }}>
                          PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {busy && (
                <div className="rounded-lg px-4 py-3 text-sm border" style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}14` }}>{busy}</div>
              )}
              <p className="text-[11px] text-white/40 leading-relaxed">
                Built in your browser from live marks, so nothing is uploaded. Pass mark 40%. Positions are across the whole class.
                Light makes a tiny, sharp file; the picture-based qualities are larger.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
